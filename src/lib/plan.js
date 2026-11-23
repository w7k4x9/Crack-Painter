// Plan — 분석 AI가 돌려준 장면 JSON을 스튜디오 상태로 바꾼다.
const Plan = (() => {
    'use strict';
    const T = Tags;

    const norm = s => String(s || '').normalize('NFKC').replace(/\s+/g, '').toLowerCase();

    function lookup(item, library) {
        const id = String(item?.id || '').trim();
        if (id) {
            const hit = library.find(c => c.id === id);
            if (hit) return hit;
        }
        const want = norm(item?.name);
        if (!want) return null;
        return library.find(c => norm(c.name) === want || (c.aliases || []).some(a => norm(a) === want)) || null;
    }

    /** 장면에서 옷을 바꿨을 때: keep(그대로) · replace(새 옷) · modify(일부 빼고 더하기) */
    function dress(saved, outfit) {
        const look = saved.look || '';
        const usual = saved.outfit || '';
        const add = T.text(outfit?.add);
        const mode = String(outfit?.mode || 'keep').toLowerCase();
        if (mode === 'replace' && add) return T.join([look, add]);
        if (mode === 'modify') {
            const gone = new Set(T.split(outfit?.remove).map(T.key));
            return T.join([look, ...T.split(usual).filter(t => !gone.has(T.key(t))), add]);
        }
        return T.join([look, usual]);
    }

    function slot(fields) {
        return { aliases: [], uc: '', position: null, enabled: true, caption: '', action: '', ...fields };
    }

    /** characters: 등록 인물 [{id,name,aliases,look,outfit,uc}] */
    function toState(plan, characters, style) {
        const p = plan && typeof plan === 'object' ? plan : {};
        const library = Array.isArray(characters) ? characters : [];
        const chars = [];
        const taken = new Set();
        for (const item of Array.isArray(p.characters) ? p.characters : []) {
            const saved = lookup(item, library);
            const common = { action: T.text(item?.tags), caption: T.text(item?.caption), position: item?.position || null };
            if (saved) {
                if (taken.has(saved.id)) continue;
                taken.add(saved.id);
                chars.push(slot({ ...common, id: saved.id, source: 'saved', name: saved.name, aliases: saved.aliases || [], look: dress(saved, item?.outfit), uc: saved.uc || '' }));
                continue;
            }
            const look = T.text(item?.look || item?.appearance);
            if (!look) continue;
            chars.push(slot({ ...common, id: `extra${chars.length}`, source: 'extra', name: String(item?.name || '').trim() || `엑스트라 ${chars.length + 1}`, look }));
        }
        const para = Number.parseInt(p.insertAfterParagraph, 10);
        return {
            title: String(p.title || p.sceneTitle || '').trim().slice(0, 80),
            moment: String(p.moment || '').trim(),
            paragraph: Number.isFinite(para) && para >= 0 ? para : 0,
            style: { pos: style?.pos || '', neg: style?.neg || '' },
            scene: { tags: T.join([T.text(p.scene?.composition), T.text(p.scene?.tags)]), caption: T.text(p.scene?.caption), count: '' },
            chars,
            neg: ''
        };
    }

    /** AI가 채운 칸에서 그 칸에 올 수 없는 태그를 미리 뺀다. 그래야 스튜디오에 보이는 것 = 보내는 것. */
    function clean(state) {
        const names = Compose.allNames(state.chars);
        const tidy = (text, noLooks) => T.join(T.unique(T.split(T.dropNames(text, names)).filter(t => {
            const k = T.kind(t);
            if (k === 'style' || k === 'quality' || k === 'count') return false;
            return !(noLooks && k === 'appearance');
        })));
        const hasPeople = (state.chars || []).length > 0;
        state.scene.tags = tidy(state.scene.tags, hasPeople);
        state.scene.caption = T.dropNames(state.scene.caption, names);
        for (const c of state.chars || []) {
            c.action = tidy(c.action, false);
            c.caption = T.dropNames(c.caption, names);
            if (c.source === 'extra') c.look = T.join(T.split(c.look).filter(t => !T.isFrame(t)));
        }
        return state;
    }

    /** 코드펜스나 앞뒤 설명이 붙은 응답에서도 JSON을 꺼낸다. */
    function parse(reply) {
        const raw = String(reply || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
        try {
            return JSON.parse(raw);
        } catch (_) {
            const from = raw.indexOf('{');
            const to = raw.lastIndexOf('}');
            if (from < 0 || to <= from) throw new Error('분석 응답에서 JSON을 찾지 못했어.');
            return JSON.parse(raw.slice(from, to + 1));
        }
    }

    return { toState, clean, dress, parse };
})();
