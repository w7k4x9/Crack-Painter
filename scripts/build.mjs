// 사용법: node scripts/build.mjs  → crack-painter.user.js
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = f => fs.readFileSync(path.join(root, 'src', f), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const order = ['core.js', 'nai.js', 'store.js', 'llm.js', 'crack.js', 'folder.js', 'ui.js', 'app.js', 'studio.js', 'gallery.js', 'settings.js', 'main.js'];
const body = [
    `const VERSION = ${JSON.stringify(pkg.version)};`,
    `const UI_CSS = ${JSON.stringify(read('ui.css'))};`,
    `const PAGE_CSS = ${JSON.stringify(read('page.css'))};`,
    ...order.map(f => `// ===== ${f} =====\n${read(f)}`)
].join('\n\n');
const indented = body;
const out = `${read('header.js').replace('__VERSION__', pkg.version)}\n(function () {\n    'use strict';\n\n${indented}\n})();\n`;
fs.writeFileSync(path.join(root, 'crack-painter.user.js'), out);
console.log(`built crack-painter.user.js v${pkg.version} (${(out.length / 1024).toFixed(1)} KB)`);
