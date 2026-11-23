// Gallery — 지금까지 만든 삽화 모아 보기 (이 채팅방 / 전체, 날짜별, 크게 보기).
const Gallery = (() => {
    'use strict';
    const { esc, icon } = Kit;
    let g = null;

    async function open() {
        const existing = Kit.windows.get('gallery');
        if (g && existing) { existing.raise(); return; }
        const win = Kit.window({ id: 'gallery', cls: 'gallery', title: '삽화 갤러리', onClose: () => { g?.watcher?.disconnect(); document.removeEventListener('keydown', onKey, true); g = null; } });
        g = { win, scope: Site.room() ? 'room' : 'all', all: [], items: [], view: -1, watcher: null };
        win.el.addEventListener('click', onClick);
        document.addEventListener('keydown', onKey, true);
        await reload();
    }

    async function reload() {
        const recs = await Vault.everything().catch(() => []);
        if (!g) return;
        const here = Site.room();
        const items = [];
        for (const rec of recs) {
            const roomName = rec.roomName || (rec.roomId === here ? Site.roomTitle() : `채팅방 ${String(rec.roomId).slice(0, 6)}`);
            (rec.history || []).forEach((shot, index) => items.push({
                roomId: rec.roomId, roomName, messageKey: rec.messageKey,
                title: shot.state?.title || rec.title || '',
                index, shot, shown: index === rec.index
            }));
        }
        g.all = items.sort((a, b) => (b.shot.createdAt || 0) - (a.shot.createdAt || 0));
        narrow();
    }

    function narrow() {
        const here = Site.room();
        g.items = g.scope === 'room' ? g.all.filter(x => x.roomId === here) : g.all;
        g.view = -1;
        draw();
    }

    function day(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (d.toDateString() === now.toDateString()) return '오늘';
        if (d.toDateString() === yesterday.toDateString()) return '어제';
        return `${d.getFullYear() !== now.getFullYear() ? `${d.getFullYear()}년 ` : ''}${d.getMonth() + 1}월 ${d.getDate()}일`;
    }

    const clock = ts => { const d = new Date(ts || 0); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

    function draw() {
        g.win.title('삽화 갤러리', `${g.items.length}장`);
        g.win.right(Kit.seg('scope', [['room', '이 채팅방'], ['all', '전체']], g.scope));
        if (g.view >= 0) { drawOne(); return; }
        if (!g.items.length) {
            g.win.body.innerHTML = `<div class="wall-empty">${icon.photo}<b>${g.scope === 'room' ? '이 채팅방에서 만든 삽화가 없어' : '아직 만든 삽화가 없어'}</b><span>답변 아래의 붓이나 번개 버튼으로 만들어 봐.</span></div>`;
            return;
        }
        // 같은 날(전체 보기면 같은 날·같은 방)끼리 묶는다
        const sections = [];
        g.items.forEach((it, i) => {
            const label = `${day(it.shot.createdAt)}${g.scope === 'all' ? ` · ${it.roomName}` : ''}`;
            if (sections.at(-1)?.label !== label) sections.push({ label, cells: [] });
            sections.at(-1).cells.push(`<button class="tile" data-i="${i}" title="${esc(it.title || '장면')} · ${clock(it.shot.createdAt)}"><img data-lazy="${esc(it.shot.imageId)}" alt="">${it.shown ? `<span class="pin" title="채팅에 보이는 그림">${icon.pin}</span>` : ''}</button>`);
        });
        g.win.body.innerHTML = `<div class="wall scroll">${sections.map(sec => `<div class="wall-day">${esc(sec.label)}</div><div class="wall-grid">${sec.cells.join('')}</div>`).join('')}</div>`;
        lazyLoad();
    }

    // 화면에 들어온 썸네일만 불러온다
    function lazyLoad() {
        g.watcher?.disconnect();
        const wall = g.win.body.querySelector('.wall');
        if (!wall) return;
        const watcher = new IntersectionObserver(seen => {
            for (const e of seen) {
                if (!e.isIntersecting) continue;
                watcher.unobserve(e.target);
                Engine.imageUrl(e.target.dataset.lazy).then(u => { if (u) e.target.src = u; });
            }
        }, { root: wall, rootMargin: '300px' });
        wall.querySelectorAll('img[data-lazy]').forEach(img => watcher.observe(img));
        g.watcher = watcher;
    }

    function promptText(sent = {}) {
        return [
            `[베이스]\n${sent.base || ''}`,
            ...(sent.chars || []).map(c => `[${c.name}]\n${c.prompt}${c.uc ? `\nUC: ${c.uc}` : ''}`),
            sent.negative ? `[네거티브]\n${sent.negative}` : ''
        ].filter(Boolean).join('\n\n');
    }

    function drawOne() {
        const it = g.items[g.view];
        if (!it) { g.view = -1; draw(); return; }
        const { shot } = it;
        const here = it.roomId === Site.room();
        const away = here ? '' : ' disabled title="그 채팅방에서 열어야 해"';
        const size = Nai.SIZES[shot.gen?.size] || Nai.SIZES.portrait;
        g.win.title(it.title || '장면', `${g.view + 1} / ${g.items.length}`);
        g.win.body.innerHTML = `
          <div class="look">
            <div class="look-stage">
              <button class="iconbutton look-nav is-prev" data-do="prev"${g.view <= 0 ? ' disabled' : ''} title="이전 (←)">${icon.back}</button>
              <img alt="">
              <button class="iconbutton look-nav is-next" data-do="next"${g.view >= g.items.length - 1 ? ' disabled' : ''} title="다음 (→)">${icon.next}</button>
            </div>
            <div class="look-side scroll">
              <button class="button is-ghost" data-do="back">${icon.back}모든 삽화</button>
              <div class="caption">정보</div>
              <div class="card">
                <div class="cell"><span class="cell-label"><b>${esc(it.title || '제목 없음')}</b><small>${esc(it.roomName)} · ${day(shot.createdAt)} ${clock(shot.createdAt)}</small></span></div>
                <div class="cell"><span class="cell-label dim small">${esc(Models.get(shot.model).label)} · ${size.w}×${size.h} · 시드 ${esc(shot.seed)}</span></div>
              </div>
              <div class="line" style="margin:12px 0 0;flex-wrap:wrap">
                <button class="button" data-do="save">${icon.save}저장</button>
                <button class="button" data-do="goto"${away}>${icon.next}채팅에서 보기</button>
                <button class="button" data-do="studio"${away}>${icon.pen}스튜디오</button>
                <span class="fill"></span>
                <button class="button is-danger" data-do="delete">${icon.bin}</button>
              </div>
              <div class="caption"><span>보낸 프롬프트</span><span class="fill"></span><button class="button is-ghost" data-do="copy">복사</button></div>
              <pre class="look-prompt">${esc(promptText(shot.sent))}</pre>
            </div>
          </div>`;
        Engine.imageUrl(shot.imageId).then(u => { const img = g?.win.body.querySelector('.look-stage img'); if (img && u) img.src = u; });
    }

    function answerOnScreen(it) {
        const md = Site.byKey(it.messageKey);
        if (!md) Kit.toast({ title: '그 답변이 화면에 없어', body: '위로 스크롤해서 그 답변을 불러온 다음 다시 눌러줘.' });
        return md;
    }

    async function onClick(ev) {
        if (!g) return;
        const seg = ev.target.closest('.segmented button');
        if (seg) { g.scope = seg.dataset.v; narrow(); return; }
        const tile = ev.target.closest('.tile');
        if (tile) { g.view = Number(tile.dataset.i); draw(); return; }
        const big = ev.target.closest('.look-stage img');
        if (big) { Kit.lightbox(big.src); return; }
        const btn = ev.target.closest('[data-do]');
        const it = g.items[g.view];
        switch (btn?.dataset.do) {
            case 'back': g.view = -1; draw(); break;
            case 'prev': g.view = Math.max(0, g.view - 1); draw(); break;
            case 'next': g.view = Math.min(g.items.length - 1, g.view + 1); draw(); break;
            case 'save': {
                const blob = it && await Vault.image(it.shot.imageId);
                if (blob) Engine.downloadShot(blob, it.title, it.shot.seed);
                break;
            }
            case 'copy':
                try { await navigator.clipboard.writeText(promptText(it.shot.sent)); Kit.toast({ title: '프롬프트를 복사했어', kind: 'ok' }); } catch (_) { Kit.toast({ title: '복사하지 못했어', kind: 'err' }); }
                break;
            case 'goto': {
                const md = it && answerOnScreen(it);
                if (md) { g.win.close(); md.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
                break;
            }
            case 'studio': {
                const md = it && answerOnScreen(it);
                if (md) { g.win.close(); Studio.open(md); }
                break;
            }
            case 'delete': {
                if (!it || !Kit.confirmTap(btn, '삭제')) return;
                const at = g.view;
                await Engine.removeShot(it.roomId, it.messageKey, it.index);
                await reload();
                if (g) { g.view = Math.min(at, g.items.length - 1); draw(); }
                break;
            }
            default:
        }
    }

    function onKey(ev) {
        if (!g || g.view < 0 || Kit.windows.get('gallery') !== g.win) return;
        if (ev.target?.closest?.('input, textarea')) return;
        if (ev.key === 'ArrowLeft' && g.view > 0) { g.view -= 1; draw(); ev.preventDefault(); }
        else if (ev.key === 'ArrowRight' && g.view < g.items.length - 1) { g.view += 1; draw(); ev.preventDefault(); }
    }

    // 새 삽화가 생기거나 지워지면 열린 목록을 새로 고친다
    Prefs.subscribe(what => { if (g && what.startsWith('records:') && g.view < 0) reload(); });

    return { open };
})();
