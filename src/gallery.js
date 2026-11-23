// ─────────────────────────────────────────────────────────────
// Gallery: 지금까지 만든 삽화 모아 보기 (macOS 사진 앱 느낌)
//   이 채팅방 / 전체 · 썸네일 그리드 · 크게 보기(정보, 프롬프트, 저장, 채팅에서 보기, 삭제)
// ─────────────────────────────────────────────────────────────
const Gallery = (() => {
    'use strict';
    const { esc, icons } = UI;
    let G = null;

    async function open() {
        if (G && UI.windows.has('gallery')) { UI.windows.get('gallery').restore(); return; }
        const win = UI.openWindow({ id: 'gallery', className: 'gallery', title: '삽화 갤러리', onClose: () => { G?.io?.disconnect(); G = null; } });
        G = { win, scope: Crack.roomId() ? 'room' : 'all', items: [], view: -1, io: null };
        bind();
        await load();
    }

    async function load() {
        const all = await Store.allRecords().catch(() => []);
        const roomId = Crack.roomId();
        const items = [];
        for (const rec of all) {
            (rec.history || []).forEach((h, index) => items.push({
                roomId: rec.roomId,
                roomName: rec.roomName || (rec.roomId === roomId ? Folder.roomName() : `채팅방 ${String(rec.roomId).slice(0, 6)}`),
                messageKey: rec.messageKey,
                title: h.state?.title || rec.title || '',
                index, h, shown: index === rec.index
            }));
        }
        items.sort((a, b) => (b.h.createdAt || 0) - (a.h.createdAt || 0));
        G.all = items;
        filter();
    }

    function filter() {
        const roomId = Crack.roomId();
        G.items = G.scope === 'room' ? G.all.filter(x => x.roomId === roomId) : G.all;
        G.view = -1;
        render();
    }

    function dateLabel(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        const now = new Date();
        const same = (a, b) => a.toDateString() === b.toDateString();
        const y = new Date(now); y.setDate(now.getDate() - 1);
        if (same(d, now)) return '오늘';
        if (same(d, y)) return '어제';
        return `${d.getFullYear() !== now.getFullYear() ? `${d.getFullYear()}년 ` : ''}${d.getMonth() + 1}월 ${d.getDate()}일`;
    }

    function time(ts) {
        const d = new Date(ts || 0);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    function render() {
        const { win } = G;
        win.setTitle('삽화 갤러리', `${G.items.length}장`);
        win.setRight(`${UI.seg('scope', [['room', '이 채팅방'], ['all', '전체']], G.scope)}`);
        if (G.view >= 0) return renderViewer();

        // 날짜(전체일 때는 채팅방도)별로 묶기
        const groups = [];
        for (const [i, it] of G.items.entries()) {
            const key = `${dateLabel(it.h.createdAt)}${G.scope === 'all' ? ` · ${it.roomName}` : ''}`;
            if (!groups.length || groups[groups.length - 1].key !== key) groups.push({ key, list: [] });
            groups[groups.length - 1].list.push([i, it]);
        }
        win.body.innerHTML = G.items.length ? `
          <div class="gal scroll">
            ${groups.map(g => `
              <div class="gal-head">${esc(g.key)}</div>
              <div class="gal-grid">${g.list.map(([i, it]) => `
                <button class="gal-cell" data-i="${i}" title="${esc(it.title || '장면')} · ${time(it.h.createdAt)}">
                  <img data-lazy="${esc(it.h.imageId)}" alt="">
                  ${it.shown ? `<span class="pin" title="채팅에 보이는 그림">${icons.pin}</span>` : ''}
                </button>`).join('')}</div>`).join('')}
          </div>`
            : `<div class="gal-empty">${icons.photo}<b>${G.scope === 'room' ? '이 채팅방에서 만든 삽화가 없어' : '아직 만든 삽화가 없어'}</b><span>답변 아래의 붓이나 번개 버튼으로 만들어 봐.</span></div>`;
        lazy();
    }

    // 화면에 보이는 썸네일만 불러온다
    function lazy() {
        G.io?.disconnect();
        const box = G.win.body.querySelector('.gal');
        if (!box) return;
        G.io = new IntersectionObserver(entries => {
            for (const e of entries) {
                if (!e.isIntersecting) continue;
                const img = e.target;
                G.io.unobserve(img);
                App.imageUrl(img.dataset.lazy).then(u => { if (u) img.src = u; });
            }
        }, { root: box, rootMargin: '300px' });
        box.querySelectorAll('img[data-lazy]').forEach(img => G.io.observe(img));
    }

    function renderViewer() {
        const it = G.items[G.view];
        if (!it) { G.view = -1; return render(); }
        const h = it.h;
        const sent = h.sent || {};
        const here = it.roomId === Crack.roomId();
        const size = NAI.SIZES[h.gen?.size] || NAI.SIZES.portrait;
        G.win.setTitle(it.title || '장면', `${G.view + 1} / ${G.items.length}`);
        G.win.body.innerHTML = `
          <div class="viewer">
            <div class="v-stage">
              <button class="icon-btn v-nav" data-act="prev" ${G.view <= 0 ? 'disabled' : ''} title="이전 (←)">${icons.left}</button>
              <img data-img="${esc(h.imageId)}" alt="">
              <button class="icon-btn v-nav" data-act="next" ${G.view >= G.items.length - 1 ? 'disabled' : ''} title="다음 (→)">${icons.right}</button>
            </div>
            <div class="v-info scroll">
              <button class="btn ghost" data-act="back">${icons.left}모든 삽화</button>
              <div class="section-title">정보</div>
              <div class="group">
                <div class="item"><span class="label"><b>${esc(it.title || '제목 없음')}</b><small>${esc(it.roomName)} · ${dateLabel(h.createdAt)} ${time(h.createdAt)}</small></span></div>
                <div class="item"><span class="label muted tiny">${esc(Core.model(h.model).label)} · ${size.w}×${size.h} · 시드 ${esc(h.seed)}</span></div>
              </div>
              <div class="row" style="margin:12px 0 0;flex-wrap:wrap">
                <button class="btn" data-act="save">${icons.download}저장</button>
                <button class="btn" data-act="goto" ${here ? '' : 'disabled title="그 채팅방에서 열어야 해"'}>${icons.right}채팅에서 보기</button>
                <button class="btn" data-act="studio" ${here ? '' : 'disabled title="그 채팅방에서 열어야 해"'}>${icons.edit}스튜디오</button>
                <span class="grow"></span>
                <button class="btn danger" data-act="delete">${icons.trash}</button>
              </div>
              <div class="section-title"><span>보낸 프롬프트</span><span class="grow"></span><button class="btn ghost" data-act="copy">복사</button></div>
              <pre class="v-prompt">${esc(promptText(sent))}</pre>
            </div>
          </div>`;
        App.imageUrl(h.imageId).then(u => { const img = G.win.body.querySelector('.v-stage img'); if (img && u) img.src = u; });
    }

    function promptText(sent) {
        return [
            `[베이스]\n${sent.base || ''}`,
            ...(sent.chars || []).map(c => `[${c.name}]\n${c.prompt}${c.uc ? `\nUC: ${c.uc}` : ''}`),
            sent.negative ? `[네거티브]\n${sent.negative}` : ''
        ].filter(Boolean).join('\n\n');
    }

    function bind() {
        const el = G.win.el;
        el.addEventListener('click', async ev => {
            if (!G) return;
            const segBtn = ev.target.closest('.seg button');
            if (segBtn) { G.scope = segBtn.dataset.v; filter(); return; }
            const cell = ev.target.closest('.gal-cell');
            if (cell) { G.view = Number(cell.dataset.i); render(); return; }
            if (ev.target.closest('.v-stage img')) { UI.lightbox(ev.target.closest('img').src); return; }
            const act = ev.target.closest('[data-act]')?.dataset.act;
            const it = G.items[G.view];
            if (act === 'back') { G.view = -1; render(); }
            else if (act === 'prev') { G.view = Math.max(0, G.view - 1); render(); }
            else if (act === 'next') { G.view = Math.min(G.items.length - 1, G.view + 1); render(); }
            else if (act === 'save' && it) {
                const blob = await Store.getImage(it.h.imageId);
                if (!blob) return;
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `crack-painter_${(it.title || 'scene').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40)}_${it.h.seed}.png`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(a.href), 4000);
            } else if (act === 'copy' && it) {
                try { await navigator.clipboard.writeText(promptText(it.h.sent || {})); UI.toast({ title: '프롬프트를 복사했어', kind: 'ok' }); } catch (_) { UI.toast({ title: '복사하지 못했어', kind: 'err' }); }
            } else if (act === 'goto' && it) {
                const md = Crack.findMarkdownByKey(it.messageKey);
                if (!md) return UI.toast({ title: '그 답변이 화면에 없어', body: '위로 스크롤해서 그 답변을 불러온 다음 다시 눌러줘.' });
                G.win.close();
                md.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (act === 'studio' && it) {
                const md = Crack.findMarkdownByKey(it.messageKey);
                if (!md) return UI.toast({ title: '그 답변이 화면에 없어', body: '위로 스크롤해서 그 답변을 불러온 다음 다시 눌러줘.' });
                G.win.close();
                Studio.open(md);
            } else if (act === 'delete' && it) {
                if (!UI.armed(ev.target.closest('[data-act]'), '삭제')) return;
                await App.removeHistoryItem(it.roomId, it.messageKey, it.index);
                const keep = G.view;
                await load();
                G.view = Math.min(keep, G.items.length - 1);
                render();
            }
        });
        document.addEventListener('keydown', onKey, true);
        const off = () => document.removeEventListener('keydown', onKey, true);
        const close = G.win.close;
        G.win.close = () => { off(); close(); };
    }

    function onKey(ev) {
        if (!G || G.win.minimized || G.view < 0) return;
        if (ev.target?.closest?.('input, textarea')) return;
        if (ev.key === 'ArrowLeft' && G.view > 0) { G.view--; render(); ev.preventDefault(); }
        else if (ev.key === 'ArrowRight' && G.view < G.items.length - 1) { G.view++; render(); ev.preventDefault(); }
    }

    // 기록이 바뀌면(새 삽화, 삭제) 열린 갤러리를 새로 고침
    Store.on(kind => { if (G && kind.startsWith('records:') && G.view < 0) load(); });

    return { open };
})();
