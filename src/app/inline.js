// Inline — 채팅 화면 안: 답변 아래 버튼 두 개, 답변 사이 삽화, 오른쪽 메뉴 두 줄, 화면 감시.
const Inline = (() => {
    'use strict';
    const { esc, icon } = Kit;

    // ── 켜기/끄기 (이 브라우저에만) ────────────────────
    function enabled() {
        try { return localStorage.getItem('cp_enabled') !== 'off'; } catch (_) { return true; }
    }
    function setEnabled(on) {
        try { localStorage.setItem('cp_enabled', on ? 'on' : 'off'); } catch (_) { /* 저장 못 해도 이번엔 적용 */ }
        document.body.classList.toggle('kp-off', !on);
        scan();
    }

    // ── 채팅 속 삽화 ────────────────────────────────────
    function toolbar(rec) {
        const n = rec.history.length;
        const i = rec.index;
        const b = (act, title, svg, off = false) => `<button data-kp="${act}" title="${title}"${off ? ' disabled' : ''}>${svg}</button>`;
        return [
            b('prev', '이전', icon.back, i <= 0),
            `<span class="kp-count">${i + 1} / ${n}</span>`,
            b('next', '다음', icon.next, i >= n - 1),
            '<span class="kp-divider"></span>',
            b('reroll', '같은 프롬프트로 다시', icon.again),
            b('studio', '스튜디오에서 편집', icon.pen),
            b('save', '저장', icon.save),
            b('delete', '이 장 삭제', icon.bin)
        ].join('');
    }

    async function render(markdown, rec) {
        const shot = rec.history[rec.index];
        if (!shot) { markdown.querySelectorAll(':scope > .kp-figure').forEach(f => f.remove()); return; }
        let fig = markdown.querySelector(':scope > .kp-figure');
        if (!fig) {
            fig = document.createElement('div');
            fig.className = 'kp-figure';
            fig.contentEditable = 'false';
            fig.innerHTML = '<div class="kp-frame"><img alt="" loading="lazy" decoding="async"><div class="kp-tools"></div></div>';
        }
        fig.dataset.key = rec.messageKey;
        const img = fig.querySelector('img');
        const url = await Engine.imageUrl(shot.imageId);
        if (img.getAttribute('src') !== url) img.src = url;
        img.alt = rec.title || '장면 삽화';
        fig.querySelector('.kp-tools').innerHTML = toolbar(rec);
        Site.place(markdown, fig, rec.paragraph);
    }

    const figureOf = key => [...document.querySelectorAll('.kp-figure')].find(f => f.dataset.key === key) || null;

    function busy(key, on) {
        const fig = figureOf(key);
        if (!fig) return;
        fig.querySelector('.kp-busy')?.remove();
        if (!on) return;
        const veil = document.createElement('div');
        veil.className = 'kp-busy';
        veil.textContent = '다시 그리는 중…';
        fig.querySelector('.kp-frame').append(veil);
    }

    async function onFigure(fig, act, btn) {
        const key = fig.dataset.key;
        const roomId = Site.room();
        const rec = (await Engine.records(roomId)).get(key);
        if (!rec) return;
        const md = fig.closest('.wrtn-markdown');
        const shot = rec.history[rec.index];
        switch (act) {
            case 'prev':
            case 'next':
                rec.index = Math.max(0, Math.min(rec.history.length - 1, rec.index + (act === 'next' ? 1 : -1)));
                await Vault.saveRecord(rec);
                if (md) render(md, rec);
                break;
            case 'reroll': Engine.reroll(key); break;
            case 'studio': if (md) Studio.open(md); break;
            case 'save': {
                const blob = await Vault.image(shot.imageId);
                if (blob) Engine.downloadShot(blob, rec.title, shot.seed);
                break;
            }
            case 'delete':
                if (Kit.confirmTap(btn, '삭제')) await Engine.removeShot(roomId, key, rec.index);
                break;
            default:
        }
    }

    document.addEventListener('click', ev => {
        const fig = ev.target.closest?.('.kp-figure');
        if (!fig) return;
        const btn = ev.target.closest('[data-kp]');
        if (btn) {
            ev.preventDefault();
            ev.stopPropagation();
            onFigure(fig, btn.dataset.kp, btn).catch(err => Engine.report(err));
            return;
        }
        if (ev.target.tagName !== 'IMG') return;
        ev.preventDefault();
        ev.stopPropagation();
        // 터치 화면: 첫 탭은 도구 줄만 보이기
        if (matchMedia('(hover: none)').matches && !fig.classList.contains('kp-tapped')) { fig.classList.add('kp-tapped'); return; }
        Kit.lightbox(ev.target.src);
    }, true);

    // ── 답변 아래 버튼 ──────────────────────────────────
    function messageButton(kind, title, svg) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `kp-msg-btn kp-${kind}`;
        b.title = title;
        b.setAttribute('aria-label', title);
        b.innerHTML = svg;
        return b;
    }

    function markRunning(key, on) {
        for (const b of document.querySelectorAll('.kp-msg-btn.kp-quick')) if (b.dataset.key === key) b.classList.toggle('kp-run', on);
    }

    document.addEventListener('click', ev => {
        const btn = ev.target.closest?.('.kp-msg-btn');
        if (!btn) return;
        ev.preventDefault();
        ev.stopPropagation();
        const reply = Site.replies(btn.closest('[data-message-group-id]') || document).find(r => r.footer.contains(btn));
        if (!reply) return;
        if (btn.classList.contains('kp-quick')) Engine.quick(reply.markdown);
        else if (Engine.ready()) Studio.open(reply.markdown);
    }, true);

    function addButtons(footer, key) {
        let slot = footer.children[0];
        if (!slot) {
            slot = document.createElement('div');
            slot.className = 'flex items-center space-x-3';
            footer.prepend(slot);
        }
        if (!slot.querySelector('.kp-studio')) slot.prepend(messageButton('studio', '삽화 스튜디오', icon.art), messageButton('quick', '바로 삽화 생성', icon.bolt));
        for (const b of slot.querySelectorAll('.kp-msg-btn')) b.dataset.key = key;
        slot.querySelector('.kp-quick')?.classList.toggle('kp-run', Engine.running.has(key));
    }

    // ── 오른쪽 메뉴: "상황 이미지 보기" 줄을 본떠 두 줄을 붙인다 ─────────
    //   AI 삽화 (스위치 = 켜고 끄기, 글자 = 설정)   ·   삽화 갤러리
    const MENU_GLYPHS = {
        sparkle: '<path d="M10 2.8l1.95 5.25L17.2 10l-5.25 1.95L10 17.2l-1.95-5.25L2.8 10l5.25-1.95z"/><path d="M18.2 13.2l.95 2.45 2.45.95-2.45.95-.95 2.45-.95-2.45-2.45-.95 2.45-.95z"/><path d="M17.6 2.4l.65 1.55 1.55.65-1.55.65-.65 1.55-.65-1.55-1.55-.65 1.55-.65z"/>',
        frame: '<path fill-rule="evenodd" clip-rule="evenodd" d="M20.2 2.2a1.3 1.3 0 0 1 1.3 1.3v16.7a1.3 1.3 0 0 1-1.3 1.3H3.5a1.3 1.3 0 0 1-1.3-1.3V3.5a1.3 1.3 0 0 1 1.3-1.3zM3.8 19.9h16.1V3.8H3.8z"/><path d="m5.6 17.6 4-5.2 2.9 3.5 1.9-2.3 3.9 4z"/><circle cx="15.6" cy="7.9" r="1.7"/>'
    };
    const SVG_NS = 'http://www.w3.org/2000/svg';

    // 크랙 원래 줄을 복제해서 글자와 아이콘만 바꾼다 (그래야 글자 크기·간격이 크랙과 같다)
    function menuRow(model, cls, label, glyph, withSwitch) {
        const row = model.cloneNode(true);
        row.classList.add('kp-menu-row', cls);
        const textSpan = [...row.querySelectorAll('span')].find(s => !s.querySelector('span') && s.textContent.trim() === '상황 이미지 보기');
        if (textSpan) textSpan.textContent = label;
        const old = row.querySelector('svg');
        if (old) {
            const fresh = document.createElementNS(SVG_NS, 'svg');
            for (const a of ['xmlns', 'fill', 'viewBox', 'width', 'height', 'color', 'class']) if (old.hasAttribute(a)) fresh.setAttribute(a, old.getAttribute(a));
            fresh.innerHTML = MENU_GLYPHS[glyph];
            old.replaceWith(fresh);
        }
        if (!withSwitch) row.querySelector('button[role="switch"]')?.closest('span')?.remove();
        return row;
    }

    function paintSwitch(sw) {
        if (!sw) return;
        const on = enabled();
        const state = on ? 'checked' : 'unchecked';
        sw.setAttribute('aria-checked', String(on));
        sw.setAttribute('data-state', state);
        sw.querySelector('span')?.setAttribute('data-state', state);
    }

    function addMenuRows() {
        const model = Site.menuModelRow();
        if (!model) return;
        const a = model.nextElementSibling;
        if (a?.classList?.contains('kp-row-main') && a.nextElementSibling?.classList?.contains('kp-row-gallery')) return;
        document.querySelectorAll('.kp-menu-row').forEach(r => r.remove());

        const main = menuRow(model, 'kp-row-main', 'AI 삽화', 'sparkle', true);
        const sw = main.querySelector('button[role="switch"]');
        paintSwitch(sw);
        main.addEventListener('click', ev => {
            ev.preventDefault();
            ev.stopPropagation();
            if (ev.target.closest('button[role="switch"]')) { setEnabled(!enabled()); paintSwitch(sw); } else Settings.open();
        }, true);

        const gallery = menuRow(model, 'kp-row-gallery', '삽화 갤러리', 'frame', false);
        gallery.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); Gallery.open(); }, true);

        model.after(main, gallery);
    }

    // ── 화면 훑기 ───────────────────────────────────────
    let scanning = false;
    async function scan() {
        if (scanning) return;
        scanning = true;
        try {
            Kit.pageStyle();
            const on = enabled();
            document.body.classList.toggle('kp-off', !on);
            addMenuRows();
            const roomId = Site.room();
            if (!roomId) return;
            const map = await Engine.records(roomId);
            for (const { markdown, footer } of Site.replies()) {
                const key = Site.keyOf(markdown);
                if (on) addButtons(footer, key);
                const rec = map.get(key);
                const fig = markdown.querySelector(':scope > .kp-figure');
                if (rec?.history?.length) { if (!fig || fig.dataset.key !== key) await render(markdown, rec); }
                else if (fig) fig.remove();
            }
        } catch (e) {
            console.warn('[크랙 페인터] 화면 훑기', e);
        } finally {
            scanning = false;
        }
    }

    let timer = 0;
    const soon = () => { clearTimeout(timer); timer = setTimeout(scan, 180); };

    function start() {
        Kit.pageStyle();
        Disk.load();
        let path = location.pathname;
        new MutationObserver(changes => {
            if (changes.some(c => !c.target.closest?.(Site.MINE) && c.target.id !== 'kp-host')) soon();
            if (location.pathname !== path) {
                path = location.pathname;
                Engine.forgetAll();
                soon();
            }
        }).observe(document.body, { childList: true, subtree: true });
        soon();
        setInterval(scan, 4000);
        Import2.run().then(n => { if (n) soon(); });
        try {
            GM_registerMenuCommand?.('설정 열기', () => Settings.open());
            GM_registerMenuCommand?.('삽화 갤러리', () => Gallery.open());
            GM_registerMenuCommand?.('삽화 보이기/숨기기', () => setEnabled(!enabled()));
        } catch (_) { /* 메뉴 없는 관리자 */ }
    }

    return { start, scan, render, figureOf, busy, markRunning, enabled, setEnabled };
})();
