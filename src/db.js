// 저장: 설정·키·작품은 유저스크립트 저장소(GM), 삽화는 IndexedDB.
const DB = (() => {
    const K = { settings: 'cp2.settings', keys: 'cp2.keys', works: 'cp2.works', migrated: 'cp2.migrated' };

    const DEFAULTS = {
        provider: 'gemini',          // gemini | claude | openai | chatgpt | none
        models: { gemini: 'gemini-flash-latest', claude: 'claude-sonnet-5-5', openai: 'gpt-5-mini' },
        nai: 'nai-diffusion-4-5-full',
        gen: { size: 'landscape', steps: 28, scale: 5, rescale: 0, sampler: 'k_euler_ancestral', noise: 'karras', coords: true },
        context: 6,                  // AI에게 보여줄 앞 대화 수
        nsfw: false,                 // 섹스 장면 허용(작품에서 성인으로 만든 인물만)
        download: false,             // 그릴 때마다 파일로도 받기
        links: {},                   // storyId → workId
        base: '', baseNeg: ''        // 작품에 베이스가 없을 때 쓰는 기본 베이스(nai_config)
    };

    const listeners = new Map();
    function on(name, fn) {
        if (!listeners.has(name)) listeners.set(name, new Set());
        listeners.get(name).add(fn);
        return () => listeners.get(name).delete(fn);
    }
    function emit(name, data) { for (const fn of listeners.get(name) || []) try { fn(data); } catch (e) { console.warn('[크랙 페인터]', e); } }

    function read(key, fallback) {
        try {
            const v = GM_getValue(key, null);
            if (v == null) return U.clone(fallback);
            return typeof v === 'string' ? JSON.parse(v) : v;
        } catch (_) { return U.clone(fallback); }
    }
    function write(key, value) { GM_setValue(key, JSON.stringify(value)); }

    function settings() {
        const s = read(K.settings, {});
        return { ...U.clone(DEFAULTS), ...s, models: { ...DEFAULTS.models, ...(s.models || {}) }, gen: { ...DEFAULTS.gen, ...(s.gen || {}) }, links: { ...(s.links || {}) } };
    }
    function patchSettings(patch) {
        const next = { ...settings(), ...patch };
        write(K.settings, next);
        emit('settings', next);
        return next;
    }

    // 키는 매번 저장소에서 새로 읽는다(탭마다 따로 들고 있으면 서로 덮어씀).
    function keys() { return { nai: '', gemini: '', claude: '', openai: '', ...read(K.keys, {}) }; }
    function setKey(name, value) {
        const k = read(K.keys, {});
        k[name] = String(value || '').trim();
        write(K.keys, k);
        emit('keys');
    }

    function works() { return read(K.works, []); }
    function saveWorks(list) { write(K.works, list); emit('works', list); }
    function putWork(work) {
        const list = works();
        const i = list.findIndex(w => w.id === work.id);
        if (i >= 0) list[i] = work; else list.push(work);
        saveWorks(list);
        return work;
    }
    function removeWork(id) { saveWorks(works().filter(w => w.id !== id)); }

    function watch() {
        if (typeof GM_addValueChangeListener !== 'function') return;
        for (const [name, key] of Object.entries(K)) {
            GM_addValueChangeListener(key, (_k, _o, _n, remote) => { if (remote) emit(name); });
        }
    }

    // ── IndexedDB: 삽화 ──────────────────────────────────
    // shots: { id, room, story, msg, para, title, roomName, model, seed, createdAt, blob, sent, direction, oldKey? }
    let dbp = null;
    function idb() {
        if (dbp) return dbp;
        dbp = new Promise((resolve, reject) => {
            const req = indexedDB.open('crack-painter-2', 1);
            req.onupgradeneeded = () => {
                const d = req.result;
                const s = d.createObjectStore('shots', { keyPath: 'id' });
                s.createIndex('room', 'room');
                s.createIndex('createdAt', 'createdAt');
                d.createObjectStore('kv');
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => { dbp = null; reject(req.error); };
        });
        return dbp;
    }
    const done = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

    async function store(name, mode = 'readonly') {
        return (await idb()).transaction(name, mode).objectStore(name);
    }

    const bc = typeof BroadcastChannel === 'function' ? new BroadcastChannel('crack-painter-2') : null;
    if (bc) bc.onmessage = ev => emit('shots', ev.data);

    async function putShot(shot) {
        await done((await store('shots', 'readwrite')).put(shot));
        bc?.postMessage({ room: shot.room });
        emit('shots', { room: shot.room });
        return shot;
    }
    async function deleteShot(id) {
        const s = await getShot(id);
        await done((await store('shots', 'readwrite')).delete(id));
        bc?.postMessage({ room: s?.room });
        emit('shots', { room: s?.room });
    }
    async function getShot(id) { return done((await store('shots')).get(id)); }
    async function roomShots(room) { return done((await store('shots')).index('room').getAll(room)); }
    async function allShots() { return done((await store('shots')).getAll()); }
    async function kvGet(key) { return done((await store('kv')).get(key)); }
    async function kvSet(key, value) { return done((await store('kv', 'readwrite')).put(value, key)); }

    // ── 1.x에서 옮겨 오기 ─────────────────────────────────
    async function migrate() {
        if (GM_getValue(K.migrated, false)) return 0;
        // 키
        try {
            const raw = GM_getValue('cp_secrets_v1', null);
            const old = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
            const k = keys();
            if (!k.nai && old.naiKey) setKey('nai', old.naiKey);
            if (!k.gemini && old.geminiKey) setKey('gemini', old.geminiKey);
        } catch (_) { /* 없으면 넘어감 */ }
        // 삽화
        let moved = 0;
        try {
            const dbs = indexedDB.databases ? await indexedDB.databases() : [{ name: 'crack-painter' }];
            if (dbs.some(d => d.name === 'crack-painter')) {
                const old = await new Promise((res, rej) => { const r = indexedDB.open('crack-painter'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onupgradeneeded = () => { r.transaction.abort(); }; });
                if (old.objectStoreNames.contains('records') && old.objectStoreNames.contains('images')) {
                    const recs = await done(old.transaction('records').objectStore('records').getAll());
                    for (const rec of recs) {
                        for (const h of rec.history || []) {
                            const blob = await done(old.transaction('images').objectStore('images').get(h.imageId));
                            if (!blob) continue;
                            await putShot({
                                id: U.uid('s'), room: rec.roomId, story: '', msg: '', oldKey: rec.messageKey, para: rec.paragraph ?? 0,
                                title: rec.title || h.state?.title || '', roomName: rec.roomName || '', model: h.model || '', seed: h.seed,
                                createdAt: h.createdAt || Date.now(), blob, sent: h.sent || null, direction: null, legacy: true
                            });
                            moved += 1;
                        }
                    }
                }
                old.close();
            }
        } catch (e) { console.warn('[크랙 페인터] 예전 삽화 옮기기 실패', e); }
        GM_setValue(K.migrated, true);
        return moved;
    }

    return { DEFAULTS, on, emit, settings, patchSettings, keys, setKey, works, saveWorks, putWork, removeWork, watch, putShot, deleteShot, getShot, roomShots, allShots, kvGet, kvSet, migrate };
})();
