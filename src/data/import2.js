// Import2 — 2.0(11/23~11/24에 잠깐 올라갔던 전면 개편판)에서 새로 만든 삽화를 한 번만 가져온다.
// 2.0은 'crack-painter-2' 저장소에 따로 보관했다. 예전 삽화를 복사해 둔 것(legacy)은 원래 자리에 그대로 있으니 건너뛴다.
const Import2 = (() => {
    'use strict';
    const FLAG = 'cp_imported_v2';

    const done = r => new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });

    async function exists() {
        if (!indexedDB.databases) return false;
        return (await indexedDB.databases()).some(d => d.name === 'crack-painter-2');
    }

    function openOld() {
        return new Promise((resolve, reject) => {
            const r = indexedDB.open('crack-painter-2');
            r.onupgradeneeded = () => r.transaction.abort();      // 없으면 만들지 않는다
            r.onsuccess = () => resolve(r.result);
            r.onerror = () => reject(r.error);
        });
    }

    // 2.0이 보낸 내용으로 스튜디오 상태를 만든다 (리롤·프롬프트 불러오기가 같은 그림을 다시 만들게)
    function stateFrom(shot) {
        const sent = shot.sent || {};
        const counts = Tags.split(sent.base).filter(t => Tags.kind(t) === 'count');
        return {
            title: shot.title || '', moment: '', paragraph: shot.para || 0,
            style: { pos: sent.base || '', neg: sent.baseNeg || '' },
            scene: { tags: '', caption: '', count: Tags.join(counts) },
            chars: (sent.chars || []).map((c, i) => ({ id: `v2_${i}`, source: 'extra', name: c.name || `인물 ${i + 1}`, aliases: [], look: c.prompt || '', action: '', caption: '', uc: c.neg || '', position: c.center || null, enabled: true })),
            neg: ''
        };
    }

    async function run() {
        if (GM_getValue(FLAG, false)) return 0;
        let moved = 0;
        try {
            if (await exists()) {
                const db = await openOld();
                const shots = db.objectStoreNames.contains('shots') ? await done(db.transaction('shots').objectStore('shots').getAll()) : [];
                db.close();
                for (const shot of shots.filter(x => !x.legacy && x.blob && x.room && x.msg).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))) {
                    const messageKey = `msg_${Site.fingerprint(shot.msg)}`;
                    const rec = (await Vault.record(shot.room, messageKey)) || { roomId: shot.room, messageKey, history: [], index: 0, paragraph: shot.para || 0, title: shot.title || '', roomName: shot.roomName || '' };
                    const sent = shot.sent || {};
                    rec.history.push({
                        imageId: await Vault.saveImage(shot.blob),
                        seed: shot.seed,
                        model: Models.ALL[shot.model] ? shot.model : Models.DEFAULT,
                        gen: { ...Nai.GEN_DEFAULTS, size: 'landscape', ucPreset: 2, qualityV5: 'none' },
                        state: stateFrom(shot),
                        sent: { base: sent.base || '', negative: sent.baseNeg || '', chars: (sent.chars || []).map(c => ({ name: c.name, prompt: c.prompt, uc: c.neg || '' })) },
                        createdAt: shot.createdAt || Date.now()
                    });
                    rec.index = rec.history.length - 1;
                    await Vault.saveRecord(rec);
                    moved += 1;
                }
            }
        } catch (e) {
            console.warn('[크랙 페인터] 2.0 삽화 가져오기 실패', e);
            return 0;    // 다음에 다시 시도
        }
        GM_setValue(FLAG, true);
        if (moved) Kit.toast({ title: `2.0에서 만든 삽화 ${moved}장을 가져왔어`, kind: 'ok', body: '채팅과 삽화 갤러리에서 볼 수 있어.' });
        return moved;
    }

    return { run, stateFrom };
})();
