// node --test test/
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = f => fs.readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');
const { Core, NAI } = new Function(`${src('core.js')}\n${src('nai.js')}\nreturn { Core, NAI };`)();

const V5 = 'nai-diffusion-5-full';
const V45 = 'nai-diffusion-4-5-full';

test('쉼표 분해는 가중치 묶음과 괄호를 보존한다', () => {
    assert.deepEqual(Core.splitTags('a, 1.2::b, c::, {d, e}, (f), -1::g::'), ['a', '1.2::b, c::', '{d, e}', '(f)', '-1::g::']);
    assert.deepEqual(Core.splitTags(''), []);
});

test('태그 분류', () => {
    for (const t of ['artist:foo', '0.8::artist:bar::', 'wlop (artist)', 'year 2024', '2020s', 'watercolor (medium)', 'anime style', 'official art']) assert.equal(Core.classify(t), 'style', t);
    for (const t of ['masterpiece', 'very aesthetic', 'best quality', 'absurdres', '{{masterpiece}}']) assert.equal(Core.classify(t), 'quality', t);
    for (const t of ['1girl', '2boys', '6+girls', 'solo', 'multiple girls']) assert.equal(Core.classify(t), 'count', t);
    for (const t of ['long hair', 'black hair', 'red eyes', 'ponytail', 'blunt bangs', 'dark skin']) assert.equal(Core.classify(t), 'appearance', t);
    for (const t of ['sitting', 'indoors', 'hair blowing', 'wet hair', 'closed eyes', 'standing by window']) assert.equal(Core.classify(t), 'other', t);
});

const sample = () => ({
    style: { pos: 'artist:foo, masterpiece', neg: 'lowres' },
    scene: { tags: 'cowboy shot, 1girl, indoors, Minji, long hair, artist:bar, window', caption: 'Light falls from the left.', count: '' },
    chars: [
        { id: 'a', name: 'Minji', aliases: ['민지'], look: '1girl, black hair, long hair, artist:zzz, school uniform', action: 'sitting, 민지, smile, masterpiece', caption: 'She looks out.', uc: '', position: 'left' },
        { id: 'b', name: '준호', aliases: [], look: '1boy, short hair', action: 'standing, 준호', caption: '', uc: 'extra arms', position: 'right' }
    ],
    neg: ''
});

test('작가 태그는 캐릭터 칸에서 베이스로 올라간다', () => {
    const a = Core.assemble(sample(), V5);
    assert.match(a.base, /^artist:foo, masterpiece, artist:zzz,/);
    for (const c of a.chars) assert.doesNotMatch(c.prompt, /artist:|masterpiece/);
    assert.ok(a.notes.some(n => /베이스로 옮겼어/.test(n.text)));
});

test('AI 장면 칸의 작가·인원수·외형·이름은 빠진다', () => {
    const a = Core.assemble(sample(), V5);
    assert.doesNotMatch(a.base, /artist:bar|long hair|Minji/);
    assert.equal(a.base.match(/1girl/g).length, 1, '인원수는 자동으로 한 번만');
    assert.match(a.base, /1girl, 1boy, cowboy shot, indoors, window/);
});

test('캐릭터 칸: 인원수 태그는 girl/boy, 이름 제거, 순서는 외형→행동→문장', () => {
    const [m, j] = Core.assemble(sample(), V5).chars;
    assert.equal(m.prompt, 'girl, black hair, long hair, school uniform, sitting, smile, She looks out.');
    assert.equal(j.prompt, 'boy, short hair, standing');
    assert.equal(j.uc, 'extra arms');
});

test('V4.5는 문장(caption)을 보내지 않고 512 합산 예산을 쓴다', () => {
    const a = Core.assemble(sample(), V45);
    assert.doesNotMatch(a.base, /Light falls/);
    assert.doesNotMatch(a.chars[0].prompt, /She looks out/);
    assert.equal(a.budget.shared, true);
    assert.equal(a.budget.used, a.budget.base + a.budget.chars);
    assert.equal(a.budget.limit, 512);
});

test('V5 예산은 베이스만 센다', () => {
    const a = Core.assemble(sample(), V5);
    assert.equal(a.budget.shared, false);
    assert.equal(a.budget.used, a.budget.base);
});

test('예산 초과 경고', () => {
    const st = sample();
    st.chars[0].look = Array.from({ length: 300 }, (_, i) => `tag number ${i}`).join(', ');
    const a = Core.assemble(st, V45);
    assert.equal(a.budget.over, true);
    assert.ok(a.notes.some(n => n.level === 'warn' && /512/.test(n.text)));
});

test('인원수 직접 입력은 자동값을 대신한다', () => {
    const st = sample();
    st.scene.count = '2girls';
    assert.match(Core.assemble(st, V5).base, /artist:zzz, 2girls, cowboy shot/);
});

test('꺼진 캐릭터와 최대 인원 제한', () => {
    const st = sample();
    st.chars[1].enabled = false;
    const a = Core.assemble(st, V5);
    assert.equal(a.chars.length, 1);
    assert.match(a.base, /, 1girl, /);
    const many = sample();
    many.chars = Array.from({ length: 8 }, (_, i) => ({ id: `x${i}`, name: `n${i}`, look: 'girl', action: '' }));
    const b = Core.assemble(many, V45);
    assert.equal(b.chars.length, 6);
    assert.equal(b.count, '6+girls');
});

test('위치 → center, V4.5 격자', () => {
    assert.deepEqual(Core.positionToCenter('left', 0, 2, false), { x: 0.3, y: 0.5 });
    assert.deepEqual(Core.positionToCenter(null, 0, 1, false), { x: 0.5, y: 0.5 });
    const g = Core.positionToCenter(null, 1, 3, true);
    assert.ok([0.1, 0.3, 0.5, 0.7, 0.9].includes(g.x));
});

test('장면 계획 → 상태: 등록 인물 매칭, 의상 변경, 미등록 인물', () => {
    const lib = [{ id: 'a', name: '민지', aliases: ['Minji'], look: 'girl, black hair', outfit: 'white shirt, jacket', uc: '' }];
    const plan = {
        insertAfterParagraph: '2', title: '창가',
        scene: { composition: 'upper body', tags: 'indoors', caption: '' },
        characters: [
            { name: 'Minji', tags: 'sitting', outfit: { mode: 'modify', remove: 'jacket', add: 'rolled up sleeves' }, position: 'left' },
            { id: 'a', name: '민지', tags: 'dup' },
            { name: '점원', look: '1boy, apron', tags: 'standing' }
        ]
    };
    const st = Core.planToState(plan, lib, { pos: 'artist:x', neg: '' });
    assert.equal(st.paragraph, 2);
    assert.equal(st.chars.length, 2);
    assert.equal(st.chars[0].look, 'girl, black hair, white shirt, rolled up sleeves');
    assert.equal(st.chars[0].source, 'saved');
    assert.equal(st.chars[1].source, 'extra');
    assert.equal(st.scene.tags, 'upper body, indoors');
    assert.equal(st.style.pos, 'artist:x');
});

test('JSON 느슨한 파싱', () => {
    assert.deepEqual(Core.parseJsonLoose('```json\n{"a":1}\n```'), { a: 1 });
    assert.deepEqual(Core.parseJsonLoose('앞말 {"a":2} 뒷말'), { a: 2 });
    assert.throws(() => Core.parseJsonLoose('없음'));
});

test('NAI V5 요청: base_caption 과 char_captions 가 분리돼 있다', () => {
    const a = Core.assemble(sample(), V5);
    const p = NAI.buildPayload(a, { ...NAI.DEFAULT_GEN, useCoords: true }, 123);
    const v4 = p.parameters.v4_prompt;
    assert.equal(p.parameters.params_version, 4);
    assert.equal(p.input, v4.caption.base_caption);
    assert.match(v4.caption.base_caption, /^artist:foo/);
    assert.match(v4.caption.base_caption, /very aesthetic, masterpiece, no text$/);
    assert.equal(v4.caption.char_captions.length, 2);
    assert.doesNotMatch(v4.caption.char_captions.map(c => c.char_caption).join(' '), /artist:/);
    assert.equal(v4.use_coords, true);
    assert.equal(p.parameters.v4_negative_prompt.caption.char_captions[1].char_caption, 'extra arms');
    assert.match(p.parameters.negative_prompt, /lowres/);
    assert.equal(p.parameters.seed, 123);
});

test('NAI V4.5 요청 형식', () => {
    const a = Core.assemble(sample(), V45);
    const p = NAI.buildPayload(a, NAI.DEFAULT_GEN, 1);
    assert.equal(p.parameters.params_version, 3);
    assert.equal(p.parameters.qualityToggle, true);
    assert.equal(p.parameters.v4_prompt.use_coords, false);
    assert.equal(p.parameters.ucPreset, 0);
    assert.equal(p.parameters.scale, 6);
});

test('NAI 응답에서 이미지 꺼내기: PNG, msgpack 안의 마지막 PNG, 오류 JSON', () => {
    const png = n => {
        const sig = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        const iend = [0, 0, 0, 0, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82];
        const ihdr = [0, 0, 0, 1, 0x49, 0x48, 0x44, 0x52, n, 0, 0, 0, 0];
        return [...sig, ...ihdr, ...iend];
    };
    const direct = NAI.extractImage(new Uint8Array(png(1)).buffer);
    assert.equal(direct.type, 'image/png');
    const stream = new Uint8Array([0x93, 0xA5, 1, 2, ...png(1), 9, 9, ...png(7), 0xC0]);
    const blob = NAI.extractImage(stream.buffer);
    assert.equal(blob.size, png(7).length);
    const err = new TextEncoder().encode('{"statusCode":402,"message":"Not enough Anlas"}');
    assert.throws(() => NAI.extractImage(err.buffer), /Not enough Anlas/);
});
