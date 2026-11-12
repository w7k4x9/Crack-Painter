// ─────────────────────────────────────────────────────────────
// Crack: crack.wrtn.ai 채팅 화면 연동
// 메시지 판별 기준(data-message-group-id, .wrtn-markdown, "메시지 옵션" 버튼)은
// 기존 스크립트에서 실제 화면으로 검증된 것을 그대로 쓴다.
// ─────────────────────────────────────────────────────────────
const Crack = (() => {
    'use strict';

    const OPTIONS_BTN = 'button[aria-label="메시지 옵션"]';
    const OWN = '.cp-figure, .cp-msg-btn, .cp-menu-row, #cp-host';

    function roomId() {
        const m = location.pathname.match(/\/episodes\/([^/?#]+)/);
        return m ? m[1] : '';
    }

    function hash(text) {
        let h = 5381;
        const s = String(text || '');
        for (let i = 0; i < s.length; i++) h = (((h << 5) + h) + s.charCodeAt(i)) >>> 0;
        return h.toString(36);
    }

    function cleanText(el) {
        if (!el) return '';
        const clone = el.cloneNode(true);
        clone.querySelectorAll(`${OWN}, pre, .wrtn-codeblock, .not-wrtn-markdown`).forEach(n => n.remove());
        return clone.textContent.replace(/\s+/g, ' ').trim();
    }

    function groupOf(node) {
        return node?.closest?.('[data-message-group-id]') || null;
    }

    function messageKey(markdown) {
        const id = groupOf(markdown)?.getAttribute('data-message-group-id');
        return id ? `msg_${hash(id)}` : `text_${hash(cleanText(markdown).slice(0, 4000))}`;
    }

    function isMainMarkdown(el) {
        return !!el?.classList?.contains('wrtn-markdown') && !el.closest('.not-wrtn-markdown') && !el.closest('.cp-figure') && !el.closest('button');
    }

    function isUserNode(root) {
        if (!root) return false;
        if (root.closest?.('.bg-surface_chat_secondary') || root.querySelector?.('.bg-surface_chat_secondary')) return true;
        if (root.matches?.('.wrtn-markdown.css-cbn3z5, .wrtn-markdown.css-1el105x, .wrtn-markdown.css-peb4p4')) return true;
        if (root.querySelector?.('.wrtn-markdown.css-cbn3z5, .wrtn-markdown.css-1el105x, .wrtn-markdown.css-peb4p4')) return true;
        if (root.querySelector?.('div.flex-row.items-end.justify-between.border-y') || root.closest?.('div.flex-row.items-end.justify-between.border-y')) return true;
        return false;
    }

    function footerOf(group) {
        const btn = group?.querySelector?.(OPTIONS_BTN);
        if (!btn) return null;
        const footer = btn.closest('div.flex.items-center.justify-between.mt-2') || btn.closest('[class*="justify-between"][class*="mt-2"]');
        return footer && group.contains(footer) ? footer : null;
    }

    function markdownOf(group) {
        const list = Array.from(group.querySelectorAll('.wrtn-markdown')).filter(isMainMarkdown);
        return list.find(md => !isUserNode(md)) || null;
    }

    function isSuggestion(el) {
        return !!el.closest?.('button[aria-label="답변 수정"]');
    }

    // AI 답변 메시지 목록: [{ group, markdown, footer }]
    function assistantMessages(scope = document) {
        const groups = new Set();
        if (scope.matches?.('[data-message-group-id]')) groups.add(scope);
        scope.querySelectorAll?.('[data-message-group-id]').forEach(g => groups.add(g));
        const out = [];
        for (const group of groups) {
            if (isUserNode(group) || isSuggestion(group)) continue;
            if (group.querySelector('.ProseMirror[contenteditable="true"], .__chat_input_textarea')) continue;
            const markdown = markdownOf(group);
            const footer = footerOf(group);
            if (!markdown || !footer) continue;
            if (cleanText(markdown).length < 5) continue;
            out.push({ group, markdown, footer });
        }
        return out.sort((a, b) => (a.group.compareDocumentPosition(b.group) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    }

    // 문단으로 셀 블록 (삽화를 넣을 수 있는 자리)
    function blocks(markdown) {
        return Array.from(markdown?.children || []).filter(el => {
            if (el.matches(`${OWN}, pre, .wrtn-codeblock, .not-wrtn-markdown`)) return false;
            if (el.matches('p, blockquote, ul, ol, table, h1, h2, h3, h4, h5, h6')) return !!cleanText(el);
            if (el.tagName === 'DIV') return !!cleanText(el);
            return false;
        });
    }

    function paragraphs(markdown) {
        const list = blocks(markdown).map((el, index) => ({ index, text: cleanText(el) })).filter(p => p.text);
        if (!list.length) {
            const t = cleanText(markdown);
            return t ? [{ index: 0, text: t }] : [];
        }
        return list;
    }

    // 대상 메시지 앞쪽 대화 (DOM 에 그려진 것만). 사용자·AI 모두.
    function contextBefore(markdown, turns = 4, maxChars = 3500) {
        const target = groupOf(markdown);
        if (!target) return '';
        const all = Array.from(document.querySelectorAll('[data-message-group-id]'))
            .filter(g => g !== target && (g.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING));
        const picked = all.slice(-turns * 2);
        const lines = picked.map(g => {
            const md = Array.from(g.querySelectorAll('.wrtn-markdown')).find(isMainMarkdown);
            const text = cleanText(md || g);
            if (!text) return '';
            return `${isUserNode(g) ? '사용자' : 'AI'}: ${text}`;
        }).filter(Boolean);
        let joined = lines.join('\n');
        if (joined.length > maxChars) joined = '…' + joined.slice(-maxChars);
        return joined;
    }

    // 문단 index 뒤에 figure 를 넣는다. 기존 figure 는 먼저 뺀다.
    function placeFigure(markdown, figure, index) {
        markdown.querySelectorAll(':scope > .cp-figure').forEach(f => { if (f !== figure) f.remove(); });
        const list = blocks(markdown);
        const target = list[Math.max(0, Math.min(Number(index) || 0, list.length - 1))];
        if (target && target.parentElement === markdown) target.insertAdjacentElement('afterend', figure);
        else markdown.appendChild(figure);
    }

    function findMarkdownByKey(key) {
        return assistantMessages().find(m => messageKey(m.markdown) === key)?.markdown || null;
    }

    // 오른쪽 메뉴의 "상황 이미지 보기" 행 (설정 진입점을 그 아래에 복제해 붙인다)
    function situationRow() {
        for (const sw of document.querySelectorAll('button[role="switch"]')) {
            const row = sw.closest('.px-2\\.5') || sw.parentElement?.parentElement;
            if (!row) continue;
            const label = Array.from(row.querySelectorAll('span')).find(s => s.textContent.replace(/\s+/g, ' ').trim() === '상황 이미지 보기');
            if (label) return row;
        }
        return null;
    }

    function siteTheme() {
        const tok = [document.body, document.documentElement].map(el => `${el.getAttribute('data-theme') || ''} ${el.className || ''}`.toLowerCase()).join(' ');
        if (/\bdark\b/.test(tok)) return 'dark';
        if (/\blight\b/.test(tok)) return 'light';
        try {
            const m = getComputedStyle(document.body).backgroundColor.match(/\d+(\.\d+)?/g);
            if (m && m.length >= 3) {
                const [r, g, b] = m.map(Number);
                const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
                if ((m[3] === undefined || Number(m[3]) > 0.3)) return lum < 0.4 ? 'dark' : 'light';
            }
        } catch (_) {}
        return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    return { roomId, messageKey, assistantMessages, paragraphs, contextBefore, placeFigure, findMarkdownByKey, situationRow, siteTheme, cleanText, OWN };
})();
