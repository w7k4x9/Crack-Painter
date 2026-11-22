// 크랙 화면과 메시지 API.
// 메시지 묶음: [data-message-group-id] (= 메시지 _id), 본문: .wrtn-markdown, 그 바로 다음 줄이 버튼 줄.
// 역할(user/assistant)은 화면으로 가르기 어려워 메시지 API로 확인한다.
const Crack = (() => {
    const API = 'https://crack-api.wrtn.ai/crack-gen/v3';
    const roles = new Map();       // messageId → role
    const contents = new Map();    // messageId → content
    let chatInfo = { id: '', story: null };

    function chatId() {
        const m = location.pathname.match(/\/episodes\/([0-9a-f]{12,})/i);
        return m ? m[1] : '';
    }
    function storyId() {
        const m = location.pathname.match(/\/stories\/([0-9a-f]{12,})/i);
        return m ? m[1] : (chatInfo.story?._id || '');
    }

    function token() {
        const m = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
        return m ? decodeURIComponent(m[1]) : '';
    }

    async function get(path) {
        const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token()}` }, credentials: 'include' });
        if (!res.ok) throw new Error(`크랙 API ${res.status}`);
        const j = await res.json();
        return j.data ?? j;
    }

    async function chat() {
        const id = chatId();
        if (!id) return null;
        if (chatInfo.id !== id) {
            const d = await get(`/chats/${id}`);
            chatInfo = { id, story: d.story || null, title: d.title || d.story?.name || '' };
        }
        return chatInfo;
    }

    // 최근 메시지 n개(새것부터 옴 → 오래된 것부터로 뒤집어 돌려준다)
    async function recent(n = 20) {
        const id = chatId();
        if (!id) return [];
        const d = await get(`/chats/${id}/messages?limit=${Math.min(50, n)}`);
        const list = (d.messages || []).map(m => ({ id: m._id, role: m.role, content: m.content || '' }));
        for (const m of list) { roles.set(m.id, m.role); contents.set(m.id, m.content); }
        return list.reverse();
    }

    // 본문 정리: 숨은 주석 줄([//]: # "…")과 이미지 문법 제거
    function plain(text) {
        return String(text || '')
            .split('\n').filter(l => !/^\s*\[\/\/\]:\s*#/.test(l)).join('\n')
            .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
            .replace(/\{\{img::[^}]*\}\}/g, '')
            .replace(/\n{3,}/g, '\n\n').trim();
    }

    function groups() {
        return [...document.querySelectorAll('[data-message-group-id]')].map(g => {
            const md = [...g.querySelectorAll('.wrtn-markdown')].find(el => !el.closest('.cp2-root'));
            return { el: g, id: g.dataset.messageGroupId, md, footer: md?.nextElementSibling || null };
        }).filter(x => x.md);
    }

    async function assistantGroups() {
        const all = groups();
        if (all.some(g => !roles.has(g.id))) {
            try { await recent(Math.max(20, all.length + 4)); } catch (e) { console.warn('[크랙 페인터] 메시지 목록', e); }
        }
        return all.filter(g => roles.get(g.id) === 'assistant');
    }

    // 문단 = 본문의 바로 아래 요소 중 글이 있는 것
    function paragraphs(md) {
        return [...md.children].filter(el => !el.classList.contains('cp2-figure') && (el.innerText || '').trim());
    }

    function headerSlot() {
        return document.querySelector('button[aria-label="메시지 검색"]')?.parentElement || null;
    }

    function dark() {
        const bg = getComputedStyle(document.body).backgroundColor.match(/\d+/g);
        if (!bg) return matchMedia('(prefers-color-scheme: dark)').matches;
        const [r, g, b] = bg.map(Number);
        return (r * 299 + g * 587 + b * 114) / 1000 < 128;
    }

    return { chatId, storyId, chat, recent, plain, groups, assistantGroups, paragraphs, headerSlot, dark, content: id => contents.get(id) || '' };
})();
