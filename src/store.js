// ─────────────────────────────────────────────────────────────
// Net: GM_xmlhttpRequest 래퍼
// Store: 설정·키(GM 저장소) + 이미지·기록(IndexedDB)
//
// 키를 "매번 다시 입력하라"던 원래 문제는 탭마다 낡은 캐시를 들고 있다가
// 저장할 때 통째로 덮어써서 생겼다. 여기서는 캐시를 두지 않는다:
//   읽기 = 매번 GM 저장소에서 새로
//   쓰기 = 새로 읽고 → 바꾼 필드만 고치고 → 저장
// ─────────────────────────────────────────────────────────────
const Net = (() => {
    'use strict';

    function httpMessage(status, text) {
        let detail = '';
        try {
            const j = JSON.parse(text);
            detail = j?.error?.message || j?.message || (typeof j?.error === 'string' ? j.error : '');
        } catch (_) {
            detail = String(text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
        }
        const hint = {
            400: '요청 형식 오류',
            401: '키가 틀렸거나 만료됐어',
            402: 'Anlas(결제 잔액)가 부족해',
            403: '권한이 없어',
            404: '주소나 모델을 찾지 못했어',
            409: '이미 다른 생성이 진행 중이야',
            429: '요청이 너무 잦아 · 잠깐 뒤에 다시',
            500: '서버 오류',
            503: '서버가 바빠'
        }[status] || '요청 실패';
        return `${hint} (HTTP ${status})${detail ? ` · ${detail}` : ''}`;
    }

    function bytesToText(buf) {
        try { return new TextDecoder().decode(new Uint8Array(buf).slice(0, 4000)); } catch (_) { return ''; }
    }

    function request({ method = 'GET', url, headers = {}, data, raw = false, responseType = 'text', timeout = 120000, signal }) {
        return new Promise((resolve, reject) => {
            if (signal?.aborted) return reject(abortError());
            let done = false;
            const finish = (fn, v) => { if (done) return; done = true; signal?.removeEventListener?.('abort', onAbort); fn(v); };
            const onAbort = () => { try { req?.abort?.(); } catch (_) {} finish(reject, abortError()); };
            signal?.addEventListener?.('abort', onAbort, { once: true });
            const req = GM_xmlhttpRequest({
                method, url, headers, timeout, responseType,
                data: data == null ? undefined : (raw ? data : JSON.stringify(data)),
                onload: res => {
                    if (res.status < 200 || res.status >= 300) {
                        const text = typeof res.responseText === 'string' && res.responseText ? res.responseText
                            : res.response instanceof ArrayBuffer ? bytesToText(res.response) : String(res.response || '');
                        const err = new Error(httpMessage(res.status, text));
                        err.status = res.status;
                        err.body = text;
                        return finish(reject, err);
                    }
                    if (responseType === 'arraybuffer') return finish(resolve, res.response);
                    try { finish(resolve, JSON.parse(res.responseText)); } catch (e) { finish(reject, new Error('응답을 JSON으로 읽지 못했어.')); }
                },
                onerror: () => finish(reject, new Error('네트워크 오류 · 연결이나 확장 프로그램의 도메인 허용을 확인해줘.')),
                ontimeout: () => finish(reject, new Error('응답 시간이 초과됐어.')),
                onabort: () => finish(reject, abortError())
            });
        });
    }

    function abortError() {
        const e = new Error('취소했어.');
        e.name = 'AbortError';
        return e;
    }

    return { request, abortError };
})();

const Store = (() => {
    'use strict';

    const SETTINGS_KEY = 'cp_settings_v1';
    const SECRETS_KEY = 'cp_secrets_v1';
    const SECRET_FIELDS = ['naiKey', 'geminiKey', 'deepseekKey'];

    const listeners = new Set();
    function on(fn) { listeners.add(fn); return () => listeners.delete(fn); }
    function emit(kind, remote = false) { listeners.forEach(fn => { try { fn(kind, remote); } catch (e) { console.error(e); } }); }

    function readJson(key) {
        try {
            const raw = GM_getValue(key, null);
            if (raw == null) return {};
            const v = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return v && typeof v === 'object' ? v : {};
        } catch (e) {
            console.warn('[Crack Painter] 저장값 읽기 실패', key, e);
            return {};
        }
    }

    function writeJson(key, value) {
        GM_setValue(key, JSON.stringify(value));
    }

    function defaults() {
        return {
            v: 1,
            analyzer: { provider: 'gemini', geminiModel: 'gemini-3.7-flash', deepseekModel: 'deepseek-v4-flash', thinking: 'auto' },
            model: Core.DEFAULT_MODEL,
            gen: { ...NAI.DEFAULT_GEN },
            style: { pos: '', neg: '' },
            presets: [],
            characters: [],
            rooms: {},
            ui: { contextTurns: 4 }
        };
    }

    function normalize(s) {
        const d = defaults();
        const out = { ...d, ...s };
        out.analyzer = { ...d.analyzer, ...(s.analyzer || {}) };
        out.gen = { ...d.gen, ...(s.gen || {}) };
        out.style = { ...d.style, ...(s.style || {}) };
        out.presets = Array.isArray(s.presets) ? s.presets : [];
        out.characters = Array.isArray(s.characters) ? s.characters.map(normChar) : [];
        out.rooms = s.rooms && typeof s.rooms === 'object' ? s.rooms : {};
        out.ui = { ...d.ui, ...(s.ui || {}) };
        if (!Core.MODELS[out.model]) out.model = Core.DEFAULT_MODEL;
        return out;
    }

    function normChar(c) {
        return {
            id: String(c?.id || uid('ch')),
            name: String(c?.name || '').trim(),
            aliases: Array.isArray(c?.aliases) ? c.aliases.map(a => String(a).trim()).filter(Boolean) : String(c?.aliases || '').split(',').map(a => a.trim()).filter(Boolean),
            look: String(c?.look || ''),
            outfit: String(c?.outfit || ''),
            uc: String(c?.uc || '')
        };
    }

    function settings() {
        return normalize(readJson(SETTINGS_KEY));
    }

    // fn(draft) 이 draft를 고친다. 저장 직전에 새로 읽으니 다른 탭의 변경을 덮지 않는다.
    function update(fn) {
        const draft = normalize(readJson(SETTINGS_KEY));
        const result = fn(draft);
        writeJson(SETTINGS_KEY, normalize(result || draft));
        emit('settings');
    }

    function secrets() {
        const s = readJson(SECRETS_KEY);
        const out = {};
        SECRET_FIELDS.forEach(f => { out[f] = typeof s[f] === 'string' ? s[f].trim() : ''; });
        return out;
    }

    function setSecret(field, value) {
        if (!SECRET_FIELDS.includes(field)) return;
        const s = readJson(SECRETS_KEY);
        s[field] = String(value || '').trim();
        writeJson(SECRETS_KEY, s);
        emit('secrets');
    }

    try {
        if (typeof GM_addValueChangeListener === 'function') {
            GM_addValueChangeListener(SETTINGS_KEY, (_k, _o, _n, remote) => { if (remote) emit('settings', true); });
            GM_addValueChangeListener(SECRETS_KEY, (_k, _o, _n, remote) => { if (remote) emit('secrets', true); });
        }
    } catch (_) {}

    // 방별 사용 캐릭터
    function roomChars(roomId, s = settings()) {
        const ids = s.rooms?.[roomId]?.chars || [];
        return s.characters.filter(c => ids.includes(c.id));
    }

    function uid(prefix = 'id') {
        const r = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
        return `${prefix}_${Date.now().toString(36)}${r}`;
    }

    // ── IndexedDB ────────────────────────────────────────────
    let dbp = null;
    function db() {
        if (dbp) return dbp;
        dbp = new Promise((resolve, reject) => {
            const req = indexedDB.open('crack-painter', 1);
            req.onupgradeneeded = () => {
                const d = req.result;
                if (!d.objectStoreNames.contains('images')) d.createObjectStore('images');
                if (!d.objectStoreNames.contains('records')) {
                    const s = d.createObjectStore('records', { keyPath: 'key' });
                    s.createIndex('room', 'roomId');
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => { dbp = null; reject(req.error); };
        });
        return dbp;
    }

    async function tx(store, mode, fn) {
        const d = await db();
        return new Promise((resolve, reject) => {
            const t = d.transaction(store, mode);
            const r = fn(t.objectStore(store));
            t.oncomplete = () => resolve(r && 'result' in r ? r.result : undefined);
            t.onerror = () => reject(t.error);
            t.onabort = () => reject(t.error || new Error('저장소 작업이 중단됐어.'));
        });
    }

    function reqP(r) {
        return new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    }

    async function putImage(blob) {
        const id = uid('img');
        await tx('images', 'readwrite', s => s.put(blob, id));
        return id;
    }

    async function getImage(id) {
        const d = await db();
        return reqP(d.transaction('images').objectStore('images').get(id));
    }

    async function deleteImage(id) {
        await tx('images', 'readwrite', s => s.delete(id));
    }

    const bc = typeof BroadcastChannel === 'function' ? new BroadcastChannel('crack-painter') : null;
    if (bc) bc.onmessage = ev => emit(`records:${ev.data?.roomId || ''}`);

    function recKey(roomId, messageKey) { return `${roomId}|${messageKey}`; }

    async function getRecord(roomId, messageKey) {
        const d = await db();
        return (await reqP(d.transaction('records').objectStore('records').get(recKey(roomId, messageKey)))) || null;
    }

    async function roomRecords(roomId) {
        const d = await db();
        return reqP(d.transaction('records').objectStore('records').index('room').getAll(roomId));
    }

    async function putRecord(rec) {
        rec.key = recKey(rec.roomId, rec.messageKey);
        rec.updatedAt = Date.now();
        await tx('records', 'readwrite', s => s.put(rec));
        bc?.postMessage({ roomId: rec.roomId });
        emit(`records:${rec.roomId}`);
        return rec;
    }

    async function deleteRecord(roomId, messageKey) {
        const rec = await getRecord(roomId, messageKey);
        if (!rec) return;
        for (const h of rec.history || []) await deleteImage(h.imageId).catch(() => {});
        await tx('records', 'readwrite', s => s.delete(recKey(roomId, messageKey)));
        bc?.postMessage({ roomId });
        emit(`records:${roomId}`);
    }

    async function usage() {
        try {
            const est = await navigator.storage?.estimate?.();
            return est ? { used: est.usage || 0, quota: est.quota || 0 } : null;
        } catch (_) {
            return null;
        }
    }

    return { on, emit, settings, update, secrets, setSecret, roomChars, uid, putImage, getImage, deleteImage, getRecord, roomRecords, putRecord, deleteRecord, usage };
})();
