// NAI 자동화 프로젝트 가이드의 규칙을 코드로 지킨다.
// AI가 무엇을 써 오든 생성 직전에 이 검사를 거친다.
const Rules = (() => {
    // 어려 보이게 하는 태그·체형: 모든 칸에서 뺀다.
    const YOUTH = /^(loli|lolicon|shota|shotacon|child|children|kid|kids|toddler|infant|baby|aged down|younger|teen|teenage|teenager|preteen|female child|male child|elementary school student|middle school student|flat chest|petite|small stature|childlike|child body|young|younger sister|younger brother|chibi|kindergarten uniform|school swimsuit)$/;

    // 작가·화풍·품질·연도·인원수: 베이스가 정하므로 AI 출력에서 뺀다.
    const STYLE = /^(artist:.*|.*\(artist\)|.*\(style\)|.*\(medium\)|year \d{4}|\d{4}s|masterpiece|best quality|amazing quality|good quality|normal quality|very aesthetic|aesthetic|highres|absurdres|incredibly absurdres|4k|8k|official art|realistic|semi-realistic|photorealistic|anime style|no text|very displeasing|worst quality|bad quality)$/;
    const COUNT = /^(solo|\d\+?(boys?|girls?|others?)|multiple (boys|girls|others)|male focus|female focus|group|couple)$/;

    // 소품: 작품 외형·의상이나 사용자가 쓴 장면에 있을 때만 남긴다.
    const PROPS = /^(cigarette|cigar|smoking|holding cigarette|lighter|match|matches|matchstick|bottle|wine bottle|holding bottle|alcohol|beer|sake|wine|wine glass|drinking glass|glass|cup|mug|teacup|holding cup|coffee|tea|towel|book|holding book|open book|phone|cellphone|smartphone|holding phone|sword|katana|holding sword|gun|handgun|rifle|holding gun|knife|dagger|holding knife|weapon|holding weapon|umbrella|holding umbrella|flower|holding flower|bouquet|rose|pen|pencil|paper|document|documents|newspaper|letter|envelope|bag|handbag|briefcase|food|plate|fork|spoon|chopsticks|can|key|candle|holding candle|lantern|holding lantern|mask|fan|folding fan|hand fan|pipe|smoking pipe|cane|staff|wand|card|playing card|tablet|laptop|headphones|stuffed toy|teddy bear|rope|chain|leash|collar|syringe|pill|pills|medicine|bandage|camera|microphone|guitar|violin|piano|ball|gift|box|present|ring|engagement ring|necklace|earrings|jewelry|cross|rosary|bible|crown|tiara|hat|gloves|scarf|glasses|sunglasses)$/;

    // 서 있는 전신은 가로 화면을 세로로 3등분해 버린다.
    const LYING = /^(lying|on back|on side|on stomach|reclining|sitting|kneeling|squatting|crouching|seiza|on bed|lying on bed|straddling|all fours|on couch|on floor|sitting on bed|lying on side)$/;

    // 섹스 세트 전용 표현: NSFW가 아닌데 나오면 뺀다.
    const EXPLICIT = /^(nsfw|nude|completely nude|sex|penis|pussy|vaginal|anal|oral|fellatio|cum|cum inside|erection|missionary|cowgirl position|doggystyle|nipples|areolae|ejaculation|orgasm|after sex|implied sex)$/;

    function cleanAiTags(text, { allowProps = new Set(), nsfw = false } = {}) {
        const notes = [];
        const r = Tags.remove(text, k => {
            if (YOUTH.test(k)) { notes.push(`어려 보이는 태그 뺌: ${k}`); return true; }
            if (STYLE.test(k)) return true;
            if (COUNT.test(k)) return true;
            if (!nsfw && EXPLICIT.test(k)) { notes.push(`NSFW가 아닌 장면이라 뺌: ${k}`); return true; }
            if (PROPS.test(k) && !allowProps.has(k)) { notes.push(`지정하지 않은 소품 뺌: ${k}`); return true; }
            return false;
        });
        return { text: r.text, notes };
    }

    // 작품에서 온 외형·의상에도 어려 보이는 태그가 섞여 있으면 뺀다(사용자에게 알림).
    function cleanAppearance(text) {
        const r = Tags.remove(text, k => YOUTH.test(k));
        return { text: r.text, notes: r.removed.map(t => `외형에서 어려 보이는 태그 뺌: ${Tags.key(t)}`) };
    }

    // 서 있는 전신 → cowboy shot. 눕거나 앉아 가로로 놓이면 그대로 둔다.
    function landscape(sceneText, poseTexts) {
        const keys = new Set([...Tags.flatKeys(sceneText), ...poseTexts.flatMap(t => Tags.flatKeys(t))]);
        if (!keys.has('full body')) return { text: sceneText, notes: [] };
        const horizontal = !keys.has('standing') && [...keys].some(k => LYING.test(k));
        if (horizontal) return { text: sceneText, notes: [] };
        return { text: Tags.replace(sceneText, 'full body', 'cowboy shot'), notes: ['서 있는 전신은 가로 화면에서 여러 컷으로 쪼개져서 cowboy shot으로 바꿈'] };
    }

    // 캐릭터 부정에 beard 보장(수염이 설정인 인물 제외)
    function negativeGuard(neg, beardOk) {
        const keys = new Set(Tags.flatKeys(neg));
        if (beardOk) {
            return Tags.remove(neg, k => k === 'beard').text;
        }
        if (keys.has('beard')) return neg;
        return Tags.join(['beard', ...Tags.split(neg)]);
    }

    // 소품 허용 목록: 작품 외형·의상에 이미 있는 태그 + 사용자가 장면에서 요청한 소품
    function propAllowance(texts, requested = []) {
        const set = new Set();
        for (const t of texts) for (const k of Tags.flatKeys(t)) set.add(k);
        for (const r of requested) set.add(Tags.key(r));
        return set;
    }

    return { YOUTH, STYLE, COUNT, PROPS, EXPLICIT, cleanAiTags, cleanAppearance, landscape, negativeGuard, propAllowance };
})();
