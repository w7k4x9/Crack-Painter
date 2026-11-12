// ─────────────────────────────────────────────────────────────
// LLM: 채팅 답변 → 장면 계획(JSON). Gemini(AI Studio) / DeepSeek
// AI에게는 "장면"과 "인물별 행동"만 맡긴다. 작가·화풍·퀄리티는 사용자의 몫이라
// 지시문에서 금지하고, 혹시 넣어도 Core.assemble 이 걸러낸다.
// ─────────────────────────────────────────────────────────────
const LLM = (() => {
    'use strict';

    const GEMINI_MODELS = Object.freeze([
        ['gemini-3.8-flash', 'Gemini 3.8 Flash'],
        ['gemini-3.7-flash', 'Gemini 3.7 Flash'],
        ['gemini-3.6-flash', 'Gemini 3.6 Flash'],
        ['gemini-3.5-flash', 'Gemini 3.5 Flash'],
        ['gemini-3.5-flash-lite', 'Gemini 3.5 Flash-Lite'],
        ['gemini-3.1-flash-lite', 'Gemini 3.1 Flash-Lite'],
        ['gemini-3.1-pro-preview', 'Gemini 3.1 Pro (Preview)'],
        ['gemini-3-flash-preview', 'Gemini 3 Flash (Preview)']
    ]);
    const DEEPSEEK_MODELS = Object.freeze([
        ['deepseek-v4-flash', 'DeepSeek V4 Flash'],
        ['deepseek-v4-pro', 'DeepSeek V4 Pro']
    ]);
    const SAFETY = ['HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_DANGEROUS_CONTENT']
        .map(category => ({ category, threshold: 'BLOCK_NONE' }));

    function instruction(family) {
        const v5 = family === 'v5';
        return `너는 롤플레이 채팅의 한 장면을 NovelAI 삽화로 옮기는 장면 연출가다.
대상 답변에서 정지 그림 한 장에 담을 수 있는 "정확한 한순간"을 고르고, 아래 JSON 하나만 출력한다. 설명·코드펜스 금지.

{
  "insertAfterParagraph": 0,
  "title": "한국어 장면 제목(15자 이내)",
  "moment": "고른 순간을 한국어 한 문장으로",
  "scene": {
    "composition": "카메라 거리·각도 Danbooru 태그 (예: cowboy shot, from side)",
    "tags": "장소·배경·시간·날씨·조명·핵심 소품 Danbooru 태그",
    "caption": "${v5 ? '영어 현재형 짧은 문장 1~3개: 공간 배치, 광원 방향, 깊이, 시선 흐름' : '빈 문자열'}"
  },
  "characters": [
    {
      "id": "등록 인물이면 그 id, 아니면 빈 문자열",
      "name": "등록 이름 그대로 (미등록이면 짧은 한국어 호칭)",
      "look": "미등록 인물만: 1girl/1boy 같은 성별 + 외형 + 의상 태그. 등록 인물은 빈 문자열",
      "tags": "이 인물의 자세·표정·시선·행동 Danbooru 태그",
      "caption": "${v5 ? '이 인물만의 영어 문장 0~2개 (방향·거리·복합 행동)' : '빈 문자열'}",
      "position": "left | center | right",
      "outfit": { "mode": "keep | replace | modify", "add": "", "remove": "" }
    }
  ]
}

[칸의 주인 — 절대 섞지 않는다]
- 작가·화풍·퀄리티·연도 태그(artist:, masterpiece, very aesthetic, year 2024, ~style 등)는 쓰지 않는다. 사용자가 따로 고정한다.
- 인원수 태그(1girl, 2boys, solo 등)는 scene과 tags에 쓰지 않는다. 프로그램이 센다. (미등록 인물의 look 에만 1girl/1boy 하나)
- 등록 인물의 머리색·눈색·체형·기본 의상은 쓰지 않는다. 이미 저장돼 있다.
- 의상이 장면에서 바뀌었을 때만 outfit 을 replace/modify 로 쓴다 (예: 재킷을 벗음 → modify, remove "jacket").
- 이름·고유명사는 tags/caption 어디에도 쓰지 않는다. caption 에서는 "the woman on the left"처럼 화면 위치로 부른다.

[사실]
- 대상 답변과 최근 맥락에 근거한 것만 그린다. 원문에 없는 접촉·표정·소품·노출을 만들지 않는다.
- 서로 다른 시점의 행동을 한 프레임에 합치지 않는다. 대사 속 상상·계획은 그리지 않는다.
- characters 에는 그 순간 화면에 실제로 보이는 인물만 넣는다. 1인칭 시점의 화자는 넣지 않는다.
- insertAfterParagraph 는 그 순간이 끝나는 문단 번호.

[태그]
- 영어 Danbooru 태그, 쉼표로 구분. 흔하고 안정적인 태그 위주로 짧게.
- 같은 뜻의 분위기 형용사를 쌓지 않는다.${v5 ? '\n- V5 는 문장을 잘 이해한다. 태그로 손실되는 관계·배치·광원은 caption 에 영어 문장으로 쓴다. 감정 선언이나 줄거리 요약은 쓰지 않는다.' : '\n- V4.5 는 문장보다 태그가 안정적이다. caption 은 모두 빈 문자열.'}`;
    }

    function peopleRule(people, focus) {
        const n = Number(people);
        if (!n) return '';
        const who = focus ? ` 한 명만 그릴 때는 '${focus.name}'(id=${focus.id})를 그린다.` : '';
        return n === 1
            ? `[인원 · 최우선] characters 에는 정확히 1명만 넣는다. 장면의 중심 인물 한 명을 단독(solo) 구도로 그리고, 다른 인물은 화면 밖에 두거나 손·뒷모습 같은 일부도 넣지 않는다.${who}`
            : `[인원 · 최우선] characters 는 최대 ${n}명. 중요한 순서대로 넣는다.${who}`;
    }

    function userPrompt({ characters, note, context, paragraphs, fixedParagraph, request, people, focus }) {
        const chars = characters.length
            ? characters.map(c => `- id=${c.id} | 이름=${c.name}${c.aliases?.length ? ` | 별칭=${c.aliases.join(', ')}` : ''} | 외형(참고용, 다시 쓰지 말 것)=${Core.joinTags([c.look, c.outfit]).slice(0, 200)}`).join('\n')
            : '(등록된 인물 없음 · 보이는 인물은 모두 미등록으로 look 을 채운다)';
        const paras = paragraphs.map(p => `[${p.index}] ${p.text}`).join('\n');
        return [
            `[등록 인물]\n${chars}`,
            note ? `[세계관·장소 메모]\n${note}` : '',
            context ? `[최근 맥락 · 이전 대화]\n${context}` : '',
            `[대상 답변 · 문단 번호]\n${paras}`,
            Number.isInteger(fixedParagraph) ? `[고정] insertAfterParagraph=${fixedParagraph} 인 문단의 순간을 그린다. 다른 장면으로 옮기지 않는다.` : '',
            peopleRule(people, focus),
            request ? `[사용자 수정 요청 · 최우선]\n${request}` : ''
        ].filter(Boolean).join('\n\n');
    }

    function geminiConfig(model, thinking) {
        const cfg = {};
        const m = String(model);
        if (!/^gemini-3\.(?:6|7|8)-flash$/.test(m)) {
            cfg.temperature = 0.3;
            cfg.topP = 0.9;
        }
        if (m === 'gemini-3.8-flash') cfg.responseFormat = { text: { mimeType: 'application/json' } };
        else cfg.responseMimeType = 'application/json';
        const level = { fast: 'low', normal: 'medium', deep: 'high' }[thinking];
        if (/^gemini-3/.test(m)) {
            if (level) cfg.thinkingConfig = { thinkingLevel: level };
            else if (m === 'gemini-3.8-flash') cfg.thinkingConfig = { thinkingLevel: 'medium' };
        }
        return cfg;
    }

    async function callGemini({ key, model, thinking, system, user, signal }) {
        if (!key) throw Object.assign(new Error('Gemini 키가 없어. 설정 → 연결에서 넣어줘.'), { code: 'NO_KEY', pane: 'api' });
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
        const body = {
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: user }] }],
            generationConfig: geminiConfig(model, thinking),
            safetySettings: SAFETY
        };
        let data;
        try {
            data = await Net.request({ method: 'POST', url, headers: { 'Content-Type': 'application/json' }, data: body, signal, timeout: 120000 });
        } catch (e) {
            // JSON 출력 설정을 모델이 거부하면 그 설정만 빼고 한 번 더
            if (e.status === 400 && /mime|responseFormat|response_format|json/i.test(e.message)) {
                delete body.generationConfig.responseFormat;
                delete body.generationConfig.responseMimeType;
                data = await Net.request({ method: 'POST', url, headers: { 'Content-Type': 'application/json' }, data: body, signal, timeout: 120000 });
            } else if (e.status === 503 || e.status === 429) {
                await new Promise(r => setTimeout(r, 2500));
                data = await Net.request({ method: 'POST', url, headers: { 'Content-Type': 'application/json' }, data: body, signal, timeout: 120000 });
            } else {
                throw e;
            }
        }
        const block = data?.promptFeedback?.blockReason;
        if (block) throw new Error(`Gemini가 요청을 막았어 (${block}).`);
        const cand = data?.candidates?.[0];
        const text = (cand?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('').trim();
        if (!text) throw new Error(`Gemini 응답이 비었어${cand?.finishReason ? ` (${cand.finishReason})` : ''}.`);
        return text;
    }

    async function callDeepSeek({ key, model, thinking, system, user, signal }) {
        if (!key) throw Object.assign(new Error('DeepSeek 키가 없어. 설정 → 연결에서 넣어줘.'), { code: 'NO_KEY', pane: 'api' });
        const body = {
            model,
            messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
            stream: false,
            response_format: { type: 'json_object' },
            ...(thinking === 'fast' ? { thinking: { type: 'disabled' } } : { thinking: { type: 'enabled' }, reasoning_effort: thinking === 'deep' ? 'max' : 'high' })
        };
        const send = () => Net.request({
            method: 'POST',
            url: 'https://api.deepseek.com/chat/completions',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
            data: body,
            signal,
            timeout: 180000
        });
        let data;
        try {
            data = await send();
        } catch (e) {
            // 400이면 선택 옵션(생각 모드·JSON 강제)을 빼고 한 번만 다시. 그래도 안 되면 원래 오류를 보여준다.
            if (e.status !== 400) throw e;
            delete body.thinking;
            delete body.reasoning_effort;
            delete body.response_format;
            try { data = await send(); } catch (_) { throw e; }
        }
        const text = String(data?.choices?.[0]?.message?.content || '').trim();
        if (!text) throw new Error('DeepSeek 응답이 비었어.');
        return text;
    }

    async function analyze(input, { settings, secrets, signal }) {
        const family = Core.model(settings.model).family;
        const system = instruction(family);
        const user = userPrompt(input);
        const a = settings.analyzer;
        const text = a.provider === 'deepseek'
            ? await callDeepSeek({ key: secrets.deepseekKey, model: a.deepseekModel, thinking: a.thinking, system, user, signal })
            : await callGemini({ key: secrets.geminiKey, model: a.geminiModel, thinking: a.thinking, system, user, signal });
        return Core.parseJsonLoose(text);
    }

    async function test(provider, key, model) {
        const system = 'Reply with JSON only.';
        const user = 'Return {"ok":true}';
        const text = provider === 'deepseek'
            ? await callDeepSeek({ key, model, thinking: 'fast', system, user })
            : await callGemini({ key, model, thinking: 'fast', system, user });
        return Core.parseJsonLoose(text);
    }

    return { GEMINI_MODELS, DEEPSEEK_MODELS, instruction, userPrompt, analyze, test };
})();
