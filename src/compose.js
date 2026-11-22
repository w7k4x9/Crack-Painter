// 연출 + 작품 카드 → NAI 칸별 프롬프트.
// 베이스 = 작품 베이스(고정) + 인원수 + 샷·각도·상호작용 + 배경 (+ V5 문장)
// 캐릭터 칸 = 외형 + 의상(섹스면 nude, nsfw) + 이 장면의 표정·시선·자세
const Compose = (() => {
    const MODELS = {
        'nai-diffusion-4-5-full': { id: 'nai-diffusion-4-5-full', v5: false, label: 'V4.5', limit: 512 },
        'nai-diffusion-4-5-curated': { id: 'nai-diffusion-4-5-curated', v5: false, label: 'V4.5 Curated', limit: 512 },
        'nai-diffusion-5-full': { id: 'nai-diffusion-5-full', v5: true, label: 'V5', limit: 1400 },
        'nai-diffusion-5-curated': { id: 'nai-diffusion-5-curated', v5: true, label: 'V5 Curated', limit: 700 }
    };
    const QUALITY_V45 = ', very aesthetic, masterpiece, no text';
    const JOIN = ',\n\n';

    const model = id => MODELS[id] || MODELS['nai-diffusion-4-5-full'];

    // V4.5 가중치를 V5 범위로: 기본 무가중치, 핵심 1.05~1.3, 억제 −1.2~−2. 구도 태그는 가중치를 뺀다.
    function toV5(text) {
        return Tags.reweight(text, (w, inner) => {
            if (inner.every(t => /portrait|close-up|face focus|upper body|cowboy shot/.test(Tags.key(t)))) return 1;
            if (w > 1) return U.clamp(1 + (w - 1) * 0.3, 1.05, 1.3);
            if (w < 0) return U.clamp(w, -2, -1.2);
            return w;
        });
    }

    function countTags(cast) {
        const males = cast.filter(m => m.male).length;
        const females = cast.length - males;
        const out = [];
        if (males) out.push(`${males}boy${males > 1 ? 's' : ''}`);
        if (females) out.push(`${females}girl${females > 1 ? 's' : ''}`);
        if (cast.length === 1) out.unshift('solo');
        return out.join(', ');
    }

    // 상위 태그 n개만 남기기
    const keepFirst = (text, n) => Tags.join(Tags.split(text).slice(0, n));
    // 가중치 없는 태그를 뒤에서 하나 빼기
    function dropOnePlain(text) {
        const list = Tags.split(text);
        for (let i = list.length - 1; i >= 0; i--) {
            if (!Tags.unwrap(list[i]).kind) { list.splice(i, 1); return Tags.join(list); }
        }
        return null;
    }

    function build({ work, direction, modelId, request = '', fallbackBase = '', fallbackNeg = '' }) {
        const m = model(modelId);
        const notes = [];
        const d = direction;
        const nsfw = d.setting === '섹스';
        const v = (ch, key) => (m.v5 && ch.v5 && ch.v5[key] ? ch.v5[key] : ch[key]);

        // 인물 카드 + 이 장면의 연출
        const members = d.cast.map(mem => {
            const card = mem.extra ? null : work.chars.find(c => c.name === mem.name);
            const ch = card || { name: mem.name || '엑스트라', appearance: mem.look || '', outfit: '', negative: '', emotions: {}, nsfwEmotions: {}, backgrounds: {}, beardOk: false, adult: false };
            return { mem, ch, male: Works.isMale({ appearance: ch.appearance, look: mem.look }) };
        });
        const allowProps = Rules.propAllowance(members.flatMap(x => [x.ch.appearance, x.ch.outfit]), request.trim() ? d.props : []);
        const solo = members.length === 1;

        const chars = members.map(({ mem, ch }) => {
            const app = Rules.cleanAppearance(v(ch, 'appearance') || '');
            notes.push(...app.notes);
            const outfit = nsfw ? 'nude, nsfw' : (v(ch, 'outfit') || '');
            const stored = (nsfw ? v(ch, 'nsfwEmotions') : v(ch, 'emotions'))?.[mem.emotion] || '';
            let acting;
            if (mem.useBlock !== false && solo && stored && !(mem.face || mem.gaze || mem.pose)) {
                acting = stored;
            } else if (mem.useBlock === true && stored) {
                acting = stored;
            } else {
                const r = Rules.cleanAiTags(Tags.join([mem.face, mem.gaze, mem.pose].filter(Boolean)), { allowProps, nsfw });
                notes.push(...r.notes.map(n => `${ch.name}: ${n}`));
                acting = r.text;
            }
            let prompt = [app.text, outfit, acting].filter(s => s && s.trim()).join(JOIN);
            if (m.v5 && !ch.v5) prompt = toV5(prompt);
            const neg = Rules.negativeGuard(ch.negative || '', ch.beardOk);
            const center = Direct.POSITIONS[mem.position] || Direct.POSITIONS.center;
            return { name: ch.name, prompt, neg, center, parts: { appearance: app.text, outfit, acting } };
        });

        // 베이스
        let workBase = m.v5 ? (work.baseV5 || (work.base ? toV5(work.base) : '')) : work.base;
        let workNeg = m.v5 ? (work.baseNegV5 || work.baseNeg) : work.baseNeg;
        if (!workBase) { workBase = m.v5 ? toV5(fallbackBase) : fallbackBase; }
        if (!workNeg) workNeg = fallbackNeg;
        if (!workBase) notes.push('베이스 프롬프트가 없어. 작품 JSON이나 nai_config.json을 불러와 줘.');

        const sceneRaw = Tags.join([d.shot, d.camera, d.scene].filter(Boolean));
        const sceneClean = Rules.cleanAiTags(sceneRaw, { allowProps, nsfw });
        notes.push(...sceneClean.notes);
        const land = Rules.landscape(sceneClean.text, chars.map(c => c.parts.acting));
        notes.push(...land.notes);

        const firstCard = members.find(x => !x.mem.extra)?.ch;
        const bgSet = m.v5 && firstCard?.v5?.backgrounds ? firstCard.v5.backgrounds : firstCard?.backgrounds;
        let background = d.setting === '기타' || d.place ? d.place : (bgSet?.[d.setting] || Works.workBackgrounds(work)[d.setting] || '');
        if (d.place) background = Rules.cleanAiTags(d.place, { allowProps: new Set(Tags.flatKeys(d.place)), nsfw }).text;
        if (m.v5 && !firstCard?.v5) background = toV5(background);

        const caption = m.v5 && d.caption ? d.caption.replace(/\s+/g, ' ').trim() : '';
        const people = countTags(members);
        let sceneBlock = Tags.join([people, land.text].filter(Boolean));
        let base = [workBase.trim().replace(/,\s*$/, ''), sceneBlock, background, caption].filter(Boolean).join(JOIN);
        let baseNeg = workNeg || '';

        // 베이스에 이미 있는 태그는 장면 칸에서 뺀다
        sceneBlock = Tags.dedupe(sceneBlock, new Set(Tags.flatKeys(workBase)));
        base = [workBase.trim().replace(/,\s*$/, ''), sceneBlock, background, caption].filter(Boolean).join(JOIN);

        const out = { model: m, base, baseNeg, chars, notes, setting: d.setting, sceneBlock, background, workBase, caption };
        fit(out);
        return out;
    }

    function tokens(out) {
        const posBase = Tags.count(out.base + (out.model.v5 ? '' : QUALITY_V45));
        const posChars = out.chars.map(c => Tags.count(c.prompt));
        const negBase = Tags.count(out.baseNeg);
        const negChars = out.chars.map(c => Tags.count(c.neg));
        const shared = !out.model.v5;
        return {
            shared,
            limit: out.model.limit,
            exact: Tags.exact(),
            posBase, posChars, negBase, negChars,
            pos: shared ? posBase + posChars.reduce((a, b) => a + b, 0) : Math.max(posBase, ...posChars, 0),
            neg: shared ? negBase + negChars.reduce((a, b) => a + b, 0) : Math.max(negBase, ...negChars, 0)
        };
    }

    // V4.5 512 예산 맞추기: 가이드 2장 순서(배경 소품 → 의상 세부 → 감정 보조 → 외형 보조)
    function fit(out) {
        let t = tokens(out);
        out.tokens = t;
        if (!t.shared || t.pos <= t.limit) { fitNeg(out); return; }
        const rebuildBase = () => { out.base = [out.workBase.trim().replace(/,\s*$/, ''), out.sceneBlock, out.background, out.caption].filter(Boolean).join(JOIN); };
        const rebuildChar = c => { c.prompt = [c.parts.appearance, c.parts.outfit, c.parts.acting].filter(Boolean).join(JOIN); };
        const steps = [
            ['배경 소품을 줄임', () => { out.background = Tags.join([Tags.split(out.background)[0], Tags.split(out.background).at(-1)].filter((x, i, a) => x && a.indexOf(x) === i)); rebuildBase(); }],
            ['의상을 핵심 3개로 줄임', () => { for (const c of out.chars) if (!/nude, nsfw/.test(c.parts.outfit)) { c.parts.outfit = keepFirst(c.parts.outfit, 3); rebuildChar(c); } }],
            ['표정·자세를 핵심만 남김', () => { for (const c of out.chars) { c.parts.acting = keepFirst(c.parts.acting, 3); rebuildChar(c); } }]
        ];
        for (const [label, fn] of steps) {
            if (tokens(out).pos <= t.limit) break;
            fn();
            out.notes.push(`V4.5 토큰 한도(512) 때문에 ${label}`);
        }
        // 마지막: 외형의 가중치 없는 보조 태그를 뒤에서부터
        let dropped = 0;
        while (tokens(out).pos > t.limit) {
            let any = false;
            for (const c of out.chars) {
                const next = dropOnePlain(c.parts.appearance);
                if (next != null) { c.parts.appearance = next; rebuildChar(c); any = true; dropped += 1; }
                if (tokens(out).pos <= t.limit) break;
            }
            if (!any) break;
        }
        if (dropped) out.notes.push(`외형 보조 태그 ${dropped}개를 뺌(가중치 있는 핵심은 그대로)`);
        t = tokens(out);
        if (t.pos > t.limit) out.notes.push(`아직 ${t.pos}/${t.limit} 토큰이라 뒷부분이 잘려. 인물이 여럿이면 V5를 써 줘.`);
        out.tokens = t;
        fitNeg(out);
    }

    function fitNeg(out) {
        let t = tokens(out);
        if (!t.shared) { out.tokens = t; return; }
        let guard = 0;
        while (t.neg > t.limit && guard++ < 60) {
            const c = [...out.chars].sort((a, b) => Tags.count(b.neg) - Tags.count(a.neg))[0];
            const list = Tags.split(c.neg);
            if (list.length <= 1) break;
            list.pop();
            c.neg = Tags.join(list);
            t = tokens(out);
        }
        if (guard) out.notes.push('부정 프롬프트가 한도를 넘어 캐릭터 부정 뒷부분을 줄임');
        out.tokens = t;
    }

    return { MODELS, QUALITY_V45, model, toV5, build, tokens };
})();
