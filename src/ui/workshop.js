// 작업실: 작품 · 갤러리 · 설정
const Workshop = (() => {
    const { h, button, iconButton, select, input, textarea, segmented, toggle } = Kit;
    let W = null;

    function open(tab = 'works') {
        if (W) { W.tab = tab; draw(); return; }
        const seg = h('div', { class: 'tabs' });
        const win = Kit.windowed({ title: '크랙 페인터', toolbar: [seg], onClose: () => { W = null; } });
        W = { win, seg, tab, workId: null, galleryScope: 'room' };
        draw();
    }

    function draw() {
        if (!W) return;
        W.seg.replaceChildren(segmented([['works', '작품'], ['gallery', '갤러리'], ['settings', '설정']], W.tab, v => { W.tab = v; draw(); }));
        W.win.content.replaceChildren();
        ({ works, gallery, settings })[W.tab]();
    }

    // ── 작품 ──────────────────────────────────────────
    function works() {
        const list = DB.works();
        const storyId = Crack.storyId();
        const current = storyId ? App.workFor(storyId, [document.title.replace(/\s*\|.*$/, '')]) : null;
        if (!W.workId || !list.some(w => w.id === W.workId)) W.workId = current?.id || list[0]?.id || null;
        const file = h('input', { type: 'file', accept: '.json,application/json', multiple: true, hidden: true, onchange: e => importFiles([...e.target.files]) });
        const side = h('div', { class: 'sidebar' },
            file,
            button('JSON 불러오기', () => file.click(), { kind: 'primary', iconName: 'upload' }),
            h('div', { class: 'faint', style: { margin: '4px 2px 8px' } }, '오토세이버 대기열 JSON(작품.json · 작품_V5.json), spec JSON, nai_config.json'),
            ...list.map(w => h('div', { class: `side-item ${w.id === W.workId ? 'on' : ''}`, onclick: () => { W.workId = w.id; draw(); } },
                Kit.icon('stack', 15), h('span', { class: 'grow' }, w.name), h('span', { class: 'faint' }, w.id === current?.id ? '연결됨' : `${w.chars.length}명`))));
        const pane = h('div', { class: 'pane' });
        const work = list.find(w => w.id === W.workId);
        if (!work) {
            pane.append(h('div', { class: 'col', style: { maxWidth: '520px' } },
                h('h3', null, '작품을 불러와 줘'),
                h('p', { class: 'muted' }, 'NAI 자동화로 만든 감정 이미지 대기열 JSON을 불러오면 인물마다 외형·의상·캐릭터 부정·감정 블록·배경이 그대로 들어와. 삽화도 감정 이미지와 같은 얼굴로 그려져.'),
                h('p', { class: 'muted' }, 'V4.5 파일과 V5 파일(이름이 _V5로 끝남)을 둘 다 넣으면 모델에 맞는 쪽을 써.')));
        } else {
            pane.append(workDetail(work, storyId, current));
        }
        W.win.content.append(side, pane);
    }

    async function importFiles(files) {
        let last = null;
        const msgs = [];
        for (const f of files) {
            try {
                const r = Works.parse(await f.text(), f.name);
                if (r.kind === 'config') {
                    DB.patchSettings({ base: r.config.base, baseNeg: r.config.baseNeg });
                    msgs.push(`${f.name}: 기본 베이스로 저장`);
                    continue;
                }
                const all = DB.works();
                const saved = all.find(w => U.looseName(w.name) === U.looseName(r.work.name));
                const merged = Works.merge(saved, r.work);
                DB.putWork(merged);
                last = merged.id;
                const cleaned = merged.chars.flatMap(c => Rules.cleanAppearance(c.appearance).notes.map(n => `${c.name}: ${n}`));
                msgs.push(`${f.name}: ${merged.name} · ${r.work.chars.length}명${r.work.v5 ? ' (V5)' : ''}${cleaned.length ? ` · ${cleaned.join(', ')}` : ''}`);
            } catch (e) {
                msgs.push(e.message);
            }
        }
        if (last) W.workId = last;
        Kit.toast('불러오기 결과', { detail: msgs.join('\n'), kind: msgs.some(m => /아니야|없어|못/.test(m)) ? 'err' : 'ok' });
        draw();
    }

    function workDetail(work, storyId, current) {
        const save = () => DB.putWork(work);
        const linked = current?.id === work.id;
        const out = h('div', { class: 'col', style: { gap: '4px' } },
            h('div', { class: 'row' },
                h('h3', { class: 'grow', style: { margin: 0 } }, work.name),
                storyId ? (linked
                    ? button('이 채팅 연결 끊기', () => { App.link(storyId, null); draw(); })
                    : button('이 채팅에 연결', () => { App.link(storyId, work.id); draw(); App.renderFigures(); }, { kind: 'primary', iconName: 'link' })) : null,
                button('작품 지우기', e => Kit.confirmInline(e.currentTarget, '한 번 더 누르면 지워져', () => { DB.removeWork(work.id); W.workId = null; draw(); }), { kind: 'danger' })),
            work.memo ? h('div', { class: 'note' }, work.memo) : null,
            h('div', { class: 'group-title' }, '베이스'),
            h('div', { class: 'group' },
                h('div', { class: 'row' }, h('span', { class: 'label grow' }, 'V4.5'), h('span', { class: 'faint' }, work.base ? `${Tags.count(work.base)} 토큰` : '없음 → 설정의 기본 베이스')),
                work.base ? h('div', { class: 'faint', style: { fontFamily: 'var(--mono)' } }, `${work.base.slice(0, 220)}…`) : null,
                h('div', { class: 'row' }, h('span', { class: 'label grow' }, 'V5'), h('span', { class: 'faint' }, work.baseV5 ? `${Tags.count(work.baseV5)} 토큰` : 'V5 파일이 없어 V4.5 베이스를 V5 가중치로 바꿔 씀'))),
            h('div', { class: 'group-title' }, `인물 ${work.chars.length}명`, h('span', { class: 'grow' }), button('인물 직접 추가', () => { work.chars.push({ name: '새 인물', aliases: [], appearance: '', outfit: '', negative: 'beard, body hair, frame', emotions: {}, nsfwEmotions: {}, backgrounds: {}, adult: false, beardOk: false, note: '', v5: null }); save(); draw(); }, { kind: 'ghost', iconName: 'plus' })));
        work.chars.forEach((c, i) => out.append(charCard(work, c, i, save)));
        return out;
    }

    function charCard(work, c, i, save) {
        const nEmo = Object.keys(c.emotions || {}).length;
        const nNsfw = Object.keys(c.nsfwEmotions || {}).length;
        const body = h('div', { class: 'col', hidden: true },
            h('div', { class: 'form' },
                h('div', { class: 'label' }, '이름'), input(c.name, v => { c.name = v.trim(); save(); }),
                h('div', { class: 'label' }, '다른 호칭'), input((c.aliases || []).join(', '), v => { c.aliases = v.split(',').map(x => x.trim()).filter(Boolean); save(); }, { placeholder: '채팅에서 부르는 이름 (쉼표로)' }),
                h('div', { class: 'label' }, '성인 장면'), h('div', { class: 'row' }, toggle(!!c.adult, v => { c.adult = v; save(); }), h('span', { class: 'faint' }, '작품에 섹스 세트가 있으면 켜져 있어. 성인인 인물만 켜 줘.')),
                h('div', { class: 'label' }, '수염 허용'), h('div', { class: 'row' }, toggle(!!c.beardOk, v => { c.beardOk = v; save(); }), h('span', { class: 'faint' }, '끄면 캐릭터 부정에 beard가 들어가.'))),
            h('div', { class: 'label' }, '외형'), textarea(c.appearance, v => { c.appearance = v; save(); }, { mono: true, rows: 3 }),
            h('div', { class: 'label' }, '의상'), textarea(c.outfit, v => { c.outfit = v; save(); }, { mono: true, rows: 2 }),
            h('div', { class: 'label' }, '캐릭터 부정'), textarea(c.negative, v => { c.negative = v; save(); }, { mono: true, rows: 2 }),
            c.note ? h('div', { class: 'note' }, `해석: ${c.note}`) : null,
            nEmo ? h('details', null, h('summary', { class: 'label' }, `감정 블록 ${nEmo}개${nNsfw ? ` + NSFW ${nNsfw}개` : ''}`),
                h('div', { class: 'col', style: { marginTop: '6px' } }, Object.entries({ ...c.emotions, ...Object.fromEntries(Object.entries(c.nsfwEmotions || {}).map(([k, v]) => [`섹스·${k}`, v])) }).map(([k, v]) => h('div', { class: 'faint', style: { fontFamily: 'var(--mono)' } }, h('b', null, `${k}  `), v)))) : null,
            h('div', { class: 'row' }, h('span', { class: 'grow' }), button('이 인물 빼기', e => Kit.confirmInline(e.currentTarget, '한 번 더 누르면 빠져', () => { work.chars.splice(i, 1); save(); draw(); }), { kind: 'danger' })));
        const head = h('div', { class: 'row', style: { cursor: 'default' }, onclick: () => { body.hidden = !body.hidden; } },
            Kit.icon('people', 15), h('strong', null, c.name),
            c.aliases?.length ? h('span', { class: 'faint' }, c.aliases.join(', ')) : null,
            h('span', { class: 'grow' }),
            c.v5 ? h('span', { class: 'chip' }, 'V5') : null,
            c.adult ? h('span', { class: 'chip' }, '성인') : null,
            h('span', { class: 'chip' }, `감정 ${nEmo}`),
            Kit.icon('down', 13));
        return h('div', { class: 'group', style: { marginBottom: '8px' } }, head, body);
    }

    // ── 갤러리 ─────────────────────────────────────────
    async function gallery() {
        const pane = h('div', { class: 'pane' });
        W.win.content.append(pane);
        const room = Crack.chatId();
        const shots = (W.galleryScope === 'room' && room ? await DB.roomShots(room) : await DB.allShots()).sort((a, b) => b.createdAt - a.createdAt);
        pane.append(h('div', { class: 'row', style: { marginBottom: '12px' } },
            segmented([['room', '이 채팅방', !room], ['all', '전체']], room ? W.galleryScope : 'all', v => { W.galleryScope = v; draw(); }),
            h('span', { class: 'faint grow' }, `${shots.length}장`)));
        if (!shots.length) { pane.append(h('div', { class: 'note' }, '아직 그린 삽화가 없어. 답변 아래 액자 버튼이나 번개 버튼으로 그려 봐.')); return; }
        let day = '';
        let grid = null;
        for (const s of shots) {
            const d = U.fmtDate(s.createdAt).slice(0, 10);
            if (d !== day) { day = d; pane.append(h('div', { class: 'group-title' }, d)); grid = h('div', { class: 'grid' }); pane.append(grid); }
            grid.append(h('div', { class: 'thumb', onclick: () => Gallery.view(s, () => draw()) }, h('img', { src: App.url(s), loading: 'lazy' }), h('div', { class: 'cap' }, `${s.title || '삽화'}${W.galleryScope === 'all' ? ` · ${s.roomName}` : ''}`)));
        }
    }

    // ── 설정 ──────────────────────────────────────────
    function settings() {
        const s = DB.settings();
        const k = DB.keys();
        const pane = h('div', { class: 'pane' });
        const p = s.provider;
        const providerInfo = AI.PROVIDERS[p];
        const modelList = h('datalist', { id: 'cp2-models' });
        const naiStatus = h('span', { class: 'faint' });
        const aiStatus = h('span', { class: 'faint' });
        const save = patch => DB.patchSettings(patch);

        pane.append(
            h('div', { class: 'group-title' }, '연결'),
            h('div', { class: 'group' }, h('div', { class: 'form' },
                h('div', { class: 'label' }, 'NovelAI 토큰'),
                h('div', { class: 'row' }, input(k.nai, v => DB.setKey('nai', v), { type: 'password', placeholder: 'pst-…', mono: true }), button('확인', async () => {
                    naiStatus.textContent = '확인 중…';
                    try { const r = await NAI.checkToken(DB.keys().nai); naiStatus.textContent = `${r.tier}${r.active ? '' : ' (만료)'}`; } catch (e) { naiStatus.textContent = e.message; }
                })),
                h('div'), naiStatus,
                h('div', { class: 'label' }, '장면 분석 AI'),
                select(Object.entries(AI.PROVIDERS).map(([id, v]) => [id, v.label]), p, v => { save({ provider: v }); draw(); }),
                h('div'), h('div', { class: 'faint' }, providerInfo.hint),
                providerInfo.key ? h('div', { class: 'label' }, 'API 키') : null,
                providerInfo.key ? input(k[providerInfo.key], v => DB.setKey(providerInfo.key, v), { type: 'password', placeholder: providerInfo.hint.split(' ')[0], mono: true }) : null,
                providerInfo.key ? h('div', { class: 'label' }, '모델') : null,
                providerInfo.key ? h('div', { class: 'row' }, input(s.models[p], v => save({ models: { ...DB.settings().models, [p]: v.trim() } }), { mono: true, extra: { list: 'cp2-models' } }), modelList, button('목록', async () => {
                    aiStatus.textContent = '불러오는 중…';
                    try {
                        const ids = await AI.listModels(p, DB.keys()[providerInfo.key]);
                        modelList.replaceChildren(...ids.map(id => h('option', { value: id })));
                        aiStatus.textContent = `${ids.length}개 · 칸을 눌러 고르면 돼`;
                    } catch (e) { aiStatus.textContent = e.message; }
                })) : null,
                providerInfo.key ? h('div') : null, providerInfo.key ? aiStatus : null)),

            h('div', { class: 'group-title' }, '그리기'),
            h('div', { class: 'group' }, h('div', { class: 'form' },
                h('div', { class: 'label' }, '모델'), select(Object.values(Compose.MODELS).map(m => [m.id, m.label]), s.nai, v => save({ nai: v })),
                h('div', { class: 'label' }, '크기'), select([['landscape', '가로 1216×832'], ['wide', '넓은 가로 1472×704'], ['square', '정사각 1024×1024']], s.gen.size, v => save({ gen: { ...DB.settings().gen, size: v } })),
                h('div', { class: 'label' }, '스텝'), input(s.gen.steps, v => save({ gen: { ...DB.settings().gen, steps: Number(v) || 28 } }), { type: 'number' }),
                h('div', { class: 'label' }, '가이던스'), input(s.gen.scale, v => save({ gen: { ...DB.settings().gen, scale: Number(v) } }), { type: 'number' }),
                h('div', { class: 'label' }, '리스케일'), input(s.gen.rescale, v => save({ gen: { ...DB.settings().gen, rescale: Number(v) } }), { type: 'number' }),
                h('div', { class: 'label' }, '샘플러'), select([['k_euler_ancestral', 'Euler Ancestral'], ['k_euler', 'Euler'], ['k_dpmpp_2s_ancestral', 'DPM++ 2S Ancestral'], ['k_dpmpp_2m_sde', 'DPM++ 2M SDE'], ['k_dpmpp_2m', 'DPM++ 2M'], ['k_dpmpp_sde', 'DPM++ SDE']], s.gen.sampler, v => save({ gen: { ...DB.settings().gen, sampler: v } })),
                h('div', { class: 'label' }, '노이즈'), select([['karras', 'Karras'], ['native', 'Native'], ['exponential', 'Exponential'], ['polyexponential', 'Polyexponential']], s.gen.noise, v => save({ gen: { ...DB.settings().gen, noise: v } })),
                h('div', { class: 'label' }, '인물 위치'), h('div', { class: 'row' }, toggle(s.gen.coords, v => save({ gen: { ...DB.settings().gen, coords: v } })), h('span', { class: 'faint' }, '둘 이상일 때 왼쪽·가운데·오른쪽 자리 지정')))),

            h('div', { class: 'group-title' }, '장면'),
            h('div', { class: 'group' }, h('div', { class: 'form' },
                h('div', { class: 'label' }, '앞 대화'), select([2, 4, 6, 10, 16].map(n => [n, `${n}개`]), s.context, v => save({ context: Number(v) })),
                h('div', { class: 'label' }, '성인 장면'), h('div', { class: 'row' }, toggle(s.nsfw, v => save({ nsfw: v })), h('span', { class: 'faint' }, '켜면 작품에서 성인으로 만든 인물만 섹스 장면이 돼')),
                h('div', { class: 'label' }, '파일로도 받기'), h('div', { class: 'row' }, toggle(s.download, v => save({ download: v })), h('span', { class: 'faint' }, '그릴 때마다 다운로드 폴더로')))),

            h('div', { class: 'group-title' }, '기본 베이스'),
            h('div', { class: 'group' },
                h('div', { class: 'faint' }, '작품 JSON에 베이스가 없을 때 쓰는 베이스야. nai_config.json을 작품 탭에서 불러오면 여기에 들어가.'),
                textarea(s.base, v => save({ base: v }), { mono: true, rows: 3, placeholder: '베이스 프롬프트' }),
                textarea(s.baseNeg, v => save({ baseNeg: v }), { mono: true, rows: 3, placeholder: '베이스 부정' })),

            h('div', { class: 'group-title' }, '정보'),
            h('div', { class: 'group' },
                h('div', { class: 'faint' }, `크랙 페인터 ${GM_info?.script?.version || ''} · 토큰 계산: ${Tags.exact() ? 'T5 사전(정확)' : '추정(+10% 여유) · 사전을 받는 중이거나 못 받았어'}`)));
        W.win.content.append(pane);
    }

    return { open };
})();

// 크게 보기
const Gallery = (() => {
    const { h, button, iconButton } = Kit;

    function view(shot, onChange) {
        Kit.mount();
        const close = () => { el.remove(); document.removeEventListener('keydown', key, true); };
        const key = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
        const copyAll = () => navigator.clipboard.writeText([`[베이스]\n${shot.sent?.base || ''}`, ...(shot.sent?.chars || []).map(c => `[${c.name}]\n${c.prompt}\n[${c.name} 부정]\n${c.neg}`), `[베이스 부정]\n${shot.sent?.baseNeg || shot.sent?.negative || ''}`].join('\n\n'));
        const info = (k, v) => h('div', { class: 'row' }, h('span', { class: 'label', style: { width: '56px' } }, k), h('span', { class: 'grow' }, v));
        const el = h('div', { class: 'viewer', onmousedown: e => { if (e.target === el || e.target.classList.contains('stage')) close(); } },
            h('div', { class: 'stage' }, h('img', { src: App.url(shot) })),
            h('aside', null,
                h('div', { class: 'row' }, h('strong', { class: 'grow' }, shot.title || '삽화'), iconButton('close', close, '닫기')),
                info('채팅방', shot.roomName || '-'),
                info('작품', shot.work || '-'),
                info('시간', U.fmtDate(shot.createdAt)),
                info('모델', Compose.model(shot.model).label),
                info('시드', String(shot.seed ?? '-')),
                shot.direction?.why ? h('div', { class: 'note' }, shot.direction.why) : null,
                h('div', { class: 'row wrap' },
                    button('저장', () => App.download(shot), { iconName: 'save' }),
                    button('프롬프트 복사', copyAll, { iconName: 'copy' }),
                    (shot.story || shot.room === Crack.chatId()) ? button('채팅에서 보기', () => { close(); location.href = `${location.origin}/stories/${shot.story || Crack.storyId()}/episodes/${shot.room}`; }, { iconName: 'chat' }) : null,
                    button('지우기', e => Kit.confirmInline(e.currentTarget, '한 번 더', async () => { await DB.deleteShot(shot.id); App.forget(shot.id); close(); App.renderFigures(); onChange?.(); }), { kind: 'danger', iconName: 'trash' })),
                shot.sent ? h('details', { class: 'sent', open: true }, h('summary', null, '보낸 내용'),
                    h('div', { class: 'inner' }, h('div', { class: 'faint', style: { fontFamily: 'var(--mono)', whiteSpace: 'pre-wrap' } },
                        [`[베이스]\n${shot.sent.base}`, ...(shot.sent.chars || []).map(c => `[${c.name}]\n${c.prompt}`)].join('\n\n')))) : null));
        document.addEventListener('keydown', key, true);
        Kit.shell().append(el);
    }

    return { view };
})();
