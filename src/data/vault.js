// Vault — 그림과 기록 (IndexedDB 'crack-painter').
// 표 이름과 기록 모양은 예전 버전과 같아서 그동안 만든 삽화가 그대로 보인다.
//   images  : imageId → Blob
//   meta    : 'folder' → 폴더 핸들 …
//   records : { key:'방|메시지', roomId, messageKey, roomName, title, paragraph, index,
//               history:[{ imageId, seed, model, gen, state, sent, createdAt }], updatedAt }
const Vault = (() => {
    'use strict';
    let opening = null;

    function open() {
        if (opening) return opening;
        opening = new Promise((resolve, reject) => {
            const req = indexedDB.open('crack-painter', 2);
            req.onupgradeneeded = () => {
                const db = req.result;
                const has = n => db.objectStoreNames.contains(n);
                if (!has('images')) db.createObjectStore('images');
                if (!has('meta')) db.createObjectStore('meta');
                if (!has('records')) db.createObjectStore('records', { keyPath: 'key' }).createIndex('room', 'roomId');
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => { opening = null; reject(req.error); };
        });
        return opening;
    }

    const done = request => new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    async function read(table, use) {
        const db = await open();
        return done(use(db.transaction(table).objectStore(table)));
    }

    async function write(table, use) {
        const db = await open();
        return new Promise((resolve, reject) => {
            const t = db.transaction(table, 'readwrite');
            use(t.objectStore(table));
            t.oncomplete = () => resolve();
            t.onerror = () => reject(t.error);
            t.onabort = () => reject(t.error || new Error('저장소 작업이 중단됐어.'));
        });
    }

    // 다른 탭에 "이 방 기록이 바뀌었다"고 알린다
    const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('crack-painter') : null;
    if (channel) channel.onmessage = ev => Prefs.notify(`records:${ev.data?.roomId || ''}`);
    const changed = roomId => { channel?.postMessage({ roomId }); Prefs.notify(`records:${roomId}`); };

    const recordKey = (roomId, messageKey) => `${roomId}|${messageKey}`;

    async function saveImage(blob) {
        const id = Prefs.newId('img');
        await write('images', s => s.put(blob, id));
        return id;
    }
    const image = id => read('images', s => s.get(id));
    const dropImage = id => write('images', s => s.delete(id));

    const record = async (roomId, messageKey) => (await read('records', s => s.get(recordKey(roomId, messageKey)))) || null;
    const roomList = roomId => read('records', s => s.index('room').getAll(roomId));
    const everything = () => read('records', s => s.getAll());

    async function saveRecord(rec) {
        rec.key = recordKey(rec.roomId, rec.messageKey);
        rec.updatedAt = Date.now();
        await write('records', s => s.put(rec));
        changed(rec.roomId);
        return rec;
    }

    async function dropRecord(roomId, messageKey) {
        const rec = await record(roomId, messageKey);
        if (!rec) return;
        for (const h of rec.history || []) await dropImage(h.imageId).catch(() => {});
        await write('records', s => s.delete(recordKey(roomId, messageKey)));
        changed(roomId);
    }

    const meta = key => read('meta', s => s.get(key));
    const setMeta = (key, value) => write('meta', s => (value == null ? s.delete(key) : s.put(value, key)));

    async function usage() {
        try {
            const e = await navigator.storage?.estimate?.();
            return e ? { used: e.usage || 0, quota: e.quota || 0 } : null;
        } catch (_) {
            return null;
        }
    }

    return { saveImage, image, dropImage, record, roomList, everything, saveRecord, dropRecord, meta, setMeta, usage };
})();
