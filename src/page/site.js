// Site — crack.wrtn.ai 채팅 화면 읽기.
// 크랙 화면에서 확인한 구조: 메시지 묶음마다 data-message-group-id, 본문은 .wrtn-markdown,
// AI 답변 아래 줄에는 "메시지 옵션" 버튼이 있다. 유저 메시지는 말풍선 배경 클래스로 구분된다.
const Site = (() => {
    'use strict';

    const MINE = '.kp-figure, .kp-msg-btn, .kp-menu-row, #kp-host';
    const SKIP = `${MINE}, pre, .wrtn-codeblock, .not-wrtn-markdown`;
    const GROUP = '[data-message-group-id]';
    const USER_BUBBLE = '.bg-surface_chat_secondary';
    const USER_MARKDOWN = '.wrtn-markdown.css-cbn3z5, .wrtn-markdown.css-1el105x, .wrtn-markdown.css-peb4p4';
    const USER_BAR = 'div.flex-row.items-end.justify-between.border-y';
    const BLOCK_TAGS = new Set(['P', 'BLOCKQUOTE', 'UL', 'OL', 'TABLE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV']);

    function room() {
        const m = location.pathname.match(/\/episodes\/([^/?#]+)/);
        return m ? m[1] : '';
    }

    // 짧은 문자열 지문 (djb2, 36진수). 예전 기록의 메시지 키와 같은 값이 나와야 한다.
    function fingerprint(s) {
        const str = String(s || '');
        let h = 5381;
        for (let i = 0; i < str.length; i += 1) h = (Math.imul(h, 33) + str.charCodeAt(i)) >>> 0;
        return h.toString(36);
    }

    /** 요소의 글자 (내가 붙인 것·코드 블록 빼고), 공백은 하나로. */
    function text(el) {
        if (!el) return '';
        const copy = el.cloneNode(true);
        for (const n of copy.querySelectorAll(SKIP)) n.remove();
        return copy.textContent.replace(/\s+/g, ' ').trim();
    }

    const groupFor = node => node?.closest?.(GROUP) || null;

    function keyOf(markdown) {
        const id = groupFor(markdown)?.getAttribute('data-message-group-id');
        return id ? `msg_${fingerprint(id)}` : `text_${fingerprint(text(markdown).slice(0, 4000))}`;
    }

    // 유저 메시지: 말풍선 배경 안/밖, 유저용 본문 클래스, 유저 메시지 아래 테두리 줄 중 하나라도 있으면
    function isUser(node) {
        if (!node) return false;
        const near = sel => Boolean(node.closest?.(sel) || node.querySelector?.(sel));
        return near(USER_BUBBLE) || Boolean(node.matches?.(USER_MARKDOWN) || node.querySelector?.(USER_MARKDOWN)) || near(USER_BAR);
    }

    const isBody = el => Boolean(el?.classList?.contains('wrtn-markdown')) && !el.closest('.not-wrtn-markdown, .kp-figure, button');

    function bodyOf(group) {
        return [...group.querySelectorAll('.wrtn-markdown')].find(md => isBody(md) && !isUser(md)) || null;
    }

    function actionBar(group) {
        const options = group.querySelector('button[aria-label="메시지 옵션"]');
        if (!options) return null;
        const bar = options.closest('div.flex.items-center.justify-between.mt-2') || options.closest('[class*="justify-between"][class*="mt-2"]');
        return bar && group.contains(bar) ? bar : null;
    }

    const before = (a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

    /** 화면에 그려진 AI 답변들, 위에서 아래 순서: [{ group, markdown, footer }] */
    function replies(scope = document) {
        const groups = new Set(scope.querySelectorAll?.(GROUP) || []);
        if (scope.matches?.(GROUP)) groups.add(scope);
        const found = [];
        for (const group of groups) {
            if (isUser(group) || group.closest('button[aria-label="답변 수정"]')) continue;
            if (group.querySelector('.ProseMirror[contenteditable="true"], .__chat_input_textarea')) continue;
            const markdown = bodyOf(group);
            const footer = markdown && actionBar(group);
            if (!footer || text(markdown).length < 5) continue;
            found.push({ group, markdown, footer });
        }
        return found.sort((a, b) => before(a.group, b.group));
    }

    /** 삽화를 넣을 수 있는 문단 블록 (본문의 직계 자식). */
    function sections(markdown) {
        return [...(markdown?.children || [])].filter(el => BLOCK_TAGS.has(el.tagName) && !el.matches(SKIP) && text(el) !== '');
    }

    function paragraphs(markdown) {
        const list = sections(markdown).map((el, index) => ({ index, text: text(el) }));
        if (list.length) return list;
        const all = text(markdown);
        return all ? [{ index: 0, text: all }] : [];
    }

    /** 대상 답변 앞의 대화 (화면에 그려진 만큼). */
    function history(markdown, turns = 4, limit = 3500) {
        const target = groupFor(markdown);
        if (!target) return '';
        const earlier = [...document.querySelectorAll(GROUP)].filter(g => g !== target && before(g, target) < 0);
        const lines = [];
        for (const g of earlier.slice(-turns * 2)) {
            const md = [...g.querySelectorAll('.wrtn-markdown')].find(isBody);
            const t = text(md || g);
            if (t) lines.push(`${isUser(g) ? '사용자' : 'AI'}: ${t}`);
        }
        const all = lines.join('\n');
        return all.length > limit ? `…${all.slice(-limit)}` : all;
    }

    /** 문단 index 뒤에 그림을 둔다. 다른 그림은 먼저 뺀다. */
    function place(markdown, figure, index) {
        for (const f of markdown.querySelectorAll(':scope > .kp-figure')) if (f !== figure) f.remove();
        const list = sections(markdown);
        const at = list[Math.max(0, Math.min(Number(index) || 0, list.length - 1))];
        if (at && at.parentElement === markdown) at.after(figure);
        else markdown.append(figure);
    }

    const byKey = key => replies().find(r => keyOf(r.markdown) === key)?.markdown || null;

    /** 오른쪽 메뉴의 "상황 이미지 보기" 줄 */
    function menuModelRow() {
        for (const sw of document.querySelectorAll('button[role="switch"]')) {
            const row = sw.closest('.px-2\\.5') || sw.parentElement?.parentElement;
            if (row && [...row.querySelectorAll('span')].some(s => s.textContent.replace(/\s+/g, ' ').trim() === '상황 이미지 보기')) return row;
        }
        return null;
    }

    function theme() {
        const marks = [document.body, document.documentElement].map(el => `${el.getAttribute('data-theme') || ''} ${el.className || ''}`).join(' ').toLowerCase();
        if (/\bdark\b/.test(marks)) return 'dark';
        if (/\blight\b/.test(marks)) return 'light';
        try {
            const rgba = getComputedStyle(document.body).backgroundColor.match(/\d+(\.\d+)?/g)?.map(Number);
            if (rgba && rgba.length >= 3 && (rgba[3] === undefined || rgba[3] > 0.3)) {
                const lum = (0.2126 * rgba[0] + 0.7152 * rgba[1] + 0.0722 * rgba[2]) / 255;
                return lum < 0.4 ? 'dark' : 'light';
            }
        } catch (_) { /* 기본값으로 */ }
        return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    const safeName = s => String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'untitled';

    /** 채팅방 이름: 위쪽 헤더 제목 → 문서 제목 → 방 id */
    function roomTitle() {
        const head = document.querySelector('.z-docked button .line-clamp-1, header button .line-clamp-1')?.textContent?.trim();
        if (head) return safeName(head);
        const t = document.title.replace(/\s*[|·-]\s*(크랙|crack|wrtn).*$/i, '').trim();
        return safeName(t && !/^(크랙|crack)$/i.test(t) ? t : room());
    }

    return { MINE, room, fingerprint, keyOf, replies, paragraphs, history, place, byKey, menuModelRow, theme, text, roomTitle, safeName };
})();
