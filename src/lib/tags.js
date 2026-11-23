// Tags — 쉼표 태그 문자열 다루기. DOM·네트워크를 쓰지 않아서 Node에서 바로 테스트한다.
const Tags = (() => {
    'use strict';

    const OPENERS = '{[(';
    const CLOSERS = '}])';
    // `1.2::` 처럼 숫자 바로 뒤에 오는 :: 는 가중치 묶음의 시작이다.
    const WEIGHT_START = /(?:^|[\s,])-?\d+(?:\.\d+)?$/;

    /** 맨 바깥 쉼표·줄바꿈에서만 나눈다. 괄호와 `N::…::` 묶음 안은 한 덩어리로 둔다. */
    function split(input) {
        const text = input == null ? '' : String(input);
        const out = [];
        let piece = '';
        let nesting = 0;
        let inWeight = false;
        const push = () => {
            const t = piece.trim();
            if (t) out.push(t);
            piece = '';
        };
        for (let i = 0; i < text.length; i += 1) {
            const c = text[i];
            if (c === ':' && text[i + 1] === ':') {
                inWeight = inWeight ? false : WEIGHT_START.test(piece);
                piece += '::';
                i += 1;
                continue;
            }
            if (OPENERS.includes(c)) nesting += 1;
            else if (CLOSERS.includes(c) && nesting > 0) nesting -= 1;
            if ((c === ',' || c === '\n') && nesting === 0 && !inWeight) {
                push();
                continue;
            }
            piece += c;
        }
        push();
        return out;
    }

    function join(list) {
        const flat = [];
        for (const item of list) {
            if (Array.isArray(item)) flat.push(...item);
            else flat.push(item);
        }
        return flat.map(x => (x == null ? '' : String(x)).trim()).filter(x => x !== '').join(', ');
    }

    const PAIR = { '{': '}', '[': ']', '(': ')' };
    function peel(s) {
        let t = s.trim();
        while (t.length > 1 && PAIR[t[0]] && t.endsWith(PAIR[t[0]])) t = t.slice(1, -1).trim();
        return t;
    }

    /** 비교용 이름: 가중치·감싼 괄호·밑줄을 걷어내고 소문자로. */
    function key(tag) {
        const bare = String(tag || '').trim().replace(/^-?\d+(?:\.\d+)?::\s*/, '').replace(/\s*::$/, '');
        return peel(bare).split('_').join(' ').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    function unique(list) {
        const seen = new Set();
        return list.filter(t => {
            const k = key(t);
            if (!k || seen.has(k)) return false;
            seen.add(k);
            return true;
        });
    }

    // ── 종류 판별 ─────────────────────────────────────────
    const QUALITY_WORDS = new Set(('masterpiece|best quality|high quality|good quality|great quality|amazing quality|normal quality|'
        + 'very aesthetic|aesthetic|absurdres|highres|incredibly absurdres|no text|very awa|newest|recent|ultra detailed|'
        + 'extremely detailed|8k|4k|hdr').split('|'));
    const STYLE_WORDS = new Set(('traditional media|digital media|official art|game cg|anime coloring|anime screencap|realistic|'
        + 'photorealistic|semi-realistic|lineart|flat color|cel shading|oekaki|watercolor|oil painting|impasto|pixel art|chibi').split('|'));
    const COUNT_FORM = /^(?:(?:\d+|6\+)(?:girls?|boys?|others?)|solo|solo focus|multiple (?:girls|boys|others)|no humans|\d+people)$/;

    const COLOR = '(?:light |dark |pale |bright )?(?:black|brown|blonde|blond|red|white|silver|grey|gray|pink|blue|green|purple|orange|aqua|yellow|multicolored|two-tone|gradient|streaked)';
    const LOOK_FORMS = [
        new RegExp(`^${COLOR} (?:hair|eyes)$`),
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

    const isStyle = k => k.startsWith('artist:') || k.endsWith('(artist)') || /^by [a-z0-9]/.test(k)
        || /^(?:year )?\d{4}s?$/.test(k)
        || /\((?:style|medium)\)$/.test(k) || /(?:^| )style$/.test(k) || STYLE_WORDS.has(k);

    /** 'style' | 'quality' | 'count' | 'appearance' | 'other' | 'empty' */
    function kind(tag) {
        const k = key(tag);
        if (!k) return 'empty';
        if (isStyle(k)) return 'style';
        if (QUALITY_WORDS.has(k)) return 'quality';
        if (COUNT_FORM.test(k)) return 'count';
        if (LOOK_FORMS.some(re => re.test(k))) return 'appearance';
        return 'other';
    }

    const isFrame = t => { const k = kind(t); return k === 'style' || k === 'quality'; };

    /** 캐릭터 칸에서는 2girls 같은 인원수 대신 girl/boy/other 를 쓴다. */
    function countAsSubject(tag) {
        const m = key(tag).match(/^(?:\d+|6\+)(girl|boy|other)s?$/);
        return m ? m[1] : '';
    }

    function subjectOf(text) {
        const ks = split(text).map(key);
        if (ks.some(k => ['1boy', 'boy', 'male', 'man', 'bishounen', 'old man'].includes(k))) return 'boy';
        if (ks.some(k => ['1girl', 'girl', 'female', 'woman', 'old woman'].includes(k))) return 'girl';
        return 'other';
    }

    /** ['girl','boy','boy'] → '1girl, 2boys' */
    function countLabel(subjects) {
        const tally = { girl: 0, boy: 0, other: 0 };
        for (const s of subjects) tally[s] = (tally[s] || 0) + 1;
        const word = (n, noun) => (n === 0 ? '' : n === 1 ? `1${noun}` : `${n > 5 ? '6+' : n}${noun}s`);
        return [word(tally.girl, 'girl'), word(tally.boy, 'boy'), word(tally.other, 'other')].filter(Boolean).join(', ');
    }

    const reEscape = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    /** NAI는 이름을 엉뚱한 인물로 읽어서, AI가 쓴 글에서 인물 이름을 지운다. */
    function dropNames(text, names) {
        let out = String(text || '');
        for (const n of names) {
            const name = String(n || '').trim();
            if (name.length < 2) continue;
            const pattern = /^[A-Za-z0-9 _-]+$/.test(name)
                ? new RegExp(`(^|[^A-Za-z0-9_])${reEscape(name)}(?=$|[^A-Za-z0-9_])`, 'gi')
                : new RegExp(reEscape(name), 'g');
            out = out.replace(pattern, pattern.flags.includes('i') ? '$1' : '');
        }
        return out.replace(/\s*,\s*(,\s*)+/g, ', ').replace(/^[\s,]+|[\s,]+$/g, '').replace(/ {2,}/g, ' ');
    }

    /** T5 토큰 수 어림값 (쉼표 조각마다 단어 수 × 1.3 + 구분자 1). */
    function tokens(text) {
        let total = 0;
        for (const raw of String(text || '').trim().split(',')) {
            const p = raw.trim();
            if (!p) continue;
            const words = p.split(/[\s_\-()[\]{}:.|]+/).filter(Boolean).length;
            total += Math.max(1, Math.round(words * 1.3)) + 1;
        }
        return total;
    }

    /** 값이 무엇이든 태그 문자열 하나로 (배열·객체는 펼쳐서). */
    function text(v) {
        if (v == null) return '';
        if (Array.isArray(v)) return join(v.map(text));
        if (typeof v === 'object') return join(Object.values(v).map(text));
        return String(v).trim();
    }

    return { split, join, key, unique, kind, isFrame, countAsSubject, subjectOf, countLabel, dropNames, tokens, text };
})();
