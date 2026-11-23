// 시작 — 한 페이지에 한 번만
if (!window.__crackPainter) {
    window.__crackPainter = VERSION;
    const go = () => {
        try { Inline.start(); } catch (e) { console.error('[크랙 페인터] 시작하지 못했어', e); }
    };
    if (document.body) setTimeout(go, 600);
    else addEventListener('DOMContentLoaded', () => setTimeout(go, 600));
}
