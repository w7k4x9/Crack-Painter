// 장면 분석 AI. API 셋(Gemini · Claude · OpenAI)과 ChatGPT 웹 중계.
const AI = (() => {
    const PROVIDERS = {
        gemini: { label: 'Gemini API', key: 'gemini', hint: 'AIza…  (aistudio.google.com/apikey)' },
        claude: { label: 'Claude API', key: 'claude', hint: 'sk-ant-…  (console.anthropic.com)' },
        openai: { label: 'GPT API', key: 'openai', hint: 'sk-…  (platform.openai.com)' },
        chatgpt: { label: 'ChatGPT 웹', key: null, hint: 'chatgpt.com에 로그인만 돼 있으면 돼. 탭을 뒤에서 열어 대신 물어봐.' },
        none: { label: '안 씀', key: null, hint: '인물·감정·장소를 직접 골라서 그려.' }
    };

    async function gemini({ key, model, system, user, signal }) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
        const off = ['HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT'].map(category => ({ category, threshold: 'BLOCK_NONE' }));
        const j = await Net.json({ url, signal, body: { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: user }] }], generationConfig: { temperature: 0.9 }, safetySettings: off } });
        const cand = j?.candidates?.[0];
        const text = (cand?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('');
        if (!text) throw new Error(`Gemini가 답하지 않았어 (${cand?.finishReason || j?.promptFeedback?.blockReason || '이유 없음'}).`);
        return text;
    }

    async function claude({ key, model, system, user, signal }) {
        const j = await Net.json({
            url: 'https://api.anthropic.com/v1/messages', signal,
            headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
            body: { model, max_tokens: 2500, system, messages: [{ role: 'user', content: user }] }
        });
        const text = (j?.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
        if (!text) throw new Error(`Claude가 답하지 않았어 (${j?.stop_reason || '이유 없음'}).`);
        return text;
    }

    async function openai({ key, model, system, user, signal }) {
        const j = await Net.json({
            url: 'https://api.openai.com/v1/chat/completions', signal,
            headers: { Authorization: `Bearer ${key}` },
            body: { model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }
        });
        const text = j?.choices?.[0]?.message?.content || '';
        if (!text) throw new Error(`GPT가 답하지 않았어 (${j?.choices?.[0]?.finish_reason || '이유 없음'}).`);
        return text;
    }

    // ChatGPT 웹: 요청을 저장소에 두고 chatgpt.com 탭을 뒤에서 연다. 그 탭의 relay.js가 답을 돌려준다.
    function chatgpt({ system, user, signal }) {
        return new Promise((resolve, reject) => {
            const id = U.uid('job');
            const text = `${system}\n\n---\n\n${user}\n\n---\n위 출력 형식의 JSON 하나만 \`\`\`json 코드 블록으로 답해.`;
            GM_setValue('cp2.relay.job', { id, text, at: Date.now() });
            const tab = GM_openInTab(`https://chatgpt.com/?cp2job=${id}`, { active: false, insert: true, setParent: true });
            let finished = false;
            const stop = (fn, v) => {
                if (finished) return;
                finished = true;
                clearTimeout(timer);
                try { GM_removeValueChangeListener(listener); } catch (_) { /* 없음 */ }
                try { tab?.close?.(); } catch (_) { /* 이미 닫힘 */ }
                fn(v);
            };
            const listener = GM_addValueChangeListener('cp2.relay.result', (_k, _o, value) => {
                if (!value || value.id !== id) return;
                if (value.error) stop(reject, new Error(`ChatGPT: ${value.error}`));
                else stop(resolve, value.text);
            });
            const timer = setTimeout(() => stop(reject, new Error('ChatGPT가 10분 안에 답하지 않았어.')), 10 * 60000);
            signal?.addEventListener('abort', () => stop(reject, new DOMException('취소됨', 'AbortError')), { once: true });
        });
    }

    async function ask({ provider, model, keys, system, user, signal }) {
        const p = PROVIDERS[provider];
        if (!p || provider === 'none') throw new Error('분석 AI를 안 쓰는 설정이야.');
        const key = p.key ? keys[p.key] : '';
        if (p.key && !key) throw Object.assign(new Error(`${p.label} 키가 없어. 작업실 → 설정 → 연결에서 넣어 줘.`), { pane: 'settings' });
        const fn = { gemini, claude, openai, chatgpt }[provider];
        return fn({ key, model, system, user, signal });
    }

    async function listModels(provider, key) {
        if (provider === 'gemini') {
            const j = await Net.json({ method: 'GET', url: `https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(key)}` });
            return (j.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => m.name.replace(/^models\//, '')).filter(n => /^gemini/.test(n));
        }
        if (provider === 'claude') {
            const j = await Net.json({ method: 'GET', url: 'https://api.anthropic.com/v1/models?limit=100', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' } });
            return (j.data || []).map(m => m.id);
        }
        if (provider === 'openai') {
            const j = await Net.json({ method: 'GET', url: 'https://api.openai.com/v1/models', headers: { Authorization: `Bearer ${key}` } });
            return (j.data || []).map(m => m.id).filter(id => /^(gpt|o\d|chatgpt)/.test(id) && !/audio|realtime|image|tts|transcribe|search|embedding/.test(id)).sort().reverse();
        }
        return [];
    }

    return { PROVIDERS, ask, listModels };
})();
