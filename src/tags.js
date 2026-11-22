// 태그 문자열 다루기.
// NAI 문법: 가중치 `1.3::a, b::`, 억제 `-1::a::`, 랜덤 `||a|b||`, 옛 괄호 `{a}` `[a]`.
// 묶음 안의 쉼표는 나누지 않는다.
const Tags = (() => {
    const OPEN_WEIGHT = /^-?(?:\d+\.?\d*|\.\d+)::/;

    // 최상위 쉼표로 나누기. 묶음(가중치·랜덤·괄호)은 한 덩어리로 남는다.
    function split(text) {
        const s = String(text ?? '');
        const out = [];
        const stack = [];
        let cur = '';
        for (let i = 0; i < s.length;) {
            const rest = s.slice(i);
            const w = stack.at(-1) !== 'r' && rest.match(OPEN_WEIGHT);
            if (w && (i === 0 || /[\s,(|]/.test(s[i - 1]) || stack.length === 0)) {
                stack.push('w');
                cur += w[0];
                i += w[0].length;
                continue;
            }
            if (rest.startsWith('||')) {
                if (stack.at(-1) === 'r') stack.pop(); else stack.push('r');
                cur += '||';
                i += 2;
                continue;
            }
            if (rest.startsWith('::') && stack.at(-1) === 'w') {
                stack.pop();
                cur += '::';
                i += 2;
                continue;
            }
            const c = s[i];
            if (c === '{' || c === '[') stack.push(c);
            else if ((c === '}' && stack.at(-1) === '{') || (c === ']' && stack.at(-1) === '[')) stack.pop();
            if ((c === ',' || c === '\n') && stack.length === 0) {
                if (cur.trim()) out.push(cur.trim());
                cur = '';
                i += 1;
                continue;
            }
            cur += c;
            i += 1;
        }
        if (cur.trim()) out.push(cur.trim());
        return out;
    }

    function join(list) {
        return list.map(t => String(t).trim()).filter(Boolean).join(', ');
    }

    // 묶음 하나를 {weight, inner:[태그…]}로 풀기. 묶음이 아니면 weight 1.
    function unwrap(tag) {
        const t = String(tag).trim();
        const m = t.match(/^(-?(?:\d+\.?\d*|\.\d+))::([\s\S]*?)::$/);
        if (m) return { weight: Number(m[1]), inner: split(m[2]), kind: 'w' };
        if (/^\|\|[\s\S]*\|\|$/.test(t)) return { weight: 1, inner: t.slice(2, -2).split('|').map(x => x.trim()).filter(Boolean), kind: 'r' };
        let depth = 0;
        let body = t;
        while (/^\{[\s\S]*\}$/.test(body)) { body = body.slice(1, -1); depth += 1; }
        if (depth) return { weight: Math.pow(1.05, depth), inner: split(body), kind: 'b' };
        while (/^\[[\s\S]*\]$/.test(body)) { body = body.slice(1, -1); depth -= 1; }
        if (depth) return { weight: Math.pow(1.05, depth), inner: split(body), kind: 'b' };
        return { weight: 1, inner: [t], kind: '' };
    }

    function wrap(weight, inner) {
        const body = join(inner);
        if (!body) return '';
        if (Math.abs(weight - 1) < 1e-6) return body;
        const w = Number(weight.toFixed(2)).toString();
        return `${w}::${body}::`;
    }

    // 비교용 키: 소문자, 밑줄→공백, 가중치·괄호 제거
    function key(tag) {
        return String(tag).toLowerCase().replace(/^-?[\d.]+::|::$/g, '').replace(/[{}[\]]/g, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // 묶음을 모두 펼친 낱개 태그 키 목록
    function flatKeys(text) {
        const out = [];
        for (const t of split(text)) {
            const u = unwrap(t);
            for (const x of u.inner) {
                if (unwrap(x).kind) out.push(...flatKeys(x));
                else out.push(key(x));
            }
        }
        return out.filter(Boolean);
    }

    // 태그 목록에서 조건에 맞는 낱개 태그를 지운다(묶음 안쪽까지). 지운 것을 돌려준다.
    function remove(text, test) {
        const removed = [];
        const walk = list => list.map(t => {
            const u = unwrap(t);
            if (!u.kind) {
                if (test(key(t), t)) { removed.push(t); return ''; }
                return t;
            }
            if (u.kind === 'r') return t;
            const kept = walk(u.inner).filter(Boolean);
            if (!kept.length) return '';
            return u.kind === 'w' ? wrap(u.weight, kept) : t.replace(join(u.inner), join(kept));
        }).filter(Boolean);
        return { text: join(walk(split(text))), removed };
    }

    // 낱개 태그 이름 바꾸기(묶음 안쪽까지)
    function replace(text, from, to) {
        const f = key(from);
        const walk = list => list.map(t => {
            const u = unwrap(t);
            if (!u.kind) return key(t) === f ? to : t;
            if (u.kind !== 'w') return t;
            return wrap(u.weight, walk(u.inner));
        });
        return join(walk(split(text)));
    }

    // 앞에 나온 것을 남기고 중복 낱개 태그를 지운다. seen을 넘기면 다른 칸과도 비교.
    function dedupe(text, seen = new Set()) {
        return remove(text, k => {
            if (seen.has(k)) return true;
            seen.add(k);
            return false;
        }).text;
    }

    // 가중치 바꾸기: fn(weight) → 새 weight. 1이 되면 묶음을 푼다.
    function reweight(text, fn) {
        const walk = list => list.map(t => {
            const u = unwrap(t);
            if (u.kind !== 'w') return t;
            const nw = fn(u.weight, u.inner);
            return wrap(nw, u.inner);
        });
        return join(walk(split(text)));
    }

    // ── 토큰 세기 ───────────────────────────────────────────
    // NAI V4+ 카운터와 같은 방식: 강조 문법을 지우고, 공백으로 나눈 단어마다 '▁'를 붙여
    // T5 Unigram 사전으로 가장 점수 높은 분할(Viterbi)을 찾은 뒤 조각 수를 더한다. 끝 토큰 1.
    // 사전(약 1MB)은 처음 한 번 받아 IndexedDB에 둔다. 받기 전에는 길이 기반 추정 + 10% 여유.
    let trie = null;
    let scores = null;
    let unkScore = 0;

    function setVocab(v) {
        if (!v || !Array.isArray(v.pieces) || !Array.isArray(v.scores)) return false;
        scores = v.scores.slice();
        unkScore = Math.min(...scores) - 10;
        scores[v.unkId ?? 2] = unkScore;
        trie = new Map();
        v.pieces.forEach((piece, id) => {
            let node = trie;
            for (const ch of piece) {
                let next = node.get(ch);
                if (!next) { next = new Map(); node.set(ch, next); }
                node = next;
            }
            node.set('', id);
        });
        return true;
    }

    const exact = () => !!trie;

    function viterbi(word) {
        const units = [...word].flatMap(ch => (ch.length > 1 ? ch.split('') : [ch]));
        const n = units.length;
        const best = new Array(n + 1).fill(-Infinity);
        const pieces = new Array(n + 1).fill(0);
        best[0] = 0;
        for (let st = 0; st < n; st++) {
            if (best[st] === -Infinity) continue;
            let node = trie;
            let single = false;
            for (let en = st + 1; en <= n; en++) {
                node = node && node.get(units[en - 1]);
                if (!node) break;
                if (node.has('')) {
                    const sc = best[st] + scores[node.get('')];
                    if (sc > best[en]) { best[en] = sc; pieces[en] = pieces[st] + 1; }
                    if (en === st + 1) single = true;
                }
            }
            if (!single) {
                const sc = best[st] + unkScore;
                if (sc > best[st + 1]) { best[st + 1] = sc; pieces[st + 1] = pieces[st] + 1; }
            }
        }
        return pieces[n];
    }

    const MEAN = [0.6, 1, 1, 1.2, 1.25, 1.4, 1.67, 1.75, 1.85, 2.2, 2.35, 2.75, 3.0, 3.6, 4.0];

    function countPart(text) {
        if (!text) return 1;
        const s = String(text).replace(/[[\]{}]/g, '').replace(/-?\d*\.?\d*::/g, '');
        const words = s.split(/\s+/);
        if (trie) return 1 + words.reduce((n, w) => n + (w ? viterbi(w.startsWith('▁') ? w : '▁' + w) : 0), 0);
        let total = 1;
        for (const w of words) {
            if (!w) { total += 1; continue; }
            const core = w.replace(/[^A-Za-z]/g, '');
            const m = MEAN[core.length] ?? 4 + 0.3 * (core.length - 14);
            total += m + (w.length - core.length);
        }
        return Math.ceil(total * 1.1);
    }

    // 랜덤 묶음 ||a|b||는 가장 긴 것, 단일 | 파트(최대 6)는 따로 세어 더한다.
    function count(text) {
        const parts = String(text ?? '').split('||').map((p, i) => {
            if (i % 2 === 0) return p;
            return p.split('|').reduce((a, b) => (b.length > a.length ? b : a), '');
        }).join('').split('|');
        const ps = parts.length > 6 ? [...parts.slice(0, 5), parts.slice(5).join('|')] : parts;
        return ps.reduce((n, p) => n + countPart(p), 0);
    }

    return { split, join, unwrap, wrap, key, flatKeys, remove, replace, dedupe, reweight, count, setVocab, exact };
})();
