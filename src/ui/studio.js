// 삽화 스튜디오: 오른쪽 인스펙터.
// 원하는 장면 → (AI 연출) → 연출 고치기 → 보내는 내용 확인 → 그리기
const Studio = (() => {
    const { h, button, iconButton, select, input, textarea, segmented, toggle } = Kit;
    let S = null;

    async function open(msgId, fromShot = null) {
        const panel = Kit.inspector({ title: '삽화 스튜디오', onClose: () => { S?.ctrl?.abort(); S = null; } });
        S = { msgId, panel, ctx: null, request: '', direction: null, out: null, busy: '', seed: '', fromShot };
        panel.body.append(h('div', { class: 'progress' }, h('div', { class: 'spin' }), '채팅을 읽는 중…'));
        try {
            S.ctx = await App.prepare(msgId);
        } catch (e) {
            panel.body.replaceChildren(h('div', { class: 'note err' }, `채팅을 읽지 못했어: ${e.message}`));
            return;
        }
        if (S.ctx.work) {
            S.direction = fromShot?.direction ? U.clone(fromShot.direction) : Direct.blank(S.ctx.work.chars);
            if (!fromShot?.direction) S.direction.paragraph = Math.max(0, S.ctx.paragraphs.length - 1);
        }
        render();
    }

    function set(fn) { fn(); recompute(); }

    function recompute() {
        if (!S?.ctx?.work || !S.direction) return;
        try { S.out = App.compose(S.ctx, S.direction, S.request); } catch (e) { S.out = null; console.warn(e); }
        renderSent();
    }

    // ── 전체 그리기 ──
    function render() {
        if (!S) return;
        const { body, foot } = S.panel;
        body.replaceChildren();
        foot.replaceChildren();
        const ctx = S.ctx;
        if (!ctx.work) { body.append(noWork()); return; }
        body.append(
            h('div', { class: 'group-title' }, Kit.icon('link', 13), `작품 · ${ctx.work.name}`, h('span', { class: 'grow' }), button('바꾸기', () => Workshop.open('works'), { kind: 'ghost' })),
            requestBox(),
            h('div', { class: 'group-title' }, Kit.icon('people', 13), '연출'),
            directionBox(),
            h('div', { class: 'group-title' }, Kit.icon('chat', 13), '보내는 내용'),
            h('div', { class: 'sent-slot' }));
        foot.append(...footer());
        recompute();
    }

    function noWork() {
        const list = DB.works();
        const box = h('div', { class: 'col' },
            h('div', { class: 'note warn' }, `이 채팅(${S.ctx.storyName || S.ctx.roomName})에 연결된 작품이 없어. 감정 이미지를 만든 작품 JSON을 불러와서 연결해 줘.`));
        if (list.length) {
            box.append(h('div', { class: 'label' }, '저장된 작품에 연결'),
                ...list.map(w => button(`${w.name} · ${w.chars.length}명`, () => { App.link(S.ctx.storyId, w.id); open(S.msgId); }, { iconName: 'link' })));
        }
        box.append(button('작품 JSON 불러오기', () => Workshop.open('works'), { kind: 'primary', iconName: 'upload' }));
        return box;
    }

    function requestBox() {
        const s = DB.settings();
        const provider = AI.PROVIDERS[s.provider];
        const ta = textarea(S.request, v => { S.request = v; }, { rows: 3, placeholder: '원하는 장면을 적어 줘 (비워 두면 AI가 답변에서 골라)\n예) 눈 오는 발코니에서 루페르트가 프란츠 어깨에 코트를 걸쳐 주는 장면' });
        const run = button(s.provider === 'none' ? 'AI 안 씀' : `${provider.label}로 연출`, () => analyze(), { kind: 'primary', iconName: 'wand', disabled: s.provider === 'none' || !!S.busy });
        return h('div', { class: 'group' },
            h('div', { class: 'label' }, '원하는 장면'),
            ta,
            h('div', { class: 'row' }, h('span', { class: 'faint grow' }, s.provider === 'none' ? '아래에서 인물·감정·장소를 직접 골라.' : '적은 장면을 AI가 감정·구도·장소로 옮겨.'), run),
            S.direction?.why ? h('div', { class: 'note' }, `AI: ${S.direction.why}`) : null);
    }

    function directionBox() {
        const d = S.direction;
        const work = S.ctx.work;
        const s = DB.settings();
        const nsfwAllowed = s.nsfw && d.cast.length && d.cast.every(m => work.chars.find(c => c.name === m.name)?.adult);
        const bgs = Works.workBackgrounds(work);
        const settingSeg = segmented([['낮', '낮'], ['밤', '밤'], ['실내', '실내'], ['섹스', '섹스', !nsfwAllowed], ['기타', '직접']], d.setting, v => { d.setting = v; fixEmotions(); render(); });
        const paraOpts = S.ctx.paragraphs.map((p, i) => [i, `${i + 1}. ${p.slice(0, 28)}${p.length > 28 ? '…' : ''}`]);

        const box = h('div', { class: 'group' },
            h('div', { class: 'form' },
                h('div', { class: 'label' }, '장소'), h('div', { class: 'row wrap' }, settingSeg),
                h('div', { class: 'label' }, ''), d.setting === '기타' || d.place
                    ? input(d.place, v => set(() => { d.place = v; }), { placeholder: '장소 태그 (예: 1.3::snowy balcony::, moonlight)', mono: true })
                    : h('div', { class: 'faint', title: bgs[d.setting] || '' }, (bgs[d.setting] || '작품에 이 배경이 없어').slice(0, 70)),
                h('div', { class: 'label' }, '샷'), select(Direct.SHOTS.map(x => [x, { 'close-up': '클로즈업', 'upper body': '상반신', 'cowboy shot': '허벅지까지', 'wide shot': '넓게', 'full body': '전신(앉거나 누울 때)' }[x]]), d.shot, v => set(() => { d.shot = v; })),
                h('div', { class: 'label' }, '각도'), input(d.camera, v => set(() => { d.camera = v; }), { placeholder: 'from below, dutch angle …', mono: true }),
                h('div', { class: 'label' }, '함께 하는 것'), input(d.scene, v => set(() => { d.scene = v; }), { placeholder: 'eye contact, hug … (혼자면 비움)', mono: true }),
                h('div', { class: 'label' }, '넣을 자리'), select(paraOpts.length ? paraOpts : [[0, '답변 끝']], d.paragraph, v => { d.paragraph = Number(v); })));

        d.cast.forEach((m, i) => box.append(castCard(m, i)));
        if (d.cast.length < 3) box.append(h('div', { class: 'row' }, button('인물 추가', () => { d.cast.push({ name: work.chars.find(c => !d.cast.some(x => x.name === c.name))?.name || work.chars[0].name, extra: false, look: '', emotion: d.setting === '섹스' ? '사랑' : '평온', face: '', gaze: '', pose: '', position: 'right' }); if (d.cast.length === 2) d.cast[0].position = 'left'; render(); }, { iconName: 'plus' })));
        return box;
    }

    function fixEmotions() {
        const pool = S.direction.setting === '섹스' ? Works.NSFW : Works.GENERAL;
        for (const m of S.direction.cast) if (!pool.includes(m.emotion)) m.emotion = pool.includes('애정') ? '애정' : pool[0];
    }

    function castCard(m, i) {
        const d = S.direction;
        const work = S.ctx.work;
        const card = work.chars.find(c => c.name === m.name);
        const pool = d.setting === '섹스' ? Works.NSFW : Works.GENERAL;
        const stored = card ? (d.setting === '섹스' ? card.nsfwEmotions : card.emotions)?.[m.emotion] : '';
        const solo = d.cast.length === 1;
        const useBlock = m.useBlock ?? (solo && !(m.face || m.gaze || m.pose));
        const names = [...work.chars.map(c => [c.name, c.name]), ['엑스트라', '엑스트라(작품 밖 인물)']];
        const el = h('div', { class: 'cast' },
            h('div', { class: 'head' },
                select(names, m.extra ? '엑스트라' : m.name, v => { m.name = v; m.extra = v === '엑스트라'; render(); }, { style: 'width:auto;flex:1 1 120px' }),
                select(pool, m.emotion, v => { m.emotion = v; render(); }, { style: 'width:auto' }),
                iconButton('close', () => { d.cast.splice(i, 1); render(); }, '빼기')),
            d.cast.length > 1 ? h('div', { class: 'row' }, h('span', { class: 'faint' }, '화면 자리'), segmented([['left', '왼쪽'], ['center', '가운데'], ['right', '오른쪽']], m.position, v => { m.position = v; render(); })) : null);
        if (m.extra) el.append(input(m.look, v => set(() => { m.look = v; }), { placeholder: '생김새 태그 (예: 1girl, mature female, long black hair)', mono: true }));
        if (stored) {
            el.append(h('div', { class: 'row' }, toggle(useBlock, v => { m.useBlock = v; render(); }), h('span', { class: 'grow' }, '작품의 감정 블록 그대로 쓰기'), h('span', { class: 'faint' }, `${m.emotion} 이미지와 같은 표정`)));
        }
        if (stored && useBlock) {
            el.append(h('div', { class: 'faint', style: { fontFamily: 'var(--mono)' } }, stored));
        } else {
            el.append(
                input(m.face, v => set(() => { m.face = v; }), { placeholder: '표정 (예: 1.3::smirk, half-closed eyes::)', mono: true }),
                input(m.gaze, v => set(() => { m.gaze = v; }), { placeholder: '시선 (예: looking down at another)', mono: true }),
                input(m.pose, v => set(() => { m.pose = v; }), { placeholder: '자세·손 (예: leaning forward, hand on own chin)', mono: true }));
        }
        return el;
    }

    // 보내는 내용(칸별 프롬프트 + 토큰 + 알림)
    function renderSent() {
        const slot = S?.panel.body.querySelector('.sent-slot');
        if (!slot) return;
        const out = S.out;
        slot.replaceChildren();
        if (!out) { slot.append(h('div', { class: 'note err' }, '프롬프트를 만들지 못했어.')); return; }
        const t = out.tokens;
        const ratio = t.pos / t.limit;
        const gauge = h('div', { class: `gauge ${ratio > 1 ? 'over' : ratio > 0.92 ? 'near' : ''}` }, h('i', { style: { width: `${Math.min(100, ratio * 100)}%` } }));
        const label = `${out.model.label} · 긍정 ${t.pos}/${t.limit}${t.shared ? ' (베이스+캐릭터 합)' : ' (칸마다)'} · 부정 ${t.neg}${t.exact ? '' : ' · 추정'}`;
        const copy = text => iconButton('copy', () => navigator.clipboard.writeText(text), '복사');
        const field = (name, text) => h('div', { class: 'col' }, h('div', { class: 'row' }, h('span', { class: 'label grow' }, name), copy(text)), textarea(text, () => {}, { mono: true, rows: Math.min(8, Math.ceil(text.length / 56) + 1), readOnly: true }));
        slot.append(
            out.notes.length ? h('div', { class: 'col', style: { marginBottom: '8px' } }, out.notes.map(n => h('div', { class: /한도|잘려|없어/.test(n) ? 'note warn' : 'note' }, n))) : null,
            h('details', { class: 'sent' },
                h('summary', null, h('span', { class: 'grow' }, label), Kit.icon('down', 13)),
                h('div', { class: 'inner' },
                    gauge,
                    field('베이스', out.base),
                    ...out.chars.map(c => field(`${c.name} · 캐릭터`, c.prompt)),
                    field('베이스 부정', out.baseNeg),
                    ...out.chars.map(c => field(`${c.name} · 부정`, c.neg)))));
    }

    function footer() {
        const s = DB.settings();
        const status = h('div', { class: 'progress', hidden: !S.busy }, h('div', { class: 'spin' }), S.busy);
        const drawBtn = button(S.busy ? '멈추기' : '그리기', () => (S.busy ? S.ctrl?.abort() : drawNow()), { kind: S.busy ? 'big' : 'primary big', iconName: S.busy ? 'stop' : 'picture' });
        return [
            status,
            h('div', { class: 'row' },
                segmented(Object.values(Compose.MODELS).filter(m => !/curated/.test(m.id)).map(m => [m.id, m.label]), s.nai, v => { DB.patchSettings({ nai: v }); recompute(); render(); }),
                h('span', { class: 'grow' }),
                input(S.seed, v => { S.seed = v.replace(/\D/g, ''); }, { placeholder: '시드(비우면 랜덤)', extra: { style: 'width:120px' } }),
                drawBtn)
        ];
    }

    function refreshFooter() {
        if (!S) return;
        S.panel.foot.replaceChildren(...footer());
        S.panel.body.querySelectorAll('button.btn.primary').forEach(b => { if (/연출/.test(b.textContent)) b.disabled = !!S.busy; });
    }

    async function analyze() {
        if (!S || S.busy) return;
        S.ctrl = new AbortController();
        S.busy = `${AI.PROVIDERS[DB.settings().provider].label}가 장면을 읽는 중…`;
        refreshFooter();
        try {
            const d = await App.direct(S.ctx, S.request.trim(), S.ctrl.signal);
            if (!S) return;
            S.direction = d;
        } catch (e) {
            if (e.name !== 'AbortError') App.fail(e);
        } finally {
            if (S) { S.busy = ''; render(); }
        }
    }

    async function drawNow() {
        if (!S || S.busy || !S.out) return;
        S.ctrl = new AbortController();
        S.busy = 'NovelAI가 그리는 중…';
        refreshFooter();
        try {
            await App.draw(S.ctx, S.out, S.direction, { seed: S.seed, signal: S.ctrl.signal });
            await App.renderFigures();
            Kit.toast('삽화를 넣었어.', { kind: 'ok' });
        } catch (e) {
            if (e.name !== 'AbortError') App.fail(e);
        } finally {
            if (S) { S.busy = ''; refreshFooter(); }
        }
    }

    return { open };
})();
