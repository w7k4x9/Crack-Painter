// Settings — 시스템 설정처럼 생긴 창. 입력한 칸 하나만 그때그때 저장한다(Prefs.edit / Prefs.setKey).
const Settings = (() => {
    'use strict';
    const { esc, icon } = Kit;

    const PANES = [
        { id: 'api', label: '연결', icon: icon.key, color: '#0a84ff' },
        { id: 'style', label: '스타일', icon: icon.palette, color: '#bf5af2' },
        { id: 'chars', label: '캐릭터', icon: icon.person, color: '#ff9f0a' },
        { id: 'room', label: '이 채팅방', icon: icon.house, color: '#30b0c7' },
        { id: 'gen', label: '생성 옵션', icon: icon.sliders, color: '#8e8e93' },
        { id: 'storage', label: '저장 공간', icon: icon.disk, color: '#34c759' }
    ];
    const AVATAR_COLORS = ['#ff9f0a', '#34c759', '#ff375f', '#30b0c7', '#bf5af2', '#0a84ff'];

    let win = null;
    let pane = 'api';
    let person = null;      // 캐릭터 화면에서 열어 둔 인물 id
    let stopListening = null;

    function open(which) {
        if (which) pane = which;
        if (win && Kit.windows.has('settings')) { win.raise(); draw(); return; }
        win = Kit.window({ id: 'settings', cls: 'settings', title: '크랙 페인터 설정', sidebar: true, onClose: () => { win = null; stopListening?.(); stopListening = null; } });
        win.body.innerHTML = `
          <div class="settings-side">
            <div class="chrome" data-drag><div class="chrome-l"><div class="traffic"><i class="t-close" data-light="close" aria-label="닫기"></i><i class="t-off"></i><i class="t-off"></i></div></div></div>
            <nav class="settings-nav scroll">${PANES.map(p => `<button data-pane="${p.id}"><span class="nav-icon" style="background:${p.color}">${p.icon}</span>${p.label}</button>`).join('')}</nav>
          </div>
          <div class="settings-main">
            <div class="chrome" data-drag><div class="chrome-l"></div><div class="chrome-c"><b></b></div><div class="chrome-r"></div></div>
            <div class="settings-pane scroll"></div>
          </div>`;
        wire(win.el);
        // 다른 탭에서 바꾸면 새로 그린다 (입력 중이면 기다린다)
        stopListening = Prefs.subscribe((what, remote) => {
            if (!remote || (what !== 'settings' && what !== 'secrets') || !win) return;
            const focused = win.el.getRootNode().activeElement;
            if (!(focused && win.el.contains(focused) && /INPUT|TEXTAREA|SELECT/.test(focused.tagName))) draw();
        });
        draw();
    }

    function draw() {
        if (!win) return;
        for (const b of win.el.querySelectorAll('.settings-nav button')) b.classList.toggle('is-on', b.dataset.pane === pane);
        win.el.querySelector('.settings-main .chrome-c b').textContent = PANES.find(p => p.id === pane).label;
        const box = win.el.querySelector('.settings-pane');
        const y = box.scrollTop;
        box.innerHTML = { api: apiPane, style: stylePane, chars: charsPane, room: roomPane, gen: genPane, storage: storagePane }[pane]();
        box.scrollTop = y;
        if (pane === 'storage') fillStorage();
    }

    const v = x => esc(x ?? '');
    const row = (label, small, control) => `<div class="cell"><span class="cell-label"><b>${label}</b>${small ? `<small>${small}</small>` : ''}</span>${control}</div>`;
    const select = (k, choices, value, extra = '') => `<select class="dropdown" data-k="${k}"${extra} style="width:auto">${Kit.options(choices, value)}</select>`;

    // ── 연결 ───────────────────────────────────────────
    const SHAPES = { naiKey: /^pst-/, geminiKey: /^AIza/, deepseekKey: /^sk-/ };
    const KEY_NAMES = { naiKey: 'NovelAI 토큰(pst-…)', geminiKey: 'Gemini 키(AIza…)', deepseekKey: 'DeepSeek 키(sk-…)' };
    const PREFIX = { naiKey: 'pst-', geminiKey: 'AIza', deepseekKey: 'sk-' };
    const whoseKey = value => Object.keys(SHAPES).find(f => SHAPES[f].test(value)) || null;

    function keyHint(field, value) {
        if (!value) return '아직 없음';
        const owner = whoseKey(value);
        if (owner && owner !== field) return `<span class="bad-text">이건 ${KEY_NAMES[owner]}야. 여기엔 ${KEY_NAMES[field]}를 넣어야 해.</span>`;
        if (!owner) return `<span class="warn-text">저장됨 · 보통 ${PREFIX[field]} 로 시작하는데 형식이 달라</span>`;
        return '저장됨 · 이 브라우저의 확장 프로그램 저장소에만 있어';
    }

    function keyRow(field, label, placeholder, keys) {
        return `<div class="cell"><span class="cell-label"><b>${label}</b><small data-hint="${field}">${keyHint(field, keys[field])}</small></span>
            <input class="input is-mono" type="password" autocomplete="off" data-secret="${field}" placeholder="${placeholder}" value="${v(keys[field])}" style="max-width:260px"></div>`;
    }

    function apiPane() {
        const p = Prefs.get();
        const k = Prefs.keys();
        const a = p.analyzer;
        let analyzer;
        if (a.provider === 'none') {
            analyzer = '<div class="cell"><span class="cell-label dim">분석 AI 없이 NovelAI 토큰만으로 써. 스튜디오를 열면 등록 인물만 채워진 빈 장면이 나오고, 장면 태그와 자세는 직접 쓰면 돼. ⚡ 바로 생성은 외형·스타일만으로 그려.</span></div>';
        } else {
            analyzer = a.provider === 'deepseek'
                ? keyRow('deepseekKey', 'DeepSeek 키', 'sk-…', k) + row('모델', '', select('analyzer.deepseekModel', Analyst.DEEPSEEK_MODELS, a.deepseekModel))
                : keyRow('geminiKey', 'Gemini 키', 'AIza…', k) + row('모델', '<a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color:var(--accent)">Google AI Studio</a>에서 무료로 키를 받을 수 있어', select('analyzer.geminiModel', Analyst.GEMINI_MODELS, a.geminiModel));
            analyzer += row('생각 깊이', '깊을수록 장면 선택이 정확하지만 느려', select('analyzer.thinking', [['auto', '자동'], ['fast', '빠르게'], ['normal', '보통'], ['deep', '깊게']], a.thinking))
                + '<div class="cell"><span class="cell-label" data-llm-status><small>키와 모델이 맞는지 짧은 요청으로 확인해</small></span><button class="button" data-do="test-llm">확인</button></div>';
        }
        return `
          <div class="caption">NovelAI (그림)</div>
          <div class="card">
            ${keyRow('naiKey', 'API 토큰', 'pst-…', k)}
            <div class="cell"><span class="cell-label" data-nai-status><small>NovelAI 계정 설정 → Get Persistent API Token</small></span><button class="button" data-do="test-nai">확인</button></div>
          </div>
          <div class="caption">장면 분석 AI</div>
          <div class="card">
            ${row('사용할 AI', '채팅을 읽고 어떤 장면을 그릴지 고르는 역할 · NovelAI 토큰과는 별개야', Kit.seg('provider', [['gemini', 'Gemini'], ['deepseek', 'DeepSeek'], ['none', '안 씀']], a.provider))}
            ${analyzer}
          </div>
          <p class="aside">키는 Tampermonkey/Violentmonkey 저장소에 저장돼. 탭을 여러 개 열어도 다른 탭이 지우지 않아. 스크립트를 지우고 새로 설치하면 저장소도 같이 지워지니까, 업데이트는 설치된 스크립트를 덮어쓰는 방식으로 해줘.</p>`;
    }

    // 붙여넣은 키 저장. 다른 서비스 키 모양이면 맞는 칸으로 옮긴다.
    const lastSaved = {};
    function saveKey(field, raw) {
        const value = String(raw || '').replace(/^Bearer\s+/i, '').replace(/\s+/g, '');
        if (lastSaved[field] === value) return;
        lastSaved[field] = value;
        const owner = whoseKey(value);
        if (owner && owner !== field) {
            Prefs.setKey(owner, value);
            const current = Prefs.keys()[field];
            if (current && whoseKey(current) && whoseKey(current) !== field) Prefs.setKey(field, '');
            Kit.toast({ title: `${KEY_NAMES[owner]}이라 그 칸에 넣었어`, body: `${KEY_NAMES[field]} 칸에는 그 서비스의 키를 따로 넣어줘.`, kind: 'ok' });
            draw();
            return;
        }
        Prefs.setKey(field, value);
        const hint = win?.el.querySelector(`[data-hint="${field}"]`);
        if (hint) hint.innerHTML = keyHint(field, value);
    }

    // ── 스타일 ─────────────────────────────────────────
    function stylePane() {
        const p = Prefs.get();
        const presets = p.presets.length
            ? p.presets.map(x => `<div class="cell"><span class="cell-label"><b>${esc(x.name)}</b><small class="is-mono">${esc(x.pos.slice(0, 90) || '(포지티브 없음)')}</small></span>
                <button class="button" data-do="preset-apply" data-id="${esc(x.id)}">적용</button>
                <button class="iconbutton is-small" data-do="preset-del" data-id="${esc(x.id)}" title="삭제">${icon.bin}</button></div>`).join('')
            : '<div class="cell"><span class="cell-label dim">저장된 프리셋이 없어. 작가 조합을 바꿔 가며 쓸 때 편해.</span></div>';
        return `
          <p class="aside" style="margin:0 4px 14px">여기 쓴 태그는 <b>모든 장면의 베이스 프롬프트 맨 앞</b>에 들어가. 작가·화풍·퀄리티 태그는 여기에만 넣어줘. 캐릭터 외형 칸에 넣어도 생성할 때 자동으로 이쪽으로 올라와.</p>
          <div class="caption">기본 스타일</div>
          <div class="card">
            <div class="cell is-col"><span>포지티브 · 작가 · 화풍 · 퀄리티</span><textarea class="textarea is-mono" data-k="style.pos" spellcheck="false" placeholder="artist:이름, 0.8::artist:다른작가::, painterly, …">${v(p.style.pos)}</textarea></div>
            <div class="cell is-col"><span>네거티브</span><textarea class="textarea is-mono is-short" data-k="style.neg" spellcheck="false" placeholder="lowres, bad anatomy, …">${v(p.style.neg)}</textarea></div>
          </div>
          <div class="caption"><span>프리셋</span><span class="fill"></span><button class="button" data-do="preset-new">${icon.add}지금 스타일로 추가</button></div>
          <div class="card">${presets}</div>`;
    }

    // ── 캐릭터 ─────────────────────────────────────────
    function charsPane() {
        const p = Prefs.get();
        const roomId = Site.room();
        const inRoom = new Set(p.rooms?.[roomId]?.chars || []);
        const open_ = p.characters.find(x => x.id === person);
        if (open_) return personPane(open_, roomId, inRoom.has(open_.id));
        const list = p.characters.length
            ? `<div class="card people">${p.characters.map((x, i) => `
                <button data-person="${esc(x.id)}"><span class="avatar" style="background:${AVATAR_COLORS[i % AVATAR_COLORS.length]}">${esc((x.name || '?').slice(0, 1))}</span>
                  <span class="who"><b>${esc(x.name || '(이름 없음)')}</b><small class="is-mono">${esc(Tags.join([x.look, x.outfit]).slice(0, 80) || '외형 없음')}</small></span>
                  ${roomId && inRoom.has(x.id) ? '<span class="tag is-blue">이 방</span>' : ''}<span class="chev">${icon.chevron}</span></button>`).join('')}</div>`
            : '<div class="card"><div class="cell"><span class="cell-label dim">아직 없어. 등록 안 해도 AI가 엑스트라로 외형을 지어서 그리지만, 매번 달라져.</span></div></div>';
        return `
          <p class="aside" style="margin:0 4px 14px">인물마다 <b>외형과 기본 의상</b>만 저장해. 자세·표정은 장면마다 AI가 채워. 등록한 인물은 채팅방별로 켜고 끌 수 있어.</p>
          <div class="caption"><span>등록 인물 ${p.characters.length}명</span><span class="fill"></span><button class="button" data-do="person-new">${icon.add}새 인물</button></div>
          ${list}`;
    }

    function personPane(c, roomId, inRoom) {
        const stray = Tags.split(Tags.join([c.look, c.outfit])).filter(Tags.isFrame);
        return `
          <div class="line" style="margin-bottom:12px"><button class="button is-ghost" data-do="person-back">${icon.back}모든 인물</button><span class="fill"></span><button class="button is-danger" data-do="person-del">삭제</button></div>
          <div class="card">
            ${row('이름', '채팅에 나오는 이름 그대로', `<input class="input" data-c="name" value="${v(c.name)}" style="max-width:260px">`)}
            ${row('별칭', '쉼표로 구분 · 성만, 애칭 등', `<input class="input" data-c="aliases" value="${v(c.aliases.join(', '))}" style="max-width:260px">`)}
            ${roomId ? row('이 채팅방에서 사용', '', Kit.toggle('person-room', inRoom)) : ''}
          </div>
          <div class="caption"><span>캐릭터 프롬프트</span><span class="layer-hint">${icon.person}char_captions</span></div>
          <div class="card">
            <div class="cell is-col"><span>외형 · 성별, 머리, 눈, 체형</span><textarea class="textarea is-mono" data-c="look" spellcheck="false" placeholder="girl, long black hair, red eyes, slender">${v(c.look)}</textarea></div>
            <div class="cell is-col"><span>기본 의상 · 장면에서 갈아입으면 AI가 바꿔</span><textarea class="textarea is-mono is-short" data-c="outfit" spellcheck="false" placeholder="white shirt, black skirt">${v(c.outfit)}</textarea></div>
            <div class="cell is-col"><span>이 인물만의 UC</span><input class="input is-mono" data-c="uc" spellcheck="false" value="${v(c.uc)}"></div>
          </div>
          <p class="aside">입력하면 바로 저장돼. 따로 저장 버튼은 없어.</p>
          ${stray.length ? `<div class="hints"><div class="hint is-warn">${icon.warn}<span class="fill">작가·화풍 태그가 섞여 있어: <code>${esc(stray.join(', '))}</code><br>이건 그림 전체에 걸리는 태그라 캐릭터 칸이 아니라 베이스에 있어야 해.</span><button class="button" data-do="person-lift">스타일로 옮기기</button></div></div>` : ''}`;
    }

    // ── 이 채팅방 ──────────────────────────────────────
    function roomPane() {
        const roomId = Site.room();
        if (!roomId) return '<div class="card"><div class="cell"><span class="cell-label dim">채팅방을 열면 방별 설정이 보여.</span></div></div>';
        const p = Prefs.get();
        const r = p.rooms[roomId] || {};
        const inRoom = new Set(r.chars || []);
        const peopleName = { auto: '자동', 1: '1명', 2: '최대 2명', 3: '최대 3명' }[p.scene.people] || '자동';
        const cast = p.characters.length
            ? p.characters.map(c => row(esc(c.name), `<span class="is-mono">${esc(Tags.join([c.look, c.outfit]).slice(0, 70))}</span>`, Kit.toggle(`room-${c.id}`, inRoom.has(c.id)))).join('')
            : '<div class="cell"><span class="cell-label dim">등록한 인물이 없어.</span><button class="button" data-do="goto-chars">캐릭터 등록</button></div>';
        const focusChoices = [['', '자동'], ...p.characters.filter(c => inRoom.has(c.id)).map(c => [c.id, c.name])];
        return `
          <div class="caption">이 방에 나오는 인물</div>
          <div class="card">${cast}</div>
          <div class="caption">인원</div>
          <div class="card">
            ${row('그릴 인원', `기본값: ${esc(peopleName)}`, Kit.seg('room-people', [['default', '기본값'], ['auto', '자동'], ['1', '1명'], ['2', '최대 2명']], String(r.people || 'default')))}
            ${row('꼭 그릴 인물', '인원을 1명으로 하면 이 인물을 그려 · 자동이면 AI가 장면의 중심 인물을 골라', `<select class="dropdown" data-room="focus" style="width:auto">${Kit.options(focusChoices, r.focus || '')}</select>`)}
          </div>
          <div class="caption">세계관 · 장소 메모</div>
          <div class="card"><div class="cell is-col"><textarea class="textarea" data-room="note" placeholder="예: 1920년대 경성. 주인공 집은 한옥, 카페는 서양식 인테리어.">${v(r.note)}</textarea></div></div>
          <p class="aside">장면 분석 AI에게 참고로 줘. 프롬프트에 그대로 들어가지는 않아.</p>
          <div class="caption">맥락</div>
          <div class="card">${row('앞 대화 몇 턴까지 읽을지', '화면에 그려진 메시지 기준', select('ui.contextTurns', [[0, '안 읽음'], [2, '2턴'], [4, '4턴'], [6, '6턴'], [10, '10턴']], p.ui.contextTurns, ' data-num'))}</div>`;
    }

    // ── 생성 옵션 ──────────────────────────────────────
    function genPane() {
        const p = Prefs.get();
        const g = p.gen;
        const isV5 = Models.isV5(p.model);
        const num = (k, label, step, small = '') => row(label, small, `<input class="input is-num is-mono" type="number" step="${step}" data-k="gen.${k}" data-num value="${v(g[k])}">`);
        const samplers = [['k_euler_ancestral', 'Euler Ancestral'], ['k_euler', 'Euler'], ['k_dpmpp_2s_ancestral', 'DPM++ 2S Ancestral'], ['k_dpmpp_2m_sde', 'DPM++ 2M SDE'], ['k_dpmpp_2m', 'DPM++ 2M'], ['k_dpmpp_sde', 'DPM++ SDE']];
        const noises = [['karras', 'Karras'], ['exponential', 'Exponential'], ['polyexponential', 'Polyexponential']];
        const ucChoices = [[2, '없음'], ...Object.keys(Nai.ucTable(p.model)).map(k => [k, Nai.UC_NAMES[k]])];
        return `
          <div class="caption">인원</div>
          <div class="card">
            ${row('그릴 인원', '1명이면 장면의 중심 인물 한 명만 solo로 그려. 채팅방마다 따로 정할 수도 있어.', Kit.seg('people', [['auto', '자동'], ['1', '1명'], ['2', '최대 2명'], ['3', '최대 3명']], String(p.scene.people)))}
            ${row('카메라', 'POV 스냅샷: 내 눈으로 몰래 찍은 듯한 구도(pov, candid shot, snapshot). 자유: 장면마다 AI가 구도를 골라.', Kit.seg('camera', [['pov', 'POV 스냅샷'], ['free', '자유']], String(p.scene.camera || 'pov')))}
          </div>
          <div class="caption">모델</div>
          <div class="card">
            ${row('NovelAI 모델', isV5 ? 'V5: 캐릭터 칸이 베이스 예산과 따로 · 최대 22명' : 'V4.5: 베이스+캐릭터 합산 512토큰 · 최대 6명', select('model', Models.list().map(m => [m.id, m.label]), p.model))}
            ${row('크기', '', Kit.seg('size', Object.entries(Nai.SIZES).map(([k, x]) => [k, `${x.label} ${x.w}×${x.h}`]), g.size))}
          </div>
          <div class="caption">품질</div>
          <div class="card">
            ${isV5
                ? row('퀄리티 태그', `베이스 끝에 붙어 · ${esc(Nai.V5_QUALITY[g.qualityV5] || '없음')}`, Kit.seg('qualityV5', [['none', '없음'], ['light', 'Light'], ['standard', 'Standard']], g.qualityV5))
                : row('퀄리티 태그 추가', 'NovelAI 서버가 붙여', Kit.toggle('qualityV45', g.qualityV45 !== false))}
            ${row('UC 프리셋', '', select('gen.ucPreset', ucChoices, Nai.ucPick(p.model, g.ucPreset), ' data-num'))}
          </div>
          <div class="caption">샘플링</div>
          <div class="card">
            ${num('steps', '스텝', 1, '28 이하는 Opus 무료')}
            ${isV5 ? num('scaleV5', 'Guidance', 0.1, 'V5 기본 5') : num('scaleV45', 'Guidance', 0.1, 'V4.5 기본 6')}
            ${isV5 ? num('rescaleV5', 'Rescale', 0.01) : num('rescaleV45', 'Rescale', 0.01)}
            ${row('샘플러', '', select('gen.sampler', samplers, g.sampler))}
            ${row('노이즈 스케줄', '', select('gen.noise', noises, g.noise))}
          </div>
          <div class="caption">인물 배치</div>
          <div class="card">${row('좌우 위치 지정', '켜면 AI가 고른 좌·중·우 위치를 NAI에 보내. 2명 이상일 때만 쓰여.', Kit.toggle('useCoords', Boolean(g.useCoords)))}</div>`;
    }

    // ── 저장 공간 ──────────────────────────────────────
    function storagePane() {
        const f = Prefs.get().folder;
        const folder = Disk.supported
            ? row('폴더에도 저장', '생성할 때마다 PNG를 이 폴더에 바로 써. NovelAI 메타데이터(프롬프트·시드)도 그대로 들어 있어.', Kit.toggle('folder-enabled', Boolean(f.enabled)))
              + '<div class="cell"><span class="cell-label"><b>저장 폴더</b><small data-folder>확인 중…</small></span><button class="button" data-do="folder-pick">폴더 선택…</button><button class="button hide" data-do="folder-grant">다시 허용</button></div>'
              + row('채팅방마다 하위 폴더', '폴더/채팅방 이름/날짜_제목_시드.png', Kit.toggle('folder-perRoom', f.perRoom !== false))
            : row('이 브라우저는 폴더 지정을 지원하지 않아', 'Chrome · Edge · Whale 에서 쓸 수 있어. 대신 생성할 때마다 다운로드 폴더로 받을 수 있어.', '');
        return `
          <div class="caption">내 컴퓨터 폴더</div>
          <div class="card">
            ${folder}
            ${row('생성할 때마다 다운로드', `${Disk.supported ? '폴더 저장을 끈 경우에만 · ' : ''}브라우저 다운로드 폴더로 받아`, Kit.toggle('folder-download', Boolean(f.download)))}
          </div>
          <p class="aside">채팅 안에 보이는 삽화는 폴더 저장과 상관없이 이 브라우저(IndexedDB)에 따로 보관돼. 브라우저를 다시 열면 폴더 권한을 한 번 더 물어볼 수 있어.</p>
          <div class="caption">이 브라우저</div>
          <div class="card">
            <div class="cell"><span class="cell-label"><b>사용량</b></span><span class="dim" data-usage>계산 중…</span></div>
            <div class="cell"><span class="cell-label"><b>이 채팅방 삽화</b></span><span class="dim" data-room-count>…</span><button class="button" data-do="open-gallery">갤러리</button><button class="button is-danger" data-do="clear-room">모두 지우기</button></div>
          </div>
          <p class="aside">다른 기기와는 공유되지 않아.</p>
          <div class="caption">정보</div>
          <div class="card">${row('Crack Painter', `버전 ${esc(VERSION)}`, '<a class="button" href="https://github.com/w7k4x9/crack-painter" target="_blank" rel="noopener">GitHub</a>')}</div>`;
    }

    async function fillFolder() {
        const label = win?.el.querySelector('[data-folder]');
        if (!label) return;
        const st = await Disk.status();
        const grant = win?.el.querySelector('[data-do="folder-grant"]');
        if (!st.set) { label.textContent = '아직 안 골랐어'; grant?.classList.add('hide'); return; }
        const ok = st.permission === 'granted';
        label.innerHTML = `<b style="font-weight:500;color:var(--text)">${esc(st.name)}</b> · ${ok ? '<span class="ok-text">쓰기 허용됨</span>' : '<span class="warn-text">권한 다시 필요</span>'}`;
        grant?.classList.toggle('hide', ok);
        const pick = win?.el.querySelector('[data-do="folder-pick"]');
        if (pick) pick.textContent = '변경…';
    }

    async function fillStorage() {
        fillFolder();
        const size = b => (b > 1e9 ? `${(b / 1e9).toFixed(1)}GB` : `${Math.round(b / 1e6)}MB`);
        const u = await Vault.usage();
        const usage = win?.el.querySelector('[data-usage]');
        if (usage) usage.textContent = u ? `${size(u.used)} / ${size(u.quota)}` : '알 수 없음';
        const count = win?.el.querySelector('[data-room-count]');
        if (!count) return;
        const roomId = Site.room();
        if (!roomId) { count.textContent = '채팅방 밖'; return; }
        const recs = await Vault.roomList(roomId);
        count.textContent = `${recs.length}개 답변 · ${recs.reduce((n, r) => n + (r.history?.length || 0), 0)}장`;
    }

    // ── 입력 ───────────────────────────────────────────
    function assign(target, path, value) {
        const keys = path.split('.');
        const last = keys.pop();
        const parent = keys.reduce((o, k) => (o[k] = o[k] || {}), target);
        parent[last] = value;
    }

    const editPerson = change => Prefs.edit(d => { const c = d.characters.find(x => x.id === person); if (c) change(c, d); });

    const SEGMENTS = {
        provider: (d, x) => { d.analyzer.provider = x; },
        size: (d, x) => { d.gen.size = x; },
        qualityV5: (d, x) => { d.gen.qualityV5 = x; },
        people: (d, x) => { d.scene.people = x; },
        camera: (d, x) => { d.scene.camera = x; },
        'room-people': (d, x) => { if (Site.room()) Prefs.room(d, Site.room()).people = x; }
    };

    async function act(name, btn) {
        const roomId = Site.room();
        switch (name) {
            case 'folder-pick':
                try {
                    await Disk.choose();
                    Prefs.edit(d => { d.folder.enabled = true; });
                    draw();
                    Kit.toast({ title: '저장 폴더를 정했어', kind: 'ok', body: '다음 생성부터 이 폴더에도 저장돼.' });
                } catch (e) {
                    if (e?.name !== 'AbortError') Engine.report(e, '폴더를 열지 못했어');
                }
                break;
            case 'folder-grant': await Disk.warm(true); fillFolder(); break;
            case 'open-gallery': Gallery.open(); break;
            case 'test-nai': testNai(); break;
            case 'test-llm': testLlm(); break;
            case 'preset-new': {
                const name_ = await Kit.ask(btn, { title: '새 스타일 프리셋', placeholder: '이름 · 예: 수채화 kawacy' });
                if (!name_) return;
                Prefs.edit(d => { d.presets.push({ id: Prefs.newId('ps'), name: name_.trim().slice(0, 40), pos: d.style.pos, neg: d.style.neg }); });
                draw();
                break;
            }
            case 'preset-apply':
                Prefs.edit(d => { const x = d.presets.find(p => p.id === btn.dataset.id); if (x) d.style = { pos: x.pos, neg: x.neg ?? d.style.neg }; });
                draw();
                Kit.toast({ title: '스타일을 바꿨어', kind: 'ok' });
                break;
            case 'preset-del':
                Prefs.edit(d => { d.presets = d.presets.filter(x => x.id !== btn.dataset.id); });
                draw();
                break;
            case 'person-new': {
                const id = Prefs.newId('ch');
                Prefs.edit(d => {
                    d.characters.push({ id, name: '', aliases: [], look: '', outfit: '', uc: '' });
                    if (roomId) { const r = Prefs.room(d, roomId); r.chars = [...(r.chars || []), id]; }
                });
                person = id;
                draw();
                win.el.querySelector('[data-c="name"]')?.focus();
                break;
            }
            case 'person-back': person = null; draw(); break;
            case 'person-del': {
                if (!Kit.confirmTap(btn, '모든 방에서 삭제')) return;
                const id = person;
                Prefs.edit(d => {
                    d.characters = d.characters.filter(x => x.id !== id);
                    for (const r of Object.values(d.rooms)) if (r.chars) r.chars = r.chars.filter(x => x !== id);
                });
                person = null;
                draw();
                break;
            }
            case 'person-lift':
                editPerson((c, d) => {
                    const lifted = [];
                    const keep = text => Tags.join(Tags.split(text).filter(t => (Tags.isFrame(t) ? (lifted.push(t), false) : true)));
                    c.look = keep(c.look);
                    c.outfit = keep(c.outfit);
                    d.style.pos = Tags.join(Tags.unique([...Tags.split(d.style.pos), ...lifted]));
                });
                draw();
                Kit.toast({ title: '스타일로 옮겼어', kind: 'ok', body: '설정 → 스타일에서 확인할 수 있어.' });
                break;
            case 'goto-chars': pane = 'chars'; draw(); break;
            case 'clear-room': {
                if (!roomId || !Kit.confirmTap(btn, '정말 모두 삭제')) return;
                for (const r of await Vault.roomList(roomId)) await Vault.dropRecord(roomId, r.messageKey);
                document.querySelectorAll('.kp-figure').forEach(f => f.remove());
                fillStorage();
                break;
            }
            default:
        }
    }

    let keyTimer = 0;
    function wire(el) {
        // 키는 치는 대로 저장 (Esc로 창을 닫아도 남게)
        el.addEventListener('input', ev => {
            const field = ev.target.dataset.secret;
            if (!field) return;
            clearTimeout(keyTimer);
            keyTimer = setTimeout(() => saveKey(field, ev.target.value), 400);
        });
        el.addEventListener('click', ev => {
            const nav = ev.target.closest('[data-pane]');
            if (nav) { pane = nav.dataset.pane; person = null; draw(); return; }
            const who = ev.target.closest('[data-person]');
            if (who) { person = who.dataset.person; draw(); return; }
            const seg = ev.target.closest('.segmented button');
            if (seg) {
                const set = SEGMENTS[seg.parentElement.dataset.seg];
                if (set) Prefs.edit(d => set(d, seg.dataset.v));
                draw();
                return;
            }
            const btn = ev.target.closest('[data-do]');
            if (btn && !btn.closest('.traffic')) act(btn.dataset.do, btn);
        });
        el.addEventListener('change', ev => {
            const t = ev.target;
            const d = t.dataset;
            const roomId = Site.room();
            if (d.secret) {
                clearTimeout(keyTimer);
                saveKey(d.secret, t.value);
            } else if (d.k) {
                const value = 'num' in d ? Number(t.value) : t.value;
                Prefs.edit(p => assign(p, d.k, value));
                if (d.k === 'model') draw();
            } else if (d.c) {
                editPerson(c => { c[d.c] = d.c === 'aliases' ? t.value.split(',').map(a => a.trim()).filter(Boolean) : t.value; });
                if (d.c === 'look' || d.c === 'outfit') draw();
            } else if (d.room) {
                if (roomId) Prefs.edit(p => { p.rooms[roomId] = { ...(p.rooms[roomId] || {}), [d.room]: t.value }; });
            } else if (d.sw) {
                toggled(d.sw, t.checked, roomId);
            }
        });
    }

    function toggled(name, on, roomId) {
        if (name.startsWith('folder-')) {
            const key = name.slice(7);
            Prefs.edit(p => { p.folder[key] = on; });
            if (key === 'enabled' && on) Disk.status().then(st => { if (!st.set) win?.el.querySelector('[data-do="folder-pick"]')?.click(); });
        } else if (name === 'qualityV45' || name === 'useCoords') {
            Prefs.edit(p => { p.gen[name] = on; });
        } else if (name === 'person-room' || name.startsWith('room-')) {
            if (!roomId) return;
            const id = name === 'person-room' ? person : name.slice(5);
            Prefs.edit(p => {
                const r = Prefs.room(p, roomId);
                const ids = new Set(r.chars || []);
                if (on) ids.add(id); else ids.delete(id);
                r.chars = [...ids];
            });
        }
    }

    async function testNai() {
        const box = win?.el.querySelector('[data-nai-status]');
        if (!box) return;
        const key = Prefs.keys().naiKey;
        if (!key) { box.innerHTML = '<b class="bad-text">토큰이 없어</b>'; return; }
        box.innerHTML = '<small>확인 중…</small>';
        try {
            const sub = await Http.send({ url: 'https://image.novelai.net/user/subscription', headers: { Authorization: `Bearer ${key}` }, timeout: 20000 });
            const tier = ['Paper', 'Tablet', 'Scroll', 'Opus'][sub?.tier] || `Tier ${sub?.tier}`;
            const left = sub?.trainingStepsLeft || {};
            const anlas = (left.fixedTrainingStepsLeft || 0) + (left.purchasedTrainingSteps || 0);
            box.innerHTML = `<b class="ok-text">연결됨</b><small>${esc(tier)} · Anlas ${anlas.toLocaleString()}${sub?.active === false ? ' · 구독 비활성' : ''}</small>`;
        } catch (e) {
            box.innerHTML = `<b class="bad-text">실패</b><small>${esc(e.message)}</small>`;
        }
    }

    async function testLlm() {
        const box = win?.el.querySelector('[data-llm-status]');
        if (!box) return;
        const p = Prefs.get();
        const k = Prefs.keys();
        const deep = p.analyzer.provider === 'deepseek';
        box.innerHTML = '<small>확인 중…</small>';
        try {
            await Analyst.ping(p.analyzer.provider, deep ? k.deepseekKey : k.geminiKey, deep ? p.analyzer.deepseekModel : p.analyzer.geminiModel);
            box.innerHTML = '<b class="ok-text">연결됨</b><small>JSON 응답 확인</small>';
        } catch (e) {
            box.innerHTML = `<b class="bad-text">실패</b><small>${esc(e.message)}</small>`;
        }
    }

    return { open };
})();
