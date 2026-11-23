// Prefs — 설정과 API 키 (유저스크립트 저장소).
// 탭마다 낡은 사본을 들고 있다가 통째로 덮어쓰면 다른 탭에서 넣은 키가 지워진다.
// 그래서 사본을 두지 않는다: 읽을 때마다 새로 읽고, 쓸 때도 새로 읽어서 바꾼 곳만 고친다.
// 저장 이름(cp_settings_v1, cp_secrets_v1)은 예전 버전과 같아서 쓰던 설정·키가 그대로 이어진다.
const Prefs = (() => {
    'use strict';

    const SETTINGS = 'cp_settings_v1';
    const SECRETS = 'cp_secrets_v1';
    const KEY_FIELDS = ['naiKey', 'geminiKey', 'deepseekKey'];

    const subscribers = new Set();
    const subscribe = fn => { subscribers.add(fn); return () => subscribers.delete(fn); };
    const notify = (what, fromOtherTab = false) => {
        for (const fn of subscribers) {
            try { fn(what, fromOtherTab); } catch (e) { console.error('[크랙 페인터]', e); }
        }
    };

    function load(name) {
        try {
            const raw = GM_getValue(name, null);
            if (raw == null) return {};
            const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return value && typeof value === 'object' ? value : {};
        } catch (e) {
            console.warn('[크랙 페인터] 저장값을 읽지 못했어', name, e);
            return {};
        }
    }
    const store = (name, value) => GM_setValue(name, JSON.stringify(value));

    function newId(prefix = 'id') {
        const tail = globalThis.crypto?.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
        return `${prefix}_${Date.now().toString(36)}${tail}`;
    }

    function blank() {
        return {
            v: 1,
            analyzer: { provider: 'gemini', geminiModel: 'gemini-3.7-flash', deepseekModel: 'deepseek-v4-flash', thinking: 'auto' },
            model: Models.DEFAULT,
            gen: { ...Nai.GEN_DEFAULTS },
            style: { pos: '', neg: '' },
            presets: [],
            characters: [],
            rooms: {},
            ui: { contextTurns: 4 },
            scene: { people: 'auto', camera: 'pov' },
            folder: { enabled: false, perRoom: true, download: false }
        };
    }

    const list = v => (Array.isArray(v) ? v : []);
    const obj = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

    function person(c) {
        const aliases = Array.isArray(c?.aliases) ? c.aliases : String(c?.aliases || '').split(',');
        return {
            id: String(c?.id || newId('ch')),
            name: String(c?.name || '').trim(),
            aliases: aliases.map(a => String(a).trim()).filter(Boolean),
            look: String(c?.look || ''),
            outfit: String(c?.outfit || ''),
            uc: String(c?.uc || '')
        };
    }

    function shape(raw) {
        const d = blank();
        const s = obj(raw);
        const out = { ...d, ...s };
        for (const part of ['analyzer', 'gen', 'style', 'ui', 'scene', 'folder']) out[part] = { ...d[part], ...obj(s[part]) };
        out.presets = list(s.presets);
        out.characters = list(s.characters).map(person);
        out.rooms = s.rooms && typeof s.rooms === 'object' ? s.rooms : {};
        if (!Models.ALL[out.model]) out.model = Models.DEFAULT;
        return out;
    }

    const get = () => shape(load(SETTINGS));

    /** edit(draft => { draft.x = … }) — 쓰기 직전에 새로 읽어서 다른 탭이 바꾼 걸 덮지 않는다. */
    function edit(change) {
        const draft = shape(load(SETTINGS));
        const replaced = change(draft);
        store(SETTINGS, shape(replaced || draft));
        notify('settings');
    }

    function keys() {
        const s = load(SECRETS);
        return Object.fromEntries(KEY_FIELDS.map(f => [f, typeof s[f] === 'string' ? s[f].trim() : '']));
    }

    function setKey(field, value) {
        if (!KEY_FIELDS.includes(field)) return;
        const s = load(SECRETS);
        s[field] = String(value || '').trim();
        store(SECRETS, s);
        notify('secrets');
    }

    try {
        if (typeof GM_addValueChangeListener === 'function') {
            GM_addValueChangeListener(SETTINGS, (_k, _old, _new, remote) => { if (remote) notify('settings', true); });
            GM_addValueChangeListener(SECRETS, (_k, _old, _new, remote) => { if (remote) notify('secrets', true); });
        }
    } catch (_) { /* 리스너 없는 환경 */ }

    /** 이 채팅방에서 켠 등록 인물 */
    function cast(roomId, s = get()) {
        const on = new Set(s.rooms?.[roomId]?.chars || []);
        return s.characters.filter(c => on.has(c.id));
    }

    function room(s, roomId) {
        if (!s.rooms[roomId]) s.rooms[roomId] = {};
        return s.rooms[roomId];
    }

    return { get, edit, keys, setKey, subscribe, notify, cast, room, newId };
})();
