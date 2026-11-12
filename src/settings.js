// ─────────────────────────────────────────────────────────────
// Settings: 시스템 설정 스타일 창
// 입력은 change 시점에 그 필드 하나만 저장한다(Store.update / setSecret).
// ─────────────────────────────────────────────────────────────
const Settings = (() => {
    'use strict';
    const { esc, icons } = UI;

    const PANES = [
        ['api', '연결', icons.key, '#0a84ff'],
        ['style', '스타일', icons.palette, '#bf5af2'],
        ['chars', '캐릭터', icons.person, '#ff9f0a'],
        ['room', '이 채팅방', icons.room, '#30b0c7'],
        ['gen', '생성 옵션', icons.slider, '#8e8e93'],
        ['storage', '저장 공간', icons.disk, '#34c759']
    ];
    let win = null;
    let pane = 'api';
    let selChar = null;
    let unsub = null;

    function open(which) {
        if (which) pane = which;
        if (win && UI.windows.has('settings')) {
            win.restore();
            render();
            return;
        }
        win = UI.openWindow({
            id: 'settings', className: 'settings', title: 'Crack Painter 설정', sidebarTitle: true,
            onClose: () => { win = null; unsub?.(); unsub = null; }
        });
        win.body.innerHTML = `
          <div class="side">
            <div class="titlebar" data-drag><div class="left"><div class="lights"><i data-act="close" aria-label="닫기"></i><i class="off"></i><i class="off"></i></div></div></div>
            <nav class="nav scroll">${PANES.map(([id, label, ic, color]) => `<button data-pane="${id}"><span class="ic" style="background:${color}">${ic}</span>${label}</button>`).join('')}</nav>
          </div>
          <div class="main">
            <div class="titlebar" data-drag><div class="left"></div><div class="title"><b></b></div><div class="right"></div></div>
            <div class="pane scroll"></div>
          </div>`;
        bind();
        unsub = Store.on((kind, remote) => { if (remote && (kind === 'settings' || kind === 'secrets')) softRefresh(); });
        render();
    }

    function softRefresh() {
        if (!win) return;
        const active = win.el.getRootNode().activeElement;
        if (active && win.el.contains(active) && /INPUT|TEXTAREA|SELECT/.test(active.tagName)) return;
        render();
    }

    function render() {
        if (!win) return;
        win.el.querySelectorAll('.nav button').forEach(b => b.classList.toggle('on', b.dataset.pane === pane));
        const meta = PANES.find(p => p[0] === pane);
        win.el.querySelector('.main .title b').textContent = meta[1];
        const box = win.el.querySelector('.pane');
        const top = box.scrollTop;
        box.innerHTML = ({ api: apiPane, style: stylePane, chars: charsPane, room: roomPane, gen: genPane, storage: storagePane })[pane]();
        box.scrollTop = top;
        if (pane === 'storage') fillStorage();
    }

    const val = v => esc(v ?? '');

    // ── 연결 ─────────────────────────────────────────────
    function apiPane() {
        const s = Store.settings();
        const k = Store.secrets();
        const a = s.analyzer;
        const keyRow = (field, label, ph) => `
          <div class="item"><span class="label"><b>${label}</b><small data-key-hint="${field}">${keyHint(field, k[field])}</small></span>
            <input class="field mono" type="password" autocomplete="off" data-secret="${field}" placeholder="${ph}" value="${val(k[field])}" style="max-width:260px">
          </div>`;
        return `
          <div class="section-title">NovelAI (그림)</div>
          <div class="group">
            ${keyRow('naiKey', 'API 토큰', 'pst-…')}
            <div class="item"><span class="label" data-nai-status><small>NovelAI 계정 설정 → Get Persistent API Token</small></span><button class="btn" data-act="test-nai">확인</button></div>
          </div>

          <div class="section-title">장면 분석 AI</div>
          <div class="group">
            <div class="item"><span class="label"><b>사용할 AI</b><small>채팅을 읽고 어떤 장면을 그릴지 고르는 역할 · NovelAI 토큰과는 별개야</small></span>${UI.seg('provider', [['gemini', 'Gemini'], ['deepseek', 'DeepSeek'], ['none', '안 씀']], a.provider)}</div>
            ${a.provider === 'none'
                ? `<div class="item"><span class="label muted">분석 AI 없이 NovelAI 토큰만으로 써. 스튜디오를 열면 등록 인물만 채워진 빈 장면이 나오고, 장면 태그와 자세는 직접 쓰면 돼. ⚡ 바로 생성은 외형·스타일만으로 그려.</span></div>`
                : a.provider === 'deepseek'
                ? `${keyRow('deepseekKey', 'DeepSeek 키', 'sk-…')}
                   <div class="item"><span class="label"><b>모델</b></span><select class="select" data-k="analyzer.deepseekModel" style="width:auto">${UI.options(LLM.DEEPSEEK_MODELS, a.deepseekModel)}</select></div>`
                : `${keyRow('geminiKey', 'Gemini 키', 'AIza…')}
                   <div class="item"><span class="label"><b>모델</b><small><a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color:var(--accent)">Google AI Studio</a>에서 무료로 키를 받을 수 있어</small></span><select class="select" data-k="analyzer.geminiModel" style="width:auto">${UI.options(LLM.GEMINI_MODELS, a.geminiModel)}</select></div>`}
            ${a.provider === 'none' ? '' : `<div class="item"><span class="label"><b>생각 깊이</b><small>깊을수록 장면 선택이 정확하지만 느려</small></span>
              <select class="select" data-k="analyzer.thinking" style="width:auto">${UI.options([['auto', '자동'], ['fast', '빠르게'], ['normal', '보통'], ['deep', '깊게']], a.thinking)}</select></div>
            <div class="item"><span class="label" data-llm-status><small>키와 모델이 맞는지 짧은 요청으로 확인해</small></span><button class="btn" data-act="test-llm">확인</button></div>`}
          </div>
          <p class="footnote">키는 Tampermonkey/Violentmonkey 저장소에 저장돼. 탭을 여러 개 열어도 다른 탭이 지우지 않아. 스크립트를 지우고 새로 설치하면 저장소도 같이 지워지니까, 업데이트는 설치된 스크립트를 덮어쓰는 방식으로 해줘.</p>`;
    }

    const KEY_SHAPE = { naiKey: /^pst-/, geminiKey: /^AIza/, deepseekKey: /^sk-/ };
    const KEY_NAME = { naiKey: 'NovelAI 토큰(pst-…)', geminiKey: 'Gemini 키(AIza…)', deepseekKey: 'DeepSeek 키(sk-…)' };
    function keyOwner(v) { return Object.keys(KEY_SHAPE).find(f => KEY_SHAPE[f].test(v)) || null; }
    function keyHint(field, v) {
        if (!v) return '아직 없음';
        const owner = keyOwner(v);
        if (owner && owner !== field) return `<span style="color:var(--red)">이건 ${KEY_NAME[owner]}야. 여기엔 ${KEY_NAME[field]}를 넣어야 해.</span>`;
        if (!owner) return `<span style="color:var(--orange)">저장됨 · 보통 ${KEY_NAME[field].replace(/.*\((.*)\)/, '$1')} 로 시작하는데 형식이 달라</span>`;
        return '저장됨 · 이 브라우저의 확장 프로그램 저장소에만 있어';
    }

    // 붙여넣은 키를 저장. 다른 칸의 키 모양이면 맞는 칸으로 옮긴다.
    const lastKey = {};
    function saveKey(field, raw) {
        const v = String(raw || '').replace(/^Bearer\s+/i, '').replace(/\s+/g, '');
        if (lastKey[field] === v) return;
        lastKey[field] = v;
        const owner = keyOwner(v);
        if (owner && owner !== field) {
            Store.setSecret(owner, v);
            // 이 칸에 원래 있던 값도 다른 서비스 키였다면 지운다
            const cur = Store.secrets()[field];
            if (cur && keyOwner(cur) && keyOwner(cur) !== field) Store.setSecret(field, '');
            UI.toast({ title: `${KEY_NAME[owner]}이라 그 칸에 넣었어`, body: `${KEY_NAME[field]} 칸에는 그 서비스의 키를 따로 넣어줘.`, kind: 'ok' });
            render();
            return;
        }
        Store.setSecret(field, v);
        const hint = win?.el.querySelector(`[data-key-hint="${field}"]`);
        if (hint) hint.innerHTML = keyHint(field, v);
    }

    // ── 스타일 ───────────────────────────────────────────
    function stylePane() {
        const s = Store.settings();
        return `
          <p class="footnote" style="margin:0 4px 14px">여기 쓴 태그는 <b>모든 장면의 베이스 프롬프트 맨 앞</b>에 들어가. 작가·화풍·퀄리티 태그는 여기에만 넣어줘. 캐릭터 외형 칸에 넣어도 생성할 때 자동으로 이쪽으로 올라와.</p>
          <div class="section-title">기본 스타일</div>
          <div class="group">
            <div class="item col"><span class="sub">포지티브 · 작가 · 화풍 · 퀄리티</span><textarea class="ta mono" data-k="style.pos" spellcheck="false" placeholder="artist:이름, 0.8::artist:다른작가::, painterly, …">${val(s.style.pos)}</textarea></div>
            <div class="item col"><span class="sub">네거티브</span><textarea class="ta mono short" data-k="style.neg" spellcheck="false" placeholder="lowres, bad anatomy, …">${val(s.style.neg)}</textarea></div>
          </div>
          <div class="section-title"><span>프리셋</span><span class="grow"></span><button class="btn" data-act="preset-new">${icons.plus}지금 스타일로 추가</button></div>
          <div class="group">
            ${s.presets.length ? s.presets.map(p => `
              <div class="item"><span class="label"><b>${esc(p.name)}</b><small class="mono">${esc(p.pos.slice(0, 90) || '(포지티브 없음)')}</small></span>
                <button class="btn" data-act="preset-apply" data-id="${esc(p.id)}">적용</button>
                <button class="icon-btn sm" data-act="preset-del" data-id="${esc(p.id)}" title="삭제">${icons.trash}</button></div>`).join('')
              : `<div class="item"><span class="label muted">저장된 프리셋이 없어. 작가 조합을 바꿔 가며 쓸 때 편해.</span></div>`}
          </div>`;
    }

    // ── 캐릭터 ───────────────────────────────────────────
    function charsPane() {
        const s = Store.settings();
        const roomId = Crack.roomId();
        const inRoom = new Set(s.rooms?.[roomId]?.chars || []);
        const c = s.characters.find(x => x.id === selChar);
        if (c) return charDetail(c, roomId, inRoom.has(c.id));
        const colors = ['#ff9f0a', '#34c759', '#ff375f', '#30b0c7', '#bf5af2', '#0a84ff'];
        return `
          <p class="footnote" style="margin:0 4px 14px">인물마다 <b>외형과 기본 의상</b>만 저장해. 자세·표정은 장면마다 AI가 채워. 등록한 인물은 채팅방별로 켜고 끌 수 있어.</p>
          <div class="section-title"><span>등록 인물 ${s.characters.length}명</span><span class="grow"></span><button class="btn" data-act="char-new">${icons.plus}새 인물</button></div>
          ${s.characters.length ? `<div class="group char-list">${s.characters.map((x, i) => `
            <button data-char="${esc(x.id)}"><span class="avatar" style="background:${colors[i % colors.length]}">${esc((x.name || '?').slice(0, 1))}</span>
              <span class="meta"><b>${esc(x.name || '(이름 없음)')}</b><small class="mono">${esc(Core.joinTags([x.look, x.outfit]).slice(0, 80) || '외형 없음')}</small></span>
              ${roomId && inRoom.has(x.id) ? '<span class="badge blue">이 방</span>' : ''}<span class="chev">${icons.disclose}</span></button>`).join('')}</div>`
            : `<div class="group"><div class="item"><span class="label muted">아직 없어. 등록 안 해도 AI가 엑스트라로 외형을 지어서 그리지만, 매번 달라져.</span></div></div>`}`;
    }

    function charDetail(c, roomId, inRoom) {
        const styleTags = Core.splitTags(Core.joinTags([c.look, c.outfit])).filter(t => ['style', 'quality'].includes(Core.classify(t)));
        return `
          <div class="row" style="margin-bottom:12px"><button class="btn ghost" data-act="char-back">${icons.left}모든 인물</button><span class="grow"></span><button class="btn danger" data-act="char-del">삭제</button></div>
          <div class="group">
            <div class="item"><span class="label"><b>이름</b><small>채팅에 나오는 이름 그대로</small></span><input class="field" data-c="name" value="${val(c.name)}" style="max-width:260px"></div>
            <div class="item"><span class="label"><b>별칭</b><small>쉼표로 구분 · 성만, 애칭 등</small></span><input class="field" data-c="aliases" value="${val(c.aliases.join(', '))}" style="max-width:260px"></div>
            ${roomId ? `<div class="item"><span class="label"><b>이 채팅방에서 사용</b></span>${UI.switchHtml('char-room', inRoom)}</div>` : ''}
          </div>
          <div class="section-title"><span>캐릭터 프롬프트</span><span class="where">${icons.person}char_captions</span></div>
          <div class="group">
            <div class="item col"><span class="sub">외형 · 성별, 머리, 눈, 체형</span><textarea class="ta mono" data-c="look" spellcheck="false" placeholder="girl, long black hair, red eyes, slender">${val(c.look)}</textarea></div>
            <div class="item col"><span class="sub">기본 의상 · 장면에서 갈아입으면 AI가 바꿔</span><textarea class="ta mono short" data-c="outfit" spellcheck="false" placeholder="white shirt, black skirt">${val(c.outfit)}</textarea></div>
            <div class="item col"><span class="sub">이 인물만의 UC</span><input class="field mono" data-c="uc" spellcheck="false" value="${val(c.uc)}"></div>
          </div>
          ${styleTags.length ? `<div class="notes"><div class="note warn">${icons.warn}<span class="grow">작가·화풍 태그가 섞여 있어: <code>${esc(styleTags.join(', '))}</code><br>이건 그림 전체에 걸리는 태그라 캐릭터 칸이 아니라 베이스에 있어야 해.</span><button class="btn" data-act="char-move-style">스타일로 옮기기</button></div></div>` : ''}`;
    }

    // ── 이 채팅방 ────────────────────────────────────────
    function roomPane() {
        const roomId = Crack.roomId();
        if (!roomId) return `<div class="group"><div class="item"><span class="label muted">채팅방을 열면 방별 설정이 보여.</span></div></div>`;
        const s = Store.settings();
        const room = s.rooms[roomId] || {};
        const inRoom = new Set(room.chars || []);
        return `
          <div class="section-title">이 방에 나오는 인물</div>
          <div class="group">
            ${s.characters.length ? s.characters.map(c => `<div class="item"><span class="label"><b>${esc(c.name)}</b><small class="mono">${esc(Core.joinTags([c.look, c.outfit]).slice(0, 70))}</small></span>${UI.switchHtml(`room-${c.id}`, inRoom.has(c.id))}</div>`).join('')
              : `<div class="item"><span class="label muted">등록한 인물이 없어.</span><button class="btn" data-act="goto-chars">캐릭터 등록</button></div>`}
          </div>
          <div class="section-title">인원</div>
          <div class="group">
            <div class="item"><span class="label"><b>그릴 인원</b><small>기본값: ${esc({ auto: '자동', 1: '1명', 2: '최대 2명', 3: '최대 3명' }[s.scene.people] || '자동')}</small></span>${UI.seg('room-people', [['default', '기본값'], ['auto', '자동'], ['1', '1명'], ['2', '최대 2명']], String(room.people || 'default'))}</div>
            <div class="item"><span class="label"><b>꼭 그릴 인물</b><small>인원을 1명으로 하면 이 인물을 그려 · 자동이면 AI가 장면의 중심 인물을 골라</small></span>
              <select class="select" data-room="focus" style="width:auto">${UI.options([['', '자동'], ...s.characters.filter(c => inRoom.has(c.id)).map(c => [c.id, c.name])], room.focus || '')}</select></div>
          </div>
          <div class="section-title">세계관 · 장소 메모</div>
          <div class="group"><div class="item col"><textarea class="ta" data-room="note" placeholder="예: 1920년대 경성. 주인공 집은 한옥, 카페는 서양식 인테리어.">${val(room.note)}</textarea></div></div>
          <p class="footnote">장면 분석 AI에게 참고로 줘. 프롬프트에 그대로 들어가지는 않아.</p>
          <div class="section-title">맥락</div>
          <div class="group"><div class="item"><span class="label"><b>앞 대화 몇 턴까지 읽을지</b><small>화면에 그려진 메시지 기준</small></span>
            <select class="select" data-k="ui.contextTurns" data-num style="width:auto">${UI.options([[0, '안 읽음'], [2, '2턴'], [4, '4턴'], [6, '6턴'], [10, '10턴']], s.ui.contextTurns)}</select></div></div>`;
    }

    // ── 생성 옵션 ────────────────────────────────────────
    function genPane() {
        const s = Store.settings();
        const g = s.gen;
        const v5 = Core.model(s.model).family === 'v5';
        const ucOpts = [[2, '없음'], ...Object.keys(NAI.ucTable(s.model)).map(k => [k, NAI.UC_LABELS[k]])];
        const num = (k, label, step, sub = '') => `<div class="item"><span class="label"><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</span><input class="field num mono" type="number" step="${step}" data-k="gen.${k}" data-num value="${val(g[k])}"></div>`;
        return `
          <div class="section-title">인원</div>
          <div class="group">
            <div class="item"><span class="label"><b>그릴 인원</b><small>1명이면 장면의 중심 인물 한 명만 solo로 그려. 채팅방마다 따로 정할 수도 있어.</small></span>${UI.seg('people', [['auto', '자동'], ['1', '1명'], ['2', '최대 2명'], ['3', '최대 3명']], String(s.scene.people))}</div>
          </div>
          <div class="section-title">모델</div>
          <div class="group">
            <div class="item"><span class="label"><b>NovelAI 모델</b><small>${v5 ? 'V5: 캐릭터 칸이 베이스 예산과 따로 · 최대 22명' : 'V4.5: 베이스+캐릭터 합산 512토큰 · 최대 6명'}</small></span>
              <select class="select" data-k="model" style="width:auto">${UI.options(Object.values(Core.MODELS).map(m => [m.id, m.label]), s.model)}</select></div>
            <div class="item"><span class="label"><b>크기</b></span>${UI.seg('size', Object.entries(NAI.SIZES).map(([k, v]) => [k, `${v.label} ${v.w}×${v.h}`]), g.size)}</div>
          </div>
          <div class="section-title">품질</div>
          <div class="group">
            ${v5 ? `<div class="item"><span class="label"><b>퀄리티 태그</b><small>베이스 끝에 붙어 · ${esc(NAI.V5_QUALITY[g.qualityV5] || '없음')}</small></span>${UI.seg('qualityV5', [['none', '없음'], ['light', 'Light'], ['standard', 'Standard']], g.qualityV5)}</div>`
                 : `<div class="item"><span class="label"><b>퀄리티 태그 추가</b><small>NovelAI 서버가 붙여</small></span>${UI.switchHtml('qualityV45', g.qualityV45 !== false)}</div>`}
            <div class="item"><span class="label"><b>UC 프리셋</b></span><select class="select" data-k="gen.ucPreset" data-num style="width:auto">${UI.options(ucOpts, NAI.ucPresetFor(s.model, g.ucPreset))}</select></div>
          </div>
          <div class="section-title">샘플링</div>
          <div class="group">
            ${num('steps', '스텝', 1, '28 이하는 Opus 무료')}
            ${v5 ? num('scaleV5', 'Guidance', 0.1, 'V5 기본 5') : num('scaleV45', 'Guidance', 0.1, 'V4.5 기본 6')}
            ${v5 ? num('rescaleV5', 'Rescale', 0.01) : num('rescaleV45', 'Rescale', 0.01)}
            <div class="item"><span class="label"><b>샘플러</b></span><select class="select" data-k="gen.sampler" style="width:auto">${UI.options([['k_euler_ancestral', 'Euler Ancestral'], ['k_euler', 'Euler'], ['k_dpmpp_2s_ancestral', 'DPM++ 2S Ancestral'], ['k_dpmpp_2m_sde', 'DPM++ 2M SDE'], ['k_dpmpp_2m', 'DPM++ 2M'], ['k_dpmpp_sde', 'DPM++ SDE']], g.sampler)}</select></div>
            <div class="item"><span class="label"><b>노이즈 스케줄</b></span><select class="select" data-k="gen.noise" style="width:auto">${UI.options([['karras', 'Karras'], ['exponential', 'Exponential'], ['polyexponential', 'Polyexponential']], g.noise)}</select></div>
          </div>
          <div class="section-title">인물 배치</div>
          <div class="group">
            <div class="item"><span class="label"><b>좌우 위치 지정</b><small>켜면 AI가 고른 좌·중·우 위치를 NAI에 보내. 2명 이상일 때만 쓰여.</small></span>${UI.switchHtml('useCoords', !!g.useCoords)}</div>
          </div>`;
    }

    // ── 저장 공간 ────────────────────────────────────────
    function storagePane() {
        const f = Store.settings().folder;
        return `
          <div class="section-title">내 컴퓨터 폴더</div>
          <div class="group">
            ${Folder.supported ? `
            <div class="item"><span class="label"><b>폴더에도 저장</b><small>생성할 때마다 PNG를 이 폴더에 바로 써. NovelAI 메타데이터(프롬프트·시드)도 그대로 들어 있어.</small></span>${UI.switchHtml('folder-enabled', !!f.enabled)}</div>
            <div class="item"><span class="label"><b>저장 폴더</b><small data-folder-status>확인 중…</small></span><button class="btn" data-act="folder-pick">폴더 선택…</button><button class="btn hidden" data-act="folder-grant">다시 허용</button></div>
            <div class="item"><span class="label"><b>채팅방마다 하위 폴더</b><small>폴더/채팅방 이름/날짜_제목_시드.png</small></span>${UI.switchHtml('folder-perRoom', f.perRoom !== false)}</div>`
            : `<div class="item"><span class="label"><b>이 브라우저는 폴더 지정을 지원하지 않아</b><small>Chrome · Edge · Whale 에서 쓸 수 있어. 대신 생성할 때마다 다운로드 폴더로 받을 수 있어.</small></span></div>`}
            <div class="item"><span class="label"><b>생성할 때마다 다운로드</b><small>${Folder.supported ? '폴더 저장을 끈 경우에만 · ' : ''}브라우저 다운로드 폴더로 받아</small></span>${UI.switchHtml('folder-download', !!f.download)}</div>
          </div>
          <p class="footnote">채팅 안에 보이는 삽화는 폴더 저장과 상관없이 이 브라우저(IndexedDB)에 따로 보관돼. 브라우저를 다시 열면 폴더 권한을 한 번 더 물어볼 수 있어.</p>

          <div class="section-title">이 브라우저</div>
          <div class="group">
            <div class="item"><span class="label"><b>사용량</b></span><span class="muted" data-usage>계산 중…</span></div>
            <div class="item"><span class="label"><b>이 채팅방 삽화</b></span><span class="muted" data-room-count>…</span><button class="btn" data-act="open-gallery">갤러리</button><button class="btn danger" data-act="clear-room">모두 지우기</button></div>
          </div>
          <p class="footnote">다른 기기와는 공유되지 않아.</p>
          <div class="section-title">정보</div>
          <div class="group">
            <div class="item"><span class="label"><b>Crack Painter</b><small>버전 ${esc(VERSION)}</small></span><a class="btn" href="https://github.com/w7k4x9/crack-painter" target="_blank" rel="noopener">GitHub</a></div>
          </div>`;
    }

    async function fillFolder() {
        const el = win?.el.querySelector('[data-folder-status]');
        if (!el) return;
        const st = await Folder.status();
        const grant = win.el.querySelector('[data-act="folder-grant"]');
        if (!st.set) { el.textContent = '아직 안 골랐어'; grant?.classList.add('hidden'); return; }
        el.innerHTML = `<b style="font-weight:500;color:var(--text)">${esc(st.name)}</b> · ${st.permission === 'granted' ? '<span style="color:var(--green)">쓰기 허용됨</span>' : '<span style="color:var(--orange)">권한 다시 필요</span>'}`;
        grant?.classList.toggle('hidden', st.permission === 'granted');
        win.el.querySelector('[data-act="folder-pick"]').textContent = '변경…';
    }

    async function fillStorage() {
        fillFolder();
        const u = await Store.usage();
        const el = win?.el.querySelector('[data-usage]');
        const fmt = b => b > 1e9 ? `${(b / 1e9).toFixed(1)}GB` : `${Math.round(b / 1e6)}MB`;
        if (el) el.textContent = u ? `${fmt(u.used)} / ${fmt(u.quota)}` : '알 수 없음';
        const roomId = Crack.roomId();
        const rc = win?.el.querySelector('[data-room-count]');
        if (rc) {
            if (!roomId) rc.textContent = '채팅방 밖';
            else {
                const list = await Store.roomRecords(roomId);
                rc.textContent = `${list.length}개 답변 · ${list.reduce((a, r) => a + (r.history?.length || 0), 0)}장`;
            }
        }
    }

    // ── 이벤트 ───────────────────────────────────────────
    function setPath(obj, path, value) {
        const keys = path.split('.');
        let o = obj;
        for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]] = o[keys[i]] || {};
        o[keys[keys.length - 1]] = value;
    }

    function updateChar(fn) {
        Store.update(d => {
            const c = d.characters.find(x => x.id === selChar);
            if (c) fn(c, d);
        });
    }

    let keyTimer = 0;
    function bind() {
        const el = win.el;
        // 키는 입력하는 즉시 저장 (Esc로 창을 닫아도 남게)
        el.addEventListener('input', ev => {
            const t = ev.target;
            if (!t.dataset.secret) return;
            clearTimeout(keyTimer);
            keyTimer = setTimeout(() => saveKey(t.dataset.secret, t.value), 400);
        });
        el.addEventListener('click', async ev => {
            const navBtn = ev.target.closest('[data-pane]');
            if (navBtn) { pane = navBtn.dataset.pane; selChar = null; render(); return; }
            const charBtn = ev.target.closest('[data-char]');
            if (charBtn) { selChar = charBtn.dataset.char; render(); return; }
            const segBtn = ev.target.closest('.seg button');
            if (segBtn) {
                const name = segBtn.parentElement.dataset.seg;
                const v = segBtn.dataset.v;
                Store.update(d => {
                    if (name === 'provider') d.analyzer.provider = v;
                    else if (name === 'size') d.gen.size = v;
                    else if (name === 'qualityV5') d.gen.qualityV5 = v;
                    else if (name === 'people') d.scene.people = v;
                    else if (name === 'room-people' && Crack.roomId()) { const r = d.rooms[Crack.roomId()] = d.rooms[Crack.roomId()] || {}; r.people = v; }
                });
                render();
                return;
            }
            const btn = ev.target.closest('[data-act]');
            if (!btn || btn.closest('.lights')) return;
            const act = btn.dataset.act;
            const roomId = Crack.roomId();
            if (act === 'folder-pick') {
                try {
                    await Folder.pick();
                    Store.update(d => { d.folder.enabled = true; });
                    render();
                    UI.toast({ title: '저장 폴더를 정했어', kind: 'ok', body: '다음 생성부터 이 폴더에도 저장돼.' });
                } catch (e) {
                    if (e?.name !== 'AbortError') App.reportError(e, '폴더를 열지 못했어');
                }
                return;
            }
            if (act === 'open-gallery') { Gallery.open(); return; }
            if (act === 'folder-grant') { await Folder.prime(true); fillFolder(); return; }
            if (act === 'test-nai') testNai();
            else if (act === 'test-llm') testLlm();
            else if (act === 'preset-new') {
                const name = prompt('프리셋 이름', '');
                if (!name) return;
                Store.update(d => { d.presets.push({ id: Store.uid('ps'), name: name.trim().slice(0, 40), pos: d.style.pos, neg: d.style.neg }); });
                render();
            } else if (act === 'preset-apply') {
                Store.update(d => { const p = d.presets.find(x => x.id === btn.dataset.id); if (p) d.style = { pos: p.pos, neg: p.neg ?? d.style.neg }; });
render();
                                UI.toast({ title: '스타일을 바꿨어', kind: 'ok' });
            } else if (act === 'preset-del') {
                Store.update(d => { d.presets = d.presets.filter(x => x.id !== btn.dataset.id); });
                render();
            } else if (act === 'char-new') {
                const id = Store.uid('ch');
                Store.update(d => {
                    d.characters.push({ id, name: '', aliases: [], look: '', outfit: '', uc: '' });
                    if (roomId) { d.rooms[roomId] = d.rooms[roomId] || {}; d.rooms[roomId].chars = [...(d.rooms[roomId].chars || []), id]; }
                });
                selChar = id;
                render();
                win.el.querySelector('[data-c="name"]')?.focus();
            } else if (act === 'char-back') { selChar = null; render(); }
            else if (act === 'char-del') {
                const ok = await App.confirmToast('이 인물을 지울까?', '모든 채팅방에서 빠져.', '삭제', true);
                if (!ok) return;
                const id = selChar;
                Store.update(d => {
                    d.characters = d.characters.filter(x => x.id !== id);
                    Object.values(d.rooms).forEach(r => { if (r.chars) r.chars = r.chars.filter(x => x !== id); });
                });
                selChar = null;
                render();
            } else if (act === 'char-move-style') {
                updateChar((c, d) => {
                    const moved = [];
                    const strip = text => Core.joinTags(Core.splitTags(text).filter(t => {
                        const k = Core.classify(t);
                        if (k === 'style' || k === 'quality') { moved.push(t); return false; }
                        return true;
                    }));
                    c.look = strip(c.look);
                    c.outfit = strip(c.outfit);
                    d.style.pos = Core.joinTags(Core.dedupe([...Core.splitTags(d.style.pos), ...moved]));
                });
                render();
                UI.toast({ title: '스타일로 옮겼어', kind: 'ok', body: '설정 → 스타일에서 확인할 수 있어.' });
            } else if (act === 'goto-chars') { pane = 'chars'; render(); }
            else if (act === 'clear-room') {
                if (!roomId) return;
                const ok = await App.confirmToast('이 채팅방 삽화를 모두 지울까?', '되돌릴 수 없어.', '모두 삭제', true);
                if (!ok) return;
                for (const r of await Store.roomRecords(roomId)) await Store.deleteRecord(roomId, r.messageKey);
                document.querySelectorAll('.cp-figure').forEach(f => f.remove());
                fillStorage();
            }
        });

        el.addEventListener('change', ev => {
            const t = ev.target;
            const roomId = Crack.roomId();
            if (t.dataset.secret) {
                clearTimeout(keyTimer);
                saveKey(t.dataset.secret, t.value);
            } else if (t.dataset.k) {
                const v = t.dataset.num !== undefined ? Number(t.value) : t.value;
                Store.update(d => setPath(d, t.dataset.k, v));
                if (t.dataset.k === 'model') render();
            } else if (t.dataset.c) {
                const field = t.dataset.c;
                updateChar(c => { c[field] = field === 'aliases' ? t.value.split(',').map(a => a.trim()).filter(Boolean) : t.value; });
                if (field === 'look' || field === 'outfit') render();
            } else if (t.dataset.room) {
                if (!roomId) return;
                Store.update(d => { d.rooms[roomId] = { ...(d.rooms[roomId] || {}), [t.dataset.room]: t.value }; });
            } else if (t.dataset.sw) {
                const sw = t.dataset.sw;
                if (sw.startsWith('folder-')) {
                    const key = sw.slice(7);
                    Store.update(d => { d.folder[key] = t.checked; });
                    if (key === 'enabled' && t.checked) Folder.status().then(st => { if (!st.set) win?.el.querySelector('[data-act="folder-pick"]')?.click(); });
                } else if (sw === 'qualityV45') Store.update(d => { d.gen.qualityV45 = t.checked; });
                else if (sw === 'useCoords') Store.update(d => { d.gen.useCoords = t.checked; });
                else if (sw === 'char-room' || sw.startsWith('room-')) {
                    const id = sw === 'char-room' ? selChar : sw.slice(5);
                    if (!roomId) return;
                    Store.update(d => {
                        const r = d.rooms[roomId] = d.rooms[roomId] || {};
                        const set = new Set(r.chars || []);
                        if (t.checked) set.add(id); else set.delete(id);
                        r.chars = Array.from(set);
                    });
                }
            }
        });
    }

    async function testNai() {
        const box = win?.el.querySelector('[data-nai-status]');
        const key = Store.secrets().naiKey;
        if (!box) return;
        if (!key) { box.innerHTML = '<b style="color:var(--red)">토큰이 없어</b>'; return; }
        box.innerHTML = '<small>확인 중…</small>';
        try {
            const d = await Net.request({ url: 'https://image.novelai.net/user/subscription', headers: { Authorization: `Bearer ${key}` }, timeout: 20000 });
            const tier = ['Paper', 'Tablet', 'Scroll', 'Opus'][d?.tier] || `Tier ${d?.tier}`;
            const anlas = (d?.trainingStepsLeft?.fixedTrainingStepsLeft || 0) + (d?.trainingStepsLeft?.purchasedTrainingSteps || 0);
            box.innerHTML = `<b style="color:var(--green)">연결됨</b><small>${esc(tier)} · Anlas ${anlas.toLocaleString()}${d?.active === false ? ' · 구독 비활성' : ''}</small>`;
        } catch (e) {
            box.innerHTML = `<b style="color:var(--red)">실패</b><small>${esc(e.message)}</small>`;
        }
    }

    async function testLlm() {
        const box = win?.el.querySelector('[data-llm-status]');
        if (!box) return;
        const s = Store.settings();
        const k = Store.secrets();
        const p = s.analyzer.provider;
        box.innerHTML = '<small>확인 중…</small>';
        try {
            await LLM.test(p, p === 'deepseek' ? k.deepseekKey : k.geminiKey, p === 'deepseek' ? s.analyzer.deepseekModel : s.analyzer.geminiModel);
            box.innerHTML = '<b style="color:var(--green)">연결됨</b><small>JSON 응답 확인</small>';
        } catch (e) {
            box.innerHTML = `<b style="color:var(--red)">실패</b><small>${esc(e.message)}</small>`;
        }
    }

    return { open };
})();
