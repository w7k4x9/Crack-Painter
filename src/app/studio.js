// Studio — 답변 하나를 분석해서 칸별로 확인·수정하고 그린다.
// 오른쪽 칸 구성이 NAI 요청 모양 그대로다:
//   베이스 프롬프트 = 스타일(직접 고정) + 장면(AI)   → base_caption
//   캐릭터 프롬프트 = 인물마다 한 칸                 → char_captions[]
const Studio = (() => {
    'use strict';
    const { esc, icon } = Kit;

    let s = null;                 // 열린 스튜디오 하나
    const drafts = new Map();     // 실수로 닫아도 고치던 내용을 메시지별로 기억

    const busy = () => Boolean(s && s.phase !== 'idle');
    const v5 = () => Models.isV5(s.model);
    const swatch = i => `k-${i % 6}`;

    function open(markdown) {
        const messageKey = Site.keyOf(markdown);
        const existing = Kit.windows.get('studio');
        if (s && existing && s.messageKey === messageKey) { existing.raise(); return; }
        if (s) existing?.close();
        const p = Prefs.get();
        s = {
            roomId: Site.room(), messageKey, markdown,
            paragraphs: Site.paragraphs(markdown),
            state: null, model: p.model, gen: { ...p.gen, seed: '' },
            styleEdited: false, dirty: false, restored: false, showMore: false,
            phase: 'idle', phaseText: '', error: '', controller: null,
            rec: null, view: -1, request: ''
        };
        const me = s;
        s.win = Kit.window({
            id: 'studio', cls: 'studio', title: '삽화 스튜디오',
            onClose: () => {
                if (me.phase === 'analyzing') me.controller?.abort();
                if (me.state && me.dirty) drafts.set(me.messageKey, { state: Engine.copy(me.state), gen: { ...me.gen }, styleEdited: me.styleEdited });
                if (s === me) s = null;
            }
        });
        s.win.right(`
            <select class="dropdown" data-model style="width:auto">${Kit.options(Models.list().map(m => [m.id, `NAI ${m.label}`]), s.model)}</select>
            <button class="iconbutton" data-do="gallery" title="삽화 갤러리">${icon.photo}</button>
            <button class="iconbutton" data-do="settings" title="설정">${icon.cog}</button>`);
        wire(s.win.el);
        start(s);
    }

    async function start(me) {
        me.rec = (await Engine.records(me.roomId)).get(me.messageKey) || null;
        if (s !== me) return;
        const shots = me.rec?.history || [];
        if (shots.length) me.view = me.rec.index;
        const draft = drafts.get(me.messageKey);
        if (draft) {
            Object.assign(me, { state: draft.state, styleEdited: draft.styleEdited, dirty: true, restored: true });
            me.gen = { ...me.gen, ...draft.gen };
            draw();
        } else if (shots.length) {
            const shown = shots[me.rec.index];
            me.state = Engine.copy(shown.state);
            me.gen.size = shown.gen?.size || me.gen.size;
            draw();
        } else {
            draw();
            analyze();
        }
    }

    // ── 동작 ───────────────────────────────────────────
    async function analyze(opts = {}) {
        const me = s;
        if (!me || busy()) return;
        me.controller = new AbortController();
        Object.assign(me, { phase: 'analyzing', phaseText: opts.request ? '요청을 반영해 다시 고르는 중' : '어떤 순간을 그릴지 고르는 중', error: '' });
        draw();
        try {
            const before = me.state;
            const next = await Engine.analyze(me.markdown, opts, me.controller.signal);
            if (s !== me) return;
            if (before && me.styleEdited) next.style = before.style;   // 손본 스타일은 재분석해도 남긴다
            Object.assign(me, { state: next, request: '', dirty: true, restored: false });
        } catch (err) {
            if (s !== me) return;
            if (err?.name !== 'AbortError') { me.error = err.message; Engine.report(err, '장면 분석 실패'); }
            if (!me.state) me.state = Plan.toState({ insertAfterParagraph: 0 }, Prefs.cast(me.roomId), Prefs.get().style);
        } finally {
            if (s === me) { Object.assign(me, { phase: 'idle', controller: null }); draw(); }
        }
    }

    function reanalyze() {
        const request = s.request.trim();
        analyze({ fixedParagraph: request ? s.state?.paragraph : undefined, request: request || undefined });
    }

    async function generate() {
        const me = s;
        if (!me || busy() || !me.state) return;
        const assembled = Compose.build(me.state, me.model);
        if (!assembled.base && !assembled.chars.length) { Engine.report(new Error('프롬프트가 비어 있어.')); return; }
        if (Engine.running.has(me.messageKey)) { Kit.toast({ title: '이 답변은 이미 생성 중이야' }); return; }
        Disk.warm();
        me.controller = Engine.begin(me.messageKey);
        Object.assign(me, { phase: 'generating', phaseText: 'NovelAI가 그리는 중', error: '' });
        draw();
        try {
            const { rec } = await Engine.generate({
                roomId: me.roomId, messageKey: me.messageKey, markdown: me.markdown,
                state: me.state, model: me.model, gen: { ...me.gen }, signal: me.controller.signal
            });
            drafts.delete(me.messageKey);
            if (s !== me) { Kit.toast({ title: '삽화 완성', kind: 'ok', body: me.state.title || '채팅에 넣었어.' }); return; }
            Object.assign(me, { rec, view: rec.index, dirty: false, restored: false });
        } catch (err) {
            if (s === me && err?.name !== 'AbortError') me.error = err.message;
            Engine.report(err, '생성 실패');
        } finally {
            Engine.running.delete(me.messageKey);
            if (s === me) { Object.assign(me, { phase: 'idle', controller: null }); draw(); }
        }
    }

    // ── 그리기 ─────────────────────────────────────────
    function draw() {
        if (!s) return;
        const st = s.state;
        s.win.title(st?.title || '삽화 스튜디오', s.paragraphs.length ? `문단 ${(st?.paragraph ?? 0) + 1} 뒤에 넣음 · ${Models.get(s.model).label}` : '');
        const keepScroll = s.win.body.querySelector('.panel-scroll')?.scrollTop || 0;
        s.win.body.innerHTML = `${stageHtml()}<div class="panel">${st ? `<div class="panel-scroll scroll">${panelHtml()}</div>${footHtml()}` : '<div class="panel-scroll"></div>'}</div>`;
        const scroller = s.win.body.querySelector('.panel-scroll');
        if (scroller) scroller.scrollTop = keepScroll;
        loadImages();
        s.win.body.querySelectorAll('textarea').forEach(grow);
        update();
    }

    function grow(ta) {
        ta.style.height = 'auto';
        ta.style.height = `${Math.min(260, ta.scrollHeight + 2)}px`;
    }

    async function loadImages() {
        for (const img of s.win.body.querySelectorAll('img[data-img]')) {
            const url = await Engine.imageUrl(img.dataset.img);
            if (url) img.src = url;
        }
    }

    function stageHtml() {
        const shots = s.rec?.history || [];
        const shot = shots[s.view];
        const overlay = busy() ? `<div class="busy"><div class="busy-card">${Kit.spinner()}<b>${esc(s.phaseText)}</b><button class="button" data-do="cancel">취소</button></div></div>` : '';
        const picture = shot
            ? `<img data-img="${esc(shot.imageId)}" alt="">`
            : `<div class="empty-state">${icon.photo}<b>${s.state ? '아직 그림이 없어' : '장면을 읽는 중'}</b><span>${s.state ? '칸별 프롬프트를 확인하고 생성을 눌러줘.' : ''}</span></div>`;
        const strip = shots.length ? `
          <div class="strip scroll">
            ${shots.map((x, i) => `<button class="thumb${i === s.view ? ' is-on' : ''}" data-thumb="${i}" title="${i + 1}번째 · seed ${x.seed}"><img data-img="${esc(x.imageId)}" alt="">${i === s.rec.index ? `<span class="pin" title="채팅에 보이는 그림">${icon.pin}</span>` : ''}</button>`).join('')}
            <div class="strip-tools">
              <button class="iconbutton" data-do="show-in-chat" title="이 그림을 채팅에 표시"${s.view === s.rec.index ? ' disabled' : ''}>${icon.check}</button>
              <button class="iconbutton" data-do="load-prompt" title="이 그림의 프롬프트 불러오기">${icon.stack}</button>
              <button class="iconbutton" data-do="reuse-seed" title="이 그림의 시드 쓰기">${icon.again}</button>
              <button class="iconbutton" data-do="delete-view" title="이 그림 삭제">${icon.bin}</button>
            </div>
          </div>` : '';
        return `<div class="stage"><div class="canvas">${picture}${overlay}</div>${strip}</div>`;
    }

    const sub = (label, note = '') => `<span class="sublabel">${label}${note ? ` <span class="dim">${note}</span>` : ''}</span>`;
    const area = (bind, value, { mono = true, short = false, placeholder = '' } = {}) =>
        `<textarea class="textarea${mono ? ' is-mono' : ''}${short ? ' is-short' : ''}" data-bind="${bind}" spellcheck="false" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`;

    function panelHtml() {
        const st = s.state;
        const m = Models.get(s.model);
        const paraChoices = s.paragraphs.map(p => [p.index, `문단 ${p.index + 1} · ${p.text.slice(0, 34)}${p.text.length > 34 ? '…' : ''}`]);
        const ucChoices = [[2, 'UC 프리셋 없음'], ...Object.keys(Nai.ucTable(s.model)).map(k => [k, `${Nai.UC_NAMES[k]} UC`])];
        return `
        <div class="caption">장면</div>
        <div class="card">
          <div class="cell"><span class="cell-label"><b>넣을 위치</b></span><select class="dropdown" data-para style="max-width:240px">${Kit.options(paraChoices, st.paragraph)}</select></div>
          ${st.moment ? `<div class="cell"><span class="cell-label dim">${esc(st.moment)}</span></div>` : ''}
          <div class="cell">
            <input class="input" data-request placeholder="고쳐 달라고 하기 · 예: 더 멀리서, 창가 쪽 순간으로" value="${esc(s.request)}">
            <button class="button" data-do="reanalyze">${icon.magic}다시 분석</button>
          </div>
        </div>

        <div class="caption"><span>베이스 프롬프트</span><span class="layer-hint">${icon.stack}base_caption · 그림 전체</span><span class="fill"></span><span class="tag" data-tok="base"></span></div>
        <div class="card">
          <div class="block">
            <div class="block-head"><span class="swatch k-style"></span><span class="block-name">스타일</span><span class="dim small">작가 · 화풍 · 퀄리티 — 직접 고정</span>
              <span class="fill"></span>
              <button class="button is-ghost" data-do="preset">프리셋</button>
              <button class="button is-ghost" data-do="save-style" title="모든 장면에 쓰는 기본 스타일로 저장">기본값으로 저장</button>
            </div>
            ${area('style.pos', st.style.pos, { placeholder: 'artist:이름, 화풍 태그…  (캐릭터 칸에 넣은 작가 태그도 여기로 올라와)' })}
          </div>
          <div class="block">
            <div class="block-head"><span class="swatch k-scene"></span><span class="block-name">장면</span><span class="dim small">인원수 · 구도 · 배경 · 조명 — AI</span></div>
            <div class="line"><span class="sublabel" style="width:44px">인원수</span><input class="input is-mono" data-bind="scene.count" placeholder="자동: ${esc(Compose.autoCount(st, s.model) || '없음')}" value="${esc(st.scene.count)}"></div>
            ${area('scene.tags', st.scene.tags, { placeholder: 'cowboy shot, indoors, bedroom, night, lamplight…' })}
            ${v5() ? `${sub('장면 문장', 'V5 자연어')}${area('scene.caption', st.scene.caption, { mono: false, short: true, placeholder: 'Soft light falls from the window on the left…' })}` : ''}
          </div>
        </div>

        <div class="caption"><span>캐릭터 프롬프트</span><span class="layer-hint">${icon.person}char_captions · 인물마다</span><span class="fill"></span><span class="tag" data-tok="chars"></span></div>
        <div class="card">
          ${st.chars.length ? st.chars.map(charHtml).join('') : '<div class="cell"><span class="cell-label dim">이 장면에 인물 칸이 없어. 배경만 그리거나 아래에서 추가해.</span></div>'}
          <div class="cell"><button class="button is-ghost" data-do="add-char">${icon.add}인물 추가</button><span class="fill"></span><span class="dim small">${m.label} 최대 ${m.maxChars}명</span></div>
        </div>

        <details class="more"${s.showMore ? ' open' : ''}><summary class="caption">${icon.chevron}<span>네거티브 · UC</span><span class="dim" style="font-weight:400">필요할 때만</span></summary>
          <div class="card"><div class="block">
            <div class="line"><span class="sublabel fill">기본 네거티브 <span class="dim">스타일과 같이 저장</span></span>
              <select class="dropdown" data-uc style="width:auto">${Kit.options(ucChoices, Nai.ucPick(s.model, s.gen.ucPreset))}</select></div>
            ${area('style.neg', st.style.neg, { short: true, placeholder: 'lowres, bad anatomy…' })}
            ${sub('이 장면만')}
            ${area('neg', st.neg, { short: true })}
          </div></div>
        </details>

        <div class="hints" data-hints></div>
        <details class="payload"><summary>${icon.chevron}실제로 보내는 내용</summary><pre data-payload></pre></details>`;
    }

    function charHtml(c, i) {
        const off = c.enabled === false;
        const saved = c.source === 'saved';
        return `
          <div class="block${off ? ' is-off' : ''}" data-slot="${i}">
            <div class="block-head">
              <span class="swatch ${swatch(i)}"></span>
              <span class="block-name">${esc(c.name || `인물 ${i + 1}`)}</span>
              <span class="tag ${saved ? 'is-blue' : 'is-orange'}">${saved ? '등록' : '엑스트라'}</span>
              <span class="tag tokens" data-tok="char${i}"></span>
              <span class="fill"></span>
              ${s.gen.useCoords ? Kit.seg(`pos${i}`, [['left', '좌'], ['center', '중'], ['right', '우']], c.position || '', 'is-small') : ''}
              ${saved
                ? `<button class="iconbutton is-small" data-do="reload-look" data-i="${i}" title="저장된 외형으로 되돌리기">${icon.again}</button>`
                : `<button class="button is-ghost" data-do="adopt" data-i="${i}" title="다음 장면부터 같은 외형으로 그리게 캐릭터로 저장">${icon.add}등록</button>`}
              <button class="iconbutton is-small" data-do="remove-char" data-i="${i}" title="이 칸 빼기">${icon.close}</button>
              ${Kit.toggle(`char${i}`, !off)}
            </div>
            ${sub('외형 · 의상')}
            ${area(`chars.${i}.look`, c.look, { short: true, placeholder: 'girl, black hair, school uniform…' })}
            ${sub('행동 · 표정 · 자세', 'AI')}
            ${area(`chars.${i}.action`, c.action, { short: true, placeholder: 'sitting, looking at viewer…' })}
            ${v5() ? `${sub('인물 문장', 'V5')}${area(`chars.${i}.caption`, c.caption, { mono: false, short: true })}` : ''}
            ${s.showMore || c.uc ? `${sub('UC')}<input class="input is-mono" data-bind="chars.${i}.uc" spellcheck="false" value="${esc(c.uc)}">` : ''}
          </div>`;
    }

    function footHtml() {
        const mac = /Mac/.test(navigator.platform);
        return `
          <div class="panel-foot">
            <div class="gauge" data-gauge></div>
            <div class="line">
              ${Kit.seg('size', Object.entries(Nai.SIZES).map(([k, v]) => [k, v.label]), s.gen.size)}
              <input class="input is-num is-mono" data-seed placeholder="랜덤" title="시드 (비우면 랜덤)" value="${esc(s.gen.seed)}">
              <span class="fill"></span>
              ${busy()
                ? '<button class="button is-large" data-do="cancel">취소</button>'
                : `<button class="button is-primary is-large" data-do="generate">${icon.art}생성<span class="keys">${mac ? '⌘↵' : 'Ctrl+↵'}</span></button>`}
            </div>
          </div>`;
    }

    // 글자를 칠 때마다 전체를 다시 그리지 않고, 계산해서 나오는 부분만 바꾼다
    function update() {
        if (!s?.state) return;
        const out = Compose.build(s.state, s.model);
        const box = s.win.body;
        const b = out.budget;
        const put = (sel, text) => { const el = box.querySelector(sel); if (el) el.textContent = text; };
        put('[data-tok="base"]', `약 ${b.base} 토큰`);
        put('[data-tok="chars"]', `약 ${b.chars} 토큰`);
        s.state.chars.forEach((c, i) => {
            const sent = out.chars.find(x => x.id === (c.id || `c${i}`));
            put(`[data-tok="char${i}"]`, sent ? String(sent.tokens) : '—');
        });
        const count = box.querySelector('[data-bind="scene.count"]');
        if (count && !s.state.scene.count) count.placeholder = `자동: ${Compose.autoCount(s.state, s.model) || '없음'}`;

        const gauge = box.querySelector('[data-gauge]');
        if (gauge) {
            const parts = [['k-style', '스타일', b.parts.style], ['k-scene', '장면', b.parts.scene]];
            if (b.shared) {
                for (const c of out.chars) {
                    const at = s.state.chars.findIndex((x, j) => (x.id || `c${j}`) === c.id);
                    parts.push([swatch(at >= 0 ? at : 0), c.name, c.tokens]);
                }
            }
            gauge.className = `gauge${b.over ? ' is-over' : ''}`;
            gauge.innerHTML = `
              <div class="gauge-bar">${parts.map(([k, , n]) => `<i class="${k}" style="width:${Math.min(100, (n / b.limit) * 100)}%"></i>`).join('')}</div>
              <div class="gauge-legend">${parts.map(([k, name, n]) => `<span class="${k}">${esc(name)} ${n}</span>`).join('')}
                <span class="gauge-total">${b.shared ? '합산' : '베이스'} 약 ${b.shared ? b.used : b.base} / ${b.limit}</span></div>
              ${!b.shared && b.chars ? `<div class="gauge-legend"><span class="dim">V5는 캐릭터 칸(약 ${b.chars})이 베이스 예산과 따로야.</span></div>` : ''}`;
        }

        const hints = box.querySelector('[data-hints]');
        if (hints) {
            const list = [...out.notes];
            if (s.error) list.unshift({ level: 'error', text: s.error });
            if (s.restored) list.unshift({ level: 'info', text: '창을 닫기 전에 고치던 내용을 불러왔어.', act: ['discard-draft', '버리고 처음부터'] });
            hints.innerHTML = list.map(n => `<div class="hint is-${n.level}">${n.level === 'info' ? icon.info : icon.warn}<span class="fill">${esc(n.text)}</span>${n.act ? `<button class="button" data-do="${n.act[0]}">${esc(n.act[1])}</button>` : ''}</div>`).join('');
        }

        const pre = box.querySelector('[data-payload]');
        if (pre) {
            const quality = v5() ? Nai.V5_QUALITY[s.gen.qualityV5] : s.gen.qualityV45 !== false ? '(서버가 퀄리티 태그 추가)' : '';
            pre.innerHTML = [
                `<span class="key">base_caption</span>\n${esc(out.base)}${quality ? `\n<span class="dim">+ ${esc(quality)}</span>` : ''}`,
                ...out.chars.map((c, i) => `<span class="key">char_captions[${i}] · ${esc(c.name)}</span> <span class="dim">(${c.center.x}, ${c.center.y})</span>\n${esc(c.prompt)}${c.uc ? `\n<span class="dim">UC: ${esc(c.uc)}</span>` : ''}`),
                `<span class="key">negative</span>\n${esc(Nai.negative(out.baseNeg, s.model, s.gen.ucPreset))}`
            ].join('\n\n');
        }
    }

    // ── 입력 ───────────────────────────────────────────
    function assign(target, path, value) {
        const keys = path.split('.');
        const last = keys.pop();
        keys.reduce((o, k) => o[k], target)[last] = value;
    }

    function wire(el) {
        el.addEventListener('input', ev => {
            if (!s) return;
            const t = ev.target;
            if (t.dataset.bind) {
                assign(s.state, t.dataset.bind, t.value);
                s.dirty = true;
                if (t.dataset.bind.startsWith('style.')) s.styleEdited = true;
                if (t.tagName === 'TEXTAREA') grow(t);
                update();
            } else if ('request' in t.dataset) {
                s.request = t.value;
            } else if ('seed' in t.dataset) {
                s.gen.seed = t.value.replace(/\D/g, '');
            }
        });
        el.addEventListener('change', ev => {
            if (!s) return;
            const t = ev.target;
            if ('model' in t.dataset) {
                s.model = t.value;
                Prefs.edit(d => { d.model = t.value; });
                draw();
            } else if ('para' in t.dataset) {
                s.state.paragraph = Number(t.value);
                draw();
            } else if ('uc' in t.dataset) {
                s.gen.ucPreset = Number(t.value);
                Prefs.edit(d => { d.gen.ucPreset = Number(t.value); });
                update();
            } else if (t.dataset.sw?.startsWith('char')) {
                s.state.chars[Number(t.dataset.sw.slice(4))].enabled = t.checked;
                draw();
            }
        });
        el.addEventListener('toggle', ev => {
            if (!s || !ev.target.matches?.('details.more')) return;
            if (s.showMore !== ev.target.open) { s.showMore = ev.target.open; draw(); }
        }, true);
        el.addEventListener('keydown', ev => {
            if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') { ev.preventDefault(); generate(); }
            else if (ev.key === 'Enter' && ev.target.dataset && 'request' in ev.target.dataset) { ev.preventDefault(); reanalyze(); }
        });
        el.addEventListener('click', ev => {
            if (!s) return;
            const seg = ev.target.closest('.segmented button');
            if (seg) { pickSegment(seg.parentElement.dataset.seg, seg.dataset.v); return; }
            const thumb = ev.target.closest('[data-thumb]');
            if (thumb) { s.view = Number(thumb.dataset.thumb); draw(); return; }
            const big = ev.target.closest('.canvas img');
            if (big) { Kit.lightbox(big.src); return; }
            const btn = ev.target.closest('[data-do]');
            if (btn && !btn.closest('.traffic')) actions[btn.dataset.do]?.(btn);
        });
    }

    function pickSegment(name, v) {
        if (name === 'size') {
            s.gen.size = v;
            Prefs.edit(d => { d.gen.size = v; });
        } else if (name.startsWith('pos')) {
            const c = s.state.chars[Number(name.slice(3))];
            c.position = c.position === v ? null : v;
        }
        draw();
    }

    const shotInView = () => s.rec?.history?.[s.view];

    const actions = {
        settings: () => Settings.open(),
        gallery: () => Gallery.open(),
        cancel: () => s.controller?.abort(),
        generate: () => generate(),
        reanalyze: () => reanalyze(),
        'save-style': () => {
            const { pos, neg } = s.state.style;
            Prefs.edit(d => { d.style = { pos, neg }; });
            s.styleEdited = false;
            Kit.toast({ title: '기본 스타일로 저장했어', kind: 'ok', body: '앞으로 모든 장면의 베이스 맨 앞에 들어가.' });
        },
        preset: btn => {
            const p = Prefs.get();
            const saved = p.presets.length
                ? p.presets.map(x => ({ label: x.name, sub: x.pos.slice(0, 60), value: x }))
                : [{ label: '저장된 프리셋 없음', sub: '설정 → 스타일에서 만들 수 있어', value: null }];
            Kit.menu(btn, [{ header: '스타일 프리셋' }, ...saved, { sep: true }, { label: '설정의 기본 스타일 불러오기', value: 'default' }, { label: '지금 스타일을 새 프리셋으로 저장…', value: 'new' }], async ({ value }) => {
                if (!value) return;
                if (value === 'new') {
                    const name = await Kit.ask(btn, { title: '새 스타일 프리셋', placeholder: '이름 · 예: 수채화 kawacy' });
                    if (!name) return;
                    const { pos, neg } = s.state.style;
                    Prefs.edit(d => { d.presets.push({ id: Prefs.newId('ps'), name: name.trim().slice(0, 40), pos, neg }); });
                    Kit.toast({ title: '프리셋 저장', kind: 'ok', body: name });
                    return;
                }
                if (value === 'default') {
                    s.state.style = { ...Prefs.get().style };
                    s.styleEdited = false;
                } else {
                    s.state.style = { pos: value.pos, neg: value.neg ?? s.state.style.neg };
                    s.styleEdited = true;
                }
                draw();
            });
        },
        'add-char': btn => {
            const p = Prefs.get();
            const here = new Set(s.state.chars.map(c => c.id));
            const inRoom = new Set(p.rooms?.[s.roomId]?.chars || []);
            const left = p.characters.filter(c => !here.has(c.id));
            const items = left.length ? [{ header: '등록 인물' }, ...left.map(c => ({ label: c.name, sub: inRoom.has(c.id) ? '이 방에서 사용 중' : '다른 방 인물', value: c }))] : [];
            Kit.menu(btn, [...items, { sep: true }, { label: '빈 엑스트라 칸', value: 'extra' }], ({ value }) => {
                const base = { aliases: [], action: '', caption: '', position: null, enabled: true };
                if (value === 'extra') s.state.chars.push({ ...base, id: `extra${Date.now()}`, source: 'extra', name: `엑스트라 ${s.state.chars.length + 1}`, look: '', uc: '' });
                else if (value?.id) s.state.chars.push({ ...base, id: value.id, source: 'saved', name: value.name, aliases: value.aliases, look: Tags.join([value.look, value.outfit]), uc: value.uc });
                draw();
            });
        },
        'discard-draft': () => {
            drafts.delete(s.messageKey);
            Object.assign(s, { restored: false, dirty: false });
            const shown = s.rec?.history?.[s.rec.index];
            if (shown) { s.state = Engine.copy(shown.state); draw(); } else { s.state = null; draw(); analyze(); }
        },
        adopt: btn => {
            const c = s.state.chars[Number(btn.dataset.i)];
            if (!c.look.trim()) { Kit.toast({ title: '외형을 먼저 채워줘', body: '외형·의상 칸이 비어 있으면 등록해도 쓸 게 없어.' }); return; }
            c.id = Engine.adopt(c);
            c.source = 'saved';
            draw();
            Kit.toast({ title: `'${c.name}'을(를) 등록했어`, kind: 'ok', body: '이 채팅방에서 켜졌어. 이름과 외형은 설정 → 캐릭터에서 다듬을 수 있어.' });
        },
        'remove-char': btn => { s.state.chars.splice(Number(btn.dataset.i), 1); draw(); },
        'reload-look': btn => {
            const c = s.state.chars[Number(btn.dataset.i)];
            const saved = Prefs.get().characters.find(x => x.id === c.id);
            if (!saved) { Kit.toast({ title: '저장된 인물을 찾지 못했어', kind: 'err' }); return; }
            Object.assign(c, { look: Tags.join([saved.look, saved.outfit]), uc: saved.uc, name: saved.name });
            draw();
        },
        'show-in-chat': async () => {
            s.rec.index = s.view;
            await Vault.saveRecord(s.rec);
            const md = s.markdown?.isConnected ? s.markdown : Site.byKey(s.messageKey);
            if (md) Inline.render(md, s.rec);
            draw();
        },
        'load-prompt': () => {
            const shot = shotInView();
            if (!shot) return;
            s.state = Engine.copy(shot.state);
            s.styleEdited = true;
            draw();
            Kit.toast({ title: '그 그림의 프롬프트를 불러왔어' });
        },
        'reuse-seed': () => {
            const shot = shotInView();
            if (!shot) return;
            s.gen.seed = String(shot.seed);
            draw();
        },
        'delete-view': async btn => {
            if (Kit.confirmTap(btn, '삭제')) await Engine.removeShot(s.roomId, s.messageKey, s.view);
        }
    };

    // ── 바깥에서 바뀐 것 반영 ──────────────────────────
    async function recordChanged(key) {
        if (!s || s.messageKey !== key) return;
        const me = s;
        const rec = (await Engine.records(me.roomId)).get(key) || null;
        if (s !== me) return;
        me.rec = rec;
        me.view = rec ? Math.min(me.view, rec.history.length - 1) : -1;
        draw();
    }

    function prefsChanged() {
        if (!s || busy()) return;
        const p = Prefs.get();
        let changed = false;
        if (p.model !== s.model) { s.model = p.model; changed = true; }
        if (s.state && !s.styleEdited && (p.style.pos !== s.state.style.pos || p.style.neg !== s.state.style.neg)) { s.state.style = { ...p.style }; changed = true; }
        if (p.gen.useCoords !== s.gen.useCoords) { s.gen.useCoords = p.gen.useCoords; changed = true; }
        for (const k of ['steps', 'scaleV5', 'scaleV45', 'rescaleV5', 'rescaleV45', 'sampler', 'noise', 'qualityV45', 'qualityV5', 'ucPreset']) s.gen[k] = p.gen[k];
        if (!changed) return;
        const select = s.win.el.querySelector('[data-model]');
        if (select) select.value = s.model;
        const focused = s.win.el.getRootNode().activeElement;
        if (focused && s.win.el.contains(focused)) update(); else draw();   // 입력 중이면 통째로 다시 그리지 않는다
    }

    return { open, recordChanged, prefsChanged };
})();
