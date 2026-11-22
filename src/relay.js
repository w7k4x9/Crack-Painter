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
