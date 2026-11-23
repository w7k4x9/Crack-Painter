// ─────────────────────────────────────────────────────────────
// Core: 프롬프트 레이어 모델 (DOM·네트워크 없음, Node 테스트 가능)
//
// NovelAI V4+ 요청은 두 갈래다.
//   base_caption  : 그림 전체에 적용 → 작가·화풍·퀄리티, 인원수, 구도·배경·조명
//   char_captions : 인물 한 명에게만 적용 → 외형·의상·자세·표정
// 이 모듈은 "어떤 태그가 어느 칸에 들어갈 수 있는가"를 규칙으로 고정한다.
// 사용자가 캐릭터 칸에 작가 태그를 넣어도, AI가 장면 칸에 머리색을 넣어도
// 전송 직전에 맞는 칸으로 옮기거나 빼고, 무엇을 했는지 notes로 알려준다.
// ─────────────────────────────────────────────────────────────
const Core = (() => {
    'use strict';

    const MODELS = Object.freeze({
        'nai-diffusion-5-full': Object.freeze({ id: 'nai-diffusion-5-full', family: 'v5', label: 'V5 Full', maxChars: 22, budget: 1471, shared: false, grid: false }),
        'nai-diffusion-5-curated': Object.freeze({ id: 'nai-diffusion-5-curated', family: 'v5', label: 'V5 Curated', maxChars: 22, budget: 703, shared: false, grid: false }),
        'nai-diffusion-4-5-full': Object.freeze({ id: 'nai-diffusion-4-5-full', family: 'v4.5', label: 'V4.5 Full', maxChars: 6, budget: 512, shared: true, grid: true }),
        'nai-diffusion-4-5-curated': Object.freeze({ id: 'nai-diffusion-4-5-curated', family: 'v4.5', label: 'V4.5 Curated', maxChars: 6, budget: 512, shared: true, grid: true })
    });
    const DEFAULT_MODEL = 'nai-diffusion-5-full';

    function model(id) {
        return MODELS[id] || MODELS[DEFAULT_MODEL];
    }

    // ── 태그 분해 ────────────────────────────────────────────
    // 최상위 쉼표에서만 자른다. `1.2::a, b::` 가중치 묶음과 {} [] () 안의 쉼표는 보존한다.
    function splitTags(input) {
        const s = String(input ?? '');
        const out = [];
        let buf = '';
        let depth = 0;
        let inWeight = false;
        for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            if (ch === ':' && s[i + 1] === ':') {
                // 여는 `N::` 인지 닫는 `::` 인지 판단
                if (!inWeight && /(^|[\s,])-?\d+(?:\.\d+)?$/.test(buf)) inWeight = true;
                else if (inWeight) inWeight = false;
                buf += '::';
                i++;
                continue;
            }
            if (ch === '{' || ch === '[' || ch === '(') depth++;
            else if ((ch === '}' || ch === ']' || ch === ')') && depth > 0) depth--;
            if ((ch === ',' || ch === '\n') && depth === 0 && !inWeight) {
                if (buf.trim()) out.push(buf.trim());
                buf = '';
                continue;
            }
            buf += ch;
        }
        if (buf.trim()) out.push(buf.trim());
        return out;
    }

    function joinTags(parts) {
        return parts.flat().map(p => String(p ?? '').trim()).filter(Boolean).join(', ');
    }

    // 비교용 정규화: 가중치·괄호·밑줄 제거, 소문자
    const PAIRS = { '{': '}', '[': ']', '(': ')' };
    function unwrap(s) {
        let t = s.trim();
        while (t.length >= 2 && PAIRS[t[0]] && t[t.length - 1] === PAIRS[t[0]]) t = t.slice(1, -1).trim();
        return t;
    }

    function tagKey(tag) {
        return unwrap(String(tag || '')
            .trim()
            .replace(/^-?\d+(?:\.\d+)?::\s*/, '')
            .replace(/\s*::$/, ''))
            .replace(/_/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function dedupe(tags) {
        const seen = new Set();
        const out = [];
        for (const t of tags) {
            const k = tagKey(t);
            if (!k || seen.has(k)) continue;
            seen.add(k);
            out.push(t);
        }
        return out;
    }

    // ── 분류 규칙 ────────────────────────────────────────────
    const QUALITY = new Set([
        'masterpiece', 'best quality', 'high quality', 'good quality', 'great quality', 'amazing quality', 'normal quality',
        'very aesthetic', 'aesthetic', 'absurdres', 'highres', 'incredibly absurdres', 'no text', 'very awa',
        'newest', 'recent', 'ultra detailed', 'extremely detailed', '8k', '4k', 'hdr'
    ]);
    const STYLE_EXACT = new Set([
        'traditional media', 'digital media', 'official art', 'game cg', 'anime coloring', 'anime screencap',
        'realistic', 'photorealistic', 'semi-realistic', 'lineart', 'flat color', 'cel shading', 'oekaki',
        'watercolor', 'oil painting', 'impasto', 'pixel art', 'chibi'
    ]);
    const COUNT_RE = /^(?:(?:\d+|6\+)(?:girls?|boys?|others?)|solo|solo focus|multiple girls|multiple boys|multiple others|no humans|\d+people)$/;

    const HAIR_COLOR = '(?:light |dark |pale |bright )?(?:black|brown|blonde|blond|red|white|silver|grey|gray|pink|blue|green|purple|orange|aqua|yellow|multicolored|two-tone|gradient|streaked)';
    const APPEARANCE_RES = [
        new RegExp(`^${HAIR_COLOR} hair$`),
        new RegExp(`^${HAIR_COLOR} eyes$`),
        /^(?:very short|short|medium|long|very long|absurdly long) hair$/,
        /^(?:straight|wavy|curly) hair$/,
        /^(?:(?:high|low|side|short) )?ponytail$/,
        /^(?:(?:low|short) )?twintails$/,
        /^(?:single |twin |side |french )?braids?$/,
        /^(?:single |double )?hair bun$/,
        /^(?:bob|hime|pixie) cut$/,
        /^(?:twin drills|drill hair|ahoge|sidelocks|hair between eyes|hair intakes|heterochromia)$/,
        /^(?:(?:blunt|swept|parted|asymmetrical) )?bangs$/,
        /^(?:dark|pale|tan|tanned) skin$/,
        /^dark-skinned (?:male|female)$/
    ];

    function classify(tag) {
        const k = tagKey(tag);
        if (!k) return 'empty';
        if (/^artist:/.test(k) || /\(artist\)$/.test(k) || /^by [a-z0-9]/.test(k)) return 'style';
        if (/^(?:year )?\d{4}s?$/.test(k) || /^year \d{4}$/.test(k)) return 'style';
        if (/\((?:style|medium)\)$/.test(k) || /(?:^| )style$/.test(k) || STYLE_EXACT.has(k)) return 'style';
        if (QUALITY.has(k)) return 'quality';
        if (COUNT_RE.test(k)) return 'count';
        if (APPEARANCE_RES.some(re => re.test(k))) return 'appearance';
        return 'other';
    }

    // 캐릭터 칸의 인원수 태그는 NAI 권장대로 girl/boy/other 로 바꾼다.
    function countToSubject(tag) {
        const k = tagKey(tag);
        if (/^(?:\d+|6\+)girls?$/.test(k)) return 'girl';
        if (/^(?:\d+|6\+)boys?$/.test(k)) return 'boy';
        if (/^(?:\d+|6\+)others?$/.test(k)) return 'other';
        return '';
    }

    function detectSubject(tags) {
        const keys = splitTags(tags).map(tagKey);
        if (keys.some(k => /^(?:1boy|boy|male|man|bishounen|old man)$/.test(k))) return 'boy';
        if (keys.some(k => /^(?:1girl|girl|female|woman|old woman)$/.test(k))) return 'girl';
        return 'other';
    }

    function countTag(subjects) {
        if (!subjects.length) return '';
        const n = { boy: 0, girl: 0, other: 0 };
        subjects.forEach(s => { n[s] = (n[s] || 0) + 1; });
        const part = (c, one, many) => c === 0 ? '' : c === 1 ? one : c > 5 ? `6+${many}` : `${c}${many}`;
        const parts = [part(n.girl, '1girl', 'girls'), part(n.boy, '1boy', 'boys'), part(n.other, '1other', 'others')].filter(Boolean);
        return parts.join(', ');
    }

    function escapeRe(s) {
        return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // AI가 만든 텍스트에서 저장된 인물 이름을 뺀다 (NAI는 이름을 엉뚱한 인물로 해석함)
    function stripNames(text, names) {
        let out = String(text || '');
        for (const raw of names) {
            const name = String(raw || '').trim();
            if (name.length < 2) continue;
            if (/^[A-Za-z0-9 _-]+$/.test(name)) {
                out = out.replace(new RegExp(`(^|[^A-Za-z0-9_])${escapeRe(name)}(?=$|[^A-Za-z0-9_])`, 'gi'), '$1');
            } else {
                out = out.replace(new RegExp(escapeRe(name), 'g'), '');
            }
        }
        return out.replace(/\s*,\s*(,\s*)+/g, ', ').replace(/^[\s,]+|[\s,]+$/g, '').replace(/ {2,}/g, ' ');
    }

    // ── 토큰 추정 (T5 근사) ──────────────────────────────────
    function estimateTokens(text) {
        const s = String(text || '').trim();
        if (!s) return 0;
        let n = 0;
        for (const part of s.split(',')) {
            const p = part.trim();
            if (!p) continue;
            const words = p.split(/[\s_\-()[\]{}:.|]+/).filter(Boolean).length;
            n += Math.max(1, Math.round(words * 1.3)) + 1;
        }
        return n;
    }

    // ── 상태 → 전송 프롬프트 조립 ─────────────────────────────
    //
    // state = {
    //   style:  { pos, neg }                     사용자 고정 (작가·화풍·퀄리티)
    //   scene:  { tags, caption, count }         AI 장면 (count 비우면 자동)
    //   chars:  [{ id, name, aliases, look, action, caption, uc, position, enabled, source }]
    //   neg:    ''                               장면별 추가 네거티브
    // }
    function assemble(state, modelId) {
        const cap = model(modelId);
        const isV5 = cap.family === 'v5';
        const notes = [];
        const st = state || {};
        const style = st.style || {};
        const scene = st.scene || {};

        const allChars = (st.chars || []).filter(c => c && c.enabled !== false);
        if (allChars.length > cap.maxChars) {
            notes.push({ level: 'warn', text: `${cap.label}는 캐릭터 칸이 최대 ${cap.maxChars}개라서 ${allChars.length - cap.maxChars}명은 빠졌어.` });
        }
        const chars = allChars.slice(0, cap.maxChars);
        const names = (st.chars || []).flatMap(c => [c.name, ...(c.aliases || [])]).filter(Boolean);

        const movedStyle = [];
        const subjects = [];

        const outChars = chars.map((c, index) => {
            const label = c.name || `인물 ${index + 1}`;
            // 사용자 외형 칸: 작가·퀄리티 태그는 베이스로 올리고, 인원수 태그는 girl/boy 로
            const look = [];
            let movedHere = 0;
            for (const t of splitTags(c.look)) {
                const kind = classify(t);
                if (kind === 'style' || kind === 'quality') { movedStyle.push(t); movedHere++; continue; }
                if (kind === 'count') { const subj = countToSubject(t); if (subj) look.push(subj); continue; }
                look.push(t);
            }
            if (movedHere) notes.push({ level: 'info', text: `'${label}' 외형 칸의 작가·화풍 태그 ${movedHere}개를 베이스로 옮겼어.` });

            // AI 행동 칸: 작가·퀄리티·인원수는 버리고 이름은 지운다
            const action = splitTags(stripNames(c.action, names)).filter(t => {
                const kind = classify(t);
                return kind !== 'style' && kind !== 'quality' && kind !== 'count';
            });
            const caption = isV5 ? stripNames(c.caption, names).trim() : '';

            subjects.push(detectSubject(joinTags(look)));
            const prompt = joinTags(dedupe([...look, ...action, ...(caption ? [caption] : [])]));
            return {
                id: c.id || `c${index}`,
                name: label,
                prompt,
                uc: joinTags(dedupe(splitTags(c.uc))),
                center: positionToCenter(c.position, index, chars.length, cap.grid),
                tokens: estimateTokens(prompt)
            };
        }).filter(c => c.prompt);

        // 장면 태그: 작가·퀄리티·인원수 제거, 캐릭터 칸이 있으면 외형 태그도 제거 (다른 인물로 번짐)
        let droppedAppearance = 0;
        const sceneTags = splitTags(stripNames(scene.tags, names)).filter(t => {
            const kind = classify(t);
            if (kind === 'style' || kind === 'quality' || kind === 'count') return false;
            if (kind === 'appearance' && outChars.length) { droppedAppearance++; return false; }
            return true;
        });
        if (droppedAppearance) notes.push({ level: 'info', text: `장면 칸의 머리색·눈색 같은 외형 태그 ${droppedAppearance}개는 캐릭터 칸이 맡으니까 뺐어.` });
        const sceneCaption = isV5 ? stripNames(scene.caption, names).trim() : '';

        const count = String(scene.count || '').trim() || (outChars.length === 1 ? `${countTag(subjects)}, solo` : outChars.length ? countTag(subjects) : '');

        const styleTags = dedupe([...splitTags(style.pos), ...movedStyle]);
        const baseTags = dedupe([...styleTags, ...splitTags(count), ...sceneTags]);
        const base = joinTags([...baseTags, ...(sceneCaption ? [sceneCaption] : [])]);
        const baseNeg = joinTags(dedupe([...splitTags(style.neg), ...splitTags(st.neg)]));

        // 칸별 토큰
        const parts = {
            style: estimateTokens(joinTags(styleTags)),
            scene: estimateTokens(joinTags([count, ...sceneTags, sceneCaption])),
            chars: outChars.map(c => ({ name: c.name, tokens: c.tokens }))
        };
        const baseTokens = estimateTokens(base);
        const charTokens = outChars.reduce((a, c) => a + c.tokens, 0);
        const used = cap.shared ? baseTokens + charTokens : baseTokens;
        const budget = { shared: cap.shared, limit: cap.budget, used, base: baseTokens, chars: charTokens, parts, over: used > cap.budget };
        if (budget.over) {
            notes.push({
                level: 'warn',
                text: cap.shared
                    ? `${cap.label}는 베이스와 캐릭터 칸이 ${cap.budget}토큰을 나눠 써. 지금 약 ${used}토큰이라 뒤쪽 태그가 잘릴 수 있어.`
                    : `베이스가 약 ${used}/${cap.budget}토큰이라 뒤쪽이 잘릴 수 있어.`
            });
        }

        return { model: cap.id, family: cap.family, base, baseNeg, count, chars: outChars, budget, notes };
    }

    // left/center/right 또는 {x,y} → NAI center. V4.5는 0.1 격자(5x5 셀 중심)에 맞춘다.
    function positionToCenter(position, index, total, grid) {
        let x;
        let y = 0.5;
        if (position && typeof position === 'object' && Number.isFinite(+position.x)) {
            x = +position.x;
            y = Number.isFinite(+position.y) ? +position.y : 0.5;
        } else {
            const p = String(position || '').toLowerCase();
            if (p === 'left') x = 0.3;
            else if (p === 'right') x = 0.7;
            else if (p === 'center') x = 0.5;
            else x = total <= 1 ? 0.5 : 0.2 + (0.6 * index) / (total - 1);
        }
        x = Math.min(0.9, Math.max(0.1, x));
        y = Math.min(0.9, Math.max(0.1, y));
        if (grid) {
            const snap = v => Math.round((Math.round((v - 0.1) / 0.2) * 0.2 + 0.1) * 10) / 10;
            x = snap(x);
            y = snap(y);
        }
        return { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 };
    }

    // ── AI 장면 계획 → 상태 ──────────────────────────────────
    // characters: 저장된 캐릭터 목록 [{id,name,aliases,look,outfit,uc}]
    function planToState(plan, characters, style) {
        const p = plan && typeof plan === 'object' ? plan : {};
        const lib = Array.isArray(characters) ? characters : [];
        const keyOf = s => String(s || '').normalize('NFKC').replace(/\s+/g, '').toLowerCase();
        const findChar = item => {
            const id = String(item?.id || '').trim();
            if (id) {
                const byId = lib.find(c => c.id === id);
                if (byId) return byId;
            }
            const k = keyOf(item?.name);
            if (!k) return null;
            return lib.find(c => keyOf(c.name) === k || (c.aliases || []).some(a => keyOf(a) === k)) || null;
        };

        const chars = [];
        const used = new Set();
        for (const item of Array.isArray(p.characters) ? p.characters : []) {
            const saved = findChar(item);
            if (saved) {
                if (used.has(saved.id)) continue;
                used.add(saved.id);
                chars.push({
                    id: saved.id,
                    source: 'saved',
                    name: saved.name,
                    aliases: saved.aliases || [],
                    look: applyOutfit(saved, item?.outfit),
                    action: flat(item?.tags),
                    caption: flat(item?.caption),
                    uc: saved.uc || '',
                    position: item?.position || null,
                    enabled: true
                });
            } else if (flat(item?.look || item?.appearance)) {
                // 저장되지 않은 인물: AI가 준 외형을 그대로 씀
                chars.push({
                    id: `extra${chars.length}`,
                    source: 'extra',
                    name: String(item?.name || '').trim() || `엑스트라 ${chars.length + 1}`,
                    aliases: [],
                    look: flat(item?.look || item?.appearance),
                    action: flat(item?.tags),
                    caption: flat(item?.caption),
                    uc: '',
                    position: item?.position || null,
                    enabled: true
                });
            }
        }

        const para = Number.parseInt(p.insertAfterParagraph, 10);
        return {
            title: String(p.title || p.sceneTitle || '').trim().slice(0, 80),
            moment: String(p.moment || '').trim(),
            paragraph: Number.isFinite(para) && para >= 0 ? para : 0,
            style: { pos: style?.pos || '', neg: style?.neg || '' },
            scene: {
                tags: joinTags([flat(p.scene?.composition), flat(p.scene?.tags)]),
                caption: flat(p.scene?.caption),
                count: ''
            },
            chars,
            neg: ''
        };
    }

    // AI가 채운 칸(장면 태그, 인물 행동)에서 그 칸에 올 수 없는 태그를 미리 뺀다.
    // 그래서 스튜디오 입력칸에 보이는 내용 = 실제로 보내는 내용이 된다.
    function sanitizeAi(state) {
        const names = (state.chars || []).flatMap(c => [c.name, ...(c.aliases || [])]).filter(Boolean);
        const keep = (text, dropAppearance) => joinTags(dedupe(splitTags(stripNames(text, names)).filter(t => {
            const kind = classify(t);
            if (kind === 'style' || kind === 'quality' || kind === 'count') return false;
            return !(dropAppearance && kind === 'appearance');
        })));
        const hasChars = (state.chars || []).length > 0;
        state.scene.tags = keep(state.scene.tags, hasChars);
        state.scene.caption = stripNames(state.scene.caption, names);
        for (const c of state.chars || []) {
            c.action = keep(c.action, false);
            c.caption = stripNames(c.caption, names);
            if (c.source === 'extra') c.look = joinTags(splitTags(c.look).filter(t => !['style', 'quality'].includes(classify(t))));
        }
        return state;
    }

    function applyOutfit(saved, outfit) {
        const look = saved.look || '';
        const base = saved.outfit || '';
        const mode = String(outfit?.mode || 'keep').toLowerCase();
        const add = flat(outfit?.add);
        if (mode === 'replace' && add) return joinTags([look, add]);
        if (mode === 'modify') {
            const remove = new Set(splitTags(outfit?.remove).map(tagKey));
            const kept = splitTags(base).filter(t => !remove.has(tagKey(t)));
            return joinTags([look, ...kept, add]);
        }
        return joinTags([look, base]);
    }

    function flat(v) {
        if (v == null) return '';
        if (Array.isArray(v)) return joinTags(v.map(flat));
        if (typeof v === 'object') return joinTags(Object.values(v).map(flat));
        return String(v).trim();
    }

    // ── 응답 JSON 느슨하게 파싱 ──────────────────────────────
    function parseJsonLoose(text) {
        const raw = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
        try {
            return JSON.parse(raw);
        } catch (_) {
            const a = raw.indexOf('{');
            const b = raw.lastIndexOf('}');
            if (a >= 0 && b > a) return JSON.parse(raw.slice(a, b + 1));
            throw new Error('분석 응답에서 JSON을 찾지 못했어.');
        }
    }

    return {
        MODELS, DEFAULT_MODEL, model,
        splitTags, joinTags, tagKey, dedupe, classify, detectSubject, countTag, stripNames,
        estimateTokens, assemble, positionToCenter, planToState, sanitizeAi, applyOutfit, parseJsonLoose
    };
})();
