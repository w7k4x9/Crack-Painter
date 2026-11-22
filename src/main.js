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
