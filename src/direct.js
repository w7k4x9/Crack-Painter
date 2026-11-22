// AI 연출 지시문과 연출 결과 검사.
// AI는 "누가 · 어떤 감정 · 어디서 · 어떤 구도"만 고른다. 외형·의상·화풍은 작품 카드가 맡는다.
const Direct = (() => {
    const SHOTS = ['close-up', 'upper body', 'cowboy shot', 'wide shot', 'full body'];
    const POSITIONS = { left: { x: 0.3, y: 0.5 }, center: { x: 0.5, y: 0.5 }, right: { x: 0.7, y: 0.5 } };

    function shortLook(ch) {
        return Tags.flatKeys(ch.appearance).filter(k => !/mature|aged up|skin|shoulder|neck|muscular|sharp face/.test(k)).slice(0, 10).join(', ');
    }

    function dossier(ch, nsfwOk) {
        const lines = [`- 이름: ${ch.name}${ch.aliases?.length ? ` (다른 호칭: ${ch.aliases.join(', ')})` : ''}`];
        lines.push(`  성별: ${Works.isMale(ch) ? '남' : '여'} · 성인 장면 ${ch.adult && nsfwOk ? '가능' : '불가'}`);
        lines.push(`  외형 요약(참고만, 출력에 쓰지 말 것): ${shortLook(ch)}`);
        if (ch.note) lines.push(`  감정 해석: ${ch.note}`);
        const sample = ['분노', '기쁨', '부끄러움', '평온', '슬픔', '유혹'].filter(e => ch.emotions?.[e]);
        if (sample.length) {
            lines.push('  이 인물이 실제로 쓴 감정 연출(어떻게 비트는지 참고, 그대로 베끼지 말 것):');
            for (const e of sample) lines.push(`    ${e}: ${ch.emotions[e]}`);
        }
        return lines.join('\n');
    }

    function instruction({ work, chars, nsfwOk, places }) {
        const emotions = Works.GENERAL.join(' · ');
        const nsfw = Works.NSFW.join(' · ');
        return `너는 롤플레이 장면 하나를 NovelAI 삽화 한 장으로 연출하는 감독이야.
인물의 외형·의상·화풍 태그는 이미 정해져 있어. 너는 연출만 정해.

## 작품: ${work.name}
${work.memo ? work.memo + '\n' : ''}## 등장할 수 있는 인물
${chars.map(c => dossier(c, nsfwOk)).join('\n')}

## 장소 세트 (작품 감정 이미지와 같은 배경)
${Object.entries(places).filter(([, v]) => v).map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- (없음: setting은 "기타"로 하고 place를 써)'}

## 규칙
1. 그림은 가로(1216×832)야. 인물을 세로로 길고 좁게 세우지 마. 서 있는 전신, 좁은 상반신 옆모습 하나만 있는 구도는 금지.
   전신이 필요하면 앉히거나 기대거나 눕혀 가로로 놓아. 상체 컷은 몸을 기울이거나 팔을 뻗어 좌우로 퍼지게 해.
2. 감정은 표정 단어 하나보다 각도·자세·시선으로 읽히게 해(올려다보기, 내려다보기, 고개 젖힘·숙임, 더치 앵글).
   같은 감정이라도 인물의 해석대로 비틀어(냉소형은 웃으며 내려다보고, 직진형은 이를 악문다).
3. 소품을 지어내지 마. 원문에 담배·술병이 나와도 사용자가 원하는 장면에서 직접 말하지 않았으면 넣지 마. 행동은 몸짓으로만 옮겨.
4. 외형(머리·눈·체형)·의상·작가·화풍·품질·인원수(1boy, solo 등) 태그는 쓰지 마. 이름도 태그에 쓰지 마.
5. 어려 보이는 표현은 어디에도 쓰지 마.
6. 태그는 실제 Danbooru/NovelAI 영어 태그만, 칸마다 2~6개. 핵심 묶음에만 1.2~1.4 가중치(예: 1.3::looking down, smirk::).
7. 장면에 나오는 인물만 cast에 넣어(최대 3명). 목록에 없는 사람이 꼭 필요하면 name을 "엑스트라"로 하고 look에 성별·머리 정도만 영어 태그로.
8. ${nsfwOk ? `성적인 장면이면 setting을 "섹스"로 하고 emotion은 [${nsfw}] 중에서 골라. "성인 장면 가능"인 인물만.` : 'setting "섹스"는 쓰지 마.'}

## 출력: 아래 JSON 하나만. 설명 금지.
{
  "paragraph": 삽화를 넣을 문단 번호(0부터, 대상 답변 기준),
  "title": "한국어 짧은 제목",
  "setting": "낮 | 밤 | 실내 | 섹스 | 기타",
  "place": "setting이 기타이거나 장소 세트와 다른 곳일 때만 영어 태그(장소 1묶음 + 빛 1개). 아니면 빈 문자열",
  "shot": "${SHOTS.join(' | ')}",
  "camera": "각도 태그 (from below, from above, dutch angle, from side, three quarter view …)",
  "scene": "인물 사이 상호작용 태그 (eye contact, hug, holding hands …). 혼자면 빈 문자열",
  "cast": [
    { "name": "위 목록 이름 그대로", "emotion": "[${emotions}] 중 하나", "face": "표정 태그", "gaze": "시선 태그", "pose": "자세·손 태그", "position": "left | center | right" }
  ],
  "props": ["사용자가 원하는 장면에서 직접 말한 소품만 영어 태그로. 없으면 빈 배열"],
  "caption": "V5용 영어 1~2문장. 이름 대신 the tall man / the woman 처럼",
  "why": "한국어 한 줄: 이 구도를 고른 이유"
}`;
    }

    function userTurn({ context, target, paragraphs, request }) {
        const paraList = paragraphs.map((p, i) => `[${i}] ${p.slice(0, 160)}`).join('\n');
        return `## 앞 대화 (오래된 것부터)
${context || '(없음)'}

## 대상 답변 (이 답변의 장면을 그려)
${target}

## 대상 답변 문단 번호
${paraList}

## 사용자가 원하는 장면
${request ? request : '(따로 없음: 대상 답변에서 가장 그림이 되는 순간을 골라)'}`;
    }

    // AI 답 → 검사된 연출. 이름은 카드와 맞추고, 모르는 감정·구도는 고친다.
    function normalize(raw, { chars, paragraphCount, nsfwOk }) {
        const d = raw && typeof raw === 'object' ? raw : {};
        const names = new Map(chars.flatMap(c => [[c.name, c], ...(c.aliases || []).map(a => [a, c])]));
        const setting = ['낮', '밤', '실내', '섹스', '기타'].includes(d.setting) ? d.setting : '실내';
        const cast = (Array.isArray(d.cast) ? d.cast : []).slice(0, 3).map(m => {
            const ch = names.get(String(m.name || '').trim()) || chars.find(c => String(m.name || '').includes(c.name));
            const nsfw = setting === '섹스';
            const pool = nsfw ? Works.NSFW : Works.GENERAL;
            const emotion = pool.includes(m.emotion) ? m.emotion : (nsfw ? '사랑' : '평온');
            return {
                name: ch ? ch.name : '엑스트라',
                extra: !ch,
                look: ch ? '' : String(m.look || ''),
                emotion,
                face: String(m.face || ''),
                gaze: String(m.gaze || ''),
                pose: String(m.pose || ''),
                position: POSITIONS[m.position] ? m.position : 'center'
            };
        });
        const out = {
            paragraph: U.clamp(Number.isInteger(d.paragraph) ? d.paragraph : paragraphCount - 1, 0, Math.max(0, paragraphCount - 1)),
            title: String(d.title || '').slice(0, 40),
            setting: setting === '섹스' && !nsfwOk ? '실내' : setting,
            place: String(d.place || ''),
            shot: SHOTS.includes(d.shot) ? d.shot : 'upper body',
            camera: String(d.camera || ''),
            scene: String(d.scene || ''),
            cast,
            props: Array.isArray(d.props) ? d.props.map(String).filter(Boolean) : [],
            caption: String(d.caption || ''),
            why: String(d.why || '')
        };
        // 섹스 장면은 성인으로 만든 인물만
        if (out.setting === '섹스' && out.cast.some(m => m.extra || !chars.find(c => c.name === m.name)?.adult)) out.setting = '실내';
        if (out.setting !== '섹스') for (const m of out.cast) if (!Works.GENERAL.includes(m.emotion)) m.emotion = '평온';
        // 위치가 겹치면 좌우로 벌린다
        if (out.cast.length === 2 && out.cast[0].position === out.cast[1].position) { out.cast[0].position = 'left'; out.cast[1].position = 'right'; }
        if (out.cast.length === 3) ['left', 'center', 'right'].forEach((p, i) => { out.cast[i].position = p; });
        return out;
    }

    // AI 없이 직접 고를 때의 빈 연출
    function blank(chars) {
        return { paragraph: 0, title: '', setting: '실내', place: '', shot: 'upper body', camera: '', scene: '', cast: chars.slice(0, 1).map(c => ({ name: c.name, extra: false, look: '', emotion: '평온', face: '', gaze: '', pose: '', position: 'center' })), props: [], caption: '', why: '' };
    }

    return { SHOTS, POSITIONS, instruction, userTurn, normalize, blank };
})();
