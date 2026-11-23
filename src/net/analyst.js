// Analyst — 채팅 답변을 읽고 그릴 장면을 JSON으로 받아 온다 (Gemini / DeepSeek).
// AI 몫은 장면과 인물별 행동뿐이다. 작가·화풍·퀄리티는 사용자가 정하고, 섞여 와도 Compose가 걸러 낸다.
const Analyst = (() => {
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

    // ── 지시문 ──────────────────────────────────────────
    function system(family) {
        const v5 = family === 'v5';
        const sceneCaption = v5 ? '영어 현재형 짧은 문장 1~3개. 인물·사물의 공간 배치, 빛이 오는 방향, 앞뒤 거리감, 시선이 흐르는 방향' : '빈 문자열';
        const charCaption = v5 ? '이 인물에게만 해당하는 영어 문장 0~2개 (향한 방향, 거리, 태그로 못 쓰는 복합 동작)' : '빈 문자열';
        return `역할: 롤플레이 채팅 답변 하나를 NovelAI 삽화 한 장으로 바꾸는 연출 담당.
할 일: 대상 답변에서 멈춘 그림 한 장으로 담을 수 있는 딱 한 순간을 골라, 아래 모양의 JSON 하나만 돌려준다. JSON 밖에 아무것도 쓰지 않는다(설명, 코드펜스 없음).

{
  "insertAfterParagraph": 0,
  "title": "장면 제목, 한국어 15자 이내",
  "moment": "고른 순간을 한국어 한 문장으로",
  "scene": {
    "composition": "카메라 거리와 각도 Danbooru 태그 (예: cowboy shot, from side)",
    "tags": "장소, 배경, 시간대, 날씨, 조명, 꼭 필요한 소품 Danbooru 태그",
    "caption": "${sceneCaption}"
  },
  "characters": [
    {
      "id": "등록 인물이면 그 id, 아니면 빈 문자열",
      "name": "등록 인물은 등록 이름 그대로, 아니면 짧은 한국어 호칭",
      "look": "등록 안 된 인물만 채운다: 1girl/1boy 같은 성별 하나 + 외형 + 옷 태그. 등록 인물은 빈 문자열",
      "tags": "이 인물의 자세, 표정, 시선, 동작 Danbooru 태그",
      "caption": "${charCaption}",
      "position": "left | center | right",
      "outfit": { "mode": "keep | replace | modify", "add": "", "remove": "" }
    }
  ]
}

규칙 1 · 칸마다 맡은 것이 따로 있다
- 작가, 화풍, 퀄리티, 연도 태그(artist:…, masterpiece, very aesthetic, year 2024, …style 같은 것)는 어디에도 쓰지 않는다. 사용자가 따로 정해 둔다.
- 인원수 태그(1girl, 2boys, solo …)는 scene 과 tags 에 쓰지 않는다. 프로그램이 직접 센다. 예외는 미등록 인물 look 의 성별 태그 하나.
- 등록 인물의 머리색, 눈색, 체형, 평소 옷은 다시 쓰지 않는다. 이미 저장돼 있다.
- outfit 은 이 장면에서 옷이 실제로 바뀐 경우에만 replace 나 modify 로 쓴다. 예: 재킷을 벗었다 → modify, remove "jacket".
- 이름과 고유명사는 tags 에도 caption 에도 넣지 않는다. caption 에서 인물을 가리킬 때는 "the man on the right" 처럼 화면 속 위치로 부른다.

규칙 2 · 원문에 있는 것만
- 대상 답변과 앞 대화에 나온 것만 그린다. 원문에 없는 스킨십, 표정, 소품, 노출을 지어내지 않는다.
- 다른 시점에 일어난 동작들을 한 화면에 합치지 않는다. 대사 속의 상상이나 계획은 그리지 않는다.
- characters 에는 그 순간 화면에 실제로 보이는 인물만 넣는다. 1인칭 화자 본인은 넣지 않는다.
- insertAfterParagraph 는 고른 순간이 끝나는 문단의 번호다.

규칙 3 · 태그 쓰는 법
- 쉼표로 구분한 영어 Danbooru 태그. 널리 쓰이고 결과가 안정적인 태그로 짧게.
- 뜻이 같은 분위기 형용사를 여러 개 겹쳐 쓰지 않는다.
${v5
        ? '- V5 는 문장을 잘 알아듣는다. 태그로는 빠지기 쉬운 관계, 배치, 빛의 방향은 caption 에 영어 문장으로 쓴다. 감정을 선언하거나 줄거리를 요약하는 문장은 쓰지 않는다.'
        : '- V4.5 는 문장보다 태그가 안정적이다. caption 은 전부 빈 문자열로 둔다.'}`;
    }

    function castRule(people, focus) {
        const n = Number(people);
        if (!n) return '';
        const who = focus ? ` 한 명만 그릴 때는 '${focus.name}'(id=${focus.id})를 그린다.` : '';
        if (n === 1) return `[인원 · 가장 먼저 지킬 것] characters 에는 딱 1명만 넣는다. 장면의 중심 인물 한 명을 혼자(solo) 있는 구도로 그리고, 다른 인물은 화면 밖에 둔다. 손이나 뒷모습 같은 일부도 넣지 않는다.${who}`;
        return `[인원 · 가장 먼저 지킬 것] characters 는 ${n}명까지. 중요한 인물부터 순서대로 넣는다.${who}`;
    }

    // 카메라 기본값: 유저(1인칭 화자)가 자기 눈높이에서 몰래 찍은 스냅사진처럼.
    function cameraRule(camera) {
        if (camera === 'free') return '';
        return `[카메라 · 기본]
- 이 그림은 유저(1인칭 화자)의 눈높이에서 찍힌 스냅사진 한 장이다. scene.composition 맨 앞에 pov, candid shot, snapshot 을 넣는다.
- 인물은 카메라를 모르는 듯 자연스러운 순간으로 잡는다. 포즈를 잡거나 정면으로 서 있는 증명사진, 전신 컷은 피한다.
- looking at viewer 는 원문에서 인물이 유저를 보고 있을 때만 쓴다. 아니면 하던 동작과 시선을 그대로 둔다.
- 거리와 각도는 유저가 실제로 있는 자리를 기준으로 정한다 (마주 앉음 → 정면 가까이, 옆에 누움 → from side 가까이, 올려다봄 → from below).
- 그 순간 원문에서 유저의 손이나 팔이 화면에 들어온다면 composition 에 pov hands 를 넣는다. 유저의 얼굴과 몸은 그리지 않는다.`;
    }

    function user({ characters, note, context, paragraphs, fixedParagraph, request, people, focus, camera }) {
        const cast = characters.length
            ? characters.map(c => {
                const alias = c.aliases?.length ? ` | 별칭=${c.aliases.join(', ')}` : '';
                const look = Tags.join([c.look, c.outfit]).slice(0, 200);
                return `- id=${c.id} | 이름=${c.name}${alias} | 외형(참고만, 다시 쓰지 말 것)=${look}`;
            }).join('\n')
            : '(등록 인물 없음 · 화면에 나오는 인물은 모두 미등록으로 보고 look 을 채운다)';
        const blocks = [
            `[등록 인물]\n${cast}`,
            note && `[세계관·장소 메모]\n${note}`,
            context && `[앞 대화]\n${context}`,
            `[대상 답변 · 앞의 숫자가 문단 번호]\n${paragraphs.map(p => `[${p.index}] ${p.text}`).join('\n')}`,
            Number.isInteger(fixedParagraph) && `[고정] insertAfterParagraph=${fixedParagraph} 문단의 순간을 그린다. 다른 장면으로 바꾸지 않는다.`,
            castRule(people, focus),
            cameraRule(camera),
            request && `[사용자 수정 요청 · 가장 우선]\n${request}`
        ];
        return blocks.filter(Boolean).join('\n\n');
    }

    // ── Gemini ──────────────────────────────────────────
    function geminiConfig(model, thinking) {
        const cfg = {};
        const m = String(model);
        const newFlash = /^gemini-3\.(?:6|7|8)-flash$/.test(m);
        if (!newFlash) Object.assign(cfg, { temperature: 0.3, topP: 0.9 });
        if (m === 'gemini-3.8-flash') cfg.responseFormat = { text: { mimeType: 'application/json' } };
        else cfg.responseMimeType = 'application/json';
        if (m.startsWith('gemini-3')) {
            const level = { fast: 'low', normal: 'medium', deep: 'high' }[thinking] || (m === 'gemini-3.8-flash' ? 'medium' : '');
            if (level) cfg.thinkingConfig = { thinkingLevel: level };
        }
        return cfg;
    }

    const OPEN_SAFETY = ['SEXUALLY_EXPLICIT', 'HATE_SPEECH', 'HARASSMENT', 'DANGEROUS_CONTENT'].map(c => ({ category: `HARM_CATEGORY_${c}`, threshold: 'BLOCK_NONE' }));
    const wait = ms => new Promise(r => setTimeout(r, ms));

    async function gemini({ key, model, thinking, sys, prompt, signal }) {
        if (!key) throw Object.assign(new Error('Gemini 키가 없어. 설정 → 연결에서 넣어줘.'), { code: 'NO_KEY', pane: 'api' });
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
        const body = {
            systemInstruction: { parts: [{ text: sys }] },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: geminiConfig(model, thinking),
            safetySettings: OPEN_SAFETY
        };
        const post = () => Http.send({ method: 'POST', url, headers: { 'Content-Type': 'application/json' }, data: body, signal, timeout: 120000 });
        let res;
        try {
            res = await post();
        } catch (e) {
            if (e.status === 400 && /mime|responseFormat|response_format|json/i.test(e.message)) {
                // 이 모델이 JSON 출력 옵션을 모르면 그 옵션만 빼고 다시
                delete body.generationConfig.responseFormat;
                delete body.generationConfig.responseMimeType;
                res = await post();
            } else if (e.status === 503 || e.status === 429) {
                await wait(2500);
                res = await post();
            } else {
                throw e;
            }
        }
        if (res?.promptFeedback?.blockReason) throw new Error(`Gemini가 요청을 막았어 (${res.promptFeedback.blockReason}).`);
        const first = res?.candidates?.[0];
        const reply = (first?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('').trim();
        if (!reply) throw new Error(`Gemini 응답이 비었어${first?.finishReason ? ` (${first.finishReason})` : ''}.`);
        return reply;
    }

    // ── DeepSeek ────────────────────────────────────────
    async function deepseek({ key, model, thinking, sys, prompt, signal }) {
        if (!key) throw Object.assign(new Error('DeepSeek 키가 없어. 설정 → 연결에서 넣어줘.'), { code: 'NO_KEY', pane: 'api' });
        const body = {
            model,
            messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }],
            stream: false,
            response_format: { type: 'json_object' }
        };
        if (thinking === 'fast') body.thinking = { type: 'disabled' };
        else Object.assign(body, { thinking: { type: 'enabled' }, reasoning_effort: thinking === 'deep' ? 'max' : 'high' });
        const post = () => Http.send({
            method: 'POST', url: 'https://api.deepseek.com/chat/completions',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
            data: body, signal, timeout: 180000
        });
        let res;
        try {
            res = await post();
        } catch (first) {
            // 400이면 선택 옵션(생각 모드, JSON 강제)을 빼고 한 번만 더. 또 실패하면 처음 오류를 보여 준다.
            if (first.status !== 400) throw first;
            ['thinking', 'reasoning_effort', 'response_format'].forEach(k => delete body[k]);
            try { res = await post(); } catch (_) { throw first; }
        }
        const reply = String(res?.choices?.[0]?.message?.content || '').trim();
        if (!reply) throw new Error('DeepSeek 응답이 비었어.');
        return reply;
    }

    function ask(provider, opts) {
        return provider === 'deepseek' ? deepseek(opts) : gemini(opts);
    }

    async function run(input, { prefs, keys, signal }) {
        const a = prefs.analyzer;
        const deep = a.provider === 'deepseek';
        const reply = await ask(a.provider, {
            key: deep ? keys.deepseekKey : keys.geminiKey,
            model: deep ? a.deepseekModel : a.geminiModel,
            thinking: a.thinking,
            sys: system(Models.get(prefs.model).family),
            prompt: user(input),
            signal
        });
        return Plan.parse(reply);
    }

    async function ping(provider, key, model) {
        return Plan.parse(await ask(provider, { key, model, thinking: 'fast', sys: 'Reply with JSON only.', prompt: 'Return {"ok":true}' }));
    }

    return { GEMINI_MODELS, DEEPSEEK_MODELS, system, user, run, ping };
})();
