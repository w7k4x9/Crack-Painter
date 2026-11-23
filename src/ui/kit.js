// Kit — 화면 부품: Shadow DOM 무대, 테마, 아이콘, 창, 팝오버, 알림, 크게 보기, 작은 컨트롤.
const Kit = (() => {
    'use strict';

    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
    const attr = (name, on) => (on ? ` ${name}` : '');

    const svg = (paths, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${paths}</svg>`;
    const icon = {
        art: svg('<path d="M13 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M4.5 17.5 9 13l3.5 3.5 2-2 5 4.5"/><circle cx="9" cy="8.8" r="1.4"/><path d="M18 2.6l.85 2.05 2.05.85-2.05.85L18 8.4l-.85-2.05-2.05-.85 2.05-.85z" fill="currentColor" stroke-width="1"/>'),
        bolt: svg('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
        again: svg('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>'),
        back: svg('<path d="m15 18-6-6 6-6"/>'),
        next: svg('<path d="m9 18 6-6-6-6"/>'),
        save: svg('<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>'),
        bin: svg('<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>'),
        pen: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
        cog: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
        close: svg('<path d="M6 6l12 12M18 6 6 18"/>', 'stroke-width="3"'),
        add: svg('<path d="M12 5v14M5 12h14"/>'),
        magic: svg('<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
        info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5v.5"/>'),
        warn: svg('<path d="M12 3 2 20h20z"/><path d="M12 10v4"/><path d="M12 17v.5"/>'),
        photo: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 8"/>'),
        key: svg('<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9"/><path d="m17 6 3 3"/><path d="m15 8 2 2"/>'),
        person: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'),
        palette: svg('<path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>'),
        sliders: svg('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'),
        house: svg('<path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/>'),
        disk: svg('<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'),
        check: svg('<path d="m5 12 5 5 9-10"/>', 'stroke-width="2.4"'),
        chevron: svg('<path d="m9 6 6 6-6 6"/>', 'stroke-width="2.6"'),
        pin: svg('<path d="m5 12 5 5 9-10"/>', 'stroke-width="3.4"'),
        stack: svg('<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>')
    };

    // ── 무대 (Shadow DOM) ─────────────────────────────────
    let host = null;
    let stage = null;
    let shell = null;
    let notices = null;

    function mount() {
        if (shell?.isConnected) return shell;
        host = document.createElement('div');
        host.id = 'kp-host';
        const shadow = host.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = SHELL_CSS;
        shell = document.createElement('div');
        shell.className = 'shell';
        stage = document.createElement('div');
        stage.className = 'stage-layer';
        notices = document.createElement('div');
        notices.className = 'notices';
        shell.append(stage, notices);
        shadow.append(style, shell);
        document.body.append(host);
        followTheme();
        const watch = new MutationObserver(followTheme);
        for (const el of [document.body, document.documentElement]) watch.observe(el, { attributes: true, attributeFilter: ['data-theme', 'class'] });
        matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', followTheme);
        return shell;
    }

    function followTheme() {
        shell?.classList.toggle('dark', Site.theme() === 'dark');
    }

    function pageStyle() {
        if (document.getElementById('kp-page-style')) return;
        const st = document.createElement('style');
        st.id = 'kp-page-style';
        st.textContent = PAGE_CSS;
        document.head.append(st);
    }

    // ── 창 ──────────────────────────────────────────────
    const windows = new Map();
    const topWindow = () => [...windows.values()].pop();
    const isTyping = el => el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);

    const trafficLights = (zoom = true) => `<div class="traffic"><i class="t-close" data-light="close" aria-label="닫기"></i><i class="t-off"></i><i class="${zoom ? 't-zoom' : 't-off'}" data-light="${zoom ? 'zoom' : ''}" aria-label="크게"></i></div>`;

    /** sidebar: 창 위 제목 줄 없이 몸통이 스스로 제목 줄을 그린다(설정 창). */
    function window_({ id, cls = '', title = '', sub = '', sidebar = false, onClose }) {
        mount();
        if (windows.has(id)) {
            const w = windows.get(id);
            w.raise();
            return w;
        }
        const scrim = document.createElement('div');
        scrim.className = 'scrim';
        const el = document.createElement('div');
        el.className = `window ${cls}`;
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-label', title);
        el.innerHTML = `${sidebar ? '' : `
            <header class="chrome" data-drag>
              <div class="chrome-l">${trafficLights()}</div>
              <div class="chrome-c"><b></b><small></small></div>
              <div class="chrome-r"></div>
            </header>`}<div class="window-body"></div>`;
        stage.append(scrim, el);

        const onKey = ev => {
            if (topWindow() !== win || ev.key !== 'Escape' || ev.target.closest?.('.popover')) return;
            ev.stopPropagation();
            if (closeMenu()) return;
            // 입력하던 중이면 창은 그대로 두고 입력칸에서만 빠져나온다
            const target = ev.composedPath?.()[0];
            if (isTyping(target)) { target.blur(); return; }
            win.close();
        };

        const win = {
            id, el,
            body: el.querySelector('.window-body'),
            title(text, subtitle = '') {
                const b = el.querySelector('.chrome-c b');
                const s = el.querySelector('.chrome-c small');
                if (b) b.textContent = text;
                if (s) { s.textContent = subtitle; s.classList.toggle('hide', !subtitle); }
            },
            right(html) { const r = el.querySelector('.chrome-r'); if (r) r.innerHTML = html; },
            raise() { stage.append(scrim, el); windows.delete(id); windows.set(id, win); },
            close() {
                if (windows.get(id) !== win) return;
                windows.delete(id);
                el.remove();
                scrim.remove();
                document.removeEventListener('keydown', onKey, true);
                onClose?.();
            }
        };
        win.title(title, sub);

        el.addEventListener('click', ev => {
            const light = ev.target.closest('[data-light]')?.dataset.light;
            if (light === 'close') win.close();
            else if (light === 'zoom') el.classList.toggle('is-zoomed');
        });
        scrim.addEventListener('click', () => win.close());
        document.addEventListener('keydown', onKey, true);
        dragByTitle(el);
        requestAnimationFrame(() => {
            const r = el.getBoundingClientRect();
            el.style.left = `${Math.max(8, (innerWidth - r.width) / 2)}px`;
            el.style.top = `${Math.max(8, (innerHeight - r.height) / 2 - 10)}px`;
        });
        windows.set(id, win);
        return win;
    }

    function dragByTitle(el) {
        const interactive = 'button, input, select, textarea, a, .traffic, .segmented';
        el.addEventListener('pointerdown', ev => {
            if (!ev.target.closest('[data-drag]') || ev.target.closest(interactive) || el.classList.contains('is-zoomed') || innerWidth <= 760) return;
            const r = el.getBoundingClientRect();
            const ox = ev.clientX - r.left;
            const oy = ev.clientY - r.top;
            const move = e => {
                el.style.left = `${Math.min(innerWidth - 80, Math.max(120 - r.width, e.clientX - ox))}px`;
                el.style.top = `${Math.min(innerHeight - 40, Math.max(0, e.clientY - oy))}px`;
            };
            const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
            addEventListener('pointermove', move);
            addEventListener('pointerup', up);
        });
        el.addEventListener('dblclick', ev => {
            if (ev.target.closest('[data-drag]') && !ev.target.closest(interactive)) el.classList.toggle('is-zoomed');
        });
    }

    // ── 누른 자리에서 한 번 더 눌러 확인 (3초 안) ─────────────
    function confirmTap(btn, label = '한 번 더') {
        if (btn.dataset.armed) {
            clearTimeout(btn.kpTimer);
            delete btn.dataset.armed;
            btn.classList.remove('is-armed');
            btn.innerHTML = btn.kpHtml;
            return true;
        }
        btn.dataset.armed = '1';
        btn.kpHtml = btn.innerHTML;
        btn.classList.add('is-armed');
        btn.innerHTML = `${icon.bin}<span>${esc(label)}</span>`;
        btn.kpTimer = setTimeout(() => {
            delete btn.dataset.armed;
            btn.classList.remove('is-armed');
            btn.innerHTML = btn.kpHtml;
        }, 3000);
        return false;
    }

    // ── 팝오버 ──────────────────────────────────────────
    let popover = null;
    function closeMenu() {
        const el = popover;
        if (!el) return false;
        popover = null;
        el.remove();
        el.kpCancel?.();
        return true;
    }

    function showPopover(anchor, cls, html) {
        closeMenu();
        mount();
        const el = document.createElement('div');
        el.className = `popover ${cls}`;
        el.innerHTML = html;
        stage.append(el);
        const a = anchor.getBoundingClientRect();
        const p = el.getBoundingClientRect();
        el.style.left = `${Math.max(8, Math.min(innerWidth - p.width - 8, a.left))}px`;
        el.style.top = `${a.bottom + 4 + p.height > innerHeight ? Math.max(8, a.top - p.height - 4) : a.bottom + 4}px`;
        popover = el;
        return el;
    }

    // 팝오버 바깥을 누르면 닫는다 (여는 클릭은 건너뛰도록 다음 틱부터)
    function closeOnOutside(el, onOutside) {
        setTimeout(() => {
            const off = ev => {
                if (popover === el && ev.composedPath().includes(el)) return;
                document.removeEventListener('pointerdown', off, true);
                if (popover === el) onOutside();
            };
            document.addEventListener('pointerdown', off, true);
        });
    }

    /** items: [{label, sub, value} | {header} | {sep:true}] */
    function menu(anchor, items, onPick) {
        const el = showPopover(anchor, '', items.map((it, i) => {
            if (it.sep) return '<hr>';
            if (it.header) return `<div class="popover-head">${esc(it.header)}</div>`;
            return `<button data-i="${i}"><span class="fill">${esc(it.label)}${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</span></button>`;
        }).join(''));
        el.addEventListener('click', ev => {
            const i = ev.target.closest('button')?.dataset.i;
            if (i == null) return;
            closeMenu();
            onPick(items[Number(i)]);
        });
        closeOnOutside(el, closeMenu);
    }

    /** 작은 이름 입력 팝오버 → 입력값 또는 null */
    function ask(anchor, { title = '', placeholder = '', value = '', ok = '저장' } = {}) {
        return new Promise(resolve => {
            const el = showPopover(anchor, 'popover-ask', `${title ? `<div class="popover-head">${esc(title)}</div>` : ''}
                <div class="line"><input class="input" placeholder="${esc(placeholder)}" value="${esc(value)}"><button class="button is-primary" data-ok>${esc(ok)}</button></div>`);
            const input = el.querySelector('input');
            let answered = false;
            const answer = v => {
                if (answered) return;
                answered = true;
                if (popover === el) closeMenu();
                resolve(v);
            };
            el.kpCancel = () => answer(null);
            input.focus();
            input.addEventListener('keydown', ev => {
                if (ev.key === 'Enter') { ev.preventDefault(); answer(input.value.trim() || null); }
                if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); answer(null); }
            });
            el.querySelector('[data-ok]').addEventListener('click', () => answer(input.value.trim() || null));
            closeOnOutside(el, () => answer(null));
        });
    }

    // ── 알림 ─────────────────────────────────────────────
    /** toast({ title, body, kind:'info'|'ok'|'err', progress, actions:[{label, primary, onClick}], timeout, onDismiss }) */
    function toast(opts) {
        mount();
        const el = document.createElement('div');
        el.className = 'notice';
        let timer = 0;
        const handle = { el, update, close };

        function update(more = {}) {
            Object.assign(opts, more);
            const kind = opts.kind || 'info';
            const badge = kind === 'err' ? ['is-err', icon.warn] : kind === 'ok' ? ['is-ok', icon.check] : ['', icon.art];
            const acts = opts.actions || [];
            el.innerHTML = `
              <div class="notice-icon ${badge[0]}">${badge[1]}</div>
              <div class="notice-text"><b>${esc(opts.title || '크랙 페인터')}</b>${opts.body ? `<p>${esc(opts.body)}</p>` : ''}
                ${opts.progress ? '<div class="notice-progress"><i></i></div>' : ''}
                ${acts.length ? `<div class="notice-acts">${acts.map((a, i) => `<button class="button${a.primary ? ' is-primary' : ''}" data-i="${i}">${esc(a.label)}</button>`).join('')}</div>` : ''}
              </div>
              <button class="iconbutton is-small notice-x" data-x title="닫기">${icon.close}</button>`;
            clearTimeout(timer);
            const stay = opts.progress || acts.length;
            const ms = opts.timeout ?? (stay ? 0 : kind === 'err' ? 7000 : 3200);
            if (ms) timer = setTimeout(close, ms);
        }

        function close() {
            clearTimeout(timer);
            el.classList.add('is-leaving');
            setTimeout(() => el.remove(), 200);
        }

        el.addEventListener('click', ev => {
            if (ev.target.closest('[data-x]')) { opts.onDismiss?.(); close(); return; }
            const i = ev.target.closest('[data-i]')?.dataset.i;
            if (i == null) return;
            const a = opts.actions[Number(i)];
            if (a.keepOpen !== true) close();
            a.onClick?.();
        });
        update();
        notices.prepend(el);
        return handle;
    }

    function lightbox(src) {
        mount();
        const el = document.createElement('div');
        el.className = 'fullview';
        const img = document.createElement('img');
        img.alt = '';
        img.src = src;
        el.append(img);
        const leave = () => { el.remove(); document.removeEventListener('keydown', onKey, true); };
        const onKey = ev => { if (ev.key === 'Escape') { ev.stopPropagation(); leave(); } };
        el.addEventListener('click', leave);
        document.addEventListener('keydown', onKey, true);
        stage.append(el);
    }

    // ── 작은 컨트롤 (HTML 문자열) ──────────────────────────
    const spinner = () => `<div class="spinner">${Array.from({ length: 8 }, (_, i) => `<i style="transform:rotate(${i * 45}deg);animation-delay:${(i - 8) / 8}s"></i>`).join('')}</div>`;

    const seg = (name, choices, value, cls = '') => `<div class="segmented ${cls}" data-seg="${esc(name)}">${choices.map(([v, label]) => `<button type="button" data-v="${esc(v)}"${String(v) === String(value) ? ' class="is-on"' : ''}>${esc(label)}</button>`).join('')}</div>`;

    const options = (choices, value) => choices.map(([v, label]) => `<option value="${esc(v)}"${attr('selected', String(v) === String(value))}>${esc(label)}</option>`).join('');

    const toggle = (name, on) => `<label class="toggle"><input type="checkbox" data-sw="${esc(name)}"${attr('checked', on)}><span></span></label>`;

    return { esc, icon, mount, pageStyle, window: window_, windows, menu, closeMenu, confirmTap, ask, toast, lightbox, spinner, seg, options, toggle };
})();
