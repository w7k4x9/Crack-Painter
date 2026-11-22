// 작은 도구들. DOM이 없어도 돌아가는 것만 둔다(테스트에서 그대로 불러 씀).
const U = (() => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    function uid(prefix = 'id') {
        const rand = Math.random().toString(36).slice(2, 8);
        return `${prefix}${Date.now().toString(36)}${rand}`;
    }

    // djb2 — 1.x가 메시지 기록 키를 만들 때 쓴 해시. 예전 기록을 다시 찾는 데만 쓴다.
    function djb2(text) {
        let h = 5381;
        const s = String(text ?? '');
        for (let i = 0; i < s.length; i++) h = (((h << 5) + h) + s.charCodeAt(i)) >>> 0;
        return h.toString(36);
    }

    const clone = v => (v == null ? v : JSON.parse(JSON.stringify(v)));

    function esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    // 가장 많이 나온 값
    function mode(list) {
        const n = new Map();
        let best = null;
        let top = 0;
        for (const v of list) {
            const c = (n.get(v) || 0) + 1;
            n.set(v, c);
            if (c > top) { top = c; best = v; }
        }
        return best;
    }

    function clamp(v, lo, hi) {
        return Math.min(hi, Math.max(lo, v));
    }

    // 작품 이름 비교용: 공백·기호·대소문자 무시
    function looseName(s) {
        return String(s || '').toLowerCase().replace(/[\s_\-·.,'"()[\]{}!?~]/g, '');
    }

    function fmtDate(ms) {
        const d = new Date(ms);
        const p = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    }

    // 응답 글에서 JSON 객체 하나 꺼내기(코드 블록, 앞뒤 설명 허용)
    function pickJson(text) {
        const raw = String(text || '');
        const fenced = [...raw.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)].map(m => m[1]);
        const tries = [...fenced, raw];
        for (const t of tries) {
            const a = t.indexOf('{');
            const b = t.lastIndexOf('}');
            if (a < 0 || b <= a) continue;
            try { return JSON.parse(t.slice(a, b + 1)); } catch (_) { /* 다음 후보 */ }
        }
        throw new Error('AI 답에서 JSON을 찾지 못했어.');
    }

    return { sleep, uid, djb2, clone, esc, mode, clamp, looseName, fmtDate, pickJson };
})();
