// Disk — 만든 삽화를 내 컴퓨터 폴더에도 PNG로 저장.
// Chromium 계열(Chrome·Edge·Whale)의 폴더 접근 기능을 쓰고, 안 되는 브라우저는 "생성할 때마다 다운로드"로 대신한다.
// 폴더 권한은 브라우저를 다시 열면 다시 물어볼 수 있고, 클릭 직후에만 물을 수 있다.
// 그래서 생성 버튼을 누른 순간 warm()으로 미리 물어 둔다.
const Disk = (() => {
    'use strict';
    const supported = typeof window.showDirectoryPicker === 'function';
    let dir = null;
    let loading = null;
    let warnedOnce = false;

    const load = () => (loading ||= Vault.meta('folder').then(h => (dir = h || null)).catch(() => null));

    async function choose() {
        if (!supported) throw new Error('이 브라우저는 폴더 지정을 지원하지 않아. Chrome·Edge·Whale에서 쓸 수 있어.');
        dir = await window.showDirectoryPicker({ id: 'crack-painter', mode: 'readwrite', startIn: 'pictures' });
        loading = Promise.resolve(dir);
        await Vault.setMeta('folder', dir);
        return dir;
    }

    async function status() {
        await load();
        if (!dir) return { set: false };
        let permission = 'prompt';
        try { permission = await dir.queryPermission({ mode: 'readwrite' }); } catch (_) { /* 모름 */ }
        return { set: true, name: dir.name, permission };
    }

    /** 클릭 핸들러 안에서 바로 부른다. 권한을 아직 안 줬으면 이때 허용 창이 뜬다. */
    function warm(force = false) {
        if (!dir || (!force && !Prefs.get().folder?.enabled)) return Promise.resolve(false);
        try {
            return dir.queryPermission({ mode: 'readwrite' })
                .then(p => (p === 'granted' ? true : dir.requestPermission({ mode: 'readwrite' }).then(r => r === 'granted')))
                .catch(() => false);
        } catch (_) {
            return Promise.resolve(false);
        }
    }

    function fileName(title, seed) {
        const d = new Date();
        const two = n => String(n).padStart(2, '0');
        const stamp = `${d.getFullYear()}${two(d.getMonth() + 1)}${two(d.getDate())}-${two(d.getHours())}${two(d.getMinutes())}${two(d.getSeconds())}`;
        return `${stamp}_${Site.safeName(title || 'scene')}_${seed}.png`;
    }

    function download(blob, name) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }

    async function save(blob, { title, seed }) {
        const opt = Prefs.get().folder || {};
        const name = fileName(title, seed);
        if (opt.enabled && dir) {
            try {
                if ((await dir.queryPermission({ mode: 'readwrite' })) !== 'granted') throw new Error('폴더 권한이 없어. 설정 → 저장 공간에서 "다시 허용"을 눌러줘.');
                const perRoom = opt.perRoom !== false;
                const target = perRoom ? await dir.getDirectoryHandle(Site.roomTitle(), { create: true }) : dir;
                const w = await (await target.getFileHandle(name, { create: true })).createWritable();
                await w.write(blob);
                await w.close();
                return { ok: true, where: [dir.name, perRoom && Site.roomTitle(), name].filter(Boolean).join('/') };
            } catch (e) {
                if (!warnedOnce) {
                    warnedOnce = true;
                    Kit.toast({ title: '폴더에 저장하지 못했어', body: `${e.message} (브라우저 안에는 저장됐어)`, kind: 'err', actions: [{ label: '설정 열기', onClick: () => Settings.open('storage') }] });
                }
                return { ok: false };
            }
        }
        if (opt.download) {
            download(blob, name);
            return { ok: true, where: `다운로드/${name}` };
        }
        return { ok: false };
    }

    return { supported, load, choose, status, warm, save, download };
})();
