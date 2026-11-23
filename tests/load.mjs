// 테스트용: 브라우저 없이 순수 모듈만 불러온다
import { readFileSync } from 'node:fs';
const src = p => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');
export const { Tags, Models, Compose, Plan, Nai } = new Function(
    ['lib/tags.js', 'lib/compose.js', 'lib/plan.js', 'lib/novelai.js'].map(src).join('\n') + '\nreturn { Tags, Models, Compose, Plan, Nai };'
)();
