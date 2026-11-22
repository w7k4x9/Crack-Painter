// NovelAI 이미지 생성 요청.
// V4.5: JSON 본문, params_version 3. V5: multipart('request' 파트), params_version 4, msgpack 스트림.
const NAI = (() => {
    const ENDPOINT = 'https://image.novelai.net/ai/generate-image';
    const SIZES = { landscape: [1216, 832], wide: [1472, 704], square: [1024, 1024] };

    function payload(out, gen, seed) {
        const [width, height] = SIZES[gen.size] || SIZES.landscape;
        const coords = out.chars.length > 1 && gen.coords !== false;
        const charPos = out.chars.map(c => ({ char_caption: c.prompt, centers: [c.center] }));
        const charNeg = out.chars.map(c => ({ char_caption: c.neg, centers: [c.center] }));
        const common = {
            width, height,
            scale: Number(gen.scale),
            cfg_rescale: Number(gen.rescale),
            sampler: gen.sampler,
            noise_schedule: gen.noise,
            steps: Number(gen.steps),
            seed,
            n_samples: 1,
            negative_prompt: out.baseNeg,
            dynamic_thresholding: false,
            controlnet_strength: 1,
            legacy: false,
            legacy_v3_extend: false,
            add_original_image: true,
            deliberate_euler_ancestral_bug: false,
            prefer_brownian: true
        };
        if (out.model.v5) {
            return {
                input: out.base,
                model: out.model.id,
                action: 'generate',
                use_new_shared_trial: true,
                parameters: {
                    ...common,
                    params_version: 4,
                    ucPresetId: 'none',
                    qualityPresetId: 'none',
                    tag_hint_qt: 0,
                    tag_hint_uc_preset: 0,
                    autoSmea: false,
                    use_coords: coords,
                    legacy_uc: false,
                    normalize_reference_strength_multiple: true,
                    inpaintImg2ImgStrength: 1,
                    characterPrompts: [],
                    straight_alpha: true,
                    v4_prompt: { caption: { base_caption: out.base, char_captions: charPos }, use_coords: coords, use_order: true },
                    v4_negative_prompt: { caption: { base_caption: out.baseNeg, char_captions: charNeg }, legacy_uc: false },
                    image_format: 'png',
                    stream: 'msgpack'
                }
            };
        }
        return {
            input: out.base,
            model: out.model.id,
            action: 'generate',
            parameters: {
                ...common,
                params_version: 3,
                uc: out.baseNeg,
                ucPreset: 2,
                qualityToggle: true,
                sm: false,
                sm_dyn: false,
                uncond_scale: 1,
                reference_information_extracted_multiple: [],
                reference_strength_multiple: [],
                v4_prompt: { caption: { base_caption: out.base, char_captions: charPos }, use_coords: coords, use_order: true, legacy_uc: false },
                v4_negative_prompt: { caption: { base_caption: out.baseNeg, char_captions: charNeg }, use_coords: coords, use_order: true, legacy_uc: false }
            }
        };
    }

    // ── 응답에서 이미지 꺼내기 ─────────────────────────────
    const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

    function indexOf(bytes, sig, from = 0) {
        for (let i = from; i <= bytes.length - sig.length; i++) {
            let ok = true;
            for (let j = 0; j < sig.length; j++) if (bytes[i + j] !== sig[j]) { ok = false; break; }
            if (ok) return i;
        }
        return -1;
    }

    // PNG 청크를 따라가 IEND까지 자른다. 스트림에는 미리보기 PNG가 여럿 올 수 있어 마지막 완성본을 고른다.
    function lastPng(bytes) {
        let found = null;
        let at = indexOf(bytes, PNG_SIG);
        while (at >= 0) {
            let p = at + 8;
            let end = -1;
            while (p + 12 <= bytes.length) {
                const len = (bytes[p] * 2 ** 24) + (bytes[p + 1] << 16) + (bytes[p + 2] << 8) + bytes[p + 3];
                if (p + 12 + len > bytes.length) break;
                const type = String.fromCharCode(bytes[p + 4], bytes[p + 5], bytes[p + 6], bytes[p + 7]);
                p += 12 + len;
                if (type === 'IEND') { end = p; break; }
            }
            if (end > 0) found = bytes.subarray(at, end);
            at = indexOf(bytes, PNG_SIG, at + 8);
        }
        return found;
    }

    function readError(bytes) {
        const text = new TextDecoder().decode(bytes.subarray(0, 3000)).trim();
        try {
            const j = JSON.parse(text);
            return j.message || j.error || text;
        } catch (_) {
            return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 300);
        }
    }

    function image(buffer) {
        const bytes = new Uint8Array(buffer);
        if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
            const files = fflate.unzipSync(bytes);
            const name = Object.keys(files).find(n => /\.(png|webp|jpe?g)$/i.test(n));
            if (!name) throw new Error('NAI가 보낸 압축 파일에 그림이 없어.');
            return new Blob([files[name]], { type: /\.webp$/i.test(name) ? 'image/webp' : 'image/png' });
        }
        const png = lastPng(bytes);
        if (png) return new Blob([png], { type: 'image/png' });
        throw new Error(readError(bytes) || 'NAI 응답에서 그림을 찾지 못했어.');
    }

    function check(p) {
        const q = p.parameters;
        const bad = [];
        if (!(q.steps >= 1 && q.steps <= 50)) bad.push(`스텝 ${q.steps}`);
        if (!(q.scale >= 0 && q.scale <= 10)) bad.push(`가이던스 ${q.scale}`);
        if (!(q.cfg_rescale >= 0 && q.cfg_rescale <= 1)) bad.push(`리스케일 ${q.cfg_rescale}`);
        if (!String(p.input).trim()) bad.push('베이스가 비어 있음');
        if (bad.length) throw new Error(`생성 값이 잘못됐어: ${bad.join(', ')}`);
    }

    async function generate({ out, gen, token, seed, signal }) {
        if (!token) throw Object.assign(new Error('NovelAI 토큰이 없어. 작업실 → 설정 → 연결에서 넣어 줘.'), { pane: 'settings' });
        const useSeed = Number.isFinite(Number(seed)) && String(seed).trim() !== '' ? Number(seed) : Math.floor(Math.random() * 4294967295);
        const body = payload(out, gen, useSeed);
        check(body);
        let data;
        const headers = { Authorization: `Bearer ${token}` };
        if (out.model.v5) {
            data = new FormData();
            data.append('request', new Blob([JSON.stringify(body)], { type: 'application/json' }), 'blob');
        } else {
            data = JSON.stringify(body);
            headers['Content-Type'] = 'application/json';
        }
        const res = await Net.send({ method: 'POST', url: ENDPOINT, headers, data, responseType: 'arraybuffer', timeout: 180000, signal });
        if (res.status >= 400) throw Object.assign(new Error(`NovelAI ${res.status}: ${readError(new Uint8Array(res.response || new ArrayBuffer(0)))}`), { status: res.status });
        return { blob: image(res.response), seed: useSeed, body };
    }

    async function checkToken(token) {
        const res = await Net.send({ method: 'GET', url: 'https://image.novelai.net/user/subscription', headers: { Authorization: `Bearer ${token}` }, responseType: 'json', timeout: 20000 });
        if (res.status >= 400) throw new Error(res.status === 401 ? '토큰이 맞지 않아.' : `확인 실패 (${res.status})`);
        const tier = ['무료', 'Tablet', 'Scroll', 'Opus'][res.response?.tier] || '알 수 없음';
        return { tier, active: !!res.response?.active };
    }

    return { SIZES, payload, image, lastPng, generate, checkToken };
})();

// GM_xmlhttpRequest를 Promise로. 상태 코드는 호출한 쪽이 본다.
const Net = (() => {
    function send({ method = 'GET', url, headers = {}, data, responseType = 'text', timeout = 60000, signal }) {
        return new Promise((resolve, reject) => {
            if (signal?.aborted) { reject(new DOMException('취소됨', 'AbortError')); return; }
            const req = GM_xmlhttpRequest({
                method, url, headers, data, responseType, timeout,
                onload: r => resolve({ status: r.status, response: r.response, text: responseType === 'text' ? r.responseText : '' }),
                onerror: () => reject(new Error(`${new URL(url).host}에 연결하지 못했어.`)),
                ontimeout: () => reject(new Error(`${new URL(url).host} 응답이 너무 늦어.`)),
                onabort: () => reject(new DOMException('취소됨', 'AbortError'))
            });
            signal?.addEventListener('abort', () => req?.abort?.(), { once: true });
        });
    }

    async function json({ method = 'POST', url, headers = {}, body, timeout = 120000, signal }) {
        const res = await send({ method, url, headers: { 'Content-Type': 'application/json', ...headers }, data: body == null ? undefined : JSON.stringify(body), responseType: 'text', timeout, signal });
        let parsed = null;
        try { parsed = JSON.parse(res.text || 'null'); } catch (_) { /* 글 응답 */ }
        if (res.status >= 400) {
            const msg = parsed?.error?.message || parsed?.error || parsed?.message || (res.text || '').slice(0, 200);
            throw Object.assign(new Error(`${new URL(url).host} ${res.status}: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`), { status: res.status });
        }
        return parsed;
    }

    return { send, json };
})();
