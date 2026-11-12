// ─────────────────────────────────────────────────────────────
// UI 기반: Shadow DOM 호스트, 테마, 아이콘, 창, 메뉴, 알림
// ─────────────────────────────────────────────────────────────
const UI = (() => {
    'use strict';

    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const P = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
    const icons = {
        // 삽화(그림 + 반짝임): 메시지 버튼·생성 버튼·알림 아이콘
        brush: P('<path d="M13 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M4.5 17.5 9 13l3.5 3.5 2-2 5 4.5"/><circle cx="9" cy="8.8" r="1.4"/><path d="M18 2.6l.85 2.05 2.05.85-2.05.85L18 8.4l-.85-2.05-2.05-.85 2.05-.85z" fill="currentColor" stroke-width="1"/>'),
        bolt: P('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
        refresh: P('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>'),
        left: P('<path d="m15 18-6-6 6-6"/>'),
        right: P('<path d="m9 18 6-6-6-6"/>'),
        download: P('<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>'),
        trash: P('<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>'),
        edit: P('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
        gear: P('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
        x: P('<path d="M6 6l12 12M18 6 6 18"/>', 'stroke-width="3"'),
        minus: P('<path d="M5 12h14"/>', 'stroke-width="3"'),
        plus: P('<path d="M12 5v14M5 12h14"/>'),
        zoom: P('<path d="M7 17 17 7"/><path d="M9 7h8v8"/>', 'stroke-width="3"'),
        sparkles: P('<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
        info: P('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5v.5"/>'),
        warn: P('<path d="M12 3 2 20h20z"/><path d="M12 10v4"/><path d="M12 17v.5"/>'),
        photo: P('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 8"/>'),
        key: P('<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9"/><path d="m17 6 3 3"/><path d="m15 8 2 2"/>'),
        person: P('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'),
        palette: P('<path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>'),
        slider: P('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'),
        room: P('<path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/>'),
        disk: P('<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'),
        check: P('<path d="m5 12 5 5 9-10"/>', 'stroke-width="2.4"'),
        disclose: P('<path d="m9 6 6 6-6 6"/>', 'stroke-width="2.6"'),
        pin: P('<path d="m5 12 5 5 9-10"/>', 'stroke-width="3.4"'),
        layers: P('<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>'),
        cpu: P('<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>')
    };

    let host = null;
    let root = null;
    let layer = null;
    let toasts = null;
    let dock = null;

    function mount() {
        if (root?.isConnected) return root;
        host = document.createElement('div');
        host.id = 'cp-host';
        const shadow = host.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = UI_CSS;
        root = document.createElement('div');
        root.className = 'root';
        layer = document.createElement('div');
        layer.className = 'layer';
        toasts = document.createElement('div');
        toasts.className = 'toasts';
        root.append(layer, toasts);
        shadow.append(style, root);
        document.body.appendChild(host);
        syncTheme();
        new MutationObserver(syncTheme).observe(document.body, { attributes: true, attributeFilter: ['data-theme', 'class'] });
        new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
        matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', syncTheme);
        return root;
    }

    function syncTheme() {
        if (!root) return;
        root.classList.toggle('dark', Crack.siteTheme() === 'dark');
    }

    function injectPageStyle() {
        if (document.getElementById('cp-page-style')) return;
        const st = document.createElement('style');
        st.id = 'cp-page-style';
        st.textContent = PAGE_CSS;
        document.head.appendChild(st);
    }

    // ── 창 ──────────────────────────────────────────────
    const windows = new Map();

    function openWindow({ id, className = '', title = '', subtitle = '', right = '', modal = true, onClose, sidebarTitle = false }) {
        mount();
        if (windows.has(id)) {
            const w = windows.get(id);
            w.restore();
            w.focus();
            return w;
        }
        const scrim = modal ? Object.assign(document.createElement('div'), { className: 'scrim' }) : null;
        const el = document.createElement('div');
        el.className = `win ${className}`;
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-label', title);
        el.innerHTML = `
            <div class="titlebar" data-drag>
              <div class="left"><div class="lights"><i data-act="close" aria-label="닫기"></i><i data-act="min" aria-label="내리기"></i><i data-act="zoom" aria-label="크게"></i></div><span class="tb-left"></span></div>
              <div class="title"><b></b><small></small></div>
              <div class="right"></div>
            </div>
            <div class="body"></div>`;
        if (sidebarTitle) el.querySelector('.titlebar').remove();
        if (scrim) layer.appendChild(scrim);
        layer.appendChild(el);

        const api = {
            id, el,
            body: el.querySelector('.body'),
            setTitle(t, sub = '') {
                const b = el.querySelector('.title b');
                const s = el.querySelector('.title small');
                if (b) b.textContent = t;
                if (s) { s.textContent = sub; s.classList.toggle('hidden', !sub); }
            },
            setRight(html) { const r = el.querySelector('.titlebar .right'); if (r) r.innerHTML = html; },
            close() {
                if (!windows.has(id)) return;
                windows.delete(id);
                el.remove();
                scrim?.remove();
                renderDock();
                document.removeEventListener('keydown', onKey, true);
                onClose?.();
            },
            minimize() {
                el.classList.add('hidden');
                scrim?.classList.add('hidden');
                api.minimized = true;
                renderDock();
            },
            restore() {
                el.classList.remove('hidden');
                scrim?.classList.remove('hidden');
                api.minimized = false;
                renderDock();
            },
            focus() { layer.appendChild(scrim || el); if (scrim) layer.appendChild(el); },
            dockLabel: title,
            minimized: false
        };
        api.setTitle(title, subtitle);
        if (right) api.setRight(right);

        // 신호등
        el.addEventListener('click', ev => {
            const act = ev.target.closest('.lights i')?.dataset.act;
            if (!act || ev.target.closest('.lights i').classList.contains('off')) return;
            if (act === 'close') api.close();
            else if (act === 'min') api.minimize();
            else if (act === 'zoom') el.classList.toggle('zoomed');
        });
        scrim?.addEventListener('click', () => api.minimize());

        const onKey = ev => {
            if (api.minimized || windows.get(id) !== api) return;
            const top = Array.from(windows.values()).filter(w => !w.minimized).pop();
            if (top !== api) return;
            if (ev.key === 'Escape' && !ev.target.closest?.('.menu')) {
                if (closeMenu()) { ev.stopPropagation(); return; }
                ev.stopPropagation();
                api.close();
            }
        };
        document.addEventListener('keydown', onKey, true);

        center(el);
        enableDrag(el);
        windows.set(id, api);
        renderDock();
        return api;
    }

    function center(el) {
        requestAnimationFrame(() => {
            const r = el.getBoundingClientRect();
            el.style.left = `${Math.max(8, (innerWidth - r.width) / 2)}px`;
            el.style.top = `${Math.max(8, (innerHeight - r.height) / 2 - 10)}px`;
        });
    }

    function enableDrag(el) {
        el.addEventListener('pointerdown', ev => {
            const bar = ev.target.closest('[data-drag]');
            if (!bar || ev.target.closest('button, input, select, textarea, .lights, a, .seg') || el.classList.contains('zoomed') || innerWidth <= 760) return;
            const r = el.getBoundingClientRect();
            const dx = ev.clientX - r.left;
            const dy = ev.clientY - r.top;
            const move = e => {
                el.style.left = `${Math.min(innerWidth - 80, Math.max(-r.width + 120, e.clientX - dx))}px`;
                el.style.top = `${Math.min(innerHeight - 40, Math.max(0, e.clientY - dy))}px`;
            };
            const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
            addEventListener('pointermove', move);
            addEventListener('pointerup', up);
        });
        el.addEventListener('dblclick', ev => {
            if (ev.target.closest('[data-drag]') && !ev.target.closest('button, input, select, textarea, .lights')) el.classList.toggle('zoomed');
        });
    }

    function renderDock() {
        const mins = Array.from(windows.values()).filter(w => w.minimized);
        if (!mins.length) { dock?.remove(); dock = null; return; }
        if (!dock) { dock = document.createElement('div'); dock.className = 'dock'; layer.appendChild(dock); }
        dock.innerHTML = mins.map(w => `<button data-id="${esc(w.id)}"><span class="app">${icons.brush}</span>${esc(w.dockLabel)}</button>`).join('');
        dock.onclick = ev => {
            const id = ev.target.closest('button')?.dataset.id;
            const w = windows.get(id);
            if (w) { w.restore(); w.focus(); }
        };
    }

    function setDockLabel(id, label) {
        const w = windows.get(id);
        if (!w) return;
        w.dockLabel = label;
        if (w.minimized) renderDock();
    }

    // ── 팝오버 메뉴 ─────────────────────────────────────
    let menuEl = null;
    function closeMenu() {
        if (!menuEl) return false;
        menuEl.remove();
        menuEl = null;
        return true;
    }
    // items: [{label, sub, value, header, sep}]
    function menu(anchor, items, onPick) {
        closeMenu();
        mount();
        menuEl = document.createElement('div');
        menuEl.className = 'menu';
        menuEl.innerHTML = items.map((it, i) => it.sep ? '<hr>' : it.header ? `<div class="hd">${esc(it.header)}</div>`
            : `<button data-i="${i}"><span class="grow">${esc(it.label)}${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</span></button>`).join('');
        layer.appendChild(menuEl);
        const r = anchor.getBoundingClientRect();
        const m = menuEl.getBoundingClientRect();
        menuEl.style.left = `${Math.max(8, Math.min(innerWidth - m.width - 8, r.left))}px`;
        menuEl.style.top = `${r.bottom + 4 + m.height > innerHeight ? Math.max(8, r.top - m.height - 4) : r.bottom + 4}px`;
        menuEl.addEventListener('click', ev => {
            const i = ev.target.closest('button')?.dataset.i;
            if (i == null) return;
            closeMenu();
            onPick(items[Number(i)]);
        });
        setTimeout(() => {
            const off = ev => {
                if (menuEl && !ev.composedPath().includes(menuEl)) { closeMenu(); document.removeEventListener('pointerdown', off, true); }
                if (!menuEl) document.removeEventListener('pointerdown', off, true);
            };
            document.addEventListener('pointerdown', off, true);
        });
    }

    // ── 알림 ─────────────────────────────────────────────
    // toast({title, body, kind:'info'|'ok'|'err', progress, actions:[{label, primary, onClick}], timeout})
    function toast(opts) {
        mount();
        const el = document.createElement('div');
        el.className = 'toast';
        const t = { el, update, close };
        function update(o = {}) {
            Object.assign(opts, o);
            const kind = opts.kind || 'info';
            el.innerHTML = `
              <div class="app ${kind === 'err' ? 'err' : kind === 'ok' ? 'ok' : ''}">${kind === 'err' ? icons.warn : kind === 'ok' ? icons.check : icons.brush}</div>
              <div class="txt"><b>${esc(opts.title || 'Crack Painter')}</b>${opts.body ? `<p>${esc(opts.body)}</p>` : ''}
                ${opts.progress ? '<div class="prog"><i></i></div>' : ''}
                ${opts.actions?.length ? `<div class="acts">${opts.actions.map((a, i) => `<button class="btn ${a.primary ? 'primary' : ''}" data-i="${i}">${esc(a.label)}</button>`).join('')}</div>` : ''}
              </div>
              <button class="icon-btn sm x" data-x title="닫기">${icons.x}</button>`;
            clearTimeout(t.timer);
            const ms = opts.timeout ?? (opts.progress || opts.actions?.length ? 0 : kind === 'err' ? 7000 : 3200);
            if (ms) t.timer = setTimeout(close, ms);
        }
        function close() {
            clearTimeout(t.timer);
            el.classList.add('leaving');
            setTimeout(() => el.remove(), 200);
        }
        el.addEventListener('click', ev => {
            if (ev.target.closest('[data-x]')) { opts.onDismiss?.(); return close(); }
            const i = ev.target.closest('[data-i]')?.dataset.i;
            if (i != null) { const a = opts.actions[Number(i)]; if (a.keepOpen !== true) close(); a.onClick?.(); }
        });
        update();
        toasts.prepend(el);
        return t;
    }

    function lightbox(src) {
        mount();
        const el = document.createElement('div');
        el.className = 'lightbox';
        el.innerHTML = `<img alt="">`;
        el.querySelector('img').src = src;
        el.addEventListener('click', () => el.remove());
        layer.appendChild(el);
        const key = ev => { if (ev.key === 'Escape') { el.remove(); document.removeEventListener('keydown', key, true); ev.stopPropagation(); } };
        document.addEventListener('keydown', key, true);
    }

    function spinner() {
        return `<div class="spinner">${Array.from({ length: 8 }, (_, i) => `<i style="transform:rotate(${i * 45}deg);animation-delay:${(i - 8) * 0.125}s"></i>`).join('')}</div>`;
    }

    function seg(name, options, value, cls = '') {
        return `<div class="seg ${cls}" data-seg="${esc(name)}">${options.map(([v, l]) => `<button type="button" data-v="${esc(v)}" class="${String(v) === String(value) ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>`;
    }

    function options(list, value) {
        return list.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`).join('');
    }

    function switchHtml(name, checked) {
        return `<label class="switch"><input type="checkbox" data-sw="${esc(name)}" ${checked ? 'checked' : ''}><span></span></label>`;
    }

    return { esc, icons, mount, injectPageStyle, openWindow, setDockLabel, menu, closeMenu, toast, lightbox, spinner, seg, options, switchHtml, windows };
})();
