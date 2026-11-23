// Nai — NovelAI 이미지 요청 만들기·보내기·응답에서 그림 꺼내기.
// 요청 필드는 NovelAI 웹판이 보내는 것과 같다 (V5 = params_version 4, V4.5 = 3).
const Nai = (() => {
    'use strict';
    const T = Tags;

    // NovelAI 웹판의 UC 프리셋 문구
    const HEAVY = 'lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page';
    const HUMAN = `${HEAVY}, @_@, mismatched pupils, glowing eyes, bad anatomy`;
    const FURRY = '{worst quality}, distracting watermark, unfinished, bad quality, {widescreen}, upscale, {sequence}, {{grandfathered content}}, blurred foreground, chromatic aberration, sketch, everyone, [sketch background], simple, [flat colors], ych (character), outline, multiple scenes, [[horror (theme)]], comic';
    const UC = Object.freeze({
        v5: { 0: HEAVY, 1: 'lowres, bad hands, bad anatomy, artistic error, sepia, white haze, worst quality, very displeasing, jpeg artifacts, 0::ai-generated::', 3: HUMAN, 4: FURRY },
        full: { 0: HEAVY, 1: 'lowres, artistic error, scan artifacts, worst quality, bad quality, jpeg artifacts, multiple views, very displeasing, too many watermarks, negative space, blank page', 3: HUMAN, 4: FURRY },
        curated: {
            0: 'blurry, lowres, upscaled, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, negative space, blank page',
            1: 'blurry, lowres, upscaled, artistic error, scan artifacts, jpeg artifacts, logo, too many watermarks, negative space, blank page',
            3: 'blurry, lowres, upscaled, artistic error, film grain, scan artifacts, bad anatomy, bad hands, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, @_@, mismatched pupils, glowing eyes, negative space, blank page'
        }
    });
    const UC_NAMES = Object.freeze({ 0: 'Heavy', 1: 'Light', 3: 'Human Focus', 4: 'Furry Focus', 2: 'None' });
    const NONE = 2;
    const V5_UC_ID = { 0: 'heavy', 1: 'light', 2: 'none', 3: 'human', 4: 'furry' };
    const V5_UC_HINT = { 0: 2, 1: 1, 2: 0, 3: 3, 4: 4 };
    const V5_QUALITY = Object.freeze({ none: '', light: 'very aesthetic, amazing quality, no text', standard: 'very aesthetic, masterpiece, no text' });

    const SIZES = Object.freeze({
        portrait: { w: 832, h: 1216, label: '세로' },
        landscape: { w: 1216, h: 832, label: '가로' },
        square: { w: 1024, h: 1024, label: '정사각' }
    });

    const GEN_DEFAULTS = Object.freeze({
        size: 'portrait', steps: 28, scaleV5: 5, scaleV45: 6, rescaleV5: 0, rescaleV45: 0,
        sampler: 'k_euler_ancestral', noise: 'karras', seed: '', ucPreset: 0,
        qualityV45: true, qualityV5: 'standard', useCoords: false
    });

    function ucTable(modelId) {
        const m = Models.get(modelId);
        if (m.family === 'v5') return UC.v5;
        return m.id.includes('curated') ? UC.curated : UC.full;
    }

    /** 모델에 없는 프리셋 번호면 Heavy(0)로. */
    function ucPick(modelId, preset) {
        const n = Number(preset);
        if (n === NONE) return NONE;
        return ucTable(modelId)[n] ? n : 0;
    }

    function negative(neg, modelId, preset) {
        const p = ucPick(modelId, preset);
        const fromPreset = p === NONE ? '' : ucTable(modelId)[p] || '';
        return T.join(T.unique([...T.split(fromPreset), ...T.split(neg)]));
    }

    const randomSeed = () => Math.floor(Math.random() * 4294967295);

    /** assembled = Compose.build() 결과 */
    function payload(assembled, gen, seed) {
        const g = { ...GEN_DEFAULTS, ...(gen || {}) };
        const m = Models.get(assembled.model);
        const { w, h } = SIZES[g.size] || SIZES.portrait;
        const chars = assembled.chars || [];
        const coords = Boolean(g.useCoords) && chars.length > 1;
        const neg = negative(assembled.baseNeg, m.id, g.ucPreset);
        const uc = ucPick(m.id, g.ucPreset);
        const captions = pick => chars.map(c => ({ char_caption: pick(c), centers: [c.center] }));
        const common = {
            width: w, height: h, sampler: g.sampler, steps: Number(g.steps), seed, n_samples: 1, noise_schedule: g.noise,
            dynamic_thresholding: false, controlnet_strength: 1, legacy: false, legacy_v3_extend: false,
            deliberate_euler_ancestral_bug: false, prefer_brownian: true, negative_prompt: neg
        };

        if (m.family === 'v5') {
            const quality = V5_QUALITY[g.qualityV5] ?? V5_QUALITY.standard;
            const base = T.join([assembled.base, quality]);
            return {
                input: base, model: m.id, action: 'generate', use_new_shared_trial: true,
                parameters: {
                    ...common,
                    params_version: 4,
                    scale: Number(g.scaleV5),
                    cfg_rescale: Number(g.rescaleV5),
                    ucPresetId: V5_UC_ID[uc] || 'heavy',
                    qualityPresetId: 'none',
                    autoSmea: false,
                    add_original_image: true,
                    use_coords: coords,
                    legacy_uc: false,
                    normalize_reference_strength_multiple: true,
                    inpaintImg2ImgStrength: 1,
                    characterPrompts: [],
                    straight_alpha: true,
                    tag_hint_qt: quality ? 1 : 0,
                    tag_hint_uc_preset: V5_UC_HINT[uc] ?? 2,
                    v4_prompt: { caption: { base_caption: base, char_captions: captions(c => c.prompt) }, use_coords: coords, use_order: true },
                    v4_negative_prompt: { caption: { base_caption: neg, char_captions: captions(c => c.uc || '') }, legacy_uc: false },
                    image_format: 'png',
                    stream: 'msgpack'
                }
            };
        }

        const flags = { use_coords: coords, use_order: true, legacy_uc: false };
        return {
            input: assembled.base, model: m.id, action: 'generate',
            parameters: {
                ...common,
                params_version: 3,
                scale: Number(g.scaleV45),
                cfg_rescale: Number(g.rescaleV45),
                uc: neg,
                ucPreset: uc,
                qualityToggle: g.qualityV45 !== false,
                sm: false,
                sm_dyn: false,
                add_original_image: false,
                uncond_scale: 1,
                reference_information_extracted_multiple: [],
                reference_strength_multiple: [],
                v4_prompt: { caption: { base_caption: assembled.base, char_captions: captions(c => c.prompt) }, ...flags },
                v4_negative_prompt: { caption: { base_caption: neg, char_captions: captions(c => c.uc || '') }, ...flags }
            }
        };
    }

    // ── 응답에서 그림 꺼내기 ───────────────────────────────
    const starts = (b, sig, at = 0) => sig.every((v, i) => v == null || b[at + i] === v);
    const SIG = { png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], jpeg: [0xFF, 0xD8, 0xFF], zip: [0x50, 0x4B, 0x03, 0x04] };

    function sniff(b) {
        if (!b || !b.length) return 'empty';
        if (starts(b, SIG.zip)) return 'zip';
        if (starts(b, SIG.png.slice(0, 4))) return 'png';
        if (starts(b, SIG.jpeg)) return 'jpeg';
        if (starts(b, [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45])) return 'webp';
        const head = new TextDecoder().decode(b.subarray(0, 200)).trim();
        return /^[{[<]/.test(head) ? 'text' : 'unknown';
    }

    function indexOf(b, sig, from) {
        for (let i = from; i <= b.length - sig.length; i += 1) if (starts(b, sig, i)) return i;
        return -1;
    }

    // V5 스트림에는 중간 미리보기(JPEG)들 뒤에 최종 PNG가 있다. 끝까지 온전한 마지막 PNG를 고른다.
    function lastPng(b) {
        let found = null;
        for (let at = indexOf(b, SIG.png, 0); at >= 0; at = indexOf(b, SIG.png, at + 1)) {
            let o = at + 8;
            while (o + 12 <= b.length) {
                const len = ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
                if (len > b.length - o - 12) break;
                const isEnd = starts(b, [0x49, 0x45, 0x4E, 0x44], o + 4);
                o += 12 + len;
                if (isEnd) { found = b.slice(at, o); break; }
            }
        }
        return found;
    }

    function firstJpeg(b) {
        const at = indexOf(b, SIG.jpeg, 0);
        if (at < 0) return null;
        for (let end = b.length - 2; end > at; end -= 1) if (b[end] === 0xFF && b[end + 1] === 0xD9) return b.slice(at, end + 2);
        return null;
    }

    function serverText(b) {
        try {
            const t = new TextDecoder().decode(b.subarray(0, 4000)).trim();
            try {
                const j = JSON.parse(t);
                return j.message || j.error?.message || j.error || t;
            } catch (_) {
                return t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            }
        } catch (_) {
            return '';
        }
    }

    const MIME = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' };
    const mimeOfName = n => (/\.webp$/i.test(n) ? MIME.webp : /\.jpe?g$/i.test(n) ? MIME.jpeg : MIME.png);

    function image(arrayBuffer) {
        const b = new Uint8Array(arrayBuffer);
        const type = sniff(b);
        if (MIME[type]) return new Blob([b], { type: MIME[type] });
        if (type === 'zip') {
            const unzip = (typeof fflate !== 'undefined' ? fflate : window.fflate).unzipSync;
            const files = unzip(b);
            const hit = Object.keys(files).find(n => /\.(png|jpe?g|webp)$/i.test(n));
            if (!hit) throw new Error(serverText(Object.values(files)[0] || new Uint8Array()) || 'NAI 응답 압축 안에 이미지가 없어.');
            return new Blob([files[hit]], { type: mimeOfName(hit) });
        }
        if (type === 'unknown') {
            const png = lastPng(b);
            if (png) return new Blob([png], { type: MIME.png });
            const jpg = firstJpeg(b);
            if (jpg) return new Blob([jpg], { type: MIME.jpeg });
        }
        throw new Error(serverText(b) || 'NAI 응답에서 이미지를 찾지 못했어.');
    }

    // 서버가 400으로 거절할 값은 보내기 전에 잡는다
    function check(body) {
        const p = body.parameters;
        const bad = [];
        if (!Number.isInteger(p.steps) || p.steps < 1 || p.steps > 50) bad.push(`스텝 ${p.steps} (1~50)`);
        if (!Number.isFinite(p.scale) || p.scale < 0 || p.scale > 10) bad.push(`Guidance ${p.scale} (0~10)`);
        if (!Number.isFinite(p.cfg_rescale) || p.cfg_rescale < 0 || p.cfg_rescale > 1) bad.push(`Rescale ${p.cfg_rescale} (0~1)`);
        if (p.width % 64 || p.height % 64) bad.push(`크기 ${p.width}×${p.height}`);
        if (!String(body.input || '').trim()) bad.push('베이스 프롬프트가 비어 있음');
        if (bad.length) throw Object.assign(new Error(`생성 옵션 값이 잘못됐어: ${bad.join(', ')}. 설정 → 생성 옵션에서 고쳐줘.`), { pane: 'gen' });
    }

    function summary(body, assembled) {
        const p = body.parameters;
        const cap = p.v4_prompt.caption;
        return [
            `model: ${body.model} (params_version ${p.params_version})`,
            `size: ${p.width}x${p.height} · steps ${p.steps} · scale ${p.scale} · rescale ${p.cfg_rescale} · ${p.sampler}/${p.noise_schedule}`,
            `uc preset: ${p.ucPresetId ?? p.ucPreset} · coords: ${p.v4_prompt.use_coords} · characters: ${cap.char_captions.length}`,
            `tokens(추정): base ${assembled.budget.base} · chars ${assembled.budget.chars} / ${assembled.budget.limit}`,
            '',
            `[base_caption] ${cap.base_caption}`,
            ...cap.char_captions.map((c, i) => `[char ${i}] (${c.centers[0].x},${c.centers[0].y}) ${c.char_caption}`),
            `[negative] ${p.negative_prompt}`
        ].join('\n');
    }

    async function draw({ assembled, gen, apiKey, seed, signal }) {
        if (!apiKey) throw Object.assign(new Error('NovelAI 키가 없어. 설정 → 연결에서 넣어줘.'), { code: 'NO_KEY', pane: 'api' });
        const useSeed = seed === '' || seed == null || !Number.isFinite(Number(seed)) ? randomSeed() : Number(seed);
        const body = payload(assembled, gen, useSeed);
        check(body);
        const v5 = assembled.family === 'v5';
        let data = body;
        if (v5) {
            data = new FormData();
            data.append('request', new Blob([JSON.stringify(body)], { type: 'application/json' }), 'blob');
        }
        const headers = { Authorization: `Bearer ${apiKey}` };
        if (!v5) headers['Content-Type'] = 'application/json';
        const buffer = await Http.send({
            method: 'POST',
            url: 'https://image.novelai.net/ai/generate-image',
            headers, data, raw: v5, responseType: 'arraybuffer', timeout: 180000, signal,
            onFail: err => { err.diag = summary(body, assembled); }
        });
        return { blob: image(buffer), seed: useSeed, payload: body };
    }

    return { SIZES, GEN_DEFAULTS, UC_NAMES, V5_QUALITY, ucTable, ucPick, negative, payload, image, draw, randomSeed };
})();
