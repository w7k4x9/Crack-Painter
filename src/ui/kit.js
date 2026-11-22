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
