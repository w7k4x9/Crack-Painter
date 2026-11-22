// node --test test/
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = f => fs.readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');
const { U, Tags, Rules, Works, Direct, Compose, NAI } = new Function(
    ['util.js', 'tags.js', 'rules.js', 'works.js', 'direct.js', 'compose.js', 'nai.js'].map(src).join('\n') + '\nreturn { U, Tags, Rules, Works, Direct, Compose, NAI };'
)();

const BASE = '1.8::artist:aaa, artist:bbb, ::\n\nbest quality, very aesthetic, no text, ';
const NEG = 'worst quality, lowres, bad anatomy';
const APP = '1.7::mature male::, aged up, pale skin, 1.4::half-closed eyes::, 1.6::black hair, short hair::, messy hair';
const OUT = '1.5::black military uniform::, gold buttons, long sleeves';
const FR = '4::portrait, face focus, close-up::';
const item = (name, setting, emotion, emo, bg, nsfw = false) => ({
    title: `${name} ${setting}_${emotion}`,
    basePrompt: BASE,
    baseNegativePrompt: NEG,
    characterPrompt: ['solo, -4::doll, no print::', APP, nsfw ? 'nude, nsfw' : OUT, nsfw ? null : FR, emo, bg].filter(Boolean).join(',\n\n'),
    negativePrompt: 'beard, body hair, frame, long hair',
    count: 10
});
const QUEUE = {
    app: 'NAI-Auto-Saver',
    queue: {
        items: [
            item('카엘', '낮', '기쁨', '1.4::laughing::, looking at viewer', '1.3::garden::, sunlight'),
            item('카엘', '밤', '기쁨', '1.4::laughing::, looking at viewer', '1.3::street at night::, lamps'),
            item('카엘', '낮', '분노', '1.3::glaring, frown::, from below', '1.3::garden::, sunlight'),
            item('카엘', '밤', '분노', '1.3::glaring, frown::, from below', '1.3::street at night::, lamps'),
            item('카엘', '섹스', '사랑', 'looking down to viewer, gentle smile', '1.3::bedroom::, dim lighting', true)
        ]
    }
};

test('태그 나누기는 가중치·랜덤·괄호 묶음을 지킨다', () => {
    assert.deepEqual(Tags.split('a, 1.3::b, c::, ||d|e||, {f, g}, -1::h::'), ['a', '1.3::b, c::', '||d|e||', '{f, g}', '-1::h::']);
    assert.deepEqual(Tags.flatKeys('1.3::Black_Hair, b::, c'), ['black hair', 'b', 'c']);
    assert.equal(Tags.remove('a, 1.3::b, c::, d', k => k === 'b').text, 'a, 1.3::c::, d');
    assert.equal(Tags.replace('x, 1.2::full body, y::', 'full body', 'cowboy shot'), 'x, 1.2::cowboy shot, y::');
});

test('토큰 추정: 사전이 없으면 길이 기반 + 여유', () => {
    assert.ok(Tags.count('three quarter view') >= 4);
    assert.equal(Tags.exact(), false);
});

test('대기열 JSON에서 인물 카드를 만든다', () => {
    const { kind, work } = Works.parse(JSON.stringify(QUEUE), '테스트작품_낮밤섹스.json');
    assert.equal(kind, 'queue');
    assert.equal(work.name, '테스트작품');
    assert.equal(work.base, BASE);
    const c = work.chars[0];
    assert.equal(c.name, '카엘');
    assert.equal(c.appearance, APP);
    assert.equal(c.outfit, OUT);
    assert.equal(c.framing, FR);
    assert.equal(c.emotions['분노'], '1.3::glaring, frown::, from below');
    assert.equal(c.nsfwEmotions['사랑'], 'looking down to viewer, gentle smile');
    assert.equal(c.backgrounds['밤'], '1.3::street at night::, lamps');
    assert.equal(c.adult, true);
    assert.equal(c.beardOk, false);
});

test('V5 파일은 같은 작품의 v5 칸으로 합쳐진다', () => {
    const a = Works.merge(null, Works.parse(JSON.stringify(QUEUE), '테스트작품.json').work);
    const b = Works.merge(a, Works.parse(JSON.stringify(QUEUE), '테스트작품_V5.json').work);
    assert.equal(b.chars.length, 1);
    assert.equal(b.chars[0].v5.appearance, APP);
    assert.equal(b.baseV5, BASE);
});

test('규칙: 어려 보이는 태그·지정 안 한 소품·화풍·인원수를 뺀다', () => {
    const r = Rules.cleanAiTags('smile, loli, holding cigarette, artist:zzz, 1boy, looking at viewer', { allowProps: new Set() });
    assert.equal(r.text, 'smile, looking at viewer');
    const ok = Rules.cleanAiTags('holding cigarette, smile', { allowProps: new Set(['holding cigarette']) });
    assert.equal(ok.text, 'holding cigarette, smile');
    assert.match(Rules.negativeGuard('frame', false), /^beard/);
    assert.equal(Rules.negativeGuard('beard, frame', true), 'frame');
    assert.equal(Rules.landscape('full body', ['standing']).text, 'cowboy shot');
    assert.equal(Rules.landscape('full body', ['lying, on back']).text, 'full body');
});

test('연출 정리: 이름 맞추기, 감정·샷 보정, 섹스는 성인만', () => {
    const work = Works.merge(null, Works.parse(JSON.stringify(QUEUE), 't.json').work);
    const d = Direct.normalize({ setting: '섹스', shot: 'weird', cast: [{ name: '카엘', emotion: '없는감정' }, { name: '모르는사람', look: '1girl' }] }, { chars: work.chars, paragraphCount: 3, nsfwOk: true });
    assert.equal(d.shot, 'upper body');
    assert.equal(d.setting, '실내'); // 엑스트라가 있어서 섹스 불가
    assert.equal(d.cast[0].emotion, '평온');
    assert.equal(d.cast[1].extra, true);
    assert.deepEqual([d.cast[0].position, d.cast[1].position], ['left', 'right']);
    assert.equal(d.paragraph, 2);
});

test('조립: 혼자면 작품 감정 블록, 베이스는 작품 그대로 + 인원수·배경', () => {
    const work = Works.merge(null, Works.parse(JSON.stringify(QUEUE), 't.json').work);
    const d = Direct.normalize({ setting: '밤', shot: 'upper body', cast: [{ name: '카엘', emotion: '분노' }] }, { chars: work.chars, paragraphCount: 1, nsfwOk: false });
    const o = Compose.build({ work, direction: d, modelId: 'nai-diffusion-4-5-full' });
    assert.ok(o.base.startsWith(BASE.trim().replace(/,\s*$/, '')));
    assert.match(o.base, /solo, 1boy, upper body/);
    assert.match(o.base, /street at night/);
    assert.ok(o.chars[0].prompt.includes(APP));
    assert.ok(o.chars[0].prompt.includes('1.3::glaring, frown::, from below'));
    assert.doesNotMatch(o.chars[0].prompt, /portrait/);
    assert.match(o.chars[0].neg, /beard/);
});

test('조립: 둘이면 AI 연출을 쓰고 소품·화풍을 걸러 낸다', () => {
    const work = Works.merge(null, Works.parse(JSON.stringify(QUEUE), 't.json').work);
    work.chars.push({ ...work.chars[0], name: '리온' });
    const d = Direct.normalize({ setting: '낮', shot: 'cowboy shot', scene: 'eye contact', cast: [{ name: '카엘', emotion: '기쁨', face: 'smile, 1boy', pose: 'holding cigarette' }, { name: '리온', emotion: '불쾌', face: 'frown, artist:x' }] }, { chars: work.chars, paragraphCount: 2, nsfwOk: false });
    const o = Compose.build({ work, direction: d, modelId: 'nai-diffusion-4-5-full' });
    assert.match(o.base, /2boys, cowboy shot, eye contact/);
    assert.doesNotMatch(o.chars[0].prompt, /cigarette|1boy/);
    assert.doesNotMatch(o.chars[1].prompt, /artist:x/);
    assert.ok(o.notes.some(n => /소품/.test(n)));
    assert.deepEqual(o.chars.map(c => c.center.x), [0.3, 0.7]);
});

test('V5 변환: 가중치를 1.05~1.3 안으로, 억제는 −1.2~−2', () => {
    const t = Compose.toV5('1.7::a::, 1.2::b::, -4::c::, 4::portrait, close-up::, d');
    assert.equal(t, '1.21::a::, 1.06::b::, -2::c::, portrait, close-up, d');
});

test('NAI 요청 본문: V4.5는 params 3, V5는 params 4 + msgpack', () => {
    const work = Works.merge(null, Works.parse(JSON.stringify(QUEUE), 't.json').work);
    const d = Direct.normalize({ setting: '낮', cast: [{ name: '카엘', emotion: '기쁨' }] }, { chars: work.chars, paragraphCount: 1, nsfwOk: false });
    const gen = { size: 'landscape', steps: 28, scale: 5, rescale: 0, sampler: 'k_euler_ancestral', noise: 'karras', coords: true };
    const v45 = NAI.payload(Compose.build({ work, direction: d, modelId: 'nai-diffusion-4-5-full' }), gen, 7);
    assert.equal(v45.parameters.params_version, 3);
    assert.equal(v45.parameters.width, 1216);
    assert.equal(v45.parameters.height, 832);
    assert.equal(v45.parameters.v4_prompt.caption.char_captions.length, 1);
    assert.equal(v45.parameters.v4_prompt.use_coords, false);
    const v5 = NAI.payload(Compose.build({ work, direction: d, modelId: 'nai-diffusion-5-full' }), gen, 7);
    assert.equal(v5.parameters.params_version, 4);
    assert.equal(v5.parameters.stream, 'msgpack');
});

test('응답에서 마지막 완성 PNG를 꺼낸다', () => {
    const png = n => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 1, 0x49, 0x48, 0x44, 0x52, n, 0, 0, 0, 0, 0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82];
    const bytes = new Uint8Array([0x93, 1, 2, ...png(1), 7, 7, ...png(9), 0xc0]);
    const got = NAI.lastPng(bytes);
    assert.equal(got.length, png(9).length);
    assert.equal(got[16], 9);
});

test('pickJson: 코드 블록과 앞뒤 설명을 견딘다', () => {
    assert.deepEqual(U.pickJson('좋아\n```json\n{"a":1}\n```\n끝'), { a: 1 });
    assert.deepEqual(U.pickJson('앞 {"b": [1,2]} 뒤'), { b: [1, 2] });
});
