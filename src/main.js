// ── 시작 ───────────────────────────────────────────────────
if (!window.__crackPainter) {
    window.__crackPainter = VERSION;
    const boot = () => { try { App.start(); } catch (e) { console.error('[Crack Painter] 시작 실패', e); } };
    if (document.body) setTimeout(boot, 600);
    else addEventListener('DOMContentLoaded', () => setTimeout(boot, 600));
}
