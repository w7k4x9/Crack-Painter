// ─────────────────────────────────────────────────────────────
// App: 생성 흐름, 기록, 채팅 안 삽화·버튼
// ─────────────────────────────────────────────────────────────
const App = (() => {
    'use strict';
    const { esc, icons } = UI;
    const MAX_HISTORY = 20;
    const running = new Map(); // messageKey -> { controller }

    // ── 이미지 URL 캐시 ───────────────────────────────────
    const urls = new Map();
    async function imageUrl(id) {
        if (!id) return '';
        if (urls.has(id)) return urls.get(id);
        const blob = await Store.getImage(id);
        if (!blob) return '';
        const u = URL.createObjectURL(blob);
        urls.set(id, u);
        return u;
    }
    function forgetImage(id) {
        const u = urls.get(id);
        if (u) URL.revokeObjectURL(u);
        urls.delete(id);
    }

    // ── 방 기록 캐시 (IndexedDB 는 탭끼리 공유, 변경은 BroadcastChannel 로 알림) ──
    let cache = { roomId: null, map: new Map(), ready: null };
    function records(roomId = Crack.roomId()) {
        if (cache.roomId !== roomId || !cache.ready) {
            cache = { roomId, map: new Map(), ready: null };
            const c = cache;
            c.ready = Store.roomRecords(roomId).then(list => { list.forEach(r => c.map.set(r.messageKey, r)); return c.map; }).catch(() => c.map);
        }
        return cache.ready;
    }
    Store.on(kind => {
        if (kind === `records:${cache.roomId}`) {
            cache.ready = null;
            records().then(() => scan());
        }
        if (kind === 'settings') Studio.onSettingsChanged?.();
    });

    const clone = v => JSON.parse(JSON.stringify(v ?? null));

    // ── 오류 처리 ─────────────────────────────────────────
    function reportError(err, title = '실패했어') {
        if (err?.name === 'AbortError') {
            UI.toast({ title: '취소했어', kind: 'info' });
            return;
        }
        console.error('[Crack Painter]', err, err?.diag || '');
        const actions = [];
        if (err?.pane) actions.push({ label: '설정 열기', primary: true, onClick: () => Settings.open(err.pane) });
        if (err?.diag || err?.body) actions.push({ label: '자세히', onClick: () => showDetail(title, err) });
        UI.toast({ title, body: err?.message || String(err), kind: 'err', actions, timeout: actions.length ? 0 : 8000 });
    }

    // 오류 자세히: 서버 원문 + 보낸 요청 요약 (키는 넣지 않음)
    function showDetail(title, err) {
        const text = [
            `[${err.service || '오류'}] HTTP ${err.status || '-'}`,
            err.message,
            '',
            '── 서버 응답 원문 ──',
            String(err.body || '(없음)').slice(0, 3000),
            ...(err.diag ? ['', '── 보낸 요청 요약 ──', err.diag] : [])
        ].join('\n');
        const w = UI.openWindow({ id: 'error-detail', className: 'detail', title: '오류 자세히', subtitle: title });
        w.body.innerHTML = `<div class="scroll" style="flex:1;padding:14px 16px;min-height:0"><pre style="margin:0;white-space:pre-wrap;word-break:break-word;font:11.5px/1.55 var(--mono)">${UI.esc(text)}</pre></div>
          <div class="row" style="padding:10px 14px;border-top:.5px solid var(--sep-strong);background:var(--bar)"><span class="muted tiny grow">API 키는 들어 있지 않아.</span><button class="btn primary" data-copy>복사</button></div>`;
        w.body.style.display = 'flex';
        w.body.style.flexDirection = 'column';
        w.body.querySelector('[data-copy]').onclick = async ev => {
            try { await navigator.clipboard.writeText(text); ev.target.textContent = '복사했어'; } catch (_) { ev.target.textContent = '복사 실패'; }
        };
    }

    function confirmToast(title, body, okLabel = '확인', danger = false) {
        return new Promise(resolve => {
            let decided = false;
            const t = UI.toast({
                title, body, kind: danger ? 'err' : 'info',
                actions: [{ label: '취소', onClick: () => { decided = true; resolve(false); } }, { label: okLabel, primary: true, onClick: () => { decided = true; resolve(true); } }],
                onDismiss: () => { if (!decided) resolve(false); }
            });
            return t;
        });
    }

    // ── 분석 ─────────────────────────────────────────────
    // 그릴 인원: 방 설정 > 전역 설정. 1명일 때 그릴 인물(focus)은 방 설정에서 고른다.
    function peopleFor(roomId, s = Store.settings()) {
        const room = s.rooms?.[roomId] || {};
        const people = room.people && room.people !== 'default' ? room.people : s.scene.people;
        const chars = Store.roomChars(roomId, s);
        const focus = chars.find(c => c.id === room.focus) || null;
        return { people: people === 'auto' ? 0 : Number(people) || 0, focus, chars };
    }

    function limitPeople(state, people, focus) {
        if (!people) return state;
        if (focus) {
            const i = state.chars.findIndex(c => c.id === focus.id);
            if (i > 0) state.chars.unshift(...state.chars.splice(i, 1));
        }
        state.chars.forEach((c, i) => { if (i >= people) c.enabled = false; });
        return state;
    }

    function analysisInput(markdown, { fixedParagraph, request } = {}) {
        const s = Store.settings();
        const roomId = Crack.roomId();
        const { people, focus } = peopleFor(roomId, s);
        return {
            people, focus,
            characters: Store.roomChars(roomId, s),
            note: s.rooms?.[roomId]?.note || '',
            context: Crack.contextBefore(markdown, Number(s.ui.contextTurns) || 4),
            paragraphs: Crack.paragraphs(markdown),
            fixedParagraph,
            request
        };
    }

    async function analyze(markdown, opts = {}, signal) {
        const s = Store.settings();
        const input = analysisInput(markdown, opts);
        if (!input.paragraphs.length) throw new Error('이 답변에서 문단을 찾지 못했어.');
        // 분석 AI 없이: 등록 인물만 넣은 빈 장면. 장면 태그는 스튜디오에서 직접 쓴다.
        if (s.analyzer.provider === 'none') {
            const picks = input.focus ? [input.focus] : input.characters;
            const plan = { insertAfterParagraph: input.paragraphs.length - 1, characters: picks.map(c => ({ id: c.id, name: c.name })) };
            return limitPeople(Core.planToState(plan, input.characters, s.style), input.people || 1, input.focus);
        }
        const plan = await LLM.analyze(input, { settings: s, secrets: Store.secrets(), signal });
        const state = limitPeople(Core.sanitizeAi(Core.planToState(plan, input.characters, s.style)), input.people, input.focus);
        state.paragraph = Math.min(state.paragraph, input.paragraphs.length - 1);
        if (Number.isInteger(opts.fixedParagraph)) state.paragraph = opts.fixedParagraph;
        return state;
    }

    // ── 생성 → 저장 → 채팅에 표시 ─────────────────────────
    async function generate({ roomId, messageKey, markdown, state, model, gen, signal }) {
        const sec = Store.secrets();
        const assembled = Core.assemble(state, model);
        if (!assembled.base && !assembled.chars.length) throw new Error('프롬프트가 비어 있어.');
        const { blob, seed } = await NAI.generate({ assembled, gen, apiKey: sec.naiKey, seed: gen.seed, signal });
        const imageId = await Store.putImage(blob);
        Folder.save(blob, { title: state.title, seed }).catch(() => {});
        const rec = (await Store.getRecord(roomId, messageKey)) || { roomId, messageKey, history: [], index: 0 };
        rec.paragraph = state.paragraph ?? rec.paragraph ?? 0;
        rec.title = state.title || rec.title || '';
        rec.history.push({
            imageId, seed, model, gen: clone(gen), state: clone(state),
            sent: { base: assembled.base, negative: NAI.mergeNegative(assembled.baseNeg, model, gen.ucPreset), chars: assembled.chars.map(c => ({ name: c.name, prompt: c.prompt, uc: c.uc })) },
            createdAt: Date.now()
        });
        while (rec.history.length > MAX_HISTORY) {
            const old = rec.history.shift();
            await Store.deleteImage(old.imageId).catch(() => {});
            forgetImage(old.imageId);
        }
        rec.index = rec.history.length - 1;
        await Store.putRecord(rec);
        (await records(roomId)).set(messageKey, rec);
        if (roomId === Crack.roomId()) {
            const md = markdown?.isConnected ? markdown : Crack.findMarkdownByKey(messageKey);
            if (md) await renderFigure(md, rec);
        }
        return { rec, blob, seed, assembled };
    }

    function settingsForGen() {
        const s = Store.settings();
        return { model: s.model, gen: { ...s.gen } };
    }

    // ⚡ 바로 생성: 분석 + 생성을 알림 하나로
    async function quick(markdown) {
        const roomId = Crack.roomId();
        const messageKey = Crack.messageKey(markdown);
        if (running.has(messageKey)) return UI.toast({ title: '이미 만들고 있어', body: '이 답변의 삽화를 생성 중이야.' });
        Folder.prime();
        const controller = new AbortController();
        running.set(messageKey, { controller });
        markButtons(messageKey, true);
        const t = UI.toast({ title: '장면 분석 중', body: '어떤 순간을 그릴지 고르고 있어.', progress: true, actions: [{ label: '취소', onClick: () => controller.abort() }] });
        try {
            const state = await analyze(markdown, {}, controller.signal);
            t.update({ title: '그리는 중', body: state.title || state.moment || 'NovelAI에 요청했어.' });
            const { model, gen } = settingsForGen();
            await generate({ roomId, messageKey, markdown, state, model, gen, signal: controller.signal });
            t.close();
            UI.toast({ title: '삽화 완성', body: state.title || '', kind: 'ok' });
        } catch (err) {
            t.close();
            reportError(err, '삽화를 만들지 못했어');
        } finally {
            running.delete(messageKey);
            markButtons(messageKey, false);
        }
    }

    // ↻ 리롤: 지금 보이는 기록의 프롬프트 그대로, 시드만 새로
    async function reroll(messageKey) {
        const roomId = Crack.roomId();
        if (running.has(messageKey)) return;
        const rec = (await records(roomId)).get(messageKey);
        const h = rec?.history?.[rec.index];
        if (!h) return;
        Folder.prime();
        const controller = new AbortController();
        running.set(messageKey, { controller });
        setFigureBusy(messageKey, true);
        try {
            const gen = { ...h.gen, seed: '' };
            await generate({ roomId, messageKey, markdown: Crack.findMarkdownByKey(messageKey), state: h.state, model: h.model, gen, signal: controller.signal });
        } catch (err) {
            reportError(err, '리롤 실패');
        } finally {
            running.delete(messageKey);
            setFigureBusy(messageKey, false);
        }
    }

    // ── 채팅 안 삽화 ──────────────────────────────────────
    function figureBar(rec) {
        const n = rec.history.length;
        const i = rec.index;
        return `
          <button data-cp="prev" title="이전" ${i <= 0 ? 'disabled' : ''}>${icons.left}</button>
          <span class="cp-count">${i + 1} / ${n}</span>
          <button data-cp="next" title="다음" ${i >= n - 1 ? 'disabled' : ''}>${icons.right}</button>
          <span class="cp-sep"></span>
          <button data-cp="reroll" title="같은 프롬프트로 다시">${icons.refresh}</button>
          <button data-cp="studio" title="스튜디오에서 편집">${icons.edit}</button>
          <button data-cp="save" title="저장">${icons.download}</button>
          <button data-cp="delete" title="이 장 삭제">${icons.trash}</button>`;
    }

    async function renderFigure(markdown, rec) {
        const h = rec.history[rec.index];
        if (!h) { markdown.querySelectorAll(':scope > .cp-figure').forEach(f => f.remove()); return; }
        let fig = markdown.querySelector(':scope > .cp-figure');
        if (!fig) {
            fig = document.createElement('div');
            fig.className = 'cp-figure';
            fig.setAttribute('contenteditable', 'false');
            fig.innerHTML = '<div class="cp-img-wrap"><img alt="" loading="lazy" decoding="async"><div class="cp-bar"></div></div>';
        }
        fig.dataset.key = rec.messageKey;
        const url = await imageUrl(h.imageId);
        const img = fig.querySelector('img');
        if (img.getAttribute('src') !== url) img.src = url;
        img.alt = rec.title || '장면 삽화';
        fig.querySelector('.cp-bar').innerHTML = figureBar(rec);
        Crack.placeFigure(markdown, fig, rec.paragraph);
    }

    function figureOf(messageKey) {
        return Array.from(document.querySelectorAll('.cp-figure')).find(f => f.dataset.key === messageKey) || null;
    }

    function setFigureBusy(messageKey, on) {
        const fig = figureOf(messageKey);
        if (!fig) return;
        fig.querySelector('.cp-busy')?.remove();
        if (on) {
            const b = document.createElement('div');
            b.className = 'cp-busy';
            b.textContent = '다시 그리는 중…';
            fig.querySelector('.cp-img-wrap').appendChild(b);
        }
    }

    async function figureAction(fig, act) {
        const key = fig.dataset.key;
        const roomId = Crack.roomId();
        const map = await records(roomId);
        const rec = map.get(key);
        if (!rec) return;
        const md = fig.closest('.wrtn-markdown');
        if (act === 'prev' || act === 'next') {
            rec.index = Math.max(0, Math.min(rec.history.length - 1, rec.index + (act === 'next' ? 1 : -1)));
            await Store.putRecord(rec);
            if (md) renderFigure(md, rec);
        } else if (act === 'reroll') {
            reroll(key);
        } else if (act === 'studio') {
            if (md) Studio.open(md);
        } else if (act === 'save') {
            const h = rec.history[rec.index];
            const blob = await Store.getImage(h.imageId);
            if (!blob) return;
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `crack-painter_${(rec.title || 'scene').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40)}_${h.seed}.png`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        } else if (act === 'delete') {
            await removeHistoryItem(roomId, key, rec.index);
        }
    }

    async function removeHistoryItem(roomId, key, index) {
        const map = await records(roomId);
        const rec = map.get(key);
        if (!rec) return;
        const ok = await confirmToast('이 삽화를 지울까?', rec.history.length > 1 ? `${rec.history.length}장 중 ${index + 1}번째 장만 지워.` : '이 답변의 마지막 삽화야.', '삭제', true);
        if (!ok) return;
        const [gone] = rec.history.splice(index, 1);
        if (gone) { await Store.deleteImage(gone.imageId).catch(() => {}); forgetImage(gone.imageId); }
        if (!rec.history.length) {
            await Store.deleteRecord(roomId, key);
            map.delete(key);
            figureOf(key)?.remove();
        } else {
            rec.index = Math.min(rec.index, rec.history.length - 1);
            await Store.putRecord(rec);
            const md = Crack.findMarkdownByKey(key);
            if (md) renderFigure(md, rec);
        }
        Studio.onRecordChanged?.(key);
    }

    document.addEventListener('click', ev => {
        const fig = ev.target.closest?.('.cp-figure');
        if (!fig) return;
        const btn = ev.target.closest('[data-cp]');
        if (btn) {
            ev.preventDefault();
            ev.stopPropagation();
            figureAction(fig, btn.dataset.cp).catch(reportError);
            return;
        }
        if (ev.target.tagName === 'IMG') {
            ev.preventDefault();
            ev.stopPropagation();
            if (matchMedia('(hover: none)').matches && !fig.classList.contains('cp-touch')) { fig.classList.add('cp-touch'); return; }
            UI.lightbox(ev.target.src);
        }
    }, true);

    // ── 메시지 버튼 ───────────────────────────────────────
    function makeBtn(kind, title, icon) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `cp-msg-btn cp-${kind}`;
        b.title = title;
        b.setAttribute('aria-label', title);
        b.innerHTML = icon;
        return b;
    }

    function markButtons(messageKey, on) {
        document.querySelectorAll('.cp-msg-btn.cp-quick').forEach(b => {
            if (b.dataset.key === messageKey) b.classList.toggle('cp-running', on);
        });
    }

    document.addEventListener('click', ev => {
        const btn = ev.target.closest?.('.cp-msg-btn');
        if (!btn) return;
        ev.preventDefault();
        ev.stopPropagation();
        const group = btn.closest('[data-message-group-id]');
        const msg = Crack.assistantMessages(group || document).find(m => m.footer.contains(btn));
        if (!msg) return;
        if (btn.classList.contains('cp-quick')) quick(msg.markdown);
        else Studio.open(msg.markdown);
    }, true);

    function enabled() {
        try { return localStorage.getItem('cp_enabled') !== 'off'; } catch (_) { return true; }
    }
    function setEnabled(on) {
        try { localStorage.setItem('cp_enabled', on ? 'on' : 'off'); } catch (_) {}
        document.body.classList.toggle('cp-hidden', !on);
        scan();
    }

    let scanning = false;
    async function scan() {
        if (scanning) return;
        scanning = true;
        try {
            UI.injectPageStyle();
            document.body.classList.toggle('cp-hidden', !enabled());
            injectMenuRow();
            const roomId = Crack.roomId();
            if (!roomId) return;
            const map = await records(roomId);
            for (const { markdown, footer } of Crack.assistantMessages()) {
                const key = Crack.messageKey(markdown);
                if (enabled()) {
                    let slot = footer.children[0];
                    if (!slot) { slot = document.createElement('div'); slot.className = 'flex items-center space-x-3'; footer.prepend(slot); }
                    let studioBtn = slot.querySelector('.cp-studio');
                    if (!studioBtn) {
                        studioBtn = makeBtn('studio', '삽화 스튜디오', icons.brush);
                        const quickBtn = makeBtn('quick', '바로 삽화 생성', icons.bolt);
                        slot.prepend(studioBtn, quickBtn);
                    }
                    slot.querySelectorAll('.cp-msg-btn').forEach(b => { b.dataset.key = key; });
                    slot.querySelector('.cp-quick')?.classList.toggle('cp-running', running.has(key));
                }
                const rec = map.get(key);
                const fig = markdown.querySelector(':scope > .cp-figure');
                if (rec?.history?.length && (!fig || fig.dataset.key !== key)) await renderFigure(markdown, rec);
                else if (!rec && fig) fig.remove();
            }
        } catch (e) {
            console.warn('[Crack Painter] scan', e);
        } finally {
            scanning = false;
        }
    }

    // 오른쪽 메뉴 "상황 이미지 보기" 아래에 "AI 삽화" 행을 복제해 붙인다
    function injectMenuRow() {
        const origin = Crack.situationRow();
        if (!origin || origin.nextElementSibling?.classList?.contains('cp-menu-row')) return;
        document.querySelectorAll('.cp-menu-row').forEach(r => r.remove());
        const row = origin.cloneNode(true);
        row.classList.add('cp-menu-row');
        const label = Array.from(row.querySelectorAll('span')).find(s => s.textContent.trim() === '상황 이미지 보기');
        if (label) label.textContent = 'AI 삽화 (Crack Painter)';
        const svg = row.querySelector('svg');
        if (svg) { const span = document.createElement('span'); span.style.cssText = 'width:24px;height:24px;display:inline-grid;place-items:center'; span.innerHTML = icons.brush; svg.replaceWith(span); }
        const sw = row.querySelector('button[role="switch"]');
        const paint = () => {
            if (!sw) return;
            const on = enabled();
            sw.setAttribute('aria-checked', String(on));
            sw.setAttribute('data-state', on ? 'checked' : 'unchecked');
            const thumb = sw.querySelector('span');
            thumb?.setAttribute('data-state', on ? 'checked' : 'unchecked');
        };
        paint();
        row.addEventListener('click', ev => {
            ev.preventDefault();
            ev.stopPropagation();
            if (ev.target.closest('button[role="switch"]')) { setEnabled(!enabled()); paint(); }
            else Settings.open();
        }, true);
        origin.insertAdjacentElement('afterend', row);
    }

    // ── 시작 ─────────────────────────────────────────────
    let timer = 0;
    function schedule() {
        clearTimeout(timer);
        timer = setTimeout(scan, 180);
    }

    let lastPath = location.pathname;
    function start() {
        UI.injectPageStyle();
        Folder.load();
        new MutationObserver(muts => {
            for (const m of muts) {
                const t = m.target;
                if (t.closest?.(Crack.OWN)) continue;
                if (t.id === 'cp-host') continue;
                schedule();
                break;
            }
            if (location.pathname !== lastPath) {
                lastPath = location.pathname;
                urls.forEach(u => URL.revokeObjectURL(u));
                urls.clear();
                schedule();
            }
        }).observe(document.body, { childList: true, subtree: true });
        schedule();
        setInterval(scan, 4000);

        try {
            GM_registerMenuCommand?.('설정 열기', () => Settings.open());
            GM_registerMenuCommand?.('삽화 보이기/숨기기', () => setEnabled(!enabled()));
        } catch (_) {}
    }

    return { start, scan, analyze, generate, quick, reroll, records, imageUrl, renderFigure, removeHistoryItem, reportError, confirmToast, running, settingsForGen, clone, enabled, setEnabled };
})();
