// Engine — 분석 → 생성 → 기록 저장 흐름과 오류 안내.
const Engine = (() => {
    'use strict';
    const HISTORY_LIMIT = 20;              // 답변 하나에 남기는 그림 수
    const running = new Map();             // messageKey → { controller }
    const copy = v => JSON.parse(JSON.stringify(v ?? null));

    // ── 그림 주소 (Blob URL) ───────────────────────────
    const urls = new Map();
    async function imageUrl(id) {
        if (!id) return '';
        if (!urls.has(id)) {
            const blob = await Vault.image(id);
            if (!blob) return '';
            urls.set(id, URL.createObjectURL(blob));
        }
        return urls.get(id);
    }
    function forget(id) {
        if (urls.has(id)) URL.revokeObjectURL(urls.get(id));
        urls.delete(id);
    }
    function forgetAll() {
        for (const u of urls.values()) URL.revokeObjectURL(u);
        urls.clear();
    }

    // ── 지금 방의 기록 (다른 탭이 바꾸면 BroadcastChannel로 알림이 온다) ──
    let book = { roomId: null, map: new Map(), loading: null };
    function records(roomId = Site.room()) {
        if (book.roomId !== roomId || !book.loading) {
            const b = { roomId, map: new Map(), loading: null };
            b.loading = Vault.roomList(roomId)
                .then(list => { for (const r of list) b.map.set(r.messageKey, r); return b.map; })
                .catch(() => b.map);
            book = b;
        }
        return book.loading;
    }
    Prefs.subscribe(what => {
        if (what === `records:${book.roomId}`) {
            book.loading = null;
            records().then(() => Inline.scan());
        }
        if (what === 'settings') Studio.prefsChanged();
    });

    // ── 오류 ───────────────────────────────────────────
    function report(err, title = '실패했어') {
        if (err?.name === 'AbortError') { Kit.toast({ title: '취소했어' }); return; }
        console.error('[크랙 페인터]', err, err?.diag || '');
        const actions = [];
        if (err?.pane) actions.push({ label: '설정 열기', primary: true, onClick: () => Settings.open(err.pane) });
        if (err?.diag || err?.body) actions.push({ label: '자세히', onClick: () => details(title, err) });
        Kit.toast({ title, body: err?.message || String(err), kind: 'err', actions, timeout: actions.length ? 0 : 8000 });
    }

    // 서버 원문과 보낸 요청 요약 (키는 넣지 않는다)
    function details(title, err) {
        const text = [
            `[${err.service || '오류'}] HTTP ${err.status || '-'}`,
            err.message,
            '',
            '── 서버 응답 원문 ──',
            String(err.body || '(없음)').slice(0, 3000),
            ...(err.diag ? ['', '── 보낸 요청 요약 ──', err.diag] : [])
        ].join('\n');
        const w = Kit.window({ id: 'error-detail', cls: 'errors', title: '오류 자세히', sub: title });
        w.body.innerHTML = `<div class="errors-text scroll"><pre>${Kit.esc(text)}</pre></div>
          <div class="errors-foot line"><span class="dim small fill">API 키는 들어 있지 않아.</span><button class="button is-primary" data-copy>복사</button></div>`;
        w.body.querySelector('[data-copy]').addEventListener('click', async ev => {
            try { await navigator.clipboard.writeText(text); ev.target.textContent = '복사했어'; } catch (_) { ev.target.textContent = '복사 실패'; }
        });
    }

    // ── 분석 ───────────────────────────────────────────
    /** 그릴 인원: 이 방 설정이 있으면 그것, 없으면 전체 설정. 1명일 때 그릴 인물(focus)은 방 설정. */
    function castFor(roomId, s = Prefs.get()) {
        const r = s.rooms?.[roomId] || {};
        const setting = r.people && r.people !== 'default' ? r.people : s.scene.people;
        const chars = Prefs.cast(roomId, s);
        return { people: setting === 'auto' ? 0 : Number(setting) || 0, focus: chars.find(c => c.id === r.focus) || null, chars };
    }

    function limit(state, people, focus) {
        if (!people) return state;
        if (focus) {
            const at = state.chars.findIndex(c => c.id === focus.id);
            if (at > 0) state.chars.unshift(...state.chars.splice(at, 1));
        }
        state.chars.forEach((c, i) => { if (i >= people) c.enabled = false; });
        return state;
    }

    function inputFor(markdown, { fixedParagraph, request } = {}) {
        const s = Prefs.get();
        const roomId = Site.room();
        const { people, focus, chars } = castFor(roomId, s);
        return {
            people, focus, characters: chars,
            note: s.rooms?.[roomId]?.note || '',
            context: Site.history(markdown, Number(s.ui.contextTurns) || 4),
            paragraphs: Site.paragraphs(markdown),
            fixedParagraph, request,
            camera: s.scene.camera || 'pov'
        };
    }

    async function analyze(markdown, opts = {}, signal) {
        const s = Prefs.get();
        const input = inputFor(markdown, opts);
        if (!input.paragraphs.length) throw new Error('이 답변에서 문단을 찾지 못했어.');
        if (s.analyzer.provider === 'none') {
            // 분석 AI 없이: 등록 인물만 넣은 빈 장면. 장면 태그는 스튜디오에서 직접 쓴다.
            const who = input.focus ? [input.focus] : input.characters;
            const plan = { insertAfterParagraph: input.paragraphs.length - 1, characters: who.map(c => ({ id: c.id, name: c.name })) };
            return limit(Plan.toState(plan, input.characters, s.style), input.people || 1, input.focus);
        }
        const plan = await Analyst.run(input, { prefs: s, keys: Prefs.keys(), signal });
        const state = limit(Plan.clean(Plan.toState(plan, input.characters, s.style)), input.people, input.focus);
        state.paragraph = Number.isInteger(opts.fixedParagraph) ? opts.fixedParagraph : Math.min(state.paragraph, input.paragraphs.length - 1);
        return state;
    }

    // ── 생성 → 저장 → 채팅에 표시 ───────────────────────
    async function generate({ roomId, messageKey, markdown, state, model, gen, signal }) {
        const assembled = Compose.build(state, model);
        if (!assembled.base && !assembled.chars.length) throw new Error('프롬프트가 비어 있어.');
        const { blob, seed } = await Nai.draw({ assembled, gen, apiKey: Prefs.keys().naiKey, seed: gen.seed, signal });
        const imageId = await Vault.saveImage(blob);
        Disk.save(blob, { title: state.title, seed }).catch(() => {});

        const rec = (await Vault.record(roomId, messageKey)) || { roomId, messageKey, history: [], index: 0 };
        rec.paragraph = state.paragraph ?? rec.paragraph ?? 0;
        rec.title = state.title || rec.title || '';
        const here = roomId === Site.room();
        if (here) rec.roomName = Site.roomTitle();
        rec.history.push({
            imageId, seed, model, gen: copy(gen), state: copy(state),
            sent: {
                base: assembled.base,
                negative: Nai.negative(assembled.baseNeg, model, gen.ucPreset),
                chars: assembled.chars.map(({ name, prompt, uc }) => ({ name, prompt, uc }))
            },
            createdAt: Date.now()
        });
        while (rec.history.length > HISTORY_LIMIT) {
            const oldest = rec.history.shift();
            await Vault.dropImage(oldest.imageId).catch(() => {});
            forget(oldest.imageId);
        }
        rec.index = rec.history.length - 1;
        await Vault.saveRecord(rec);
        (await records(roomId)).set(messageKey, rec);
        if (here) {
            const md = markdown?.isConnected ? markdown : Site.byKey(messageKey);
            if (md) await Inline.render(md, rec);
        }
        return { rec, blob, seed, assembled };
    }

    const genPrefs = () => { const s = Prefs.get(); return { model: s.model, gen: { ...s.gen } }; };

    /** 시작 전에 필요한 키가 다 있는지. 없으면 설정의 그 칸을 바로 연다. */
    function ready() {
        const s = Prefs.get();
        const k = Prefs.keys();
        const need = [];
        if (!k.naiKey) need.push('NovelAI 토큰');
        if (s.analyzer.provider === 'gemini' && !k.geminiKey) need.push('Gemini 키');
        if (s.analyzer.provider === 'deepseek' && !k.deepseekKey) need.push('DeepSeek 키');
        if (!need.length) return true;
        Settings.open('api');
        Kit.toast({ title: '시작하려면 키가 필요해', body: `빠진 것: ${need.join(', ')}. 분석 AI 없이 쓰려면 '사용할 AI'를 '안 씀'으로 바꿔.`, timeout: 7000 });
        return false;
    }

    /** 스튜디오의 엑스트라 칸을 등록 인물로 저장하고 이 방에서 켠다 → 새 id */
    function adopt(slot) {
        const id = Prefs.newId('ch');
        const roomId = Site.room();
        Prefs.edit(d => {
            d.characters.push({ id, name: slot.name, aliases: [], look: slot.look || '', outfit: '', uc: slot.uc || '' });
            if (roomId) { const r = Prefs.room(d, roomId); r.chars = [...new Set([...(r.chars || []), id])]; }
        });
        return id;
    }

    function begin(messageKey) {
        const controller = new AbortController();
        running.set(messageKey, { controller });
        return controller;
    }

    /** ⚡ 바로 생성: 분석과 생성을 알림 하나로 */
    async function quick(markdown) {
        if (!ready()) return;
        const roomId = Site.room();
        const messageKey = Site.keyOf(markdown);
        if (running.has(messageKey)) { Kit.toast({ title: '이미 만들고 있어', body: '이 답변의 삽화를 생성 중이야.' }); return; }
        Disk.warm();
        const controller = begin(messageKey);
        Inline.markRunning(messageKey, true);
        const t = Kit.toast({ title: '장면 분석 중', body: '어떤 순간을 그릴지 고르고 있어.', progress: true, actions: [{ label: '취소', onClick: () => controller.abort() }] });
        try {
            const state = await analyze(markdown, {}, controller.signal);
            t.update({ title: '그리는 중', body: state.title || state.moment || 'NovelAI에 요청했어.' });
            await generate({ roomId, messageKey, markdown, state, ...genPrefs(), signal: controller.signal });
            t.close();
            Kit.toast({ title: '삽화 완성', body: state.title || '', kind: 'ok' });
        } catch (err) {
            t.close();
            report(err, '삽화를 만들지 못했어');
        } finally {
            running.delete(messageKey);
            Inline.markRunning(messageKey, false);
        }
    }

    /** ↻ 지금 보이는 그림의 프롬프트 그대로, 시드만 새로 */
    async function reroll(messageKey) {
        if (running.has(messageKey)) return;
        const roomId = Site.room();
        const rec = (await records(roomId)).get(messageKey);
        const shown = rec?.history?.[rec.index];
        if (!shown) return;
        Disk.warm();
        const controller = begin(messageKey);
        Inline.busy(messageKey, true);
        try {
            await generate({ roomId, messageKey, markdown: Site.byKey(messageKey), state: shown.state, model: shown.model, gen: { ...shown.gen, seed: '' }, signal: controller.signal });
        } catch (err) {
            report(err, '리롤 실패');
        } finally {
            running.delete(messageKey);
            Inline.busy(messageKey, false);
        }
    }

    /** 기록에서 그림 한 장 지우기. 마지막 장이면 기록째 지운다. */
    async function removeShot(roomId, messageKey, index) {
        // 다른 방 기록(갤러리 '전체')을 지울 때는 지금 방 캐시를 건드리지 않는다
        const map = roomId === Site.room() ? await records(roomId) : null;
        const rec = map?.get(messageKey) || (await Vault.record(roomId, messageKey));
        if (!rec) return;
        const [gone] = rec.history.splice(index, 1);
        if (gone) { await Vault.dropImage(gone.imageId).catch(() => {}); forget(gone.imageId); }
        if (!rec.history.length) {
            await Vault.dropRecord(roomId, messageKey);
            map?.delete(messageKey);
            Inline.figureOf(messageKey)?.remove();
        } else {
            rec.index = Math.min(rec.index, rec.history.length - 1);
            await Vault.saveRecord(rec);
            const md = Site.byKey(messageKey);
            if (md) Inline.render(md, rec);
        }
        Studio.recordChanged(messageKey);
    }

    function downloadShot(blob, title, seed) {
        Disk.download(blob, `crack-painter_${(title || 'scene').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40)}_${seed}.png`);
    }

    return { running, copy, imageUrl, forgetAll, records, report, analyze, generate, genPrefs, ready, adopt, begin, quick, reroll, removeShot, downloadShot };
})();
