// 흐름: 메시지 준비 → (AI 연출) → 칸별 프롬프트 → NAI → 저장 → 채팅에 붙이기
const App = (() => {
    const { h } = Kit;
    const running = new Map();    // msgId → AbortController
    const viewIndex = new Map();  // msgId → 보고 있는 삽화 번호
    const urls = new Map();       // shotId → objectURL

    // ── 작품 찾기 ──
    function workFor(storyId, names = []) {
        const s = DB.settings();
        const list = DB.works();
        const linked = list.find(w => w.id === s.links[storyId]);
        if (linked) return linked;
        const loose = names.map(U.looseName).filter(Boolean);
        return list.find(w => loose.includes(U.looseName(w.name))) || null;
    }

    function link(storyId, workId) {
        const s = DB.settings();
        const links = { ...s.links };
        if (workId) links[storyId] = workId; else delete links[storyId];
        DB.patchSettings({ links });
    }

    // ── 한 메시지에 대한 준비물 ──
    async function prepare(msgId) {
        const info = await Crack.chat().catch(() => null);
        const storyId = Crack.storyId();
        const names = [info?.story?.name, info?.title].filter(Boolean);
        const work = workFor(storyId, names);
        const s = DB.settings();
        const recent = await Crack.recent(Math.max(10, s.context * 2 + 4)).catch(() => []);
        const at = recent.findIndex(m => m.id === msgId);
        const before = (at >= 0 ? recent.slice(0, at) : recent).slice(-s.context);
        const group = Crack.groups().find(g => g.id === msgId);
        const paragraphs = group ? Crack.paragraphs(group.md).map(el => el.innerText.trim()) : [];
        const target = Crack.plain(at >= 0 ? recent[at].content : Crack.content(msgId)) || paragraphs.join('\n\n');
        return {
            msgId, storyId, room: Crack.chatId(), roomName: info?.title || document.title.replace(/\s*\|.*$/, ''),
            storyName: info?.story?.name || '', work, paragraphs, target,
            context: before.map(m => `${m.role === 'user' ? '[사용자]' : '[AI]'} ${Crack.plain(m.content).slice(0, 1600)}`).join('\n\n')
        };
    }

    // ── AI 연출 ──
    async function direct(ctx, request, signal) {
        const s = DB.settings();
        const work = ctx.work;
        const chars = work.chars;
        const nsfwOk = !!s.nsfw;
        const places = Works.workBackgrounds(work);
        if (!nsfwOk) delete places['섹스'];
        const system = Direct.instruction({ work, chars, nsfwOk, places });
        const user = Direct.userTurn({ context: ctx.context, target: ctx.target, paragraphs: ctx.paragraphs, request });
        const text = await AI.ask({ provider: s.provider, model: s.models[s.provider], keys: DB.keys(), system, user, signal });
        return Direct.normalize(U.pickJson(text), { chars, paragraphCount: ctx.paragraphs.length, nsfwOk });
    }

    function compose(ctx, direction, request = '') {
        const s = DB.settings();
        return Compose.build({ work: ctx.work, direction, modelId: s.nai, request, fallbackBase: s.base, fallbackNeg: s.baseNeg });
    }

    // ── 그리기 ──
    async function draw(ctx, out, direction, { seed = '', signal } = {}) {
        const s = DB.settings();
        const { blob, seed: used } = await NAI.generate({ out, gen: s.gen, token: DB.keys().nai, seed, signal });
        const shot = {
            id: U.uid('s'), room: ctx.room, story: ctx.storyId, msg: ctx.msgId, para: direction.paragraph,
            title: direction.title || ctx.paragraphs[direction.paragraph]?.slice(0, 24) || '', roomName: ctx.roomName, work: ctx.work?.name || '',
            model: out.model.id, seed: used, createdAt: Date.now(), blob,
            sent: { base: out.base, baseNeg: out.baseNeg, chars: out.chars.map(c => ({ name: c.name, prompt: c.prompt, neg: c.neg, center: c.center })), notes: out.notes, tokens: out.tokens },
            direction: U.clone(direction)
        };
        await DB.putShot(shot);
        viewIndex.delete(ctx.msgId);
        if (s.download) download(shot);
        return shot;
    }

    // 버튼 하나로: AI 연출 → 바로 그리기
    async function quick(msgId) {
        if (running.has(msgId)) { running.get(msgId).abort(); return; }
        const s = DB.settings();
        const ctrl = new AbortController();
        running.set(msgId, ctrl);
        paintButtons();
        try {
            const ctx = await prepare(msgId);
            if (!ctx.work) { Kit.toast('이 채팅에 연결된 작품이 없어.', { actions: [{ label: '작품 연결하기', run: () => Workshop.open('works') }], ms: 0 }); return; }
            if (s.provider === 'none') { Studio.open(msgId); return; }
            const direction = await direct(ctx, '', ctrl.signal);
            const out = compose(ctx, direction);
            await draw(ctx, out, direction, { signal: ctrl.signal });
            Kit.toast(`삽화 완성 · ${direction.title || ctx.roomName}`, { kind: 'ok' });
        } catch (e) {
            if (e.name !== 'AbortError') fail(e);
        } finally {
            running.delete(msgId);
            paintButtons();
        }
    }

    function fail(e) {
        console.error('[크랙 페인터]', e);
        Kit.toast(e.message || String(e), { kind: 'err', detail: e.stack ? `${e.message}\n\n${e.stack.split('\n').slice(0, 4).join('\n')}` : '', actions: e.pane === 'settings' ? [{ label: '설정 열기', run: () => Workshop.open('settings') }] : [] });
    }

    // ── 파일 저장 ──
    function fileName(shot) {
        const safe = s => String(s || '').replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 40);
        const d = new Date(shot.createdAt);
        const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
        return `${safe(shot.roomName) || '크랙'}_${stamp}_${safe(shot.title) || '삽화'}_${shot.seed}.png`;
    }
    function download(shot) {
        const a = h('a', { href: url(shot), download: fileName(shot) });
        document.body.append(a);
        a.click();
        a.remove();
    }

    function url(shot) {
        if (!urls.has(shot.id)) urls.set(shot.id, URL.createObjectURL(shot.blob));
        return urls.get(shot.id);
    }
    function forget(id) {
        const u = urls.get(id);
        if (u) { URL.revokeObjectURL(u); urls.delete(id); }
    }

    // ── 채팅 안 삽화 ──
    function shotsFor(all, msgId) {
        const old = `msg_${U.djb2(msgId)}`;
        return all.filter(s => s.msg === msgId || (!s.msg && s.oldKey === old)).sort((a, b) => a.createdAt - b.createdAt);
    }

    async function renderFigures() {
        const room = Crack.chatId();
        if (!room) return;
        const all = await DB.roomShots(room);
        for (const g of Crack.groups()) {
            const list = shotsFor(all, g.id);
            const fig = g.md.querySelector(':scope > .cp2-figure');
            if (!list.length) { fig?.remove(); continue; }
            const idx = U.clamp(viewIndex.has(g.id) ? viewIndex.get(g.id) : list.length - 1, 0, list.length - 1);
            const shot = list[idx];
            if (fig && fig.dataset.shot === shot.id && fig.dataset.count === String(list.length)) continue;
            fig?.remove();
            const paras = Crack.paragraphs(g.md);
            const anchor = paras[Math.min(shot.para ?? paras.length - 1, paras.length - 1)] || g.md.lastElementChild;
            const el = figure(g.id, list, idx);
            if (anchor) anchor.after(el); else g.md.append(el);
        }
    }

    function figure(msgId, list, idx) {
        const shot = list[idx];
        const go = d => { viewIndex.set(msgId, U.clamp(idx + d, 0, list.length - 1)); renderFigures(); };
        const btn = (name, title, fn) => h('button', { class: 'cp2-fbtn', title, 'aria-label': title, html: Icons.get(name, 15), onclick: e => { e.preventDefault(); e.stopPropagation(); fn(e.currentTarget); } });
        const del = btn('trash', '지우기 (한 번 더 누르면 지워져)', b => {
            if (!b.dataset.armed) { b.dataset.armed = '1'; b.classList.add('armed'); setTimeout(() => { delete b.dataset.armed; b.classList.remove('armed'); }, 3000); return; }
            DB.deleteShot(shot.id).then(() => { forget(shot.id); viewIndex.delete(msgId); renderFigures(); });
        });
        return h('figure', { class: 'cp2-figure', 'data-shot': shot.id, 'data-count': String(list.length), contenteditable: 'false' },
            h('img', { src: url(shot), alt: shot.title || '삽화', loading: 'lazy', onclick: () => Gallery.view(shot) }),
            h('div', { class: 'cp2-fbar' },
                list.length > 1 ? btn('left', '이전 삽화', () => go(-1)) : null,
                list.length > 1 ? h('span', { class: 'cp2-fcount' }, `${idx + 1}/${list.length}`) : null,
                list.length > 1 ? btn('right', '다음 삽화', () => go(1)) : null,
                h('span', { class: 'cp2-fgap' }),
                btn('reroll', '같은 연출로 다시 그리기', () => reroll(msgId, shot)),
                btn('pencil', '스튜디오에서 고치기', () => Studio.open(msgId, shot)),
                btn('save', '파일로 저장', () => download(shot)),
                del));
    }

    async function reroll(msgId, shot) {
        if (!shot.direction) { Studio.open(msgId, shot); return; }
        if (running.has(msgId)) return;
        const ctrl = new AbortController();
        running.set(msgId, ctrl);
        paintButtons();
        try {
            const ctx = await prepare(msgId);
            if (!ctx.work) throw new Error('이 채팅에 연결된 작품이 없어.');
            const out = compose(ctx, shot.direction);
            await draw(ctx, out, shot.direction, { signal: ctrl.signal });
        } catch (e) {
            if (e.name !== 'AbortError') fail(e);
        } finally {
            running.delete(msgId);
            paintButtons();
        }
    }

    // ── 메시지 버튼 · 머리줄 버튼 ──
    function paintButtons() {
        for (const b of document.querySelectorAll('.cp2-msgbtn.quick')) {
            const busy = running.has(b.dataset.msg);
            b.classList.toggle('busy', busy);
            b.title = busy ? '그리는 중 · 누르면 멈춤' : '바로 그리기 (AI 연출)';
            b.innerHTML = Icons.get(busy ? 'stop' : 'bolt', 17);
        }
    }

    async function decorate() {
        const slot = Crack.headerSlot();
        if (slot && !slot.querySelector('.cp2-head')) {
            slot.prepend(h('button', { class: 'cp2-head', title: '크랙 페인터 작업실', 'aria-label': '크랙 페인터 작업실', html: Icons.get('picture', 20), onclick: () => Workshop.open() }));
        }
        const groups = await Crack.assistantGroups();
        for (const g of groups) {
            const bar = g.footer?.firstElementChild;
            if (!bar || bar.querySelector('.cp2-msgbtn')) continue;
            bar.append(
                h('button', { class: 'cp2-msgbtn', 'data-msg': g.id, title: '삽화 스튜디오', 'aria-label': '삽화 스튜디오', html: Icons.get('picture', 17), onclick: e => { e.stopPropagation(); Studio.open(g.id); } }),
                h('button', { class: 'cp2-msgbtn quick', 'data-msg': g.id, title: '바로 그리기 (AI 연출)', 'aria-label': '바로 그리기', html: Icons.get('bolt', 17), onclick: e => { e.stopPropagation(); quick(g.id); } }));
        }
        paintButtons();
    }

    return { workFor, link, prepare, direct, compose, draw, quick, reroll, fail, download, fileName, url, forget, renderFigures, decorate, running };
})();
