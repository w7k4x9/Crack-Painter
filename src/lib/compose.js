// Models · Compose — 스튜디오 상태를 NAI가 받는 두 갈래로 나눈다.
//   베이스(base_caption)   : 그림 전체 — 작가·화풍·퀄리티, 인원수, 구도·배경·조명
//   캐릭터(char_captions)  : 인물 한 명 — 외형·의상·자세·표정
// 칸에 맞지 않는 태그는 보내기 직전에 옮기거나 빼고, 한 일을 notes 로 알려 준다.
const Models = (() => {
    'use strict';
    const make = (id, family, label, maxChars, budget) => Object.freeze({ id, family, label, maxChars, budget, shared: family === 'v4.5', grid: family === 'v4.5' });
    const ALL = Object.freeze({
        'nai-diffusion-5-full': make('nai-diffusion-5-full', 'v5', 'V5 Full', 22, 1471),
        'nai-diffusion-5-curated': make('nai-diffusion-5-curated', 'v5', 'V5 Curated', 22, 703),
        'nai-diffusion-4-5-full': make('nai-diffusion-4-5-full', 'v4.5', 'V4.5 Full', 6, 512),
        'nai-diffusion-4-5-curated': make('nai-diffusion-4-5-curated', 'v4.5', 'V4.5 Curated', 6, 512)
    });
    const DEFAULT = 'nai-diffusion-5-full';
    const get = id => ALL[id] || ALL[DEFAULT];
    const list = () => Object.values(ALL);
    const isV5 = id => get(id).family === 'v5';
    return { ALL, DEFAULT, get, list, isV5 };
})();

const Compose = (() => {
    'use strict';
    const T = Tags;

    /** left/center/right 또는 {x,y} → NAI 좌표. V4.5는 5×5 칸 가운데(0.1, 0.3 …)에 맞춘다. */
    function center(position, index, total, snapToGrid) {
        let x;
        let y = 0.5;
        if (position && typeof position === 'object' && Number.isFinite(+position.x)) {
            x = +position.x;
            if (Number.isFinite(+position.y)) y = +position.y;
        } else {
            const spots = { left: 0.3, center: 0.5, right: 0.7 };
            const named = spots[String(position || '').toLowerCase()];
            x = named != null ? named : total <= 1 ? 0.5 : 0.2 + (0.6 * index) / (total - 1);
        }
        const clamp = v => Math.min(0.9, Math.max(0.1, v));
        x = clamp(x);
        y = clamp(y);
        if (snapToGrid) {
            const snap = v => Math.round((Math.round((v - 0.1) / 0.2) * 0.2 + 0.1) * 10) / 10;
            x = snap(x);
            y = snap(y);
        }
        const r3 = v => Math.round(v * 1000) / 1000;
        return { x: r3(x), y: r3(y) };
    }

    const allNames = chars => (chars || []).flatMap(c => [c.name, ...(c.aliases || [])]).filter(Boolean);

    // 사용자 외형 칸 정리: 작가·퀄리티는 베이스로 보내고, 인원수는 girl/boy 로 바꾼다.
    function sortLook(look) {
        const keep = [];
        const lifted = [];
        for (const t of T.split(look)) {
            const k = T.kind(t);
            if (k === 'style' || k === 'quality') lifted.push(t);
            else if (k === 'count') { const s = T.countAsSubject(t); if (s) keep.push(s); }
            else keep.push(t);
        }
        return { keep, lifted };
    }

    const notFrameOrCount = t => !['style', 'quality', 'count'].includes(T.kind(t));

    /**
     * state = { style:{pos,neg}, scene:{tags,caption,count}, chars:[{id,name,aliases,look,action,caption,uc,position,enabled,source}], neg }
     * → { model, family, base, baseNeg, count, chars:[{id,name,prompt,uc,center,tokens}], budget, notes }
     */
    function build(state, modelId) {
        const m = Models.get(modelId);
        const v5 = m.family === 'v5';
        const st = state || {};
        const style = st.style || {};
        const scene = st.scene || {};
        const notes = [];
        const names = allNames(st.chars);

        const active = (st.chars || []).filter(c => c && c.enabled !== false);
        if (active.length > m.maxChars) {
            notes.push({ level: 'warn', text: `${m.label}는 캐릭터 칸이 최대 ${m.maxChars}개라서 ${active.length - m.maxChars}명은 빠졌어.` });
        }
        const slots = active.slice(0, m.maxChars);

        const liftedStyle = [];
        const subjects = [];
        const chars = [];
        slots.forEach((c, i) => {
            const label = c.name || `인물 ${i + 1}`;
            const { keep, lifted } = sortLook(c.look);
            if (lifted.length) {
                liftedStyle.push(...lifted);
                notes.push({ level: 'info', text: `'${label}' 외형 칸의 작가·화풍 태그 ${lifted.length}개를 베이스로 옮겼어.` });
            }
            const action = T.split(T.dropNames(c.action, names)).filter(notFrameOrCount);
            const sentence = v5 ? T.dropNames(c.caption, names).trim() : '';
            const prompt = T.join(T.unique([...keep, ...action, ...(sentence ? [sentence] : [])]));
            if (!prompt) return;
            subjects.push(T.subjectOf(T.join(keep)));
            chars.push({
                id: c.id || `c${i}`,
                name: label,
                prompt,
                uc: T.join(T.unique(T.split(c.uc))),
                center: center(c.position, i, slots.length, m.grid),
                tokens: T.tokens(prompt)
            });
        });

        // 장면 칸: 작가·퀄리티·인원수는 빼고, 캐릭터 칸이 있으면 머리색 같은 외형도 뺀다(다른 인물에게 번진다).
        let droppedLooks = 0;
        const sceneTags = T.split(T.dropNames(scene.tags, names)).filter(t => {
            if (!notFrameOrCount(t)) return false;
            if (chars.length && T.kind(t) === 'appearance') { droppedLooks += 1; return false; }
            return true;
        });
        if (droppedLooks) notes.push({ level: 'info', text: `장면 칸의 머리색·눈색 같은 외형 태그 ${droppedLooks}개는 캐릭터 칸이 맡으니까 뺐어.` });
        const sceneSentence = v5 ? T.dropNames(scene.caption, names).trim() : '';

        let count = String(scene.count || '').trim();
        if (!count && chars.length) count = chars.length === 1 ? `${T.countLabel(subjects)}, solo` : T.countLabel(subjects);

        const styleTags = T.unique([...T.split(style.pos), ...liftedStyle]);
        const baseTags = T.unique([...styleTags, ...T.split(count), ...sceneTags]);
        const base = T.join([...baseTags, ...(sceneSentence ? [sceneSentence] : [])]);
        const baseNeg = T.join(T.unique([...T.split(style.neg), ...T.split(st.neg)]));

        const baseTokens = T.tokens(base);
        const charTokens = chars.reduce((sum, c) => sum + c.tokens, 0);
        const used = m.shared ? baseTokens + charTokens : baseTokens;
        const budget = {
            shared: m.shared, limit: m.budget, used, base: baseTokens, chars: charTokens, over: used > m.budget,
            parts: {
                style: T.tokens(T.join(styleTags)),
                scene: T.tokens(T.join([count, ...sceneTags, sceneSentence])),
                chars: chars.map(c => ({ name: c.name, tokens: c.tokens }))
            }
        };
        if (budget.over) {
            notes.push({
                level: 'warn',
                text: m.shared
                    ? `${m.label}는 베이스와 캐릭터 칸이 ${m.budget}토큰을 나눠 써. 지금 약 ${used}토큰이라 뒤쪽 태그가 잘릴 수 있어.`
                    : `베이스가 약 ${used}/${m.budget}토큰이라 뒤쪽이 잘릴 수 있어.`
            });
        }
        return { model: m.id, family: m.family, base, baseNeg, count, chars, budget, notes };
    }

    /** 인원수 칸을 비워 두면 들어갈 자동 값 (입력칸 안내 문구용). */
    function autoCount(state, modelId) {
        return build({ ...state, scene: { ...(state?.scene || {}), count: '' } }, modelId).count;
    }

    return { build, center, autoCount, allNames };
})();
