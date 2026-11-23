// node tools/build.mjs → crack-painter.user.js (모듈을 순서대로 이어 붙인 유저스크립트 한 파일)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = path => readFileSync(`${root}src/${path}`, 'utf8');
const { version } = JSON.parse(readFileSync(`${root}package.json`, 'utf8'));

export const MODULES = [
    'lib/tags.js', 'lib/compose.js', 'lib/plan.js', 'lib/novelai.js',
    'net/http.js', 'net/analyst.js',
    'data/prefs.js', 'data/vault.js',
    'page/site.js', 'page/disk.js', 'data/import2.js',
    'ui/kit.js',
    'app/engine.js', 'app/inline.js', 'app/studio.js', 'app/gallery.js', 'app/settings.js',
    'boot.js'
];

const parts = [
    `const VERSION = ${JSON.stringify(version)};`,
    `const SHELL_CSS = ${JSON.stringify(src('ui/shell.css'))};`,
    `const PAGE_CSS = ${JSON.stringify(src('ui/page.css'))};`,
    ...MODULES.map(m => `// ── ${m} ──\n${src(m)}`)
];
const header = src('header.txt').replace('__VERSION__', version);
const out = `${header}\n(() => {\n'use strict';\n\n${parts.join('\n\n')}\n})();\n`;
writeFileSync(`${root}crack-painter.user.js`, out);
console.log(`crack-painter.user.js ${version} · ${(out.length / 1024).toFixed(1)} KB`);
