// src/ → crack-painter.user.js 한 파일로 묶는다.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = f => fs.readFileSync(path.join(root, 'src', f), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

export const ORDER = ['util.js', 'tags.js', 'rules.js', 'works.js', 'direct.js', 'compose.js', 'nai.js', 'ai.js', 'relay.js', 'crack.js', 'db.js', 'ui/icons.js', 'ui/kit.js', 'app.js', 'ui/studio.js', 'ui/workshop.js', 'main.js'];

const css = name => `const ${name} = ${JSON.stringify(read(name === 'CSS_UI' ? 'ui/style.css' : 'ui/page.css'))};`;
const body = [css('CSS_UI'), css('CSS_PAGE'), ...ORDER.map(f => `// ── ${f} ──\n${read(f)}`)].join('\n\n');
const out = `${read('header.js').replace('__VERSION__', pkg.version)}\n(function () {\n'use strict';\n\n${body}\n})();\n`;
fs.writeFileSync(path.join(root, 'crack-painter.user.js'), out);
console.log(`crack-painter.user.js ${pkg.version} (${(out.length / 1024).toFixed(1)} KB)`);
