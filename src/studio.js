// ─────────────────────────────────────────────────────────────
// Studio: 장면 하나를 분석 → 칸별로 확인·수정 → 생성
// 화면 구성 자체가 NAI 요청 구조를 따른다:
//   베이스 프롬프트 = 스타일(고정) + 장면(AI)   →  base_caption
//   캐릭터 프롬프트 = 인물마다 한 칸            →  char_captions[]
// ─────────────────────────────────────────────────────────────
const Studio = (() => {
    'use strict';
    const { esc, icons } = UI;
    let S = null; // 현재 세션

    function open(markdown) {
        const roomId = Crack.roomId();
        const messageKey = Crack.messageKey(markdown);
        if (S && S.messageKey === messageKey && UI.windows.has('studio')) {
            const w = UI.windows.get('studio');
            w.restore();
            return;
        }
        if (S) close();
        const s = Store.settings();
        S = {
            roomId, messageKey, markdown,
            paragraphs: Crack.paragraphs(markdown),
            state: null,
            model: s.model,
            gen: { ...s.gen, seed: '' },
            styleTouched: false,
            status: 'idle', statusText: '', error: '',
            controller: null,
            rec: null,
            view: -1,
            request: ''
        };
        S.win = UI.openWindow({ id: 'studio', className: 'studio', title: '삽화 스튜디오', subtitle: '', onClose: () => { if (S?.status === 'analyzing') S.controller?.abort(); S = null; } });
        S.win.setRight(`
            <select class="select" data-model style="width:auto">${UI.options(Object.values(Core.MODELS).map(m => [m.id, `NAI ${m.label}`]), S.model)}</select>
            <button class="icon-btn" data-act="gallery" title="삽화 갤러리">${icons.photo}</button>
            <button class="icon-btn" data-act="settings" title="설정">${icons.gear}</button>`);
        bindChrome();
        load();
    }

    function close() {
        UI.windows.get('studio')?.close();
    }

    async function load() {
        const map = await App.records(S.roomId);
        const sess = S;
        sess.rec = map.get(sess.messageKey) || null;
        if (sess.rec?.history?.length) {
            const h = sess.rec.history[sess.rec.index];
            sess.view = sess.rec.index;
            sess.state = App.clone(h.state);
            sess.gen.size = h.gen?.size || sess.gen.size;
            render();
        } else {
            render();
            analyze();
        }
    }

    // ── 동작 ─────────────────────────────────────────────
    async function analyze(opts = {}) {
        const sess = S;
        if (!sess || busy()) return;
        sess.controller = new AbortController();
        sess.status = 'analyzing';
        sess.statusText = opts.request ? '요청을 반영해 다시 고르는 중' : '어떤 순간을 그릴지 고르는 중';
        sess.error = '';
        render();
        try {
            const prev = sess.state;
            const state = await App.analyze(sess.markdown, opts, sess.controller.signal);
            if (S !== sess) return;
            // 스튜디오에서 손본 스타일은 재분석해도 유지
            if (prev && sess.styleTouched) state.style = prev.style;
            sess.state = state;
            sess.request = '';
        } catch (err) {
            if (S !== sess) return;
            if (err?.name !== 'AbortError') { sess.error = err.message; App.reportError(err, '장면 분석 실패'); }
            if (!sess.state) sess.state = Core.planToState({ insertAfterParagraph: 0 }, Store.roomChars(sess.roomId), Store.settings().style);
        } finally {
            if (S === sess) { sess.status = 'idle'; sess.controller = null; render(); }
        }
    }

    async function generate() {
        const sess = S;
        if (!sess || busy() || !sess.state) return;
        const assembled = Core.assemble(sess.state, sess.model);
        if (!assembled.base && !assembled.chars.length) return App.reportError(new Error('프롬프트가 비어 있어.'));
        if (App.running.has(sess.messageKey)) return UI.toast({ title: '이 답변은 이미 생성 중이야' });
        Folder.prime();
        sess.controller = new AbortController();
        App.running.set(sess.messageKey, { controller: sess.controller });
        sess.status = 'generating';
        sess.statusText = 'NovelAI가 그리는 중';
        sess.error = '';
        render();
        UI.setDockLabel('studio', '그리는 중…');
        try {
            const { rec, seed } = await App.generate({
                roomId: sess.roomId, messageKey: sess.messageKey, markdown: sess.markdown,
                state: sess.state, model: sess.model, gen: { ...sess.gen }, signal: sess.controller.signal
            });
            if (S !== sess) { UI.toast({ title: '삽화 완성', kind: 'ok', body: '채팅에 넣었어.' }); return; }
            sess.rec = rec;
            sess.view = rec.index;
            sess.lastSeed = seed;
            if (!UI.windows.has('studio')) UI.toast({ title: '삽화 완성', kind: 'ok', body: sess.state.title || '채팅에 넣었어.' });
        } catch (err) {
            if (S === sess && err?.name !== 'AbortError') sess.error = err.message;
            App.reportError(err, '생성 실패');
        } finally {
            App.running.delete(sess.messageKey);
            if (S === sess) { sess.status = 'idle'; sess.controller = null; render(); UI.setDockLabel('studio', '삽화 스튜디오'); }
        }
    }

    function busy() { return S && S.status !== 'idle'; }

    // ── 렌더 ─────────────────────────────────────────────
    function render() {
        if (!S) return;
        const st = S.state;
        S.win.setTitle(st?.title || '삽화 스튜디오', S.paragraphs.length ? `문단 ${(st?.paragraph ?? 0) + 1} 뒤에 넣음 · ${Core.model(S.model).label}` : '');
        const scroll = S.win.body.querySelector('.inspector .content')?.scrollTop || 0;
        S.win.body.innerHTML = `${stageHtml()}<div class="inspector">${st ? `<div class="content scroll">${inspectorHtml()}</div>${footerHtml()}` : `<div class="content"></div>`}</div>`;
        const c = S.win.body.querySelector('.inspector .content');
        if (c) c.scrollTop = scroll;
        hydrateImages();
        S.win.body.querySelectorAll('textarea').forEach(autosize);
        refresh();
    }

    function autosize(ta) {
        ta.style.height = 'auto';
        ta.style.height = `${Math.min(260, ta.scrollHeight + 2)}px`;
    }

    function stageHtml() {
        const h = S.rec?.history?.[S.view];
        const busyHtml = busy() ? `<div class="busy"><div class="card">${UI.spinner()}<b>${esc(S.statusText)}</b><button class="btn" data-act="cancel">취소</button></div></div>` : '';
        const canvas = h
            ? `<img data-img="${esc(h.imageId)}" alt="">`
            : `<div class="placeholder">${icons.photo}<b>${S.state ? '아직 그림이 없어' : '장면을 읽는 중'}</b><span>${S.state ? '칸별 프롬프트를 확인하고 생성을 눌러줘.' : ''}</span></div>`;
        const film = S.rec?.history?.length ? `
          <div class="film scroll">
            ${S.rec.history.map((x, i) => `<button class="thumb ${i === S.view ? 'on' : ''}" data-thumb="${i}" title="${i + 1}번째 · seed ${x.seed}"><img data-img="${esc(x.imageId)}" alt="">${i === S.rec.index ? `<span class="pin" title="채팅에 보이는 그림">${icons.pin}</span>` : ''}</button>`).join('')}
            <div class="tools">
              <button class="icon-btn" data-act="show-in-chat" title="이 그림을 채팅에 표시" ${S.view === S.rec.index ? 'disabled' : ''}>${icons.check}</button>
              <button class="icon-btn" data-act="load-prompt" title="이 그림의 프롬프트 불러오기">${icons.layers}</button>
              <button class="icon-btn" data-act="reuse-seed" title="이 그림의 시드 쓰기">${icons.refresh}</button>
              <button class="icon-btn" data-act="delete-view" title="이 그림 삭제">${icons.trash}</button>
            </div>
          </div>` : '';
        return `<div class="stage"><div class="canvas">${canvas}${busyHtml}</div>${film}</div>`;
    }

    const slotColor = i => `c-${i % 6}`;

    function inspectorHtml() {
        const st = S.state;
        const v5 = Core.model(S.model).family === 'v5';
        const paraOpts = S.paragraphs.map(p => [p.index, `문단 ${p.index + 1} · ${p.text.slice(0, 34)}${p.text.length > 34 ? '…' : ''}`]);
        const s = Store.settings();
        const autoCount = Core.assemble({ ...st, scene: { ...st.scene, count: '' } }, S.model).count;

        return `
        <div class="section-title">장면</div>
        <div class="group">
          <div class="item"><span class="label"><b>넣을 위치</b></span><select class="select" data-para style="max-width:240px">${UI.options(paraOpts, st.paragraph)}</select></div>
          ${st.moment ? `<div class="item"><span class="label muted">${esc(st.moment)}</span></div>` : ''}
          <div class="item">
            <input class="field" data-request placeholder="고쳐 달라고 하기 · 예: 더 멀리서, 창가 쪽 순간으로" value="${esc(S.request)}">
            <button class="btn" data-act="reanalyze">${icons.sparkles}다시 분석</button>
          </div>
        </div>

        <div class="section-title"><span>베이스 프롬프트</span><span class="where">${icons.layers}base_caption · 그림 전체</span><span class="grow"></span><span class="badge" data-tok="base"></span></div>
        <div class="group">
          <div class="slot">
            <div class="slot-head"><span class="dot c-style" style="background:var(--c)"></span><span class="name">스타일</span><span class="muted tiny">작가 · 화풍 · 퀄리티 — 직접 고정</span>
              <span class="grow"></span>
              <button class="btn ghost" data-act="preset">프리셋</button>
              <button class="btn ghost" data-act="save-style" title="설정의 기본 스타일로 저장">기본으로</button>
            </div>
            <textarea class="ta mono" data-bind="style.pos" spellcheck="false" placeholder="artist:이름, 화풍 태그…  (캐릭터 칸에 넣은 작가 태그도 여기로 올라와)">${esc(st.style.pos)}</textarea>
          </div>
          <div class="slot">
            <div class="slot-head"><span class="dot c-scene" style="background:var(--c)"></span><span class="name">장면</span><span class="muted tiny">인원수 · 구도 · 배경 · 조명 — AI</span></div>
            <div class="row"><span class="sub" style="width:44px">인원수</span><input class="field mono" data-bind="scene.count" placeholder="자동: ${esc(autoCount || '없음')}" value="${esc(st.scene.count)}"></div>
            <textarea class="ta mono" data-bind="scene.tags" spellcheck="false" placeholder="cowboy shot, indoors, bedroom, night, lamplight…">${esc(st.scene.tags)}</textarea>
            ${v5 ? `<span class="sub">장면 문장 <span class="muted" style="font-weight:400">V5 자연어</span></span><textarea class="ta short" data-bind="scene.caption" spellcheck="false" placeholder="Soft light falls from the window on the left…">${esc(st.scene.caption)}</textarea>` : ''}
          </div>
        </div>

        <div class="section-title"><span>캐릭터 프롬프트</span><span class="where">${icons.person}char_captions · 인물마다</span><span class="grow"></span><span class="badge" data-tok="chars"></span></div>
        <div class="group">
          ${st.chars.length ? st.chars.map((c, i) => charSlotHtml(c, i, v5)).join('') : `<div class="item"><span class="label muted">이 장면에 인물 칸이 없어. 배경만 그리거나 아래에서 추가해.</span></div>`}
          <div class="item"><button class="btn ghost" data-act="add-char">${icons.plus}인물 추가</button><span class="grow"></span><span class="muted tiny">${Core.model(S.model).label} 최대 ${Core.model(S.model).maxChars}명</span></div>
        </div>

        <div class="section-title">네거티브</div>
        <div class="group">
          <div class="slot">
            <div class="row"><span class="sub grow">기본 네거티브 <span class="muted" style="font-weight:400">스타일과 같이 저장</span></span>
              <select class="select" data-uc style="width:auto">${UI.options(ucOptions(), NAI.ucPresetFor(S.model, S.gen.ucPreset))}</select></div>
            <textarea class="ta mono short" data-bind="style.neg" spellcheck="false" placeholder="lowres, bad anatomy…">${esc(st.style.neg)}</textarea>
            <span class="sub">이 장면만</span>
            <textarea class="ta mono short" data-bind="neg" spellcheck="false" placeholder="">${esc(st.neg)}</textarea>
          </div>
        </div>

        <div class="notes" data-notes></div>
        <details class="raw"><summary>${icons.disclose}실제로 보내는 내용</summary><pre data-raw></pre></details>`;
    }

    function ucOptions() {
        const table = NAI.ucTable(S.model);
        return [[2, 'UC 프리셋 없음'], ...Object.keys(table).map(k => [k, `${NAI.UC_LABELS[k]} UC`])];
    }

    function charSlotHtml(c, i, v5) {
        const off = c.enabled === false;
        const coords = !!S.gen.useCoords;
        return `
          <div class="slot ${off ? 'off' : ''}" data-slot="${i}">
            <div class="slot-head">
              <span class="dot ${slotColor(i)}" style="background:var(--c)"></span>
              <span class="name">${esc(c.name || `인물 ${i + 1}`)}</span>
              <span class="badge ${c.source === 'saved' ? 'blue' : 'orange'}">${c.source === 'saved' ? '등록' : '엑스트라'}</span>
              <span class="badge tok" data-tok="char${i}"></span>
              <span class="grow"></span>
              ${coords ? UI.seg(`pos${i}`, [['left', '좌'], ['center', '중'], ['right', '우']], c.position || '', 'sm') : ''}
              ${c.source === 'saved' ? `<button class="icon-btn sm" data-act="reload-look" data-i="${i}" title="저장된 외형으로 되돌리기">${icons.refresh}</button>` : ''}
              <button class="icon-btn sm" data-act="remove-char" data-i="${i}" title="이 칸 빼기">${icons.x}</button>
              ${UI.switchHtml(`char${i}`, !off)}
            </div>
            <span class="sub">외형 · 의상</span>
            <textarea class="ta mono short" data-bind="chars.${i}.look" spellcheck="false" placeholder="girl, black hair, school uniform…">${esc(c.look)}</textarea>
            <span class="sub">행동 · 표정 · 자세 <span class="muted" style="font-weight:400">AI</span></span>
            <textarea class="ta mono short" data-bind="chars.${i}.action" spellcheck="false" placeholder="sitting, looking at viewer…">${esc(c.action)}</textarea>
            ${v5 ? `<span class="sub">인물 문장 <span class="muted" style="font-weight:400">V5</span></span><textarea class="ta short" data-bind="chars.${i}.caption" spellcheck="false">${esc(c.caption)}</textarea>` : ''}
            <span class="sub">UC</span>
            <input class="field mono" data-bind="chars.${i}.uc" spellcheck="false" value="${esc(c.uc)}">
          </div>`;
    }

    function footerHtml() {
        const sizes = Object.entries(NAI.SIZES).map(([k, v]) => [k, v.label]);
        return `
          <div class="footer">
            <div class="meter" data-meter></div>
            <div class="row">
              ${UI.seg('size', sizes, S.gen.size)}
              <input class="field num mono" data-seed placeholder="랜덤" title="시드 (비우면 랜덤)" value="${esc(S.gen.seed)}">
              <span class="grow"></span>
              ${busy() ? `<button class="btn lg" data-act="cancel">취소</button>` : `<button class="btn primary lg" data-act="generate">${icons.brush}생성<span class="kbd">${/Mac/.test(navigator.platform) ? "⌘↵" : "Ctrl+↵"}</span></button>`}
            </div>
          </div>`;
    }

    async function hydrateImages() {
        for (const img of S.win.body.querySelectorAll('img[data-img]')) {
            const url = await App.imageUrl(img.dataset.img);
            if (url) img.src = url;
        }
    }

    // 텍스트 입력 중에는 전체를 다시 그리지 않고 파생 정보만 갱신
    function refresh() {
        if (!S?.state) return;
        const a = Core.assemble(S.state, S.model);
        const body = S.win.body;
        const b = a.budget;
        const tok = body.querySelector('[data-tok="base"]');
        if (tok) tok.textContent = `약 ${b.base} 토큰`;
        const tc = body.querySelector('[data-tok="chars"]');
        if (tc) tc.textContent = `약 ${b.chars} 토큰`;
        S.state.chars.forEach((c, i) => {
            const el = body.querySelector(`[data-tok="char${i}"]`);
            if (!el) return;
            const out = a.chars.find(x => x.id === (c.id || `c${i}`));
            el.textContent = out ? `${out.tokens}` : '—';
        });
        const autoCount = body.querySelector('[data-bind="scene.count"]');
        if (autoCount && !S.state.scene.count) autoCount.placeholder = `자동: ${Core.assemble({ ...S.state, scene: { ...S.state.scene, count: '' } }, S.model).count || '없음'}`;

        // 미터
        const meter = body.querySelector('[data-meter]');
        if (meter) {
            const limit = b.limit;
            const segs = [['c-style', '스타일', b.parts.style], ['c-scene', '장면', b.parts.scene]];
            const charSegs = a.chars.map((c, i) => {
                const idx = S.state.chars.findIndex((x, j) => (x.id || `c${j}`) === c.id);
                return [slotColor(idx >= 0 ? idx : i), c.name, c.tokens];
            });
            const shown = b.shared ? [...segs, ...charSegs] : segs;
            const total = b.shared ? b.used : b.base;
            meter.className = `meter ${b.over ? 'over' : ''}`;
            meter.innerHTML = `
              <div class="bar">${shown.map(([cls, , n]) => `<i class="${cls}" style="background:var(--c);width:${Math.min(100, (n / limit) * 100)}%"></i>`).join('')}</div>
              <div class="legend">${shown.map(([cls, name, n]) => `<span class="${cls}">${esc(name)} ${n}</span>`).join('')}
                <span class="total">${b.shared ? '합산' : '베이스'} 약 ${total} / ${limit}</span></div>
              ${!b.shared && b.chars ? `<div class="legend"><span class="muted">V5는 캐릭터 칸(약 ${b.chars})이 베이스 예산과 따로야.</span></div>` : ''}`;
        }

        // 알림
        const notes = body.querySelector('[data-notes]');
        if (notes) {
            const list = [...a.notes];
            if (S.error) list.unshift({ level: 'error', text: S.error });
            notes.innerHTML = list.map(n => `<div class="note ${n.level}">${n.level === 'info' ? icons.info : icons.warn}<span>${esc(n.text)}</span></div>`).join('');
        }

        // 전송 미리보기
        const raw = body.querySelector('[data-raw]');
        if (raw) {
            const g = { ...S.gen };
            const quality = Core.model(S.model).family === 'v5' ? NAI.V5_QUALITY[g.qualityV5] : (g.qualityV45 !== false ? '(서버가 퀄리티 태그 추가)' : '');
            raw.innerHTML = [
                `<span class="k">base_caption</span>\n${esc(a.base)}${quality ? `\n<span class="muted">+ ${esc(quality)}</span>` : ''}`,
                ...a.chars.map((c, i) => `<span class="k">char_captions[${i}] · ${esc(c.name)}</span> <span class="muted">(${c.center.x}, ${c.center.y})</span>\n${esc(c.prompt)}${c.uc ? `\n<span class="muted">UC: ${esc(c.uc)}</span>` : ''}`),
                `<span class="k">negative</span>\n${esc(NAI.mergeNegative(a.baseNeg, S.model, g.ucPreset))}`
            ].join('\n\n');
        }
    }

    // ── 이벤트 ───────────────────────────────────────────
    function setPath(obj, path, value) {
        const keys = path.split('.');
        let o = obj;
        for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
        o[keys[keys.length - 1]] = value;
    }

    function bindChrome() {
        const el = S.win.el;
        el.addEventListener('input', ev => {
            if (!S) return;
            const t = ev.target;
            if (t.dataset.bind) {
                setPath(S.state, t.dataset.bind, t.value);
                if (t.tagName === 'TEXTAREA') autosize(t);
                if (t.dataset.bind.startsWith('style.')) S.styleTouched = true;
                refresh();
            } else if (t.dataset.request !== undefined) {
                S.request = t.value;
            } else if (t.dataset.seed !== undefined) {
                S.gen.seed = t.value.replace(/[^\d]/g, '');
            }
        });
        el.addEventListener('change', ev => {
            if (!S) return;
            const t = ev.target;
            if (t.dataset.model !== undefined) {
                S.model = t.value;
                Store.update(d => { d.model = t.value; });
                render();
            } else if (t.dataset.para !== undefined) {
                S.state.paragraph = Number(t.value);
                render();
            } else if (t.dataset.uc !== undefined) {
                S.gen.ucPreset = Number(t.value);
                Store.update(d => { d.gen.ucPreset = Number(t.value); });
                refresh();
            } else if (t.dataset.sw?.startsWith('char')) {
                const i = Number(t.dataset.sw.slice(4));
                S.state.chars[i].enabled = t.checked;
                render();
            }
        });
        el.addEventListener('keydown', ev => {
            if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') { ev.preventDefault(); generate(); }
            if (ev.key === 'Enter' && ev.target.dataset?.request !== undefined) { ev.preventDefault(); reanalyze(); }
        });
        el.addEventListener('click', ev => {
            if (!S) return;
            const segBtn = ev.target.closest('.seg button');
            if (segBtn) {
                const name = segBtn.parentElement.dataset.seg;
                const v = segBtn.dataset.v;
                if (name === 'size') { S.gen.size = v; Store.update(d => { d.gen.size = v; }); }
                else if (name.startsWith('pos')) { const i = Number(name.slice(3)); S.state.chars[i].position = S.state.chars[i].position === v ? null : v; }
                render();
                return;
            }
            const thumb = ev.target.closest('[data-thumb]');
            if (thumb) { S.view = Number(thumb.dataset.thumb); render(); return; }
            if (ev.target.closest('.canvas img')) { UI.lightbox(ev.target.closest('.canvas img').src); return; }
            const act = ev.target.closest('[data-act]')?.dataset.act;
            if (!act) return;
            const btn = ev.target.closest('[data-act]');
            actions[act]?.(btn);
        });
    }

    function reanalyze() {
        analyze({ fixedParagraph: S.request ? S.state?.paragraph : undefined, request: S.request.trim() || undefined });
    }

    const actions = {
        settings: () => Settings.open(),
        gallery: () => Gallery.open(),
        cancel: () => S.controller?.abort(),
        generate: () => generate(),
        reanalyze: () => reanalyze(),
        'save-style': async () => {
            const { pos, neg } = S.state.style;
            Store.update(d => { d.style = { pos, neg }; });
            S.styleTouched = false;
            UI.toast({ title: '기본 스타일로 저장했어', kind: 'ok', body: '앞으로 모든 장면의 베이스 맨 앞에 들어가.' });
        },
        preset: btn => {
            const s = Store.settings();
            const items = [
                { header: '스타일 프리셋' },
                ...(s.presets.length ? s.presets.map(p => ({ label: p.name, sub: p.pos.slice(0, 60), value: p })) : [{ label: '저장된 프리셋 없음', sub: '설정 → 스타일에서 만들 수 있어', value: null }]),
                { sep: true },
                { label: '설정의 기본 스타일 불러오기', value: 'default' },
                { label: '지금 스타일을 새 프리셋으로 저장…', value: 'new' }
            ];
            UI.menu(btn, items, it => {
                if (!it.value) return;
                if (it.value === 'default') { S.state.style = { ...Store.settings().style }; S.styleTouched = false; }
                else if (it.value === 'new') {
                    const name = prompt('프리셋 이름', '');
                    if (!name) return;
                    const { pos, neg } = S.state.style;
                    Store.update(d => { d.presets.push({ id: Store.uid('ps'), name: name.trim().slice(0, 40), pos, neg }); });
                    UI.toast({ title: '프리셋 저장', kind: 'ok', body: name });
                    return;
                } else { S.state.style = { pos: it.value.pos, neg: it.value.neg ?? S.state.style.neg }; S.styleTouched = true; }
                render();
            });
        },
        'add-char': btn => {
            const s = Store.settings();
            const present = new Set(S.state.chars.map(c => c.id));
            const roomIds = new Set(s.rooms?.[S.roomId]?.chars || []);
            const avail = s.characters.filter(c => !present.has(c.id));
            const items = [
                ...(avail.length ? [{ header: '등록 인물' }, ...avail.map(c => ({ label: c.name, sub: roomIds.has(c.id) ? '이 방에서 사용 중' : '다른 방 인물', value: c }))] : []),
                { sep: true },
                { label: '빈 엑스트라 칸', value: 'extra' }
            ];
            UI.menu(btn, items, it => {
                if (it.value === 'extra') S.state.chars.push({ id: `extra${Date.now()}`, source: 'extra', name: `엑스트라 ${S.state.chars.length + 1}`, aliases: [], look: '', action: '', caption: '', uc: '', position: null, enabled: true });
                else if (it.value?.id) { const c = it.value; S.state.chars.push({ id: c.id, source: 'saved', name: c.name, aliases: c.aliases, look: Core.joinTags([c.look, c.outfit]), action: '', caption: '', uc: c.uc, position: null, enabled: true }); }
                render();
            });
        },
        'remove-char': btn => { S.state.chars.splice(Number(btn.dataset.i), 1); render(); },
        'reload-look': btn => {
            const c = S.state.chars[Number(btn.dataset.i)];
            const saved = Store.settings().characters.find(x => x.id === c.id);
            if (!saved) return UI.toast({ title: '저장된 인물을 찾지 못했어', kind: 'err' });
            c.look = Core.joinTags([saved.look, saved.outfit]);
            c.uc = saved.uc;
            c.name = saved.name;
            render();
        },
        'show-in-chat': async () => {
            S.rec.index = S.view;
            await Store.putRecord(S.rec);
            const md = S.markdown?.isConnected ? S.markdown : Crack.findMarkdownByKey(S.messageKey);
            if (md) App.renderFigure(md, S.rec);
            render();
        },
        'load-prompt': () => {
            const h = S.rec?.history?.[S.view];
            if (!h) return;
            S.state = App.clone(h.state);
            S.styleTouched = true;
            render();
            UI.toast({ title: '그 그림의 프롬프트를 불러왔어' });
        },
        'reuse-seed': () => {
            const h = S.rec?.history?.[S.view];
            if (!h) return;
            S.gen.seed = String(h.seed);
            render();
        },
        'delete-view': async () => {
            await App.removeHistoryItem(S.roomId, S.messageKey, S.view);
        }
    };

    async function onRecordChanged(key) {
        if (!S || S.messageKey !== key) return;
        S.rec = (await App.records(S.roomId)).get(key) || null;
        S.view = S.rec ? Math.min(S.view, S.rec.history.length - 1) : -1;
        render();
    }

    function onSettingsChanged() {
        if (!S || busy()) return;
        const s = Store.settings();
        let changed = false;
        if (s.model !== S.model) { S.model = s.model; changed = true; }
        if (S.state && !S.styleTouched && (s.style.pos !== S.state.style.pos || s.style.neg !== S.state.style.neg)) { S.state.style = { ...s.style }; changed = true; }
        if (s.gen.useCoords !== S.gen.useCoords) { S.gen.useCoords = s.gen.useCoords; changed = true; }
        ['steps', 'scaleV5', 'scaleV45', 'rescaleV5', 'rescaleV45', 'sampler', 'noise', 'qualityV45', 'qualityV5', 'ucPreset'].forEach(k => { S.gen[k] = s.gen[k]; });
        if (changed) {
            const sel = S.win.el.querySelector('[data-model]');
            if (sel) sel.value = S.model;
            const active = S.win.el.getRootNode().activeElement;
            // 입력 중이면 다시 그리지 않음
            if (!active || !S.win.el.contains(active)) render();
            else refresh();
        }
    }

    return { open, close, onRecordChanged, onSettingsChanged, get session() { return S; } };
})();
