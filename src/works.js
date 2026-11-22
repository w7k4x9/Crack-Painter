// 작품 JSON 불러오기.
// 1) 오토세이버 대기열 JSON (app: NAI-Auto-Saver, queue.items[]) — 감정 이미지를 만든 그 파일
// 2) spec JSON (work, characters[]) — 빌더에 넣는 원본
// 3) nai_config.json (base_prompt, base_negative) — 베이스만
// 어느 쪽이든 인물 카드로 바꾼다.
const Works = (() => {
    const GENERAL = ['경계', '고뇌', '기쁨', '당황', '무표정', '부끄러움', '분노', '불쾌', '서운', '슬픔', '애정', '유혹', '장난', '진지', '질투', '평온', '피로'];
    const NSFW = ['갈망', '결합', '고조', '만족', '몰입', '사랑', '애정', '여운', '욕망', '응시', '절정', '황홀'];
    const SETTINGS = ['낮', '밤', '실내', '섹스'];

    const isFraming = b => /portrait|face focus|close-up/.test(b) && Tags.split(b).length <= 2 && /::/.test(b);
    const isHeader = b => /^\s*solo\b/.test(b) && b.length < 60;
    const isNsfwHeader = b => /^\s*nude,\s*nsfw\s*$/i.test(b);

    function blocks(characterPrompt) {
        return String(characterPrompt || '').split(/,?\s*\n\s*\n\s*/).map(s => s.trim().replace(/,\s*$/, '')).filter(Boolean);
    }

    function parseTitle(title) {
        const m = String(title || '').match(/^(.+?)\s+(\S+?)_(.+)$/);
        if (!m) return null;
        return { name: m[1].trim(), setting: m[2].trim(), emotion: m[3].trim() };
    }

    function workNameFromFile(fileName) {
        const stem = String(fileName || '').replace(/\.[^.]+$/, '');
        const v5 = /(^|[_\s-])v5$/i.test(stem);
        const clean = stem.replace(/[_\s-]v5$/i, '');
        return { name: clean.split('_')[0].trim() || clean, v5 };
    }

    // 대기열 JSON → { name, base, baseNeg, chars[] }
    function fromQueue(json, fileName) {
        const items = json?.queue?.items || json?.items || [];
        if (!items.length) throw new Error('대기열 JSON에 항목이 없어.');
        const byName = new Map();
        for (const it of items) {
            const t = parseTitle(it.title);
            if (!t) continue;
            if (!byName.has(t.name)) byName.set(t.name, []);
            byName.get(t.name).push({ ...t, blocks: blocks(it.characterPrompt), neg: it.negativePrompt || '', base: it.basePrompt || '', baseNeg: it.baseNegativePrompt || '' });
        }
        if (!byName.size) throw new Error('항목 제목이 "이름 낮_감정" 형식이 아니라 인물을 나눌 수 없어.');
        const chars = [];
        for (const [name, list] of byName) chars.push(charFromItems(name, list));
        const all = [...byName.values()].flat();
        const fn = workNameFromFile(fileName);
        return { name: fn.name, v5: fn.v5, base: U.mode(all.map(x => x.base).filter(Boolean)) || '', baseNeg: U.mode(all.map(x => x.baseNeg).filter(Boolean)) || '', chars };
    }

    function charFromItems(name, list) {
        const general = list.filter(x => x.setting !== '섹스');
        const sex = list.filter(x => x.setting === '섹스');
        const c = { name, appearance: '', outfit: '', negative: '', framing: '', emotions: {}, nsfwEmotions: {}, backgrounds: {}, adult: sex.length > 0, beardOk: false, note: '' };
        // 블록 순서(가이드 1장): header · appearance · outfit|nsfw · framing · emotion · background
        // 끝의 둘은 위치로, 나머지는 성격으로 가른다.
        const counts = new Map();
        for (const it of list) for (const b of new Set(it.blocks.slice(0, -2))) counts.set(b, (counts.get(b) || 0) + 1);
        for (const it of list) {
            const n = it.blocks.length;
            if (n < 3) continue;
            const bg = it.blocks[n - 1];
            const emo = it.blocks[n - 2];
            if (!c.backgrounds[it.setting]) c.backgrounds[it.setting] = bg;
            const target = it.setting === '섹스' ? c.nsfwEmotions : c.emotions;
            if (!target[it.emotion]) target[it.emotion] = emo;
            for (const b of it.blocks.slice(0, -2)) {
                if (isHeader(b) || isNsfwHeader(b)) continue;
                if (isFraming(b)) { c.framing = c.framing || b; continue; }
                const inAll = counts.get(b) === list.length;
                const inGeneralOnly = general.length && general.every(g => g.blocks.includes(b)) && !sex.some(s => s.blocks.includes(b));
                if (inAll && !c.appearance) c.appearance = b;
                else if (inGeneralOnly && !c.outfit && b !== c.appearance) c.outfit = b;
            }
        }
        // 인물 항목이 한 세트뿐이면 외형과 의상이 둘 다 "모든 항목"에 있다 → 순서로 가른다.
        if (!c.outfit && general.length && !sex.length) {
            const mid = general[0].blocks.slice(0, -2).filter(b => !isHeader(b) && !isFraming(b));
            if (mid.length >= 2) { c.appearance = mid[0]; c.outfit = mid[1]; }
        }
        c.negative = U.mode(list.map(x => x.neg)) || '';
        c.beardOk = !Tags.flatKeys(c.negative).includes('beard');
        return c;
    }

    // spec JSON → 작품
    function fromSpec(json) {
        const chars = (json.characters || []).map(ch => ({
            name: ch.name,
            appearance: ch.appearance || '',
            outfit: ch.outfit || '',
            negative: ch.negative || '',
            framing: '',
            emotions: { ...(ch.emotions || {}) },
            nsfwEmotions: { ...(ch.nsfw_emotions || {}) },
            backgrounds: { ...(json.backgrounds || {}), ...(ch.backgrounds || {}) },
            adult: ch.nsfw !== false && !!json.nsfw && Object.keys(ch.nsfw_emotions || {}).length > 0,
            beardOk: !!ch.beard_ok,
            note: ch._근거 || '',
            v5: ch.appearance_v5 ? { appearance: ch.appearance_v5, emotions: ch.emotions_v5 || {}, nsfwEmotions: ch.nsfw_emotions_v5 || {}, backgrounds: ch.backgrounds_v5 || json.backgrounds_v5 || {}, candid: ch.v5_candid || json.v5_candid || '' } : null
        }));
        return { name: json.work || '이름 없는 작품', v5: false, base: '', baseNeg: '', chars, memo: json._메모 || '' };
    }

    // 파일 하나 읽기 → { kind, work? , config? }
    function parse(text, fileName) {
        let json;
        try { json = JSON.parse(text); } catch (_) { throw new Error(`${fileName}: JSON이 아니야.`); }
        if (json?.queue?.items || (json?.app === 'NAI-Auto-Saver')) return { kind: 'queue', work: fromQueue(json, fileName) };
        if (Array.isArray(json?.characters)) return { kind: 'spec', work: fromSpec(json) };
        if (typeof json?.base_prompt === 'string') return { kind: 'config', config: { base: json.base_prompt, baseNeg: json.base_negative || '', baseV5: json.base_prompt_v5 || '', baseNegV5: json.base_negative_v5 || '' } };
        throw new Error(`${fileName}: 오토세이버 대기열 JSON, spec JSON, nai_config.json 중 어느 것도 아니야.`);
    }

    // 새로 읽은 작품을 저장된 작품에 합친다. V5 파일이면 v5 칸만 채운다.
    function merge(saved, incoming) {
        const out = saved ? U.clone(saved) : { id: U.uid('w'), name: incoming.name, base: '', baseNeg: '', baseV5: '', baseNegV5: '', chars: [], links: [], memo: '' };
        if (incoming.v5) {
            if (incoming.base) out.baseV5 = incoming.base;
            if (incoming.baseNeg) out.baseNegV5 = incoming.baseNeg;
        } else {
            if (incoming.base) out.base = incoming.base;
            if (incoming.baseNeg) out.baseNeg = incoming.baseNeg;
        }
        if (incoming.memo) out.memo = incoming.memo;
        for (const ch of incoming.chars) {
            const i = out.chars.findIndex(x => x.name === ch.name);
            if (incoming.v5) {
                const v5 = { appearance: ch.appearance, outfit: ch.outfit, negative: ch.negative, emotions: ch.emotions, nsfwEmotions: ch.nsfwEmotions, backgrounds: ch.backgrounds };
                if (i >= 0) out.chars[i].v5 = v5;
                else out.chars.push({ ...ch, v5 });
            } else if (i >= 0) {
                out.chars[i] = { ...out.chars[i], ...ch, v5: ch.v5 || out.chars[i].v5 || null, aliases: out.chars[i].aliases || [] };
            } else {
                out.chars.push({ aliases: [], v5: null, ...ch });
            }
        }
        return out;
    }

    // 작품 전체 배경: 인물들이 가장 많이 쓴 배경
    function workBackgrounds(work) {
        const out = {};
        for (const s of SETTINGS) out[s] = U.mode(work.chars.map(c => c.backgrounds?.[s]).filter(Boolean)) || '';
        return out;
    }

    // 성별: 외형에 여성 표시가 있으면 여, 아니면 남(이 프로젝트 인물은 대부분 남성)
    function isMale(ch) {
        const k = new Set(Tags.flatKeys(`${ch.appearance || ''}, ${ch.look || ''}`));
        return !['mature female', '1girl', 'female', 'woman', 'girl'].some(t => k.has(t));
    }

    return { GENERAL, NSFW, SETTINGS, parse, merge, fromQueue, fromSpec, blocks, parseTitle, workBackgrounds, isMale };
})();
