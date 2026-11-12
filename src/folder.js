// ─────────────────────────────────────────────────────────────
// Folder: 생성한 삽화를 내 컴퓨터 폴더에도 PNG로 저장
// Chrome·Edge·Whale 등 Chromium 브라우저의 File System Access API 사용.
// 지원하지 않는 브라우저(Firefox·Safari)는 "생성할 때마다 다운로드"로 대신한다.
//
// 폴더 권한은 브라우저를 다시 열면 "다시 허용"이 필요할 수 있다. 권한 요청은
// 클릭 직후에만 가능해서, 생성 버튼을 누른 순간 prime()으로 미리 요청한다.
// ─────────────────────────────────────────────────────────────
const Folder = (() => {
    'use strict';
    const supported = typeof window.showDirectoryPicker === 'function';
    let handle = null;
    let loaded = null;

    function load() {
        if (!loaded) loaded = Store.getMeta('folder').then(h => { handle = h || null; return handle; }).catch(() => null);
        return loaded;
    }

    async function pick() {
        if (!supported) throw new Error('이 브라우저는 폴더 지정을 지원하지 않아. Chrome·Edge·Whale에서 쓸 수 있어.');
        const h = await window.showDirectoryPicker({ id: 'crack-painter', mode: 'readwrite', startIn: 'pictures' });
        handle = h;
        loaded = Promise.resolve(h);
        await Store.setMeta('folder', h);
        return h;
    }

    async function clear() {
        handle = null;
        loaded = Promise.resolve(null);
        await Store.setMeta('folder', null);
    }

    async function status() {
        await load();
        if (!handle) return { set: false };
        let permission = 'prompt';
        try { permission = await handle.queryPermission({ mode: 'readwrite' }); } catch (_) {}
        return { set: true, name: handle.name, permission };
    }

    // 클릭 핸들러 안에서 바로 부른다. 권한이 'prompt'면 이때 허용 창이 뜬다.
    function prime(force = false) {
        if (!handle || (!force && !Store.settings().folder?.enabled)) return Promise.resolve(false);
        try {
            return handle.queryPermission({ mode: 'readwrite' }).then(p => p === 'granted' ? true : handle.requestPermission({ mode: 'readwrite' }).then(r => r === 'granted')).catch(() => false);
        } catch (_) {
            return Promise.resolve(false);
        }
    }

    const clean = s => String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'untitled';

    // 채팅방 이름: 상단 헤더 제목(예: "나쁜 버릇") → 문서 제목 → 방 id
    function roomName() {
        const head = document.querySelector('.z-docked button .line-clamp-1, header button .line-clamp-1');
        const h = head?.textContent?.trim();
        if (h) return clean(h);
        const t = document.title.replace(/\s*[|·-]\s*(크랙|crack|wrtn).*$/i, '').trim();
        return clean(t && !/^(크랙|crack)$/i.test(t) ? t : Crack.roomId());
    }

    function fileName({ title, seed }) {
        const d = new Date();
        const p = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}_${clean(title || 'scene')}_${seed}.png`;
    }

    let warned = false;
    async function save(blob, info) {
        const s = Store.settings().folder || {};
        const name = fileName(info);
        if (s.enabled && handle) {
            try {
                if ((await handle.queryPermission({ mode: 'readwrite' })) !== 'granted') throw new Error('폴더 권한이 없어. 설정 → 저장 공간에서 "다시 허용"을 눌러줘.');
                let dir = handle;
                if (s.perRoom !== false) dir = await handle.getDirectoryHandle(roomName(), { create: true });
                const fh = await dir.getFileHandle(name, { create: true });
                const w = await fh.createWritable();
                await w.write(blob);
                await w.close();
                return { ok: true, where: `${handle.name}${s.perRoom !== false ? `/${roomName()}` : ''}/${name}` };
            } catch (e) {
                if (!warned) {
                    warned = true;
                    UI.toast({ title: '폴더에 저장하지 못했어', body: `${e.message} (브라우저 안에는 저장됐어)`, kind: 'err', actions: [{ label: '설정 열기', onClick: () => Settings.open('storage') }] });
                }
                return { ok: false };
            }
        }
        if (s.download) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = name;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 5000);
            return { ok: true, where: `다운로드/${name}` };
        }
        return { ok: false };
    }

    return { supported, load, pick, clear, status, prime, save, roomName };
})();
