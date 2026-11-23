// Http — GM_xmlhttpRequest를 Promise로. 실패하면 사람 말로 된 오류를 만든다.
const Http = (() => {
    'use strict';

    const SERVICES = [[/novelai\.net/, 'NovelAI'], [/googleapis\.com/, 'Gemini'], [/deepseek\.com/, 'DeepSeek']];
    const serviceOf = url => (SERVICES.find(([re]) => re.test(String(url || ''))) || [null, '서버'])[1];

    const STATUS_WORDS = {
        400: '요청 형식 오류', 401: '키가 틀렸거나 만료됐어', 402: 'Anlas(결제 잔액)가 부족해', 403: '권한이 없어',
        404: '주소나 모델을 찾지 못했어', 409: '이미 다른 생성이 진행 중이야', 429: '요청이 너무 잦아 · 잠깐 뒤에 다시',
        500: '서버 오류', 503: '서버가 바빠'
    };

    function detailOf(text) {
        try {
            const j = JSON.parse(text);
            return j?.error?.message || j?.message || (typeof j?.error === 'string' ? j.error : '') || '';
        } catch (_) {
            return String(text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
        }
    }

    // 서비스마다 흔한 실패는 원인과 고칠 곳(pane)을 같이 알려 준다.
    function known(service, status, detail) {
        if (service === 'Gemini' && (status === 403 || /API key not valid|API_KEY_INVALID|api key/i.test(detail))) {
            return { text: 'Gemini 키가 올바르지 않아. NovelAI 토큰(pst-…)이 아니라 Google AI Studio에서 받은 AIza… 키를 넣어야 해.', pane: 'api' };
        }
        if (service === 'DeepSeek' && status === 401) return { text: 'DeepSeek 키가 올바르지 않아.', pane: 'api' };
        if (service === 'NovelAI') {
            if (status === 401) return { text: 'NovelAI 토큰이 틀렸거나 만료됐어. NovelAI 설정에서 새 토큰을 받아 넣어줘.', pane: 'api' };
            if (status === 402) return { text: 'NovelAI 구독이 없거나 Anlas가 부족해.' };
            if (status === 400) return { text: `NovelAI가 요청 내용을 거부했어. 토큰 문제는 아니야(토큰이 틀리면 401이 떠).${detail ? ` 서버 메시지: ${detail}` : ''}` };
        }
        return null;
    }

    function cancelled() {
        return Object.assign(new Error('취소했어.'), { name: 'AbortError' });
    }

    function bodyText(res) {
        if (typeof res.responseText === 'string' && res.responseText) return res.responseText;
        if (res.response instanceof ArrayBuffer) {
            try { return new TextDecoder().decode(new Uint8Array(res.response).subarray(0, 4000)); } catch (_) { return ''; }
        }
        return String(res.response || '');
    }

    function failure(url, res) {
        const text = bodyText(res);
        const service = serviceOf(url);
        const detail = detailOf(text);
        const hit = known(service, res.status, detail);
        const message = hit ? hit.text : `${service}: ${STATUS_WORDS[res.status] || '요청 실패'} (HTTP ${res.status})${detail ? ` · ${detail}` : ''}`;
        const err = Object.assign(new Error(message), { status: res.status, service, body: text });
        if (hit?.pane) err.pane = hit.pane;
        return err;
    }

    /** raw: data를 그대로 보냄(FormData 등). 아니면 JSON으로. responseType 'arraybuffer' 면 버퍼, 아니면 JSON을 돌려준다. */
    function send({ method = 'GET', url, headers = {}, data, raw = false, responseType = 'text', timeout = 120000, signal, onFail }) {
        return new Promise((resolve, reject) => {
            if (signal?.aborted) { reject(cancelled()); return; }
            let settled = false;
            let handle = null;
            const settle = (fn, value) => {
                if (settled) return;
                settled = true;
                signal?.removeEventListener?.('abort', stop);
                fn(value);
            };
            const stop = () => {
                try { handle?.abort?.(); } catch (_) { /* 이미 끝남 */ }
                settle(reject, cancelled());
            };
            signal?.addEventListener?.('abort', stop, { once: true });
            handle = GM_xmlhttpRequest({
                method, url, headers, timeout, responseType,
                data: data == null ? undefined : raw ? data : JSON.stringify(data),
                onload: res => {
                    if (res.status < 200 || res.status >= 300) {
                        const err = failure(url, res);
                        try { onFail?.(err); } catch (_) { /* 진단 정보는 없어도 됨 */ }
                        settle(reject, err);
                        return;
                    }
                    if (responseType === 'arraybuffer') { settle(resolve, res.response); return; }
                    try { settle(resolve, JSON.parse(res.responseText)); } catch (_) { settle(reject, new Error('응답을 JSON으로 읽지 못했어.')); }
                },
                onerror: () => settle(reject, new Error('네트워크 오류 · 연결이나 확장 프로그램의 도메인 허용을 확인해줘.')),
                ontimeout: () => settle(reject, new Error('응답 시간이 초과됐어.')),
                onabort: () => settle(reject, cancelled())
            });
        });
    }

    return { send, cancelled };
})();
