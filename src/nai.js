// ─────────────────────────────────────────────────────────────
// NAI: 요청 본문 생성(순수 함수) + 전송 + 응답에서 이미지 꺼내기
// 필드 구성은 NovelAI 웹판 요청(V5 params_version 4 / V4.5 params_version 3)과 같다.
// ─────────────────────────────────────────────────────────────
const NAI = (() => {
    'use strict';

    const UC_PRESETS = Object.freeze({
        v5: {
            0: 'lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page',
            1: 'lowres, bad hands, bad anatomy, artistic error, sepia, white haze, worst quality, very displeasing, jpeg artifacts, 0::ai-generated::',
            3: 'lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, @_@, mismatched pupils, glowing eyes, bad anatomy',
            4: '{worst quality}, distracting watermark, unfinished, bad quality, {widescreen}, upscale, {sequence}, {{grandfathered content}}, blurred foreground, chromatic aberration, sketch, everyone, [sketch background], simple, [flat colors], ych (character), outline, multiple scenes, [[horror (theme)]], comic'
        },
        'v4.5-full': {
            0: 'lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page',
            1: 'lowres, artistic error, scan artifacts, worst quality, bad quality, jpeg artifacts, multiple views, very displeasing, too many watermarks, negative space, blank page',
            3: 'lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, @_@, mismatched pupils, glowing eyes, bad anatomy',
            4: '{worst quality}, distracting watermark, unfinished, bad quality, {widescreen}, upscale, {sequence}, {{grandfathered content}}, blurred foreground, chromatic aberration, sketch, everyone, [sketch background], simple, [flat colors], ych (character), outline, multiple scenes, [[horror (theme)]], comic'
        },
        'v4.5-curated': {
            0: 'blurry, lowres, upscaled, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, negative space, blank page',
            1: 'blurry, lowres, upscaled, artistic error, scan artifacts, jpeg artifacts, logo, too many watermarks, negative space, blank page',
            3: 'blurry, lowres, upscaled, artistic error, film grain, scan artifacts, bad anatomy, bad hands, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, @_@, mismatched pupils, glowing eyes, negative space, blank page'
        }
    });
    const UC_LABELS = Object.freeze({ 0: 'Heavy', 1: 'Light', 3: 'Human Focus', 4: 'Furry Focus', 2: 'None' });
    const V5_UC_ID = Object.freeze({ 0: 'heavy', 1: 'light', 2: 'none', 3: 'human', 4: 'furry' });
    const V5_UC_HINT = Object.freeze({ 2: 0, 1: 1, 0: 2, 3: 3, 4: 4 });
    const V5_QUALITY = Object.freeze({ none: '', light: 'very aesthetic, amazing quality, no text', standard: 'very aesthetic, masterpiece, no text' });

    const SIZES = Object.freeze({
        portrait: { w: 832, h: 1216, label: '세로' },
        landscape: { w: 1216, h: 832, label: '가로' },
        square: { w: 1024, h: 1024, label: '정사각' }
    });

    const DEFAULT_GEN = Object.freeze({
        size: 'portrait',
        steps: 28,
        scaleV5: 5,
        scaleV45: 6,
        rescaleV5: 0,
        rescaleV45: 0,
        sampler: 'k_euler_ancestral',
        noise: 'karras',
        seed: '',
        ucPreset: 0,
        qualityV45: true,
        qualityV5: 'standard',
        useCoords: false
    });

    function ucTable(modelId) {
        const cap = Core.model(modelId);
        if (cap.family === 'v5') return UC_PRESETS.v5;
        return /curated/.test(cap.id) ? UC_PRESETS['v4.5-curated'] : UC_PRESETS['v4.5-full'];
    }

    function ucPresetFor(modelId, preset) {
        const p = Number(preset);
        const table = ucTable(modelId);
        if (p === 2) return 2;
        return table[p] ? p : 0;
    }

    function mergeNegative(neg, modelId, preset) {
        const p = ucPresetFor(modelId, preset);
        const presetTags = p === 2 ? '' : ucTable(modelId)[p] || '';
        return Core.joinTags(Core.dedupe([...Core.splitTags(presetTags), ...Core.splitTags(neg)]));
    }

    // assembled: Core.assemble() 결과
    function buildPayload(assembled, gen, seed) {
        const g = { ...DEFAULT_GEN, ...(gen || {}) };
        const cap = Core.model(assembled.model);
        const size = SIZES[g.size] || SIZES.portrait;
        const chars = assembled.chars || [];
        const useCoords = !!g.useCoords && chars.length >= 2;
        const negative = mergeNegative(assembled.baseNeg, cap.id, g.ucPreset);
        const charCaptions = chars.map(c => ({ char_caption: c.prompt, centers: [c.center] }));
        const charNegCaptions = chars.map(c => ({ char_caption: c.uc || '', centers: [c.center] }));

        if (cap.family === 'v5') {
            const quality = V5_QUALITY[g.qualityV5] ?? V5_QUALITY.standard;
            const base = Core.joinTags([assembled.base, quality]);
            return {
                input: base,
                model: cap.id,
                action: 'generate',
                parameters: {
                    params_version: 4,
                    width: size.w,
                    height: size.h,
                    scale: Number(g.scaleV5),
                    sampler: g.sampler,
                    steps: Number(g.steps),
                    seed,
                    n_samples: 1,
                    ucPresetId: V5_UC_ID[ucPresetFor(cap.id, g.ucPreset)] || 'heavy',
                    qualityPresetId: 'none',
                    autoSmea: false,
                    dynamic_thresholding: false,
                    controlnet_strength: 1,
                    legacy: false,
                    add_original_image: true,
                    cfg_rescale: Number(g.rescaleV5),
                    legacy_v3_extend: false,
                    use_coords: useCoords,
                    legacy_uc: false,
                    normalize_reference_strength_multiple: true,
                    inpaintImg2ImgStrength: 1,
                    characterPrompts: [],
                    straight_alpha: true,
                    tag_hint_qt: quality ? 1 : 0,
                    tag_hint_uc_preset: V5_UC_HINT[ucPresetFor(cap.id, g.ucPreset)] ?? 2,
                    v4_prompt: { caption: { base_caption: base, char_captions: charCaptions }, use_coords: useCoords, use_order: true },
                    v4_negative_prompt: { caption: { base_caption: negative, char_captions: charNegCaptions }, legacy_uc: false },
                    negative_prompt: negative,
                    deliberate_euler_ancestral_bug: false,
                    prefer_brownian: true,
                    noise_schedule: g.noise,
                    image_format: 'png',
                    stream: 'msgpack'
                },
                use_new_shared_trial: true
            };
        }

        return {
            input: assembled.base,
            model: cap.id,
            action: 'generate',
            parameters: {
                params_version: 3,
                width: size.w,
                height: size.h,
                scale: Number(g.scaleV45),
                cfg_rescale: Number(g.rescaleV45),
                sampler: g.sampler,
                steps: Number(g.steps),
                n_samples: 1,
                seed,
                noise_schedule: g.noise,
                negative_prompt: negative,
                uc: negative,
                ucPreset: ucPresetFor(cap.id, g.ucPreset),
                qualityToggle: g.qualityV45 !== false,
                sm: false,
                sm_dyn: false,
                dynamic_thresholding: false,
                controlnet_strength: 1,
                legacy: false,
                legacy_v3_extend: false,
                add_original_image: false,
                uncond_scale: 1,
                deliberate_euler_ancestral_bug: false,
                prefer_brownian: true,
                reference_information_extracted_multiple: [],
                reference_strength_multiple: [],
                v4_prompt: { caption: { base_caption: assembled.base, char_captions: charCaptions }, use_coords: useCoords, use_order: true, legacy_uc: false },
                v4_negative_prompt: { caption: { base_caption: negative, char_captions: charNegCaptions }, use_coords: useCoords, use_order: true, legacy_uc: false }
            }
        };
    }

    function randomSeed() {
        return Math.floor(Math.random() * 4294967295);
    }

    // ── 응답 해석 ────────────────────────────────────────────
    function signature(b) {
        if (!b || !b.length) return 'empty';
        if (b[0] === 0x50 && b[1] === 0x4B && b[2] === 0x03 && b[3] === 0x04) return 'zip';
        if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return 'png';
        if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'jpeg';
        if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) return 'webp';
        const head = new TextDecoder().decode(b.slice(0, 200)).trim();
        if (head.startsWith('{') || head.startsWith('[') || head.startsWith('<')) return 'text';
        return 'unknown';
    }

    function find(b, sig, from) {
        outer: for (let i = from; i <= b.length - sig.length; i++) {
            for (let j = 0; j < sig.length; j++) if (b[i + j] !== sig[j]) continue outer;
            return i;
        }
        return -1;
    }

    function u32be(b, o) {
        return ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
    }

    // V5 msgpack 스트림: 중간 미리보기(JPEG) 뒤에 최종 PNG가 들어 있다. PNG를 먼저 찾는다.
    function carvePng(b) {
        const sig = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        let from = 0;
        let last = null;
        while (from < b.length) {
            const start = find(b, sig, from);
            if (start < 0) break;
            let o = start + 8;
            let end = -1;
            while (o + 12 <= b.length) {
                const len = u32be(b, o);
                if (len > b.length - o - 12) break;
                const isEnd = b[o + 4] === 0x49 && b[o + 5] === 0x45 && b[o + 6] === 0x4E && b[o + 7] === 0x44;
                o += 12 + len;
                if (isEnd) { end = o; break; }
            }
            if (end > 0) last = b.slice(start, end);
            from = start + 1;
        }
        return last;
    }

    function carveJpeg(b) {
        const start = find(b, [0xFF, 0xD8, 0xFF], 0);
        if (start < 0) return null;
        for (let i = b.length - 2; i > start; i--) if (b[i] === 0xFF && b[i + 1] === 0xD9) return b.slice(start, i + 2);
        return null;
    }

    function errorText(b) {
        try {
            const t = new TextDecoder().decode(b.slice(0, 4000)).trim();
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

    function extractImage(arrayBuffer) {
        const b = new Uint8Array(arrayBuffer);
        const kind = signature(b);
        if (kind === 'png') return new Blob([b], { type: 'image/png' });
        if (kind === 'jpeg') return new Blob([b], { type: 'image/jpeg' });
        if (kind === 'webp') return new Blob([b], { type: 'image/webp' });
        if (kind === 'zip') {
            const files = (typeof fflate !== 'undefined' ? fflate : window.fflate).unzipSync(b);
            const entry = Object.entries(files).find(([n]) => /\.(png|jpe?g|webp)$/i.test(n));
            if (!entry) throw new Error(errorText(Object.values(files)[0] || new Uint8Array()) || 'NAI 응답 압축 안에 이미지가 없어.');
            const mime = /\.webp$/i.test(entry[0]) ? 'image/webp' : /\.jpe?g$/i.test(entry[0]) ? 'image/jpeg' : 'image/png';
            return new Blob([entry[1]], { type: mime });
        }
        if (kind === 'unknown') {
            const png = carvePng(b);
            if (png) return new Blob([png], { type: 'image/png' });
            const jpg = carveJpeg(b);
            if (jpg) return new Blob([jpg], { type: 'image/jpeg' });
        }
        throw new Error(errorText(b) || 'NAI 응답에서 이미지를 찾지 못했어.');
    }

    async function generate({ assembled, gen, apiKey, seed, signal }) {
        if (!apiKey) throw Object.assign(new Error('NovelAI 키가 없어. 설정 → 연결에서 넣어줘.'), { code: 'NO_KEY', pane: 'api' });
        const useSeed = seed === '' || seed == null || !Number.isFinite(Number(seed)) ? randomSeed() : Number(seed);
        const payload = buildPayload(assembled, gen, useSeed);
        validate(payload);
        const isV5 = assembled.family === 'v5';
        let data = payload;
        if (isV5) {
            data = new FormData();
            data.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }), 'blob');
        }
        const buffer = await Net.request({
            method: 'POST',
            url: 'https://image.novelai.net/ai/generate-image',
            onError: err => { err.diag = diagnose(payload, assembled); },
            headers: isV5 ? { Authorization: `Bearer ${apiKey}` } : { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            data,
            raw: isV5,
            responseType: 'arraybuffer',
            timeout: 180000,
            signal
        });
        return { blob: extractImage(buffer), seed: useSeed, payload };
    }

    // 서버가 400으로 거부할 값을 미리 잡는다
    function validate(payload) {
        const p = payload.parameters;
        const bad = [];
        if (!Number.isInteger(p.steps) || p.steps < 1 || p.steps > 50) bad.push(`스텝 ${p.steps} (1~50)`);
        if (!Number.isFinite(p.scale) || p.scale < 0 || p.scale > 10) bad.push(`Guidance ${p.scale} (0~10)`);
        if (!Number.isFinite(p.cfg_rescale) || p.cfg_rescale < 0 || p.cfg_rescale > 1) bad.push(`Rescale ${p.cfg_rescale} (0~1)`);
        if (p.width % 64 || p.height % 64) bad.push(`크기 ${p.width}×${p.height}`);
        if (!String(payload.input || '').trim()) bad.push('베이스 프롬프트가 비어 있음');
        if (bad.length) throw Object.assign(new Error(`생성 옵션 값이 잘못됐어: ${bad.join(', ')}. 설정 → 생성 옵션에서 고쳐줘.`), { pane: 'gen' });
    }

    function diagnose(payload, assembled) {
        const p = payload.parameters;
        const caps = p.v4_prompt.caption;
        return [
            `model: ${payload.model} (params_version ${p.params_version})`,
            `size: ${p.width}x${p.height} · steps ${p.steps} · scale ${p.scale} · rescale ${p.cfg_rescale} · ${p.sampler}/${p.noise_schedule}`,
            `uc preset: ${p.ucPresetId ?? p.ucPreset} · coords: ${p.v4_prompt.use_coords} · characters: ${caps.char_captions.length}`,
            `tokens(추정): base ${assembled.budget.base} · chars ${assembled.budget.chars} / ${assembled.budget.limit}`,
            '',
            `[base_caption] ${caps.base_caption}`,
            ...caps.char_captions.map((c, i) => `[char ${i}] (${c.centers[0].x},${c.centers[0].y}) ${c.char_caption}`),
            `[negative] ${p.negative_prompt}`
        ].join('\n');
    }

    return { SIZES, DEFAULT_GEN, UC_LABELS, V5_QUALITY, ucTable, ucPresetFor, mergeNegative, buildPayload, extractImage, generate, randomSeed };
})();
