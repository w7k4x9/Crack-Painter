// ==UserScript==
// @name         크랙 페인터
// @namespace    https://github.com/w7k4x9/crack-painter
// @version      2.0.0
// @description  크랙(crack.wrtn.ai) 장면을 NovelAI 삽화로. NAI 자동화 작품 JSON의 인물·감정 블록을 그대로 써서 감정 이미지와 같은 얼굴로 그림.
// @author       w7k4x9
// @match        https://crack.wrtn.ai/*
// @match        https://chatgpt.com/*
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%235b8cff%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%238b5cf6%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20x%3D%226%22%20y%3D%226%22%20width%3D%22116%22%20height%3D%22116%22%20rx%3D%2228%22%20fill%3D%22url%28%23g%29%22%2F%3E%3Cpath%20d%3D%22M24%2092%2050%2062c3-3%207-3%209%200l14%2016%207-7c3-3%206-3%209%200l15%2016v5c0%206-5%2010-10%2010H34c-5%200-9-4-10-10Z%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2284%22%20cy%3D%2244%22%20r%3D%2210%22%20fill%3D%22%23fff%22%2F%3E%3Cpath%20d%3D%22M44%2022c2%2012%207%2017%2019%2019-12%202-17%207-19%2019-2-12-7-17-19-19%2012-2%2017-7%2019-19Z%22%20fill%3D%22%23fff%22%20opacity%3D%22.85%22%2F%3E%3C%2Fsvg%3E
// @homepageURL  https://github.com/w7k4x9/crack-painter
// @downloadURL  https://raw.githubusercontent.com/w7k4x9/crack-painter/main/crack-painter.user.js
// @updateURL    https://raw.githubusercontent.com/w7k4x9/crack-painter/main/crack-painter.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_openInTab
// @grant        GM_registerMenuCommand
// @grant        GM_info
// @connect      image.novelai.net
// @connect      generativelanguage.googleapis.com
// @connect      api.anthropic.com
// @connect      api.openai.com
// @connect      raw.githubusercontent.com
// @require      https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.js
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
'use strict';

const CSS_UI = ":host { all: initial; }\n.cp2 {\n    --font: -apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Apple SD Gothic Neo\", Pretendard, \"Malgun Gothic\", sans-serif;\n    --mono: ui-monospace, \"SF Mono\", Menlo, Consolas, monospace;\n    --bg: rgba(246, 246, 248, .86);\n    --bg-solid: #f5f5f7;\n    --card: #ffffff;\n    --line: rgba(0, 0, 0, .1);\n    --line-strong: rgba(0, 0, 0, .18);\n    --text: #1d1d1f;\n    --text2: rgba(60, 60, 67, .72);\n    --text3: rgba(60, 60, 67, .45);\n    --fill: rgba(120, 120, 128, .12);\n    --fill2: rgba(120, 120, 128, .2);\n    --accent: #0a7aff;\n    --accent-soft: rgba(10, 122, 255, .12);\n    --danger: #ff3b30;\n    --ok: #28a745;\n    --warn: #c77c00;\n    --shadow: 0 20px 50px rgba(0, 0, 0, .18), 0 0 0 .5px rgba(0, 0, 0, .14);\n    font: 13px/1.45 var(--font);\n    color: var(--text);\n    -webkit-font-smoothing: antialiased;\n    letter-spacing: -.01em;\n}\n.cp2.dark {\n    --bg: rgba(38, 38, 42, .86);\n    --bg-solid: #1e1e21;\n    --card: #2a2a2e;\n    --line: rgba(255, 255, 255, .1);\n    --line-strong: rgba(255, 255, 255, .18);\n    --text: #f5f5f7;\n    --text2: rgba(235, 235, 245, .7);\n    --text3: rgba(235, 235, 245, .4);\n    --fill: rgba(120, 120, 128, .24);\n    --fill2: rgba(120, 120, 128, .34);\n    --accent: #2f8cff;\n    --accent-soft: rgba(47, 140, 255, .2);\n    --shadow: 0 20px 50px rgba(0, 0, 0, .5), 0 0 0 .5px rgba(255, 255, 255, .14);\n}\n.cp2 * { box-sizing: border-box; }\n.cp2 [hidden] { display: none !important; }\n.cp2 button, .cp2 input, .cp2 select, .cp2 textarea { font: inherit; color: inherit; letter-spacing: inherit; }\n.cp2 svg { display: block; flex: none; }\n\n/* 버튼 */\n.btn { display: inline-flex; align-items: center; justify-content: center; gap: 5px; height: 24px; padding: 0 10px; border-radius: 6px; border: .5px solid var(--line-strong); background: var(--card); box-shadow: 0 .5px 1px rgba(0,0,0,.08); cursor: default; white-space: nowrap; }\n.btn:active { filter: brightness(.94); }\n.btn:disabled { opacity: .45; pointer-events: none; }\n.btn.primary { background: var(--accent); border-color: transparent; color: #fff; }\n.btn.danger { color: var(--danger); }\n.btn.big { height: 30px; padding: 0 16px; font-weight: 600; }\n.btn.icon { width: 26px; padding: 0; border: none; background: transparent; box-shadow: none; color: var(--text2); }\n.btn.icon:hover { background: var(--fill); color: var(--text); }\n.btn.ghost { border: none; background: transparent; box-shadow: none; color: var(--accent); padding: 0 4px; }\n\n/* 입력 */\n.in, .sel, .ta { width: 100%; border: .5px solid var(--line-strong); border-radius: 6px; background: var(--card); padding: 4px 8px; outline: none; }\n.in, .sel { height: 24px; }\n.ta { resize: vertical; min-height: 52px; line-height: 1.5; }\n.ta.mono, .in.mono { font: 11.5px/1.5 var(--mono); }\n.in:focus, .sel:focus, .ta:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }\n.sel { appearance: none; padding-right: 22px; background-image: linear-gradient(45deg, transparent 50%, var(--text2) 50%), linear-gradient(135deg, var(--text2) 50%, transparent 50%); background-position: calc(100% - 11px) 10px, calc(100% - 7px) 10px; background-size: 4px 4px; background-repeat: no-repeat; }\n\n/* 세그먼트 */\n.seg { display: inline-flex; padding: 2px; border-radius: 7px; background: var(--fill); gap: 2px; }\n.seg button { height: 20px; padding: 0 10px; border: none; border-radius: 5px; background: transparent; font-size: 12px; }\n.seg button.on { background: var(--card); box-shadow: 0 1px 2px rgba(0,0,0,.14); font-weight: 600; }\n.seg button:disabled { opacity: .35; }\n\n/* 스위치 */\n.sw { position: relative; width: 32px; height: 19px; border-radius: 10px; background: var(--fill2); border: none; flex: none; transition: background .15s; }\n.sw::after { content: \"\"; position: absolute; top: 2px; left: 2px; width: 15px; height: 15px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.25); transition: transform .15s; }\n.sw.on { background: var(--ok); }\n.sw.on::after { transform: translateX(13px); }\n\n/* 공통 배치 */\n.row { display: flex; align-items: center; gap: 8px; }\n.row.wrap { flex-wrap: wrap; }\n.grow { flex: 1; min-width: 0; }\n.col { display: flex; flex-direction: column; gap: 6px; }\n.muted { color: var(--text2); }\n.faint { color: var(--text3); font-size: 11.5px; }\n.label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: none; }\n.group { background: var(--card); border: .5px solid var(--line); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }\n.group-title { font-size: 11px; font-weight: 600; color: var(--text2); margin: 14px 2px 6px; display: flex; align-items: center; gap: 6px; }\n.group-title:first-child { margin-top: 2px; }\n.form { display: grid; grid-template-columns: 92px 1fr; gap: 8px 10px; align-items: center; }\n.form > .label { text-align: right; font-weight: 500; font-size: 12px; }\n.note { font-size: 11.5px; padding: 6px 9px; border-radius: 7px; background: var(--fill); color: var(--text2); }\n.note.warn { background: rgba(255, 159, 10, .15); color: var(--warn); }\n.note.err { background: rgba(255, 59, 48, .12); color: var(--danger); }\n.chip { display: inline-flex; align-items: center; gap: 4px; height: 20px; padding: 0 8px; border-radius: 10px; background: var(--fill); font-size: 11.5px; }\n\n/* 오른쪽 인스펙터 */\n.inspector { position: fixed; top: 10px; right: 10px; bottom: 10px; width: min(420px, calc(100vw - 20px)); z-index: 2147483000; display: flex; flex-direction: column; border-radius: 14px; background: var(--bg); backdrop-filter: blur(30px) saturate(1.6); -webkit-backdrop-filter: blur(30px) saturate(1.6); box-shadow: var(--shadow); overflow: hidden; animation: slide .18s ease-out; }\n@keyframes slide { from { transform: translateX(24px); opacity: 0; } }\n.inspector > header { display: flex; align-items: center; gap: 8px; padding: 10px 10px 10px 14px; border-bottom: .5px solid var(--line); }\n.inspector > header .title { font-weight: 700; font-size: 14px; }\n.inspector > .body { flex: 1; overflow: auto; padding: 10px 14px 16px; }\n.inspector > footer { padding: 10px 14px; border-top: .5px solid var(--line); display: flex; flex-direction: column; gap: 8px; }\n\n/* 가운데 창 */\n.backdrop { position: fixed; inset: 0; z-index: 2147482999; background: rgba(0,0,0,.18); display: grid; place-items: center; animation: fade .15s; }\n@keyframes fade { from { opacity: 0; } }\n.window { width: min(920px, calc(100vw - 32px)); height: min(640px, calc(100vh - 48px)); display: flex; flex-direction: column; border-radius: 12px; background: var(--bg-solid); box-shadow: var(--shadow); overflow: hidden; }\n.window > .toolbar { height: 46px; flex: none; display: flex; align-items: center; gap: 10px; padding: 0 12px; border-bottom: .5px solid var(--line); background: var(--bg); }\n.lights { display: flex; gap: 8px; margin-right: 6px; }\n.lights i { width: 12px; height: 12px; border-radius: 50%; background: var(--fill2); display: block; }\n.lights i.close { background: #ff5f57; cursor: default; }\n.window > .content { flex: 1; min-height: 0; display: flex; }\n.sidebar { width: 210px; flex: none; border-right: .5px solid var(--line); overflow: auto; padding: 8px; display: flex; flex-direction: column; gap: 2px; background: var(--bg); }\n.side-item { display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-radius: 6px; cursor: default; }\n.side-item.on { background: var(--accent); color: #fff; }\n.side-item .faint { color: inherit; opacity: .7; }\n.pane { flex: 1; min-width: 0; overflow: auto; padding: 14px 18px 20px; }\n\n/* 인물 카드 */\n.cast { border: .5px solid var(--line); border-radius: 10px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; background: var(--card); }\n.cast .head { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }\n.cast .head .sel { min-width: 0; }\n\n/* 보내는 내용 */\ndetails.sent { border: .5px solid var(--line); border-radius: 10px; background: var(--card); }\ndetails.sent > summary { list-style: none; padding: 8px 10px; cursor: default; display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 12px; }\ndetails.sent > summary::-webkit-details-marker { display: none; }\ndetails.sent .inner { padding: 0 10px 10px; display: flex; flex-direction: column; gap: 8px; }\n.gauge { height: 4px; border-radius: 2px; background: var(--fill); overflow: hidden; }\n.gauge > i { display: block; height: 100%; background: var(--ok); }\n.gauge.over > i { background: var(--danger); }\n.gauge.near > i { background: var(--warn); }\n\n/* 진행 표시 */\n.progress { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text2); }\n.spin { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--fill2); border-top-color: var(--accent); animation: rot .8s linear infinite; }\n@keyframes rot { to { transform: rotate(360deg); } }\n\n/* 알림 배너 */\n.toasts { position: fixed; top: 12px; right: 12px; z-index: 2147483001; display: flex; flex-direction: column; gap: 8px; width: min(340px, calc(100vw - 24px)); }\n.toast { display: flex; gap: 10px; padding: 10px 12px; border-radius: 12px; background: var(--bg); backdrop-filter: blur(30px) saturate(1.6); -webkit-backdrop-filter: blur(30px) saturate(1.6); box-shadow: var(--shadow); animation: drop .2s ease-out; }\n@keyframes drop { from { transform: translateY(-8px); opacity: 0; } }\n.toast .ic { width: 26px; height: 26px; border-radius: 7px; display: grid; place-items: center; color: #fff; background: var(--accent); flex: none; }\n.toast.err .ic { background: var(--danger); }\n.toast.ok .ic { background: var(--ok); }\n.toast .t { font-weight: 600; }\n.toast pre { margin: 6px 0 0; max-height: 160px; overflow: auto; font: 11px/1.4 var(--mono); white-space: pre-wrap; color: var(--text2); }\n\n/* 갤러리 */\n.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); gap: 10px; }\n.thumb { position: relative; border-radius: 8px; overflow: hidden; background: var(--fill); aspect-ratio: 1216 / 832; cursor: zoom-in; }\n.thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }\n.thumb .cap { position: absolute; left: 0; right: 0; bottom: 0; padding: 14px 8px 5px; font-size: 11px; color: #fff; background: linear-gradient(transparent, rgba(0,0,0,.6)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.viewer { position: fixed; inset: 0; z-index: 2147483002; background: rgba(0,0,0,.86); display: flex; }\n.viewer .stage { flex: 1; display: grid; place-items: center; padding: 24px; min-width: 0; }\n.viewer .stage img { max-width: 100%; max-height: 100%; border-radius: 6px; }\n.viewer aside { width: 320px; background: var(--bg-solid); overflow: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }\n";

const CSS_PAGE = ".cp2-msgbtn, .cp2-head { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; border-radius: 7px; background: transparent; color: inherit; opacity: .62; cursor: pointer; padding: 0; }\n.cp2-msgbtn:hover, .cp2-head:hover { opacity: 1; background: rgba(127, 127, 127, .14); }\n.cp2-head { width: 32px; height: 32px; opacity: .8; }\n.cp2-msgbtn.busy { opacity: 1; color: #0a7aff; animation: cp2-pulse 1.2s ease-in-out infinite; }\n@keyframes cp2-pulse { 50% { opacity: .45; } }\n.cp2-figure { position: relative; margin: 14px 0; border-radius: 10px; overflow: hidden; line-height: 0; background: rgba(127, 127, 127, .1); user-select: none; }\n.cp2-figure img { width: 100%; height: auto; display: block; cursor: zoom-in; }\n.cp2-fbar { position: absolute; left: 8px; right: 8px; bottom: 8px; display: flex; align-items: center; gap: 2px; padding: 3px; border-radius: 9px; background: rgba(28, 28, 30, .62); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); color: #fff; opacity: 0; transform: translateY(4px); transition: opacity .15s, transform .15s; line-height: 1; }\n.cp2-figure:hover .cp2-fbar, .cp2-figure:focus-within .cp2-fbar { opacity: 1; transform: none; }\n@media (hover: none) { .cp2-fbar { opacity: 1; transform: none; } }\n.cp2-fbtn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 26px; border: none; border-radius: 6px; background: transparent; color: inherit; cursor: pointer; padding: 0; }\n.cp2-fbtn:hover { background: rgba(255, 255, 255, .16); }\n.cp2-fbtn.armed { background: #ff3b30; }\n.cp2-fcount { font: 600 11.5px/1 -apple-system, BlinkMacSystemFont, sans-serif; padding: 0 4px; }\n.cp2-fgap { flex: 1; }\n";

// ── util.js ──
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


// ── tags.js ──
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


// ── rules.js ──
// NAI 자동화 프로젝트 가이드의 규칙을 코드로 지킨다.
// AI가 무엇을 써 오든 생성 직전에 이 검사를 거친다.
const Rules = (() => {
    // 어려 보이게 하는 태그·체형: 모든 칸에서 뺀다.
    const YOUTH = /^(loli|lolicon|shota|shotacon|child|children|kid|kids|toddler|infant|baby|aged down|younger|teen|teenage|teenager|preteen|female child|male child|elementary school student|middle school student|flat chest|petite|small stature|childlike|child body|young|younger sister|younger brother|chibi|kindergarten uniform|school swimsuit)$/;

    // 작가·화풍·품질·연도·인원수: 베이스가 정하므로 AI 출력에서 뺀다.
    const STYLE = /^(artist:.*|.*\(artist\)|.*\(style\)|.*\(medium\)|year \d{4}|\d{4}s|masterpiece|best quality|amazing quality|good quality|normal quality|very aesthetic|aesthetic|highres|absurdres|incredibly absurdres|4k|8k|official art|realistic|semi-realistic|photorealistic|anime style|no text|very displeasing|worst quality|bad quality)$/;
    const COUNT = /^(solo|\d\+?(boys?|girls?|others?)|multiple (boys|girls|others)|male focus|female focus|group|couple)$/;

    // 소품: 작품 외형·의상이나 사용자가 쓴 장면에 있을 때만 남긴다.
    const PROPS = /^(cigarette|cigar|smoking|holding cigarette|lighter|match|matches|matchstick|bottle|wine bottle|holding bottle|alcohol|beer|sake|wine|wine glass|drinking glass|glass|cup|mug|teacup|holding cup|coffee|tea|towel|book|holding book|open book|phone|cellphone|smartphone|holding phone|sword|katana|holding sword|gun|handgun|rifle|holding gun|knife|dagger|holding knife|weapon|holding weapon|umbrella|holding umbrella|flower|holding flower|bouquet|rose|pen|pencil|paper|document|documents|newspaper|letter|envelope|bag|handbag|briefcase|food|plate|fork|spoon|chopsticks|can|key|candle|holding candle|lantern|holding lantern|mask|fan|folding fan|hand fan|pipe|smoking pipe|cane|staff|wand|card|playing card|tablet|laptop|headphones|stuffed toy|teddy bear|rope|chain|leash|collar|syringe|pill|pills|medicine|bandage|camera|microphone|guitar|violin|piano|ball|gift|box|present|ring|engagement ring|necklace|earrings|jewelry|cross|rosary|bible|crown|tiara|hat|gloves|scarf|glasses|sunglasses)$/;

    // 서 있는 전신은 가로 화면을 세로로 3등분해 버린다.
    const LYING = /^(lying|on back|on side|on stomach|reclining|sitting|kneeling|squatting|crouching|seiza|on bed|lying on bed|straddling|all fours|on couch|on floor|sitting on bed|lying on side)$/;

    // 섹스 세트 전용 표현: NSFW가 아닌데 나오면 뺀다.
    const EXPLICIT = /^(nsfw|nude|completely nude|sex|penis|pussy|vaginal|anal|oral|fellatio|cum|cum inside|erection|missionary|cowgirl position|doggystyle|nipples|areolae|ejaculation|orgasm|after sex|implied sex)$/;

    function cleanAiTags(text, { allowProps = new Set(), nsfw = false } = {}) {
        const notes = [];
        const r = Tags.remove(text, k => {
            if (YOUTH.test(k)) { notes.push(`어려 보이는 태그 뺌: ${k}`); return true; }
            if (STYLE.test(k)) return true;
            if (COUNT.test(k)) return true;
            if (!nsfw && EXPLICIT.test(k)) { notes.push(`NSFW가 아닌 장면이라 뺌: ${k}`); return true; }
            if (PROPS.test(k) && !allowProps.has(k)) { notes.push(`지정하지 않은 소품 뺌: ${k}`); return true; }
            return false;
        });
        return { text: r.text, notes };
    }

    // 작품에서 온 외형·의상에도 어려 보이는 태그가 섞여 있으면 뺀다(사용자에게 알림).
    function cleanAppearance(text) {
        const r = Tags.remove(text, k => YOUTH.test(k));
        return { text: r.text, notes: r.removed.map(t => `외형에서 어려 보이는 태그 뺌: ${Tags.key(t)}`) };
    }

    // 서 있는 전신 → cowboy shot. 눕거나 앉아 가로로 놓이면 그대로 둔다.
    function landscape(sceneText, poseTexts) {
        const keys = new Set([...Tags.flatKeys(sceneText), ...poseTexts.flatMap(t => Tags.flatKeys(t))]);
        if (!keys.has('full body')) return { text: sceneText, notes: [] };
        const horizontal = !keys.has('standing') && [...keys].some(k => LYING.test(k));
        if (horizontal) return { text: sceneText, notes: [] };
        return { text: Tags.replace(sceneText, 'full body', 'cowboy shot'), notes: ['서 있는 전신은 가로 화면에서 여러 컷으로 쪼개져서 cowboy shot으로 바꿈'] };
    }

    // 캐릭터 부정에 beard 보장(수염이 설정인 인물 제외)
    function negativeGuard(neg, beardOk) {
        const keys = new Set(Tags.flatKeys(neg));
        if (beardOk) {
            return Tags.remove(neg, k => k === 'beard').text;
        }
        if (keys.has('beard')) return neg;
        return Tags.join(['beard', ...Tags.split(neg)]);
    }

    // 소품 허용 목록: 작품 외형·의상에 이미 있는 태그 + 사용자가 장면에서 요청한 소품
    function propAllowance(texts, requested = []) {
        const set = new Set();
        for (const t of texts) for (const k of Tags.flatKeys(t)) set.add(k);
        for (const r of requested) set.add(Tags.key(r));
        return set;
    }

    return { YOUTH, STYLE, COUNT, PROPS, EXPLICIT, cleanAiTags, cleanAppearance, landscape, negativeGuard, propAllowance };
})();


// ── works.js ──
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


// ── direct.js ──
// AI 연출 지시문과 연출 결과 검사.
// AI는 "누가 · 어떤 감정 · 어디서 · 어떤 구도"만 고른다. 외형·의상·화풍은 작품 카드가 맡는다.
const Direct = (() => {
    const SHOTS = ['close-up', 'upper body', 'cowboy shot', 'wide shot', 'full body'];
    const POSITIONS = { left: { x: 0.3, y: 0.5 }, center: { x: 0.5, y: 0.5 }, right: { x: 0.7, y: 0.5 } };

    function shortLook(ch) {
        return Tags.flatKeys(ch.appearance).filter(k => !/mature|aged up|skin|shoulder|neck|muscular|sharp face/.test(k)).slice(0, 10).join(', ');
    }

    function dossier(ch, nsfwOk) {
        const lines = [`- 이름: ${ch.name}${ch.aliases?.length ? ` (다른 호칭: ${ch.aliases.join(', ')})` : ''}`];
        lines.push(`  성별: ${Works.isMale(ch) ? '남' : '여'} · 성인 장면 ${ch.adult && nsfwOk ? '가능' : '불가'}`);
        lines.push(`  외형 요약(참고만, 출력에 쓰지 말 것): ${shortLook(ch)}`);
        if (ch.note) lines.push(`  감정 해석: ${ch.note}`);
        const sample = ['분노', '기쁨', '부끄러움', '평온', '슬픔', '유혹'].filter(e => ch.emotions?.[e]);
        if (sample.length) {
            lines.push('  이 인물이 실제로 쓴 감정 연출(어떻게 비트는지 참고, 그대로 베끼지 말 것):');
            for (const e of sample) lines.push(`    ${e}: ${ch.emotions[e]}`);
        }
        return lines.join('\n');
    }

    function instruction({ work, chars, nsfwOk, places }) {
        const emotions = Works.GENERAL.join(' · ');
        const nsfw = Works.NSFW.join(' · ');
        return `너는 롤플레이 장면 하나를 NovelAI 삽화 한 장으로 연출하는 감독이야.
인물의 외형·의상·화풍 태그는 이미 정해져 있어. 너는 연출만 정해.

## 작품: ${work.name}
${work.memo ? work.memo + '\n' : ''}## 등장할 수 있는 인물
${chars.map(c => dossier(c, nsfwOk)).join('\n')}

## 장소 세트 (작품 감정 이미지와 같은 배경)
${Object.entries(places).filter(([, v]) => v).map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- (없음: setting은 "기타"로 하고 place를 써)'}

## 규칙
1. 그림은 가로(1216×832)야. 인물을 세로로 길고 좁게 세우지 마. 서 있는 전신, 좁은 상반신 옆모습 하나만 있는 구도는 금지.
   전신이 필요하면 앉히거나 기대거나 눕혀 가로로 놓아. 상체 컷은 몸을 기울이거나 팔을 뻗어 좌우로 퍼지게 해.
2. 감정은 표정 단어 하나보다 각도·자세·시선으로 읽히게 해(올려다보기, 내려다보기, 고개 젖힘·숙임, 더치 앵글).
   같은 감정이라도 인물의 해석대로 비틀어(냉소형은 웃으며 내려다보고, 직진형은 이를 악문다).
3. 소품을 지어내지 마. 원문에 담배·술병이 나와도 사용자가 원하는 장면에서 직접 말하지 않았으면 넣지 마. 행동은 몸짓으로만 옮겨.
4. 외형(머리·눈·체형)·의상·작가·화풍·품질·인원수(1boy, solo 등) 태그는 쓰지 마. 이름도 태그에 쓰지 마.
5. 어려 보이는 표현은 어디에도 쓰지 마.
6. 태그는 실제 Danbooru/NovelAI 영어 태그만, 칸마다 2~6개. 핵심 묶음에만 1.2~1.4 가중치(예: 1.3::looking down, smirk::).
7. 장면에 나오는 인물만 cast에 넣어(최대 3명). 목록에 없는 사람이 꼭 필요하면 name을 "엑스트라"로 하고 look에 성별·머리 정도만 영어 태그로.
8. ${nsfwOk ? `성적인 장면이면 setting을 "섹스"로 하고 emotion은 [${nsfw}] 중에서 골라. "성인 장면 가능"인 인물만.` : 'setting "섹스"는 쓰지 마.'}

## 출력: 아래 JSON 하나만. 설명 금지.
{
  "paragraph": 삽화를 넣을 문단 번호(0부터, 대상 답변 기준),
  "title": "한국어 짧은 제목",
  "setting": "낮 | 밤 | 실내 | 섹스 | 기타",
  "place": "setting이 기타이거나 장소 세트와 다른 곳일 때만 영어 태그(장소 1묶음 + 빛 1개). 아니면 빈 문자열",
  "shot": "${SHOTS.join(' | ')}",
  "camera": "각도 태그 (from below, from above, dutch angle, from side, three quarter view …)",
  "scene": "인물 사이 상호작용 태그 (eye contact, hug, holding hands …). 혼자면 빈 문자열",
  "cast": [
    { "name": "위 목록 이름 그대로", "emotion": "[${emotions}] 중 하나", "face": "표정 태그", "gaze": "시선 태그", "pose": "자세·손 태그", "position": "left | center | right" }
  ],
  "props": ["사용자가 원하는 장면에서 직접 말한 소품만 영어 태그로. 없으면 빈 배열"],
  "caption": "V5용 영어 1~2문장. 이름 대신 the tall man / the woman 처럼",
  "why": "한국어 한 줄: 이 구도를 고른 이유"
}`;
    }

    function userTurn({ context, target, paragraphs, request }) {
        const paraList = paragraphs.map((p, i) => `[${i}] ${p.slice(0, 160)}`).join('\n');
        return `## 앞 대화 (오래된 것부터)
${context || '(없음)'}

## 대상 답변 (이 답변의 장면을 그려)
${target}

## 대상 답변 문단 번호
${paraList}

## 사용자가 원하는 장면
${request ? request : '(따로 없음: 대상 답변에서 가장 그림이 되는 순간을 골라)'}`;
    }

    // AI 답 → 검사된 연출. 이름은 카드와 맞추고, 모르는 감정·구도는 고친다.
    function normalize(raw, { chars, paragraphCount, nsfwOk }) {
        const d = raw && typeof raw === 'object' ? raw : {};
        const names = new Map(chars.flatMap(c => [[c.name, c], ...(c.aliases || []).map(a => [a, c])]));
        const setting = ['낮', '밤', '실내', '섹스', '기타'].includes(d.setting) ? d.setting : '실내';
        const cast = (Array.isArray(d.cast) ? d.cast : []).slice(0, 3).map(m => {
            const ch = names.get(String(m.name || '').trim()) || chars.find(c => String(m.name || '').includes(c.name));
            const nsfw = setting === '섹스';
            const pool = nsfw ? Works.NSFW : Works.GENERAL;
            const emotion = pool.includes(m.emotion) ? m.emotion : (nsfw ? '사랑' : '평온');
            return {
                name: ch ? ch.name : '엑스트라',
                extra: !ch,
                look: ch ? '' : String(m.look || ''),
                emotion,
                face: String(m.face || ''),
                gaze: String(m.gaze || ''),
                pose: String(m.pose || ''),
                position: POSITIONS[m.position] ? m.position : 'center'
            };
        });
        const out = {
            paragraph: U.clamp(Number.isInteger(d.paragraph) ? d.paragraph : paragraphCount - 1, 0, Math.max(0, paragraphCount - 1)),
            title: String(d.title || '').slice(0, 40),
            setting: setting === '섹스' && !nsfwOk ? '실내' : setting,
            place: String(d.place || ''),
            shot: SHOTS.includes(d.shot) ? d.shot : 'upper body',
            camera: String(d.camera || ''),
            scene: String(d.scene || ''),
            cast,
            props: Array.isArray(d.props) ? d.props.map(String).filter(Boolean) : [],
            caption: String(d.caption || ''),
            why: String(d.why || '')
        };
        // 섹스 장면은 성인으로 만든 인물만
        if (out.setting === '섹스' && out.cast.some(m => m.extra || !chars.find(c => c.name === m.name)?.adult)) out.setting = '실내';
        if (out.setting !== '섹스') for (const m of out.cast) if (!Works.GENERAL.includes(m.emotion)) m.emotion = '평온';
        // 위치가 겹치면 좌우로 벌린다
        if (out.cast.length === 2 && out.cast[0].position === out.cast[1].position) { out.cast[0].position = 'left'; out.cast[1].position = 'right'; }
        if (out.cast.length === 3) ['left', 'center', 'right'].forEach((p, i) => { out.cast[i].position = p; });
        return out;
    }

    // AI 없이 직접 고를 때의 빈 연출
    function blank(chars) {
        return { paragraph: 0, title: '', setting: '실내', place: '', shot: 'upper body', camera: '', scene: '', cast: chars.slice(0, 1).map(c => ({ name: c.name, extra: false, look: '', emotion: '평온', face: '', gaze: '', pose: '', position: 'center' })), props: [], caption: '', why: '' };
    }

    return { SHOTS, POSITIONS, instruction, userTurn, normalize, blank };
})();


// ── compose.js ──
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


// ── nai.js ──
// NovelAI 이미지 생성 요청.
// V4.5: JSON 본문, params_version 3. V5: multipart('request' 파트), params_version 4, msgpack 스트림.
const NAI = (() => {
    const ENDPOINT = 'https://image.novelai.net/ai/generate-image';
    const SIZES = { landscape: [1216, 832], wide: [1472, 704], square: [1024, 1024] };

    function payload(out, gen, seed) {
        const [width, height] = SIZES[gen.size] || SIZES.landscape;
        const coords = out.chars.length > 1 && gen.coords !== false;
        const charPos = out.chars.map(c => ({ char_caption: c.prompt, centers: [c.center] }));
        const charNeg = out.chars.map(c => ({ char_caption: c.neg, centers: [c.center] }));
        const common = {
            width, height,
            scale: Number(gen.scale),
            cfg_rescale: Number(gen.rescale),
            sampler: gen.sampler,
            noise_schedule: gen.noise,
            steps: Number(gen.steps),
            seed,
            n_samples: 1,
            negative_prompt: out.baseNeg,
            dynamic_thresholding: false,
            controlnet_strength: 1,
            legacy: false,
            legacy_v3_extend: false,
            add_original_image: true,
            deliberate_euler_ancestral_bug: false,
            prefer_brownian: true
        };
        if (out.model.v5) {
            return {
                input: out.base,
                model: out.model.id,
                action: 'generate',
                use_new_shared_trial: true,
                parameters: {
                    ...common,
                    params_version: 4,
                    ucPresetId: 'none',
                    qualityPresetId: 'none',
                    tag_hint_qt: 0,
                    tag_hint_uc_preset: 0,
                    autoSmea: false,
                    use_coords: coords,
                    legacy_uc: false,
                    normalize_reference_strength_multiple: true,
                    inpaintImg2ImgStrength: 1,
                    characterPrompts: [],
                    straight_alpha: true,
                    v4_prompt: { caption: { base_caption: out.base, char_captions: charPos }, use_coords: coords, use_order: true },
                    v4_negative_prompt: { caption: { base_caption: out.baseNeg, char_captions: charNeg }, legacy_uc: false },
                    image_format: 'png',
                    stream: 'msgpack'
                }
            };
        }
        return {
            input: out.base,
            model: out.model.id,
            action: 'generate',
            parameters: {
                ...common,
                params_version: 3,
                uc: out.baseNeg,
                ucPreset: 2,
                qualityToggle: true,
                sm: false,
                sm_dyn: false,
                uncond_scale: 1,
                reference_information_extracted_multiple: [],
                reference_strength_multiple: [],
                v4_prompt: { caption: { base_caption: out.base, char_captions: charPos }, use_coords: coords, use_order: true, legacy_uc: false },
                v4_negative_prompt: { caption: { base_caption: out.baseNeg, char_captions: charNeg }, use_coords: coords, use_order: true, legacy_uc: false }
            }
        };
    }

    // ── 응답에서 이미지 꺼내기 ─────────────────────────────
    const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

    function indexOf(bytes, sig, from = 0) {
        for (let i = from; i <= bytes.length - sig.length; i++) {
            let ok = true;
            for (let j = 0; j < sig.length; j++) if (bytes[i + j] !== sig[j]) { ok = false; break; }
            if (ok) return i;
        }
        return -1;
    }

    // PNG 청크를 따라가 IEND까지 자른다. 스트림에는 미리보기 PNG가 여럿 올 수 있어 마지막 완성본을 고른다.
    function lastPng(bytes) {
        let found = null;
        let at = indexOf(bytes, PNG_SIG);
        while (at >= 0) {
            let p = at + 8;
            let end = -1;
            while (p + 12 <= bytes.length) {
                const len = (bytes[p] * 2 ** 24) + (bytes[p + 1] << 16) + (bytes[p + 2] << 8) + bytes[p + 3];
                if (p + 12 + len > bytes.length) break;
                const type = String.fromCharCode(bytes[p + 4], bytes[p + 5], bytes[p + 6], bytes[p + 7]);
                p += 12 + len;
                if (type === 'IEND') { end = p; break; }
            }
            if (end > 0) found = bytes.subarray(at, end);
            at = indexOf(bytes, PNG_SIG, at + 8);
        }
        return found;
    }

    function readError(bytes) {
        const text = new TextDecoder().decode(bytes.subarray(0, 3000)).trim();
        try {
            const j = JSON.parse(text);
            return j.message || j.error || text;
        } catch (_) {
            return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 300);
        }
    }

    function image(buffer) {
        const bytes = new Uint8Array(buffer);
        if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
            const files = fflate.unzipSync(bytes);
            const name = Object.keys(files).find(n => /\.(png|webp|jpe?g)$/i.test(n));
            if (!name) throw new Error('NAI가 보낸 압축 파일에 그림이 없어.');
            return new Blob([files[name]], { type: /\.webp$/i.test(name) ? 'image/webp' : 'image/png' });
        }
        const png = lastPng(bytes);
        if (png) return new Blob([png], { type: 'image/png' });
        throw new Error(readError(bytes) || 'NAI 응답에서 그림을 찾지 못했어.');
    }

    function check(p) {
        const q = p.parameters;
        const bad = [];
        if (!(q.steps >= 1 && q.steps <= 50)) bad.push(`스텝 ${q.steps}`);
        if (!(q.scale >= 0 && q.scale <= 10)) bad.push(`가이던스 ${q.scale}`);
        if (!(q.cfg_rescale >= 0 && q.cfg_rescale <= 1)) bad.push(`리스케일 ${q.cfg_rescale}`);
        if (!String(p.input).trim()) bad.push('베이스가 비어 있음');
        if (bad.length) throw new Error(`생성 값이 잘못됐어: ${bad.join(', ')}`);
    }

    async function generate({ out, gen, token, seed, signal }) {
        if (!token) throw Object.assign(new Error('NovelAI 토큰이 없어. 작업실 → 설정 → 연결에서 넣어 줘.'), { pane: 'settings' });
        const useSeed = Number.isFinite(Number(seed)) && String(seed).trim() !== '' ? Number(seed) : Math.floor(Math.random() * 4294967295);
        const body = payload(out, gen, useSeed);
        check(body);
        let data;
        const headers = { Authorization: `Bearer ${token}` };
        if (out.model.v5) {
            data = new FormData();
            data.append('request', new Blob([JSON.stringify(body)], { type: 'application/json' }), 'blob');
        } else {
            data = JSON.stringify(body);
            headers['Content-Type'] = 'application/json';
        }
        const res = await Net.send({ method: 'POST', url: ENDPOINT, headers, data, responseType: 'arraybuffer', timeout: 180000, signal });
        if (res.status >= 400) throw Object.assign(new Error(`NovelAI ${res.status}: ${readError(new Uint8Array(res.response || new ArrayBuffer(0)))}`), { status: res.status });
        return { blob: image(res.response), seed: useSeed, body };
    }

    async function checkToken(token) {
        const res = await Net.send({ method: 'GET', url: 'https://image.novelai.net/user/subscription', headers: { Authorization: `Bearer ${token}` }, responseType: 'json', timeout: 20000 });
        if (res.status >= 400) throw new Error(res.status === 401 ? '토큰이 맞지 않아.' : `확인 실패 (${res.status})`);
        const tier = ['무료', 'Tablet', 'Scroll', 'Opus'][res.response?.tier] || '알 수 없음';
        return { tier, active: !!res.response?.active };
    }

    return { SIZES, payload, image, lastPng, generate, checkToken };
})();

// GM_xmlhttpRequest를 Promise로. 상태 코드는 호출한 쪽이 본다.
const Net = (() => {
    function send({ method = 'GET', url, headers = {}, data, responseType = 'text', timeout = 60000, signal }) {
        return new Promise((resolve, reject) => {
            if (signal?.aborted) { reject(new DOMException('취소됨', 'AbortError')); return; }
            const req = GM_xmlhttpRequest({
                method, url, headers, data, responseType, timeout,
                onload: r => resolve({ status: r.status, response: r.response, text: responseType === 'text' ? r.responseText : '' }),
                onerror: () => reject(new Error(`${new URL(url).host}에 연결하지 못했어.`)),
                ontimeout: () => reject(new Error(`${new URL(url).host} 응답이 너무 늦어.`)),
                onabort: () => reject(new DOMException('취소됨', 'AbortError'))
            });
            signal?.addEventListener('abort', () => req?.abort?.(), { once: true });
        });
    }

    async function json({ method = 'POST', url, headers = {}, body, timeout = 120000, signal }) {
        const res = await send({ method, url, headers: { 'Content-Type': 'application/json', ...headers }, data: body == null ? undefined : JSON.stringify(body), responseType: 'text', timeout, signal });
        let parsed = null;
        try { parsed = JSON.parse(res.text || 'null'); } catch (_) { /* 글 응답 */ }
        if (res.status >= 400) {
            const msg = parsed?.error?.message || parsed?.error || parsed?.message || (res.text || '').slice(0, 200);
            throw Object.assign(new Error(`${new URL(url).host} ${res.status}: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`), { status: res.status });
        }
        return parsed;
    }

    return { send, json };
})();


// ── ai.js ──
// 장면 분석 AI. API 셋(Gemini · Claude · OpenAI)과 ChatGPT 웹 중계.
const AI = (() => {
    const PROVIDERS = {
        gemini: { label: 'Gemini API', key: 'gemini', hint: 'AIza…  (aistudio.google.com/apikey)' },
        claude: { label: 'Claude API', key: 'claude', hint: 'sk-ant-…  (console.anthropic.com)' },
        openai: { label: 'GPT API', key: 'openai', hint: 'sk-…  (platform.openai.com)' },
        chatgpt: { label: 'ChatGPT 웹', key: null, hint: 'chatgpt.com에 로그인만 돼 있으면 돼. 탭을 뒤에서 열어 대신 물어봐.' },
        none: { label: '안 씀', key: null, hint: '인물·감정·장소를 직접 골라서 그려.' }
    };

    async function gemini({ key, model, system, user, signal }) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
        const off = ['HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT'].map(category => ({ category, threshold: 'BLOCK_NONE' }));
        const j = await Net.json({ url, signal, body: { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: user }] }], generationConfig: { temperature: 0.9 }, safetySettings: off } });
        const cand = j?.candidates?.[0];
        const text = (cand?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('');
        if (!text) throw new Error(`Gemini가 답하지 않았어 (${cand?.finishReason || j?.promptFeedback?.blockReason || '이유 없음'}).`);
        return text;
    }

    async function claude({ key, model, system, user, signal }) {
        const j = await Net.json({
            url: 'https://api.anthropic.com/v1/messages', signal,
            headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
            body: { model, max_tokens: 2500, system, messages: [{ role: 'user', content: user }] }
        });
        const text = (j?.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
        if (!text) throw new Error(`Claude가 답하지 않았어 (${j?.stop_reason || '이유 없음'}).`);
        return text;
    }

    async function openai({ key, model, system, user, signal }) {
        const j = await Net.json({
            url: 'https://api.openai.com/v1/chat/completions', signal,
            headers: { Authorization: `Bearer ${key}` },
            body: { model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }
        });
        const text = j?.choices?.[0]?.message?.content || '';
        if (!text) throw new Error(`GPT가 답하지 않았어 (${j?.choices?.[0]?.finish_reason || '이유 없음'}).`);
        return text;
    }

    // ChatGPT 웹: 요청을 저장소에 두고 chatgpt.com 탭을 뒤에서 연다. 그 탭의 relay.js가 답을 돌려준다.
    function chatgpt({ system, user, signal }) {
        return new Promise((resolve, reject) => {
            const id = U.uid('job');
            const text = `${system}\n\n---\n\n${user}\n\n---\n위 출력 형식의 JSON 하나만 \`\`\`json 코드 블록으로 답해.`;
            GM_setValue('cp2.relay.job', { id, text, at: Date.now() });
            const tab = GM_openInTab(`https://chatgpt.com/?cp2job=${id}`, { active: false, insert: true, setParent: true });
            let finished = false;
            const stop = (fn, v) => {
                if (finished) return;
                finished = true;
                clearTimeout(timer);
                try { GM_removeValueChangeListener(listener); } catch (_) { /* 없음 */ }
                try { tab?.close?.(); } catch (_) { /* 이미 닫힘 */ }
                fn(v);
            };
            const listener = GM_addValueChangeListener('cp2.relay.result', (_k, _o, value) => {
                if (!value || value.id !== id) return;
                if (value.error) stop(reject, new Error(`ChatGPT: ${value.error}`));
                else stop(resolve, value.text);
            });
            const timer = setTimeout(() => stop(reject, new Error('ChatGPT가 10분 안에 답하지 않았어.')), 10 * 60000);
            signal?.addEventListener('abort', () => stop(reject, new DOMException('취소됨', 'AbortError')), { once: true });
        });
    }

    async function ask({ provider, model, keys, system, user, signal }) {
        const p = PROVIDERS[provider];
        if (!p || provider === 'none') throw new Error('분석 AI를 안 쓰는 설정이야.');
        const key = p.key ? keys[p.key] : '';
        if (p.key && !key) throw Object.assign(new Error(`${p.label} 키가 없어. 작업실 → 설정 → 연결에서 넣어 줘.`), { pane: 'settings' });
        const fn = { gemini, claude, openai, chatgpt }[provider];
        return fn({ key, model, system, user, signal });
    }

    async function listModels(provider, key) {
        if (provider === 'gemini') {
            const j = await Net.json({ method: 'GET', url: `https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(key)}` });
            return (j.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => m.name.replace(/^models\//, '')).filter(n => /^gemini/.test(n));
        }
        if (provider === 'claude') {
            const j = await Net.json({ method: 'GET', url: 'https://api.anthropic.com/v1/models?limit=100', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' } });
            return (j.data || []).map(m => m.id);
        }
        if (provider === 'openai') {
            const j = await Net.json({ method: 'GET', url: 'https://api.openai.com/v1/models', headers: { Authorization: `Bearer ${key}` } });
            return (j.data || []).map(m => m.id).filter(id => /^(gpt|o\d|chatgpt)/.test(id) && !/audio|realtime|image|tts|transcribe|search|embedding/.test(id)).sort().reverse();
        }
        return [];
    }

    return { PROVIDERS, ask, listModels };
})();


// ── relay.js ──
// chatgpt.com에서만 돈다. 크랙 탭이 맡긴 요청 하나를 ChatGPT에 보내고 답(JSON)을 돌려준다.
// 주소의 cp2job과 저장소의 작업 id가 같을 때만 움직인다(사용자가 직접 연 ChatGPT에는 손대지 않음).
const Relay = (() => {
    const visible = el => !!el && el.getClientRects().length > 0;
    const first = sels => sels.map(s => [...document.querySelectorAll(s)].find(visible)).find(Boolean) || null;

    const composer = () => first(['#prompt-textarea', 'div[contenteditable="true"][id="prompt-textarea"]', 'form div[contenteditable="true"]', 'form textarea']);
    const sendButton = () => first(['button[data-testid="send-button"]', '#composer-submit-button', 'form button[aria-label*="Send"]', 'form button[aria-label*="보내기"]']);
    const generating = () => !!first(['button[data-testid="stop-button"]', 'button[aria-label*="Stop"]', 'button[aria-label*="중지"]']);
    const replies = () => [...document.querySelectorAll('[data-message-author-role="assistant"]')];

    // 숨은 탭에서도 화면 변화가 있으면 바로 깨어난다(타이머는 느려져도 MutationObserver는 바로 불림).
    function change(ms) {
        return new Promise(resolve => {
            const mo = new MutationObserver(() => { mo.disconnect(); clearTimeout(t); resolve(); });
            mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
            const t = setTimeout(() => { mo.disconnect(); resolve(); }, ms);
        });
    }

    async function until(test, ms) {
        const end = Date.now() + ms;
        while (Date.now() < end) {
            const v = test();
            if (v) return v;
            await change(1000);
        }
        return null;
    }

    function textOf(el) { return el ? (el.tagName === 'TEXTAREA' ? el.value : el.innerText) : ''; }

    async function put(text) {
        for (let i = 0; i < 3; i++) {
            const el = await until(composer, 60000);
            if (!el) throw new Error('입력창을 찾지 못했어. ChatGPT에 로그인돼 있는지 확인해 줘.');
            el.focus();
            if (i === 0) {
                document.execCommand('selectAll', false);
                document.execCommand('insertText', false, text);
            } else if (i === 1) {
                const dt = new DataTransfer();
                dt.setData('text/plain', text);
                el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
            } else if (el.tagName === 'TEXTAREA') {
                Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, text);
                el.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                el.textContent = text;
                el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
            }
            await change(700);
            if (textOf(composer()).trim().length > Math.min(40, text.length / 2)) return;
        }
        throw new Error('입력창에 요청을 넣지 못했어.');
    }

    function jsonIn(el) {
        const blocks = [...el.querySelectorAll('pre')].map(p => p.innerText).filter(t => t.includes('{'));
        for (const t of [...blocks.reverse(), el.innerText]) {
            try { U.pickJson(t); return t; } catch (_) { /* 아직 덜 옴 */ }
        }
        return '';
    }

    async function run(id) {
        const job = GM_getValue('cp2.relay.job', null);
        if (!job || job.id !== id) return;
        if (GM_getValue('cp2.relay.taken', '') === id) return;
        GM_setValue('cp2.relay.taken', id);
        const reply = v => GM_setValue('cp2.relay.result', { id, ...v, at: Date.now() });
        try {
            await put(job.text);
            const btn = await until(() => { const b = sendButton(); return b && !b.disabled ? b : null; }, 60000);
            if (!btn) throw new Error('보내기 버튼이 눌리지 않았어.');
            const before = replies().length;
            btn.click();
            if (!await until(() => replies().length > before || generating(), 90000)) throw new Error('ChatGPT가 답을 시작하지 않았어(사용 한도나 로그인을 확인해 줘).');
            let last = '';
            let same = 0;
            const end = Date.now() + 8 * 60000;
            while (Date.now() < end) {
                await change(1500);
                const el = replies().at(-1);
                const now = el ? el.innerText : '';
                if (!generating() && el && jsonIn(el)) break;
                same = now && now === last && !generating() ? same + 1 : 0;
                if (same >= 3) break;
                last = now;
            }
            const el = replies().at(-1);
            const text = el ? (jsonIn(el) || el.innerText) : '';
            if (!text) throw new Error('답을 읽지 못했어.');
            reply({ text });
        } catch (e) {
            reply({ error: e.message || String(e) });
        }
    }

    function start() {
        const id = new URLSearchParams(location.search).get('cp2job');
        if (id) run(id);
    }

    return { start };
})();


// ── crack.js ──
// 크랙 화면과 메시지 API.
// 메시지 묶음: [data-message-group-id] (= 메시지 _id), 본문: .wrtn-markdown, 그 바로 다음 줄이 버튼 줄.
// 역할(user/assistant)은 화면으로 가르기 어려워 메시지 API로 확인한다.
const Crack = (() => {
    const API = 'https://crack-api.wrtn.ai/crack-gen/v3';
    const roles = new Map();       // messageId → role
    const contents = new Map();    // messageId → content
    let chatInfo = { id: '', story: null };

    function chatId() {
        const m = location.pathname.match(/\/episodes\/([0-9a-f]{12,})/i);
        return m ? m[1] : '';
    }
    function storyId() {
        const m = location.pathname.match(/\/stories\/([0-9a-f]{12,})/i);
        return m ? m[1] : (chatInfo.story?._id || '');
    }

    function token() {
        const m = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
        return m ? decodeURIComponent(m[1]) : '';
    }

    async function get(path) {
        const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token()}` }, credentials: 'include' });
        if (!res.ok) throw new Error(`크랙 API ${res.status}`);
        const j = await res.json();
        return j.data ?? j;
    }

    async function chat() {
        const id = chatId();
        if (!id) return null;
        if (chatInfo.id !== id) {
            const d = await get(`/chats/${id}`);
            chatInfo = { id, story: d.story || null, title: d.title || d.story?.name || '' };
        }
        return chatInfo;
    }

    // 최근 메시지 n개(새것부터 옴 → 오래된 것부터로 뒤집어 돌려준다)
    async function recent(n = 20) {
        const id = chatId();
        if (!id) return [];
        const d = await get(`/chats/${id}/messages?limit=${Math.min(50, n)}`);
        const list = (d.messages || []).map(m => ({ id: m._id, role: m.role, content: m.content || '' }));
        for (const m of list) { roles.set(m.id, m.role); contents.set(m.id, m.content); }
        return list.reverse();
    }

    // 본문 정리: 숨은 주석 줄([//]: # "…")과 이미지 문법 제거
    function plain(text) {
        return String(text || '')
            .split('\n').filter(l => !/^\s*\[\/\/\]:\s*#/.test(l)).join('\n')
            .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
            .replace(/\{\{img::[^}]*\}\}/g, '')
            .replace(/\n{3,}/g, '\n\n').trim();
    }

    function groups() {
        return [...document.querySelectorAll('[data-message-group-id]')].map(g => {
            const md = [...g.querySelectorAll('.wrtn-markdown')].find(el => !el.closest('.cp2-root'));
            return { el: g, id: g.dataset.messageGroupId, md, footer: md?.nextElementSibling || null };
        }).filter(x => x.md);
    }

    async function assistantGroups() {
        const all = groups();
        if (all.some(g => !roles.has(g.id))) {
            try { await recent(Math.max(20, all.length + 4)); } catch (e) { console.warn('[크랙 페인터] 메시지 목록', e); }
        }
        return all.filter(g => roles.get(g.id) === 'assistant');
    }

    // 문단 = 본문의 바로 아래 요소 중 글이 있는 것
    function paragraphs(md) {
        return [...md.children].filter(el => !el.classList.contains('cp2-figure') && (el.innerText || '').trim());
    }

    function headerSlot() {
        return document.querySelector('button[aria-label="메시지 검색"]')?.parentElement || null;
    }

    function dark() {
        const bg = getComputedStyle(document.body).backgroundColor.match(/\d+/g);
        if (!bg) return matchMedia('(prefers-color-scheme: dark)').matches;
        const [r, g, b] = bg.map(Number);
        return (r * 299 + g * 587 + b * 114) / 1000 < 128;
    }

    return { chatId, storyId, chat, recent, plain, groups, assistantGroups, paragraphs, headerSlot, dark, content: id => contents.get(id) || '' };
})();


// ── db.js ──
// 저장: 설정·키·작품은 유저스크립트 저장소(GM), 삽화는 IndexedDB.
const DB = (() => {
    const K = { settings: 'cp2.settings', keys: 'cp2.keys', works: 'cp2.works', migrated: 'cp2.migrated' };

    const DEFAULTS = {
        provider: 'gemini',          // gemini | claude | openai | chatgpt | none
        models: { gemini: 'gemini-flash-latest', claude: 'claude-sonnet-5-5', openai: 'gpt-5-mini' },
        nai: 'nai-diffusion-4-5-full',
        gen: { size: 'landscape', steps: 28, scale: 5, rescale: 0, sampler: 'k_euler_ancestral', noise: 'karras', coords: true },
        context: 6,                  // AI에게 보여줄 앞 대화 수
        nsfw: false,                 // 섹스 장면 허용(작품에서 성인으로 만든 인물만)
        download: false,             // 그릴 때마다 파일로도 받기
        links: {},                   // storyId → workId
        base: '', baseNeg: ''        // 작품에 베이스가 없을 때 쓰는 기본 베이스(nai_config)
    };

    const listeners = new Map();
    function on(name, fn) {
        if (!listeners.has(name)) listeners.set(name, new Set());
        listeners.get(name).add(fn);
        return () => listeners.get(name).delete(fn);
    }
    function emit(name, data) { for (const fn of listeners.get(name) || []) try { fn(data); } catch (e) { console.warn('[크랙 페인터]', e); } }

    function read(key, fallback) {
        try {
            const v = GM_getValue(key, null);
            if (v == null) return U.clone(fallback);
            return typeof v === 'string' ? JSON.parse(v) : v;
        } catch (_) { return U.clone(fallback); }
    }
    function write(key, value) { GM_setValue(key, JSON.stringify(value)); }

    function settings() {
        const s = read(K.settings, {});
        return { ...U.clone(DEFAULTS), ...s, models: { ...DEFAULTS.models, ...(s.models || {}) }, gen: { ...DEFAULTS.gen, ...(s.gen || {}) }, links: { ...(s.links || {}) } };
    }
    function patchSettings(patch) {
        const next = { ...settings(), ...patch };
        write(K.settings, next);
        emit('settings', next);
        return next;
    }

    // 키는 매번 저장소에서 새로 읽는다(탭마다 따로 들고 있으면 서로 덮어씀).
    function keys() { return { nai: '', gemini: '', claude: '', openai: '', ...read(K.keys, {}) }; }
    function setKey(name, value) {
        const k = read(K.keys, {});
        k[name] = String(value || '').trim();
        write(K.keys, k);
        emit('keys');
    }

    function works() { return read(K.works, []); }
    function saveWorks(list) { write(K.works, list); emit('works', list); }
    function putWork(work) {
        const list = works();
        const i = list.findIndex(w => w.id === work.id);
        if (i >= 0) list[i] = work; else list.push(work);
        saveWorks(list);
        return work;
    }
    function removeWork(id) { saveWorks(works().filter(w => w.id !== id)); }

    function watch() {
        if (typeof GM_addValueChangeListener !== 'function') return;
        for (const [name, key] of Object.entries(K)) {
            GM_addValueChangeListener(key, (_k, _o, _n, remote) => { if (remote) emit(name); });
        }
    }

    // ── IndexedDB: 삽화 ──────────────────────────────────
    // shots: { id, room, story, msg, para, title, roomName, model, seed, createdAt, blob, sent, direction, oldKey? }
    let dbp = null;
    function idb() {
        if (dbp) return dbp;
        dbp = new Promise((resolve, reject) => {
            const req = indexedDB.open('crack-painter-2', 1);
            req.onupgradeneeded = () => {
                const d = req.result;
                const s = d.createObjectStore('shots', { keyPath: 'id' });
                s.createIndex('room', 'room');
                s.createIndex('createdAt', 'createdAt');
                d.createObjectStore('kv');
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => { dbp = null; reject(req.error); };
        });
        return dbp;
    }
    const done = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

    async function store(name, mode = 'readonly') {
        return (await idb()).transaction(name, mode).objectStore(name);
    }

    const bc = typeof BroadcastChannel === 'function' ? new BroadcastChannel('crack-painter-2') : null;
    if (bc) bc.onmessage = ev => emit('shots', ev.data);

    async function putShot(shot) {
        await done((await store('shots', 'readwrite')).put(shot));
        bc?.postMessage({ room: shot.room });
        emit('shots', { room: shot.room });
        return shot;
    }
    async function deleteShot(id) {
        const s = await getShot(id);
        await done((await store('shots', 'readwrite')).delete(id));
        bc?.postMessage({ room: s?.room });
        emit('shots', { room: s?.room });
    }
    async function getShot(id) { return done((await store('shots')).get(id)); }
    async function roomShots(room) { return done((await store('shots')).index('room').getAll(room)); }
    async function allShots() { return done((await store('shots')).getAll()); }
    async function kvGet(key) { return done((await store('kv')).get(key)); }
    async function kvSet(key, value) { return done((await store('kv', 'readwrite')).put(value, key)); }

    // ── 1.x에서 옮겨 오기 ─────────────────────────────────
    async function migrate() {
        if (GM_getValue(K.migrated, false)) return 0;
        // 키
        try {
            const raw = GM_getValue('cp_secrets_v1', null);
            const old = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
            const k = keys();
            if (!k.nai && old.naiKey) setKey('nai', old.naiKey);
            if (!k.gemini && old.geminiKey) setKey('gemini', old.geminiKey);
        } catch (_) { /* 없으면 넘어감 */ }
        // 삽화
        let moved = 0;
        try {
            const dbs = indexedDB.databases ? await indexedDB.databases() : [{ name: 'crack-painter' }];
            if (dbs.some(d => d.name === 'crack-painter')) {
                const old = await new Promise((res, rej) => { const r = indexedDB.open('crack-painter'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onupgradeneeded = () => { r.transaction.abort(); }; });
                if (old.objectStoreNames.contains('records') && old.objectStoreNames.contains('images')) {
                    const recs = await done(old.transaction('records').objectStore('records').getAll());
                    for (const rec of recs) {
                        for (const h of rec.history || []) {
                            const blob = await done(old.transaction('images').objectStore('images').get(h.imageId));
                            if (!blob) continue;
                            await putShot({
                                id: U.uid('s'), room: rec.roomId, story: '', msg: '', oldKey: rec.messageKey, para: rec.paragraph ?? 0,
                                title: rec.title || h.state?.title || '', roomName: rec.roomName || '', model: h.model || '', seed: h.seed,
                                createdAt: h.createdAt || Date.now(), blob, sent: h.sent || null, direction: null, legacy: true
                            });
                            moved += 1;
                        }
                    }
                }
                old.close();
            }
        } catch (e) { console.warn('[크랙 페인터] 예전 삽화 옮기기 실패', e); }
        GM_setValue(K.migrated, true);
        return moved;
    }

    return { DEFAULTS, on, emit, settings, patchSettings, keys, setKey, works, saveWorks, putWork, removeWork, watch, putShot, deleteShot, getShot, roomShots, allShots, kvGet, kvSet, migrate };
})();


// ── ui/icons.js ──
// 아이콘: 전부 이 저장소에서 새로 그린 것. 20×20 격자, 면(채움) + 옅은 면(35%)의 두 톤.
// 다른 아이콘 세트에서 가져온 모양은 없다.
const Icons = (() => {
    const svg = (body, size = 18) => `<svg viewBox="0 0 20 20" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">${body}</svg>`;
    const soft = d => `<path d="${d}" opacity=".35"/>`;

    // 톱니: 바깥 8개 이와 안쪽 구멍을 계산으로 만든다.
    function gearPath() {
        const pts = [];
        const teeth = 8;
        for (let i = 0; i < teeth * 2; i++) {
            const a = (Math.PI * 2 * i) / (teeth * 2) - Math.PI / 2;
            const spread = Math.PI / (teeth * 2) * 0.55;
            const r = i % 2 === 0 ? 8.2 : 6.4;
            for (const s of [-spread, spread]) pts.push([10 + r * Math.cos(a + s), 10 + r * Math.sin(a + s)]);
        }
        const outer = 'M' + pts.map(p => p.map(n => n.toFixed(2)).join(' ')).join('L') + 'Z';
        const hole = 'M10 7.4a2.6 2.6 0 1 0 0 5.2a2.6 2.6 0 1 0 0-5.2Z';
        return outer + hole;
    }

    const P = {
        // 액자 속 언덕과 해 — 앱 아이콘이자 "삽화" 버튼
        picture: soft('M5 3.5h10A2.5 2.5 0 0 1 17.5 6v8A2.5 2.5 0 0 1 15 16.5H5A2.5 2.5 0 0 1 2.5 14V6A2.5 2.5 0 0 1 5 3.5Z') + '<path d="M3.6 14.6 7.9 9.6c.4-.5 1.1-.5 1.5 0l2.4 2.7 1.1-1.2c.4-.4 1-.4 1.4 0l2.4 2.6v.4c0 1-.8 1.8-1.8 1.8H5.3c-.8 0-1.5-.5-1.7-1.3Z"/><circle cx="13.2" cy="7.3" r="1.7"/>',
        // 붓끝 반짝임 세 개
        spark: '<path d="M8.5 2.2c.4 3.1 1.8 4.6 5.2 5.3-3.4.7-4.8 2.2-5.2 5.3-.4-3.1-1.8-4.6-5.2-5.3 3.4-.7 4.8-2.2 5.2-5.3Z"/>' + soft('M15 11.2c.2 1.6.9 2.4 2.7 2.8-1.8.4-2.5 1.2-2.7 2.8-.2-1.6-.9-2.4-2.7-2.8 1.8-.4 2.5-1.2 2.7-2.8Z') + '<circle cx="15.3" cy="4.2" r="1.1"/>',
        bolt: soft('M10 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Z') + '<path d="M11.3 4.2 6.4 10.6h3.1l-.9 5.2 5-6.6h-3.2Z"/>',
        stack: soft('M4.6 2.8h9.2c1 0 1.8.8 1.8 1.8v.6H6.2c-1.4 0-2.6 1.2-2.6 2.6v6.4h-.2c-.5 0-.9-.4-.9-.9V4.6c0-1 .8-1.8 1.8-1.8Z') + '<path d="M7.4 6.6h8.4c1 0 1.8.8 1.8 1.8v6.8c0 1-.8 1.8-1.8 1.8H7.4c-1 0-1.8-.8-1.8-1.8V8.4c0-1 .8-1.8 1.8-1.8Zm1.1 8.3h6.4l-2-2.6c-.3-.3-.7-.3-1 0l-.9 1.1-.6-.7c-.3-.3-.7-.3-1 0Z"/>',
        gear: `<path fill-rule="evenodd" d="${gearPath()}"/>`,
        close: '<rect x="9" y="2.8" width="2" height="14.4" rx="1" transform="rotate(45 10 10)"/><rect x="9" y="2.8" width="2" height="14.4" rx="1" transform="rotate(-45 10 10)"/>',
        left: '<path d="M12.6 3.6c.5.5.5 1.2 0 1.7L7.9 10l4.7 4.7c.5.5.5 1.2 0 1.7s-1.2.5-1.7 0l-5.5-5.5c-.5-.5-.5-1.3 0-1.8l5.5-5.5c.5-.5 1.2-.5 1.7 0Z"/>',
        right: '<path d="M7.4 3.6c-.5.5-.5 1.2 0 1.7l4.7 4.7-4.7 4.7c-.5.5-.5 1.2 0 1.7s1.2.5 1.7 0l5.5-5.5c.5-.5.5-1.3 0-1.8L9.1 3.6c-.5-.5-1.2-.5-1.7 0Z"/>',
        down: '<path d="M3.6 7.4c.5-.5 1.2-.5 1.7 0l4.7 4.7 4.7-4.7c.5-.5 1.2-.5 1.7 0s.5 1.2 0 1.7l-5.5 5.5c-.5.5-1.3.5-1.8 0L3.6 9.1c-.5-.5-.5-1.2 0-1.7Z"/>',
        // 두 반달 화살 — 다시 그리기
        reroll: '<path d="M10 3.2a6.8 6.8 0 0 1 6.3 4.3l.9-.5c.4-.2.9.1.9.6v3.3c0 .5-.5.8-.9.6l-2.9-1.6c-.4-.2-.4-.8 0-1l.6-.4A4.9 4.9 0 0 0 5.6 8 1 1 0 0 1 3.8 7.4 6.8 6.8 0 0 1 10 3.2Z"/>' + soft('M10 16.8a6.8 6.8 0 0 1-6.3-4.3l-.9.5c-.4.2-.9-.1-.9-.6V9.1c0-.5.5-.8.9-.6l2.9 1.6c.4.2.4.8 0 1l-.6.4A4.9 4.9 0 0 0 14.4 12a1 1 0 0 1 1.8.6 6.8 6.8 0 0 1-6.2 4.2Z'),
        pencil: soft('M3 17l.9-3.6 2.7 2.7Z') + '<path d="M13.3 3.1a1.9 1.9 0 0 1 2.7 0l.9.9c.7.7.7 1.9 0 2.7l-8.7 8.7-3.6-3.6Z"/>',
        save: '<path d="M10 2.5c.6 0 1 .4 1 1v7.1l2.2-2.2c.4-.4 1-.4 1.4 0s.4 1 0 1.4l-3.9 3.9c-.4.4-1 .4-1.4 0L5.4 9.8c-.4-.4-.4-1 0-1.4s1-.4 1.4 0L9 10.6V3.5c0-.6.4-1 1-1Z"/>' + soft('M3.5 13.5c.6 0 1 .4 1 1v.8c0 .4.3.7.7.7h9.6c.4 0 .7-.3.7-.7v-.8c0-.6.4-1 1-1s1 .4 1 1v.8c0 1.5-1.2 2.7-2.7 2.7H5.2c-1.5 0-2.7-1.2-2.7-2.7v-.8c0-.6.4-1 1-1Z'),
        trash: soft('M5 6.5h10l-.7 9.1c-.1 1-.9 1.9-2 1.9H7.7c-1 0-1.9-.8-2-1.9Z') + '<path d="M8.2 2.5h3.6c.5 0 .9.3 1 .8l.2.7h2.8c.6 0 1 .4 1 1s-.4 1-1 1H4.2c-.6 0-1-.4-1-1s.4-1 1-1H7l.2-.7c.1-.5.5-.8 1-.8Z"/>',
        copy: soft('M4.5 2.5h7c1.1 0 2 .9 2 2v.5H8c-1.7 0-3 1.3-3 3v6.5h-.5c-1.1 0-2-.9-2-2v-8c0-1.1.9-2 2-2Z') + '<path d="M8.5 6.5h7c1.1 0 2 .9 2 2v7c0 1.1-.9 2-2 2h-7c-1.1 0-2-.9-2-2v-7c0-1.1.9-2 2-2Z"/>',
        plus: '<rect x="9" y="3.5" width="2" height="13" rx="1"/><rect x="3.5" y="9" width="13" height="2" rx="1"/>',
        people: '<circle cx="7.4" cy="6.6" r="3"/><path d="M2.4 15.4c0-2.8 2.2-4.6 5-4.6s5 1.8 5 4.6c0 .6-.4 1-1 1h-8c-.6 0-1-.4-1-1Z"/>' + soft('M13.4 3.8a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2Zm.6 6.8c2.2.2 3.8 1.8 3.8 4 0 .5-.4.9-.9.9h-2.7c.2-.4.2-.8.2-1.3 0-1.4-.5-2.6-1.4-3.5.3-.1.6-.1 1-.1Z'),
        wand: '<path d="M3.4 15.2 12 6.6c.5-.5 1.3-.5 1.8 0s.5 1.3 0 1.8l-8.6 8.6c-.5.5-1.3.5-1.8 0s-.5-1.3 0-1.8Z"/>' + soft('M15.4 1.8l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6Zm-6 .8.4 1.1 1.1.4-1.1.4-.4 1.1-.4-1.1-1.1-.4 1.1-.4Zm8 6.6.4 1.1 1.1.4-1.1.4-.4 1.1-.4-1.1-1.1-.4 1.1-.4Z'),
        check: '<path d="M16.2 5.3c.5.4.5 1.1.1 1.6l-7.2 8c-.4.4-1 .5-1.5.1L3.8 12c-.5-.4-.5-1.1-.1-1.6.4-.5 1.1-.5 1.6-.1l2.9 2.5 6.4-7.2c.4-.5 1.1-.5 1.6-.3Z"/>',
        alert: soft('M8.3 3.3c.8-1.3 2.6-1.3 3.4 0l6 10.4c.8 1.3-.2 3-1.7 3H4c-1.5 0-2.5-1.7-1.7-3Z') + '<rect x="9" y="6.6" width="2" height="5.4" rx="1"/><circle cx="10" cy="14.2" r="1.1"/>',
        upload: '<path d="M10 13.8c-.6 0-1-.4-1-1V6.4L6.8 8.6c-.4.4-1 .4-1.4 0s-.4-1 0-1.4l3.9-3.9c.4-.4 1-.4 1.4 0l3.9 3.9c.4.4.4 1 0 1.4s-1 .4-1.4 0L11 6.4v6.4c0 .6-.4 1-1 1Z"/>' + soft('M3.5 13.5c.6 0 1 .4 1 1v.8c0 .4.3.7.7.7h9.6c.4 0 .7-.3.7-.7v-.8c0-.6.4-1 1-1s1 .4 1 1v.8c0 1.5-1.2 2.7-2.7 2.7H5.2c-1.5 0-2.7-1.2-2.7-2.7v-.8c0-.6.4-1 1-1Z'),
        link: soft('M8.6 4.4 9.8 3.2a4 4 0 0 1 5.7 5.7l-1.2 1.2-1.4-1.4 1.2-1.2a2 2 0 0 0-2.9-2.9L10 5.8Z') + '<path d="M11.4 15.6 10.2 16.8a4 4 0 0 1-5.7-5.7l1.2-1.2 1.4 1.4-1.2 1.2a2 2 0 0 0 2.9 2.9l1.2-1.2Zm-3.9-3.1 5-5c.4-.4 1-.4 1.4 0s.4 1 0 1.4l-5 5c-.4.4-1 .4-1.4 0s-.4-1 0-1.4Z"/>',
        chat: soft('M4.5 3h11c1.1 0 2 .9 2 2v7c0 1.1-.9 2-2 2H9l-3.6 2.8c-.5.4-1.2 0-1.2-.6V14c-1 0-1.7-.9-1.7-2V5c0-1.1.9-2 2-2Z') + '<rect x="6" y="6.5" width="8" height="1.6" rx=".8"/><rect x="6" y="9.5" width="5" height="1.6" rx=".8"/>',
        stop: '<rect x="5" y="5" width="10" height="10" rx="2.4"/>',
        dot: '<circle cx="10" cy="10" r="3"/>'
    };

    const get = (name, size) => svg(P[name] || P.dot, size);
    return { get, names: Object.keys(P) };
})();


// ── ui/kit.js ──
// 화면 부품. 모든 창은 Shadow DOM 하나(#cp2-host) 안에 그린다. 크랙 스타일과 섞이지 않게.
const Kit = (() => {
    let host = null;
    let root = null;
    let shell = null;

    function h(tag, props, ...kids) {
        const el = document.createElement(tag);
        for (const [k, v] of Object.entries(props || {})) {
            if (v == null || v === false) continue;
            if (k === 'class') el.className = v;
            else if (k === 'html') el.innerHTML = v;
            else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
            else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
            else if (k in el && typeof v !== 'string') el[k] = v;
            else el.setAttribute(k, v === true ? '' : v);
        }
        for (const kid of kids.flat(Infinity)) {
            if (kid == null || kid === false) continue;
            el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
        }
        return el;
    }

    const icon = (name, size) => h('span', { html: Icons.get(name, size), style: { display: 'inline-flex' } });

    function mount() {
        if (shell && document.documentElement.contains(host)) return shell;
        host = document.createElement('div');
        host.id = 'cp2-host';
        root = host.attachShadow({ mode: 'open' });
        root.append(h('style', null, CSS_UI));
        shell = h('div', { class: 'cp2' });
        root.append(shell);
        document.documentElement.append(host);
        theme();
        return shell;
    }

    function theme() {
        if (shell) shell.classList.toggle('dark', Crack.dark());
    }

    // ── 컨트롤 ──
    function button(label, onclick, { kind = '', iconName = '', title = '', disabled = false } = {}) {
        return h('button', { class: `btn ${kind}`, onclick, title: title || null, disabled }, iconName ? icon(iconName, 15) : null, label || null);
    }
    function iconButton(name, onclick, title) {
        return h('button', { class: 'btn icon', onclick, title, 'aria-label': title }, icon(name, 16));
    }
    function select(options, value, onchange, attrs = {}) {
        const el = h('select', { class: 'sel', ...attrs, onchange: e => onchange(e.target.value) },
            options.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return h('option', { value: v, selected: String(v) === String(value) }, l); }));
        return el;
    }
    function input(value, oninput, attrs = {}) {
        return h('input', { class: `in ${attrs.mono ? 'mono' : ''}`, value: value ?? '', placeholder: attrs.placeholder || '', type: attrs.type || 'text', oninput: e => oninput(e.target.value), spellcheck: false, ...(attrs.extra || {}) });
    }
    function textarea(value, oninput, attrs = {}) {
        return h('textarea', { class: `ta ${attrs.mono ? 'mono' : ''}`, placeholder: attrs.placeholder || '', rows: attrs.rows || 3, oninput: e => oninput(e.target.value), spellcheck: false, readOnly: !!attrs.readOnly }, value ?? '');
    }
    function segmented(options, value, onchange) {
        const wrap = h('div', { class: 'seg' });
        for (const o of options) {
            const [v, l, dis] = Array.isArray(o) ? o : [o, o];
            wrap.append(h('button', { class: String(v) === String(value) ? 'on' : '', disabled: !!dis, onclick: () => onchange(v) }, l));
        }
        return wrap;
    }
    function toggle(on, onchange) {
        const el = h('button', { class: `sw ${on ? 'on' : ''}`, role: 'switch', 'aria-checked': String(!!on) });
        el.addEventListener('click', () => { const next = !el.classList.contains('on'); el.classList.toggle('on', next); el.setAttribute('aria-checked', String(next)); onchange(next); });
        return el;
    }

    // ── 알림 배너 (오른쪽 위) ──
    function toast(title, { kind = '', detail = '', ms = 4200, actions = [] } = {}) {
        mount();
        let box = shell.querySelector('.toasts');
        if (!box) { box = h('div', { class: 'toasts' }); shell.append(box); }
        const ic = kind === 'err' ? 'alert' : kind === 'ok' ? 'check' : 'picture';
        const more = detail ? h('pre', { hidden: true }, detail) : null;
        const t = h('div', { class: `toast ${kind}` },
            h('div', { class: 'ic' }, icon(ic, 16)),
            h('div', { class: 'grow' },
                h('div', { class: 't' }, title),
                more,
                (detail || actions.length) ? h('div', { class: 'row', style: { marginTop: '6px' } },
                    detail ? button('자세히', () => { more.hidden = !more.hidden; }, { kind: 'ghost' }) : null,
                    detail ? button('복사', () => navigator.clipboard.writeText(detail), { kind: 'ghost' }) : null,
                    actions.map(a => button(a.label, () => { a.run(); t.remove(); }, { kind: 'ghost' }))) : null),
            iconButton('close', () => t.remove(), '닫기'));
        box.append(t);
        if (ms && !detail && !actions.length) setTimeout(() => t.remove(), ms);
        return t;
    }

    // ── 오른쪽 인스펙터 (한 번에 하나) ──
    function inspector({ title, onClose }) {
        mount();
        shell.querySelector('.inspector')?.__close?.();
        const head = h('header', null, icon('picture', 18), h('div', { class: 'title grow' }, title));
        const body = h('div', { class: 'body' });
        const foot = h('footer');
        const el = h('section', { class: 'inspector' }, head, body, foot);
        const close = () => { el.remove(); document.removeEventListener('keydown', esc, true); onClose?.(); };
        const esc = e => { if (e.key === 'Escape' && !/INPUT|TEXTAREA|SELECT/.test(e.composedPath()[0]?.tagName || '')) close(); };
        el.__close = close;
        head.append(iconButton('close', close, '닫기'));
        document.addEventListener('keydown', esc, true);
        shell.append(el);
        return { el, head, body, foot, close };
    }

    // ── 가운데 창 ──
    function windowed({ title, toolbar = [], onClose }) {
        mount();
        const close = () => { back.remove(); document.removeEventListener('keydown', esc, true); onClose?.(); };
        const esc = e => { if (e.key === 'Escape' && !/INPUT|TEXTAREA|SELECT/.test(e.composedPath()[0]?.tagName || '') && !shell.querySelector('.viewer')) close(); };
        const content = h('div', { class: 'content' });
        const bar = h('div', { class: 'toolbar' }, h('div', { class: 'lights' }, h('i', { class: 'close', title: '닫기', onclick: close }), h('i'), h('i')), h('strong', null, title), h('div', { class: 'grow' }), toolbar);
        const win = h('div', { class: 'window' }, bar, content);
        const back = h('div', { class: 'backdrop', onmousedown: e => { if (e.target === back) close(); } }, win);
        document.addEventListener('keydown', esc, true);
        shell.append(back);
        return { win, bar, content, close };
    }

    function confirmInline(btn, label, run) {
        // 같은 버튼을 한 번 더 누르면 실행(3초 안). 따로 확인창을 띄우지 않는다.
        if (btn.dataset.armed) { run(); return; }
        const old = btn.innerHTML;
        btn.dataset.armed = '1';
        btn.classList.add('danger');
        btn.textContent = label;
        setTimeout(() => { delete btn.dataset.armed; btn.classList.remove('danger'); btn.innerHTML = old; }, 3000);
    }

    return { h, icon, mount, theme, button, iconButton, select, input, textarea, segmented, toggle, toast, inspector, windowed, confirmInline, shell: () => shell };
})();


// ── app.js ──
// 흐름: 메시지 준비 → (AI 연출) → 칸별 프롬프트 → NAI → 저장 → 채팅에 붙이기
const App = (() => {
    const { h } = Kit;
    const running = new Map();    // msgId → AbortController
    const viewIndex = new Map();  // msgId → 보고 있는 삽화 번호
    const urls = new Map();       // shotId → objectURL

    // ── 작품 찾기 ──
    function workFor(storyId, names = []) {
        const s = DB.settings();
        const list = DB.works();
        const linked = list.find(w => w.id === s.links[storyId]);
        if (linked) return linked;
        const loose = names.map(U.looseName).filter(Boolean);
        return list.find(w => loose.includes(U.looseName(w.name))) || null;
    }

    function link(storyId, workId) {
        const s = DB.settings();
        const links = { ...s.links };
        if (workId) links[storyId] = workId; else delete links[storyId];
        DB.patchSettings({ links });
    }

    // ── 한 메시지에 대한 준비물 ──
    async function prepare(msgId) {
        const info = await Crack.chat().catch(() => null);
        const storyId = Crack.storyId();
        const names = [info?.story?.name, info?.title].filter(Boolean);
        const work = workFor(storyId, names);
        const s = DB.settings();
        const recent = await Crack.recent(Math.max(10, s.context * 2 + 4)).catch(() => []);
        const at = recent.findIndex(m => m.id === msgId);
        const before = (at >= 0 ? recent.slice(0, at) : recent).slice(-s.context);
        const group = Crack.groups().find(g => g.id === msgId);
        const paragraphs = group ? Crack.paragraphs(group.md).map(el => el.innerText.trim()) : [];
        const target = Crack.plain(at >= 0 ? recent[at].content : Crack.content(msgId)) || paragraphs.join('\n\n');
        return {
            msgId, storyId, room: Crack.chatId(), roomName: info?.title || document.title.replace(/\s*\|.*$/, ''),
            storyName: info?.story?.name || '', work, paragraphs, target,
            context: before.map(m => `${m.role === 'user' ? '[사용자]' : '[AI]'} ${Crack.plain(m.content).slice(0, 1600)}`).join('\n\n')
        };
    }

    // ── AI 연출 ──
    async function direct(ctx, request, signal) {
        const s = DB.settings();
        const work = ctx.work;
        const chars = work.chars;
        const nsfwOk = !!s.nsfw;
        const places = Works.workBackgrounds(work);
        if (!nsfwOk) delete places['섹스'];
        const system = Direct.instruction({ work, chars, nsfwOk, places });
        const user = Direct.userTurn({ context: ctx.context, target: ctx.target, paragraphs: ctx.paragraphs, request });
        const text = await AI.ask({ provider: s.provider, model: s.models[s.provider], keys: DB.keys(), system, user, signal });
        return Direct.normalize(U.pickJson(text), { chars, paragraphCount: ctx.paragraphs.length, nsfwOk });
    }

    function compose(ctx, direction, request = '') {
        const s = DB.settings();
        return Compose.build({ work: ctx.work, direction, modelId: s.nai, request, fallbackBase: s.base, fallbackNeg: s.baseNeg });
    }

    // ── 그리기 ──
    async function draw(ctx, out, direction, { seed = '', signal } = {}) {
        const s = DB.settings();
        const { blob, seed: used } = await NAI.generate({ out, gen: s.gen, token: DB.keys().nai, seed, signal });
        const shot = {
            id: U.uid('s'), room: ctx.room, story: ctx.storyId, msg: ctx.msgId, para: direction.paragraph,
            title: direction.title || ctx.paragraphs[direction.paragraph]?.slice(0, 24) || '', roomName: ctx.roomName, work: ctx.work?.name || '',
            model: out.model.id, seed: used, createdAt: Date.now(), blob,
            sent: { base: out.base, baseNeg: out.baseNeg, chars: out.chars.map(c => ({ name: c.name, prompt: c.prompt, neg: c.neg, center: c.center })), notes: out.notes, tokens: out.tokens },
            direction: U.clone(direction)
        };
        await DB.putShot(shot);
        viewIndex.delete(ctx.msgId);
        if (s.download) download(shot);
        return shot;
    }

    // 버튼 하나로: AI 연출 → 바로 그리기
    async function quick(msgId) {
        if (running.has(msgId)) { running.get(msgId).abort(); return; }
        const s = DB.settings();
        const ctrl = new AbortController();
        running.set(msgId, ctrl);
        paintButtons();
        try {
            const ctx = await prepare(msgId);
            if (!ctx.work) { Kit.toast('이 채팅에 연결된 작품이 없어.', { actions: [{ label: '작품 연결하기', run: () => Workshop.open('works') }], ms: 0 }); return; }
            if (s.provider === 'none') { Studio.open(msgId); return; }
            const direction = await direct(ctx, '', ctrl.signal);
            const out = compose(ctx, direction);
            await draw(ctx, out, direction, { signal: ctrl.signal });
            Kit.toast(`삽화 완성 · ${direction.title || ctx.roomName}`, { kind: 'ok' });
        } catch (e) {
            if (e.name !== 'AbortError') fail(e);
        } finally {
            running.delete(msgId);
            paintButtons();
        }
    }

    function fail(e) {
        console.error('[크랙 페인터]', e);
        Kit.toast(e.message || String(e), { kind: 'err', detail: e.stack ? `${e.message}\n\n${e.stack.split('\n').slice(0, 4).join('\n')}` : '', actions: e.pane === 'settings' ? [{ label: '설정 열기', run: () => Workshop.open('settings') }] : [] });
    }

    // ── 파일 저장 ──
    function fileName(shot) {
        const safe = s => String(s || '').replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 40);
        const d = new Date(shot.createdAt);
        const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
        return `${safe(shot.roomName) || '크랙'}_${stamp}_${safe(shot.title) || '삽화'}_${shot.seed}.png`;
    }
    function download(shot) {
        const a = h('a', { href: url(shot), download: fileName(shot) });
        document.body.append(a);
        a.click();
        a.remove();
    }

    function url(shot) {
        if (!urls.has(shot.id)) urls.set(shot.id, URL.createObjectURL(shot.blob));
        return urls.get(shot.id);
    }
    function forget(id) {
        const u = urls.get(id);
        if (u) { URL.revokeObjectURL(u); urls.delete(id); }
    }

    // ── 채팅 안 삽화 ──
    function shotsFor(all, msgId) {
        const old = `msg_${U.djb2(msgId)}`;
        return all.filter(s => s.msg === msgId || (!s.msg && s.oldKey === old)).sort((a, b) => a.createdAt - b.createdAt);
    }

    async function renderFigures() {
        const room = Crack.chatId();
        if (!room) return;
        const all = await DB.roomShots(room);
        for (const g of Crack.groups()) {
            const list = shotsFor(all, g.id);
            const fig = g.md.querySelector(':scope > .cp2-figure');
            if (!list.length) { fig?.remove(); continue; }
            const idx = U.clamp(viewIndex.has(g.id) ? viewIndex.get(g.id) : list.length - 1, 0, list.length - 1);
            const shot = list[idx];
            if (fig && fig.dataset.shot === shot.id && fig.dataset.count === String(list.length)) continue;
            fig?.remove();
            const paras = Crack.paragraphs(g.md);
            const anchor = paras[Math.min(shot.para ?? paras.length - 1, paras.length - 1)] || g.md.lastElementChild;
            const el = figure(g.id, list, idx);
            if (anchor) anchor.after(el); else g.md.append(el);
        }
    }

    function figure(msgId, list, idx) {
        const shot = list[idx];
        const go = d => { viewIndex.set(msgId, U.clamp(idx + d, 0, list.length - 1)); renderFigures(); };
        const btn = (name, title, fn) => h('button', { class: 'cp2-fbtn', title, 'aria-label': title, html: Icons.get(name, 15), onclick: e => { e.preventDefault(); e.stopPropagation(); fn(e.currentTarget); } });
        const del = btn('trash', '지우기 (한 번 더 누르면 지워져)', b => {
            if (!b.dataset.armed) { b.dataset.armed = '1'; b.classList.add('armed'); setTimeout(() => { delete b.dataset.armed; b.classList.remove('armed'); }, 3000); return; }
            DB.deleteShot(shot.id).then(() => { forget(shot.id); viewIndex.delete(msgId); renderFigures(); });
        });
        return h('figure', { class: 'cp2-figure', 'data-shot': shot.id, 'data-count': String(list.length), contenteditable: 'false' },
            h('img', { src: url(shot), alt: shot.title || '삽화', loading: 'lazy', onclick: () => Gallery.view(shot) }),
            h('div', { class: 'cp2-fbar' },
                list.length > 1 ? btn('left', '이전 삽화', () => go(-1)) : null,
                list.length > 1 ? h('span', { class: 'cp2-fcount' }, `${idx + 1}/${list.length}`) : null,
                list.length > 1 ? btn('right', '다음 삽화', () => go(1)) : null,
                h('span', { class: 'cp2-fgap' }),
                btn('reroll', '같은 연출로 다시 그리기', () => reroll(msgId, shot)),
                btn('pencil', '스튜디오에서 고치기', () => Studio.open(msgId, shot)),
                btn('save', '파일로 저장', () => download(shot)),
                del));
    }

    async function reroll(msgId, shot) {
        if (!shot.direction) { Studio.open(msgId, shot); return; }
        if (running.has(msgId)) return;
        const ctrl = new AbortController();
        running.set(msgId, ctrl);
        paintButtons();
        try {
            const ctx = await prepare(msgId);
            if (!ctx.work) throw new Error('이 채팅에 연결된 작품이 없어.');
            const out = compose(ctx, shot.direction);
            await draw(ctx, out, shot.direction, { signal: ctrl.signal });
        } catch (e) {
            if (e.name !== 'AbortError') fail(e);
        } finally {
            running.delete(msgId);
            paintButtons();
        }
    }

    // ── 메시지 버튼 · 머리줄 버튼 ──
    function paintButtons() {
        for (const b of document.querySelectorAll('.cp2-msgbtn.quick')) {
            const busy = running.has(b.dataset.msg);
            b.classList.toggle('busy', busy);
            b.title = busy ? '그리는 중 · 누르면 멈춤' : '바로 그리기 (AI 연출)';
            b.innerHTML = Icons.get(busy ? 'stop' : 'bolt', 17);
        }
    }

    async function decorate() {
        const slot = Crack.headerSlot();
        if (slot && !slot.querySelector('.cp2-head')) {
            slot.prepend(h('button', { class: 'cp2-head', title: '크랙 페인터 작업실', 'aria-label': '크랙 페인터 작업실', html: Icons.get('picture', 20), onclick: () => Workshop.open() }));
        }
        const groups = await Crack.assistantGroups();
        for (const g of groups) {
            const bar = g.footer?.firstElementChild;
            if (!bar || bar.querySelector('.cp2-msgbtn')) continue;
            bar.append(
                h('button', { class: 'cp2-msgbtn', 'data-msg': g.id, title: '삽화 스튜디오', 'aria-label': '삽화 스튜디오', html: Icons.get('picture', 17), onclick: e => { e.stopPropagation(); Studio.open(g.id); } }),
                h('button', { class: 'cp2-msgbtn quick', 'data-msg': g.id, title: '바로 그리기 (AI 연출)', 'aria-label': '바로 그리기', html: Icons.get('bolt', 17), onclick: e => { e.stopPropagation(); quick(g.id); } }));
        }
        paintButtons();
    }

    return { workFor, link, prepare, direct, compose, draw, quick, reroll, fail, download, fileName, url, forget, renderFigures, decorate, running };
})();


// ── ui/studio.js ──
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


// ── ui/workshop.js ──
// 작업실: 작품 · 갤러리 · 설정
const Workshop = (() => {
    const { h, button, iconButton, select, input, textarea, segmented, toggle } = Kit;
    let W = null;

    function open(tab = 'works') {
        if (W) { W.tab = tab; draw(); return; }
        const seg = h('div', { class: 'tabs' });
        const win = Kit.windowed({ title: '크랙 페인터', toolbar: [seg], onClose: () => { W = null; } });
        W = { win, seg, tab, workId: null, galleryScope: 'room' };
        draw();
    }

    function draw() {
        if (!W) return;
        W.seg.replaceChildren(segmented([['works', '작품'], ['gallery', '갤러리'], ['settings', '설정']], W.tab, v => { W.tab = v; draw(); }));
        W.win.content.replaceChildren();
        ({ works, gallery, settings })[W.tab]();
    }

    // ── 작품 ──────────────────────────────────────────
    function works() {
        const list = DB.works();
        const storyId = Crack.storyId();
        const current = storyId ? App.workFor(storyId, [document.title.replace(/\s*\|.*$/, '')]) : null;
        if (!W.workId || !list.some(w => w.id === W.workId)) W.workId = current?.id || list[0]?.id || null;
        const file = h('input', { type: 'file', accept: '.json,application/json', multiple: true, hidden: true, onchange: e => importFiles([...e.target.files]) });
        const side = h('div', { class: 'sidebar' },
            file,
            button('JSON 불러오기', () => file.click(), { kind: 'primary', iconName: 'upload' }),
            h('div', { class: 'faint', style: { margin: '4px 2px 8px' } }, '오토세이버 대기열 JSON(작품.json · 작품_V5.json), spec JSON, nai_config.json'),
            ...list.map(w => h('div', { class: `side-item ${w.id === W.workId ? 'on' : ''}`, onclick: () => { W.workId = w.id; draw(); } },
                Kit.icon('stack', 15), h('span', { class: 'grow' }, w.name), h('span', { class: 'faint' }, w.id === current?.id ? '연결됨' : `${w.chars.length}명`))));
        const pane = h('div', { class: 'pane' });
        const work = list.find(w => w.id === W.workId);
        if (!work) {
            pane.append(h('div', { class: 'col', style: { maxWidth: '520px' } },
                h('h3', null, '작품을 불러와 줘'),
                h('p', { class: 'muted' }, 'NAI 자동화로 만든 감정 이미지 대기열 JSON을 불러오면 인물마다 외형·의상·캐릭터 부정·감정 블록·배경이 그대로 들어와. 삽화도 감정 이미지와 같은 얼굴로 그려져.'),
                h('p', { class: 'muted' }, 'V4.5 파일과 V5 파일(이름이 _V5로 끝남)을 둘 다 넣으면 모델에 맞는 쪽을 써.')));
        } else {
            pane.append(workDetail(work, storyId, current));
        }
        W.win.content.append(side, pane);
    }

    async function importFiles(files) {
        let last = null;
        const msgs = [];
        for (const f of files) {
            try {
                const r = Works.parse(await f.text(), f.name);
                if (r.kind === 'config') {
                    DB.patchSettings({ base: r.config.base, baseNeg: r.config.baseNeg });
                    msgs.push(`${f.name}: 기본 베이스로 저장`);
                    continue;
                }
                const all = DB.works();
                const saved = all.find(w => U.looseName(w.name) === U.looseName(r.work.name));
                const merged = Works.merge(saved, r.work);
                DB.putWork(merged);
                last = merged.id;
                const cleaned = merged.chars.flatMap(c => Rules.cleanAppearance(c.appearance).notes.map(n => `${c.name}: ${n}`));
                msgs.push(`${f.name}: ${merged.name} · ${r.work.chars.length}명${r.work.v5 ? ' (V5)' : ''}${cleaned.length ? ` · ${cleaned.join(', ')}` : ''}`);
            } catch (e) {
                msgs.push(e.message);
            }
        }
        if (last) W.workId = last;
        Kit.toast('불러오기 결과', { detail: msgs.join('\n'), kind: msgs.some(m => /아니야|없어|못/.test(m)) ? 'err' : 'ok' });
        draw();
    }

    function workDetail(work, storyId, current) {
        const save = () => DB.putWork(work);
        const linked = current?.id === work.id;
        const out = h('div', { class: 'col', style: { gap: '4px' } },
            h('div', { class: 'row' },
                h('h3', { class: 'grow', style: { margin: 0 } }, work.name),
                storyId ? (linked
                    ? button('이 채팅 연결 끊기', () => { App.link(storyId, null); draw(); })
                    : button('이 채팅에 연결', () => { App.link(storyId, work.id); draw(); App.renderFigures(); }, { kind: 'primary', iconName: 'link' })) : null,
                button('작품 지우기', e => Kit.confirmInline(e.currentTarget, '한 번 더 누르면 지워져', () => { DB.removeWork(work.id); W.workId = null; draw(); }), { kind: 'danger' })),
            work.memo ? h('div', { class: 'note' }, work.memo) : null,
            h('div', { class: 'group-title' }, '베이스'),
            h('div', { class: 'group' },
                h('div', { class: 'row' }, h('span', { class: 'label grow' }, 'V4.5'), h('span', { class: 'faint' }, work.base ? `${Tags.count(work.base)} 토큰` : '없음 → 설정의 기본 베이스')),
                work.base ? h('div', { class: 'faint', style: { fontFamily: 'var(--mono)' } }, `${work.base.slice(0, 220)}…`) : null,
                h('div', { class: 'row' }, h('span', { class: 'label grow' }, 'V5'), h('span', { class: 'faint' }, work.baseV5 ? `${Tags.count(work.baseV5)} 토큰` : 'V5 파일이 없어 V4.5 베이스를 V5 가중치로 바꿔 씀'))),
            h('div', { class: 'group-title' }, `인물 ${work.chars.length}명`, h('span', { class: 'grow' }), button('인물 직접 추가', () => { work.chars.push({ name: '새 인물', aliases: [], appearance: '', outfit: '', negative: 'beard, body hair, frame', emotions: {}, nsfwEmotions: {}, backgrounds: {}, adult: false, beardOk: false, note: '', v5: null }); save(); draw(); }, { kind: 'ghost', iconName: 'plus' })));
        work.chars.forEach((c, i) => out.append(charCard(work, c, i, save)));
        return out;
    }

    function charCard(work, c, i, save) {
        const nEmo = Object.keys(c.emotions || {}).length;
        const nNsfw = Object.keys(c.nsfwEmotions || {}).length;
        const body = h('div', { class: 'col', hidden: true },
            h('div', { class: 'form' },
                h('div', { class: 'label' }, '이름'), input(c.name, v => { c.name = v.trim(); save(); }),
                h('div', { class: 'label' }, '다른 호칭'), input((c.aliases || []).join(', '), v => { c.aliases = v.split(',').map(x => x.trim()).filter(Boolean); save(); }, { placeholder: '채팅에서 부르는 이름 (쉼표로)' }),
                h('div', { class: 'label' }, '성인 장면'), h('div', { class: 'row' }, toggle(!!c.adult, v => { c.adult = v; save(); }), h('span', { class: 'faint' }, '작품에 섹스 세트가 있으면 켜져 있어. 성인인 인물만 켜 줘.')),
                h('div', { class: 'label' }, '수염 허용'), h('div', { class: 'row' }, toggle(!!c.beardOk, v => { c.beardOk = v; save(); }), h('span', { class: 'faint' }, '끄면 캐릭터 부정에 beard가 들어가.'))),
            h('div', { class: 'label' }, '외형'), textarea(c.appearance, v => { c.appearance = v; save(); }, { mono: true, rows: 3 }),
            h('div', { class: 'label' }, '의상'), textarea(c.outfit, v => { c.outfit = v; save(); }, { mono: true, rows: 2 }),
            h('div', { class: 'label' }, '캐릭터 부정'), textarea(c.negative, v => { c.negative = v; save(); }, { mono: true, rows: 2 }),
            c.note ? h('div', { class: 'note' }, `해석: ${c.note}`) : null,
            nEmo ? h('details', null, h('summary', { class: 'label' }, `감정 블록 ${nEmo}개${nNsfw ? ` + NSFW ${nNsfw}개` : ''}`),
                h('div', { class: 'col', style: { marginTop: '6px' } }, Object.entries({ ...c.emotions, ...Object.fromEntries(Object.entries(c.nsfwEmotions || {}).map(([k, v]) => [`섹스·${k}`, v])) }).map(([k, v]) => h('div', { class: 'faint', style: { fontFamily: 'var(--mono)' } }, h('b', null, `${k}  `), v)))) : null,
            h('div', { class: 'row' }, h('span', { class: 'grow' }), button('이 인물 빼기', e => Kit.confirmInline(e.currentTarget, '한 번 더 누르면 빠져', () => { work.chars.splice(i, 1); save(); draw(); }), { kind: 'danger' })));
        const head = h('div', { class: 'row', style: { cursor: 'default' }, onclick: () => { body.hidden = !body.hidden; } },
            Kit.icon('people', 15), h('strong', null, c.name),
            c.aliases?.length ? h('span', { class: 'faint' }, c.aliases.join(', ')) : null,
            h('span', { class: 'grow' }),
            c.v5 ? h('span', { class: 'chip' }, 'V5') : null,
            c.adult ? h('span', { class: 'chip' }, '성인') : null,
            h('span', { class: 'chip' }, `감정 ${nEmo}`),
            Kit.icon('down', 13));
        return h('div', { class: 'group', style: { marginBottom: '8px' } }, head, body);
    }

    // ── 갤러리 ─────────────────────────────────────────
    async function gallery() {
        const pane = h('div', { class: 'pane' });
        W.win.content.append(pane);
        const room = Crack.chatId();
        const shots = (W.galleryScope === 'room' && room ? await DB.roomShots(room) : await DB.allShots()).sort((a, b) => b.createdAt - a.createdAt);
        pane.append(h('div', { class: 'row', style: { marginBottom: '12px' } },
            segmented([['room', '이 채팅방', !room], ['all', '전체']], room ? W.galleryScope : 'all', v => { W.galleryScope = v; draw(); }),
            h('span', { class: 'faint grow' }, `${shots.length}장`)));
        if (!shots.length) { pane.append(h('div', { class: 'note' }, '아직 그린 삽화가 없어. 답변 아래 액자 버튼이나 번개 버튼으로 그려 봐.')); return; }
        let day = '';
        let grid = null;
        for (const s of shots) {
            const d = U.fmtDate(s.createdAt).slice(0, 10);
            if (d !== day) { day = d; pane.append(h('div', { class: 'group-title' }, d)); grid = h('div', { class: 'grid' }); pane.append(grid); }
            grid.append(h('div', { class: 'thumb', onclick: () => Gallery.view(s, () => draw()) }, h('img', { src: App.url(s), loading: 'lazy' }), h('div', { class: 'cap' }, `${s.title || '삽화'}${W.galleryScope === 'all' ? ` · ${s.roomName}` : ''}`)));
        }
    }

    // ── 설정 ──────────────────────────────────────────
    function settings() {
        const s = DB.settings();
        const k = DB.keys();
        const pane = h('div', { class: 'pane' });
        const p = s.provider;
        const providerInfo = AI.PROVIDERS[p];
        const modelList = h('datalist', { id: 'cp2-models' });
        const naiStatus = h('span', { class: 'faint' });
        const aiStatus = h('span', { class: 'faint' });
        const save = patch => DB.patchSettings(patch);

        pane.append(
            h('div', { class: 'group-title' }, '연결'),
            h('div', { class: 'group' }, h('div', { class: 'form' },
                h('div', { class: 'label' }, 'NovelAI 토큰'),
                h('div', { class: 'row' }, input(k.nai, v => DB.setKey('nai', v), { type: 'password', placeholder: 'pst-…', mono: true }), button('확인', async () => {
                    naiStatus.textContent = '확인 중…';
                    try { const r = await NAI.checkToken(DB.keys().nai); naiStatus.textContent = `${r.tier}${r.active ? '' : ' (만료)'}`; } catch (e) { naiStatus.textContent = e.message; }
                })),
                h('div'), naiStatus,
                h('div', { class: 'label' }, '장면 분석 AI'),
                select(Object.entries(AI.PROVIDERS).map(([id, v]) => [id, v.label]), p, v => { save({ provider: v }); draw(); }),
                h('div'), h('div', { class: 'faint' }, providerInfo.hint),
                providerInfo.key ? h('div', { class: 'label' }, 'API 키') : null,
                providerInfo.key ? input(k[providerInfo.key], v => DB.setKey(providerInfo.key, v), { type: 'password', placeholder: providerInfo.hint.split(' ')[0], mono: true }) : null,
                providerInfo.key ? h('div', { class: 'label' }, '모델') : null,
                providerInfo.key ? h('div', { class: 'row' }, input(s.models[p], v => save({ models: { ...DB.settings().models, [p]: v.trim() } }), { mono: true, extra: { list: 'cp2-models' } }), modelList, button('목록', async () => {
                    aiStatus.textContent = '불러오는 중…';
                    try {
                        const ids = await AI.listModels(p, DB.keys()[providerInfo.key]);
                        modelList.replaceChildren(...ids.map(id => h('option', { value: id })));
                        aiStatus.textContent = `${ids.length}개 · 칸을 눌러 고르면 돼`;
                    } catch (e) { aiStatus.textContent = e.message; }
                })) : null,
                providerInfo.key ? h('div') : null, providerInfo.key ? aiStatus : null)),

            h('div', { class: 'group-title' }, '그리기'),
            h('div', { class: 'group' }, h('div', { class: 'form' },
                h('div', { class: 'label' }, '모델'), select(Object.values(Compose.MODELS).map(m => [m.id, m.label]), s.nai, v => save({ nai: v })),
                h('div', { class: 'label' }, '크기'), select([['landscape', '가로 1216×832'], ['wide', '넓은 가로 1472×704'], ['square', '정사각 1024×1024']], s.gen.size, v => save({ gen: { ...DB.settings().gen, size: v } })),
                h('div', { class: 'label' }, '스텝'), input(s.gen.steps, v => save({ gen: { ...DB.settings().gen, steps: Number(v) || 28 } }), { type: 'number' }),
                h('div', { class: 'label' }, '가이던스'), input(s.gen.scale, v => save({ gen: { ...DB.settings().gen, scale: Number(v) } }), { type: 'number' }),
                h('div', { class: 'label' }, '리스케일'), input(s.gen.rescale, v => save({ gen: { ...DB.settings().gen, rescale: Number(v) } }), { type: 'number' }),
                h('div', { class: 'label' }, '샘플러'), select([['k_euler_ancestral', 'Euler Ancestral'], ['k_euler', 'Euler'], ['k_dpmpp_2s_ancestral', 'DPM++ 2S Ancestral'], ['k_dpmpp_2m_sde', 'DPM++ 2M SDE'], ['k_dpmpp_2m', 'DPM++ 2M'], ['k_dpmpp_sde', 'DPM++ SDE']], s.gen.sampler, v => save({ gen: { ...DB.settings().gen, sampler: v } })),
                h('div', { class: 'label' }, '노이즈'), select([['karras', 'Karras'], ['native', 'Native'], ['exponential', 'Exponential'], ['polyexponential', 'Polyexponential']], s.gen.noise, v => save({ gen: { ...DB.settings().gen, noise: v } })),
                h('div', { class: 'label' }, '인물 위치'), h('div', { class: 'row' }, toggle(s.gen.coords, v => save({ gen: { ...DB.settings().gen, coords: v } })), h('span', { class: 'faint' }, '둘 이상일 때 왼쪽·가운데·오른쪽 자리 지정')))),

            h('div', { class: 'group-title' }, '장면'),
            h('div', { class: 'group' }, h('div', { class: 'form' },
                h('div', { class: 'label' }, '앞 대화'), select([2, 4, 6, 10, 16].map(n => [n, `${n}개`]), s.context, v => save({ context: Number(v) })),
                h('div', { class: 'label' }, '성인 장면'), h('div', { class: 'row' }, toggle(s.nsfw, v => save({ nsfw: v })), h('span', { class: 'faint' }, '켜면 작품에서 성인으로 만든 인물만 섹스 장면이 돼')),
                h('div', { class: 'label' }, '파일로도 받기'), h('div', { class: 'row' }, toggle(s.download, v => save({ download: v })), h('span', { class: 'faint' }, '그릴 때마다 다운로드 폴더로')))),

            h('div', { class: 'group-title' }, '기본 베이스'),
            h('div', { class: 'group' },
                h('div', { class: 'faint' }, '작품 JSON에 베이스가 없을 때 쓰는 베이스야. nai_config.json을 작품 탭에서 불러오면 여기에 들어가.'),
                textarea(s.base, v => save({ base: v }), { mono: true, rows: 3, placeholder: '베이스 프롬프트' }),
                textarea(s.baseNeg, v => save({ baseNeg: v }), { mono: true, rows: 3, placeholder: '베이스 부정' })),

            h('div', { class: 'group-title' }, '정보'),
            h('div', { class: 'group' },
                h('div', { class: 'faint' }, `크랙 페인터 ${GM_info?.script?.version || ''} · 토큰 계산: ${Tags.exact() ? 'T5 사전(정확)' : '추정(+10% 여유) · 사전을 받는 중이거나 못 받았어'}`)));
        W.win.content.append(pane);
    }

    return { open };
})();

// 크게 보기
const Gallery = (() => {
    const { h, button, iconButton } = Kit;

    function view(shot, onChange) {
        Kit.mount();
        const close = () => { el.remove(); document.removeEventListener('keydown', key, true); };
        const key = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
        const copyAll = () => navigator.clipboard.writeText([`[베이스]\n${shot.sent?.base || ''}`, ...(shot.sent?.chars || []).map(c => `[${c.name}]\n${c.prompt}\n[${c.name} 부정]\n${c.neg}`), `[베이스 부정]\n${shot.sent?.baseNeg || shot.sent?.negative || ''}`].join('\n\n'));
        const info = (k, v) => h('div', { class: 'row' }, h('span', { class: 'label', style: { width: '56px' } }, k), h('span', { class: 'grow' }, v));
        const el = h('div', { class: 'viewer', onmousedown: e => { if (e.target === el || e.target.classList.contains('stage')) close(); } },
            h('div', { class: 'stage' }, h('img', { src: App.url(shot) })),
            h('aside', null,
                h('div', { class: 'row' }, h('strong', { class: 'grow' }, shot.title || '삽화'), iconButton('close', close, '닫기')),
                info('채팅방', shot.roomName || '-'),
                info('작품', shot.work || '-'),
                info('시간', U.fmtDate(shot.createdAt)),
                info('모델', Compose.model(shot.model).label),
                info('시드', String(shot.seed ?? '-')),
                shot.direction?.why ? h('div', { class: 'note' }, shot.direction.why) : null,
                h('div', { class: 'row wrap' },
                    button('저장', () => App.download(shot), { iconName: 'save' }),
                    button('프롬프트 복사', copyAll, { iconName: 'copy' }),
                    (shot.story || shot.room === Crack.chatId()) ? button('채팅에서 보기', () => { close(); location.href = `${location.origin}/stories/${shot.story || Crack.storyId()}/episodes/${shot.room}`; }, { iconName: 'chat' }) : null,
                    button('지우기', e => Kit.confirmInline(e.currentTarget, '한 번 더', async () => { await DB.deleteShot(shot.id); App.forget(shot.id); close(); App.renderFigures(); onChange?.(); }), { kind: 'danger', iconName: 'trash' })),
                shot.sent ? h('details', { class: 'sent', open: true }, h('summary', null, '보낸 내용'),
                    h('div', { class: 'inner' }, h('div', { class: 'faint', style: { fontFamily: 'var(--mono)', whiteSpace: 'pre-wrap' } },
                        [`[베이스]\n${shot.sent.base}`, ...(shot.sent.chars || []).map(c => `[${c.name}]\n${c.prompt}`)].join('\n\n')))) : null));
        document.addEventListener('keydown', key, true);
        Kit.shell().append(el);
    }

    return { view };
})();


// ── main.js ──
// 시작점
(() => {
    if (location.hostname === 'chatgpt.com') { Relay.start(); return; }

    const VOCAB_URLS = [
        'https://raw.githubusercontent.com/zer0thgear/zer0-novel-utillities/main/public/tokenizers/t5-unigram.json',
        'https://raw.githubusercontent.com/comfyanonymous/ComfyUI/master/comfy/text_encoders/t5_tokenizer/tokenizer.json'
    ];

    // T5 사전: IndexedDB에 있으면 쓰고, 없으면 한 번 받아 둔다(약 1MB).
    async function loadVocab() {
        try {
            const cached = await DB.kvGet('t5vocab');
            if (cached && Tags.setVocab(cached)) return;
        } catch (_) { /* 처음 */ }
        for (const url of VOCAB_URLS) {
            try {
                const res = await Net.send({ url, responseType: 'text', timeout: 60000 });
                if (res.status !== 200) continue;
                const j = JSON.parse(res.text);
                const v = j.pieces ? j : { unkId: j.model?.unk_id ?? 2, pieces: j.model.vocab.map(p => p[0]), scores: j.model.vocab.map(p => p[1]) };
                if (Tags.setVocab(v)) { await DB.kvSet('t5vocab', v); return; }
            } catch (_) { /* 다음 주소 */ }
        }
    }

    function injectPageStyle() {
        if (document.getElementById('cp2-page-style')) return;
        const st = document.createElement('style');
        st.id = 'cp2-page-style';
        st.textContent = CSS_PAGE;
        document.head.append(st);
    }

    let timer = null;
    let scanning = false;
    async function scan() {
        if (scanning) return;
        scanning = true;
        try {
            injectPageStyle();
            Kit.theme();
            if (!Crack.chatId()) return;
            await App.decorate();
            await App.renderFigures();
        } catch (e) {
            console.warn('[크랙 페인터] scan', e);
        } finally {
            scanning = false;
        }
    }
    const soon = () => { clearTimeout(timer); timer = setTimeout(scan, 350); };

    async function start() {
        DB.watch();
        DB.on('shots', () => App.renderFigures());
        DB.on('works', () => App.renderFigures());
        const moved = await DB.migrate().catch(() => 0);
        if (moved) Kit.toast(`예전 버전 삽화 ${moved}장을 옮겨 왔어. 갤러리에서 볼 수 있어.`, { kind: 'ok', ms: 7000 });
        loadVocab();
        new MutationObserver(muts => {
            if (muts.every(m => [...m.addedNodes, ...m.removedNodes].every(n => n.nodeType === 1 && (n.id === 'cp2-host' || n.classList?.contains('cp2-figure') || n.classList?.contains('cp2-msgbtn'))))) return;
            soon();
        }).observe(document.body, { childList: true, subtree: true });
        scan();
        GM_registerMenuCommand?.('작업실 열기', () => Workshop.open());
        GM_registerMenuCommand?.('설정', () => Workshop.open('settings'));
    }

    start();
})();

})();
