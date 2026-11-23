// ==UserScript==
// @name         크랙 페인터
// @namespace    https://github.com/w7k4x9/crack-painter
// @version      2.2.0
// @description  크랙(crack.wrtn.ai) 채팅 장면을 NovelAI 삽화로. 작가·화풍은 베이스, 인물은 캐릭터 칸으로 정확히 나눠 보냄.
// @author       w7k4x9
// @match        https://crack.wrtn.ai/*
// @icon         data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='5.5' x2='0' y2='122.5' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%232C9BFF'/%3E%3Cstop offset='1' stop-color='%23047CFF'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M122.5 64.0 L122.4 68.9 L122.0 73.2 L121.5 77.2 L120.7 81.1 L119.7 84.8 L118.4 88.4 L117.0 91.9 L115.3 95.2 L113.5 98.3 L111.4 101.3 L109.1 104.1 L106.7 106.7 L104.1 109.1 L101.3 111.4 L98.3 113.5 L95.2 115.3 L91.9 117.0 L88.4 118.4 L84.8 119.7 L81.1 120.7 L77.2 121.5 L73.2 122.0 L68.9 122.4 L64.0 122.5 L59.1 122.4 L54.8 122.0 L50.8 121.5 L46.9 120.7 L43.2 119.7 L39.6 118.4 L36.1 117.0 L32.8 115.3 L29.7 113.5 L26.7 111.4 L23.9 109.1 L21.3 106.7 L18.9 104.1 L16.6 101.3 L14.5 98.3 L12.7 95.2 L11.0 91.9 L9.6 88.4 L8.3 84.8 L7.3 81.1 L6.5 77.2 L6.0 73.2 L5.6 68.9 L5.5 64.0 L5.6 59.1 L6.0 54.8 L6.5 50.8 L7.3 46.9 L8.3 43.2 L9.6 39.6 L11.0 36.1 L12.7 32.8 L14.5 29.7 L16.6 26.7 L18.9 23.9 L21.3 21.3 L23.9 18.9 L26.7 16.6 L29.7 14.5 L32.8 12.7 L36.1 11.0 L39.6 9.6 L43.2 8.3 L46.9 7.3 L50.8 6.5 L54.8 6.0 L59.1 5.6 L64.0 5.5 L68.9 5.6 L73.2 6.0 L77.2 6.5 L81.1 7.3 L84.8 8.3 L88.4 9.6 L91.9 11.0 L95.2 12.7 L98.3 14.5 L101.3 16.6 L104.1 18.9 L106.7 21.3 L109.1 23.9 L111.4 26.7 L113.5 29.7 L115.3 32.8 L117.0 36.1 L118.4 39.6 L119.7 43.2 L120.7 46.9 L121.5 50.8 L122.0 54.8 L122.4 59.1Z' fill='url%28%23g%29'/%3E%3Cpath d='M93 31 68 63' stroke='%23fff' stroke-width='15' stroke-linecap='round'/%3E%3Cpath d='M58 71c-9.5-2.2-18.6 3.4-21 12.6-1.5 5.6-4.4 9.6-10 11.6 9.6 5 22.4 4.2 30-3.4 6.4-6.4 7.6-14.4 1-20.8z' fill='%23fff'/%3E%3C/svg%3E
// @homepageURL  https://github.com/w7k4x9/crack-painter
// @downloadURL  https://raw.githubusercontent.com/w7k4x9/crack-painter/main/crack-painter.user.js
// @updateURL    https://raw.githubusercontent.com/w7k4x9/crack-painter/main/crack-painter.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_registerMenuCommand
// @connect      image.novelai.net
// @connect      api.novelai.net
// @connect      generativelanguage.googleapis.com
// @connect      api.deepseek.com
// @require      https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.js
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
'use strict';

const VERSION = "2.2.0";

const SHELL_CSS = "/* 크랙 페인터 · 창과 컨트롤 (Shadow DOM 안). macOS 느낌. */\n:host { all: initial; }\n\n/* ── 색과 글꼴 ───────────────────────────────────────── */\n.shell {\n  --font: -apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Apple SD Gothic Neo\", \"Pretendard Variable\", Pretendard, \"Noto Sans KR\", system-ui, sans-serif;\n  --mono: ui-monospace, \"SF Mono\", Menlo, Consolas, monospace;\n  --accent: #007aff; --accent-soft: rgba(0, 122, 255, .14); --ring: rgba(0, 122, 255, .38);\n  --text: #1d1d1f; --text2: #6e6e73; --text3: #a1a1a6;\n  --win: rgba(246, 246, 248, .92); --win-solid: #f6f6f8;\n  --bar: rgba(236, 236, 240, .78); --side: rgba(232, 232, 237, .72); --stage: #e9e9ee;\n  --card: #fff; --field: #fff; --btn: #fff; --btn-hover: #f4f4f6;\n  --line: rgba(0, 0, 0, .09); --line-strong: rgba(0, 0, 0, .16);\n  --track: rgba(0, 0, 0, .065); --hover: rgba(0, 0, 0, .045);\n  --shadow: 0 0 0 .5px rgba(0, 0, 0, .22), 0 24px 70px rgba(0, 0, 0, .28), 0 4px 14px rgba(0, 0, 0, .12);\n  --ctl: 0 .5px 1.5px rgba(0, 0, 0, .18), 0 0 0 .5px rgba(0, 0, 0, .08);\n  --red: #ff3b30; --orange: #ff9500; --green: #28cd41; --yellow: #ffcc00; --purple: #af52de; --teal: #30b0c7; --pink: #ff2d55;\n  font: 13px/1.38 var(--font);\n  letter-spacing: -.003em;\n  color: var(--text);\n  -webkit-font-smoothing: antialiased;\n}\n.shell.dark {\n  --accent: #0a84ff; --accent-soft: rgba(10, 132, 255, .22); --ring: rgba(10, 132, 255, .5);\n  --text: #f5f5f7; --text2: #a1a1a6; --text3: #6e6e73;\n  --win: rgba(36, 36, 40, .9); --win-solid: #242428;\n  --bar: rgba(44, 44, 48, .82); --side: rgba(40, 40, 44, .7); --stage: #1b1b1e;\n  --card: rgba(255, 255, 255, .055); --field: rgba(255, 255, 255, .07); --btn: rgba(255, 255, 255, .12); --btn-hover: rgba(255, 255, 255, .17);\n  --line: rgba(255, 255, 255, .08); --line-strong: rgba(255, 255, 255, .16);\n  --track: rgba(255, 255, 255, .09); --hover: rgba(255, 255, 255, .06);\n  --shadow: 0 0 0 .5px rgba(255, 255, 255, .12), 0 0 0 1px rgba(0, 0, 0, .6), 0 24px 70px rgba(0, 0, 0, .55);\n  --ctl: 0 0 0 .5px rgba(255, 255, 255, .06), 0 1px 1px rgba(0, 0, 0, .3);\n  --red: #ff453a; --orange: #ff9f0a; --green: #32d74b; --yellow: #ffd60a; --purple: #bf5af2; --teal: #40c8e0; --pink: #ff375f;\n}\n*, *::before, *::after { box-sizing: border-box; }\nbutton, input, textarea, select { font: inherit; color: inherit; letter-spacing: inherit; }\nsvg { display: block; }\n.hide { display: none !important; }\n.dim { color: var(--text2); }\n.small { font-size: 11px; }\n.fill { flex: 1; }\n.line { display: flex; align-items: center; gap: 8px; }\n.scroll { overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--line-strong) transparent; }\n.scroll::-webkit-scrollbar { width: 10px; height: 10px; }\n.scroll::-webkit-scrollbar-thumb { border: 3px solid transparent; border-radius: 10px; background: var(--line-strong); background-clip: content-box; }\n@keyframes appear { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: none; } }\n@keyframes fade-in { from { opacity: 0; } }\n\n/* ── 창 ─────────────────────────────────────────────── */\n.stage-layer { position: fixed; inset: 0; z-index: 2147483000; pointer-events: none; }\n.scrim { position: fixed; inset: 0; pointer-events: auto; background: rgba(0, 0, 0, .18); animation: fade-in .18s ease; }\n.shell.dark .scrim { background: rgba(0, 0, 0, .35); }\n.window {\n  position: fixed; display: flex; flex-direction: column; min-width: 320px; min-height: 240px;\n  pointer-events: auto; overflow: hidden; border-radius: 12px;\n  background: var(--win); box-shadow: var(--shadow);\n  -webkit-backdrop-filter: blur(40px) saturate(180%); backdrop-filter: blur(40px) saturate(180%);\n  animation: appear .22s cubic-bezier(.2, .9, .3, 1.1);\n}\n.window.is-zoomed { inset: 12px !important; width: auto !important; height: auto !important; }\n.window-body { flex: 1; min-height: 0; }\n\n.chrome {\n  flex: none; height: 52px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px;\n  padding: 0 14px 0 16px; background: var(--bar); border-bottom: .5px solid var(--line-strong);\n  user-select: none; cursor: default; touch-action: none;\n}\n.chrome-l, .chrome-r { display: flex; align-items: center; gap: 8px; min-width: 0; }\n.chrome-r { justify-content: flex-end; }\n.chrome-r .dropdown { max-width: 170px; }\n.chrome-c { min-width: 0; text-align: center; }\n.chrome-c b, .chrome-c small { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.chrome-c b { font-size: 13px; font-weight: 600; }\n.chrome-c small { margin-top: 1px; font-size: 11px; color: var(--text2); }\n.traffic { display: flex; gap: 8px; margin-right: 6px; }\n.traffic i { width: 12px; height: 12px; border-radius: 50%; border: .5px solid rgba(0, 0, 0, .18); cursor: pointer; }\n.traffic .t-close { background: #ff5f57; }\n.traffic .t-zoom { background: #28c840; }\n.traffic i:hover { filter: brightness(.92); }\n.traffic .t-off { background: var(--track); cursor: default; }\n\n/* ── 버튼 ─────────────────────────────────────────── */\n.button {\n  display: inline-flex; align-items: center; justify-content: center; gap: 5px;\n  height: 24px; padding: 0 10px; border: 0; border-radius: 6px;\n  background: var(--btn); box-shadow: var(--ctl);\n  font-size: 13px; font-weight: 500; white-space: nowrap; cursor: default;\n}\na.button { color: inherit; text-decoration: none; }\n.button:hover { background: var(--btn-hover); }\n.button:active { filter: brightness(.94); }\n.button:disabled { opacity: .45; pointer-events: none; }\n.button svg { width: 14px; height: 14px; }\n.button.is-primary {\n  color: #fff; background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 88%, #fff), var(--accent));\n  box-shadow: 0 .5px 1px rgba(0, 0, 0, .25), inset 0 .5px 0 rgba(255, 255, 255, .25);\n}\n.button.is-primary:hover { background: var(--accent); }\n.button.is-danger { color: var(--red); }\n.button.is-ghost { background: transparent; box-shadow: none; }\n.button.is-ghost:hover { background: var(--hover); }\n.button.is-large { height: 28px; padding: 0 14px; border-radius: 7px; }\n.button.is-armed, .iconbutton.is-armed { width: auto; gap: 4px; padding: 0 8px; background: var(--red) !important; color: #fff !important; font-size: 12px; font-weight: 600; }\n.iconbutton.is-armed svg { width: 13px; height: 13px; }\n.iconbutton {\n  display: inline-grid; place-items: center; width: 28px; height: 28px; border: 0; border-radius: 6px;\n  background: transparent; color: var(--text2); cursor: default;\n}\n.iconbutton:hover { background: var(--hover); color: var(--text); }\n.iconbutton svg { width: 16px; height: 16px; }\n.iconbutton.is-small { width: 22px; height: 22px; }\n.iconbutton.is-small svg { width: 13px; height: 13px; }\n.keys { margin-left: 2px; font-size: 11px; opacity: .75; }\n\n/* ── 입력 ─────────────────────────────────────────── */\n.input, .textarea, .dropdown {\n  width: 100%; min-height: 24px; padding: 4px 8px; border: 0; outline: 0; border-radius: 6px;\n  background: var(--field); box-shadow: var(--ctl); transition: box-shadow .12s;\n}\n.input:focus, .textarea:focus, .dropdown:focus { box-shadow: 0 0 0 .5px var(--accent), 0 0 0 3.5px var(--ring); }\n.input::placeholder, .textarea::placeholder { color: var(--text3); }\n.textarea { display: block; min-height: 54px; padding: 6px 8px; resize: vertical; font: 12.5px/1.45 var(--font); }\n.textarea.is-short { min-height: 38px; }\n.is-mono.textarea, .is-mono.input { font-family: var(--mono); font-size: 12px; }\n.input.is-num { width: 72px; text-align: right; font-variant-numeric: tabular-nums; }\n.dropdown {\n  height: 24px; min-height: 0; padding-right: 26px; appearance: none; -webkit-appearance: none; cursor: default;\n  background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='12' viewBox='0 0 8 12'%3E%3Cpath d='M1 4.5 4 1.5l3 3M1 7.5l3 3 3-3' fill='none' stroke='%23888' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\");\n  background-repeat: no-repeat; background-position: right 8px center;\n}\n.shell.dark .dropdown option { background: #2c2c30; }\n\n.segmented { display: inline-flex; gap: 2px; padding: 2px; border-radius: 7px; background: var(--track); }\n.segmented button {\n  height: 20px; padding: 0 10px; border: 0; border-radius: 5px; background: transparent;\n  font-size: 12px; font-weight: 500; white-space: nowrap; color: var(--text); cursor: default;\n}\n.segmented button.is-on { background: var(--btn); box-shadow: var(--ctl); }\n.shell.dark .segmented button.is-on { background: rgba(255, 255, 255, .2); }\n.segmented.is-small button { height: 18px; padding: 0 7px; font-size: 11px; }\n\n.toggle { position: relative; flex: none; width: 32px; height: 19px; }\n.toggle input { position: absolute; inset: 0; z-index: 1; margin: 0; opacity: 0; cursor: default; }\n.toggle span { position: absolute; inset: 0; border-radius: 99px; background: var(--track); box-shadow: inset 0 0 0 .5px var(--line); transition: background .2s; }\n.toggle span::after {\n  content: ''; position: absolute; top: 2px; left: 2px; width: 15px; height: 15px; border-radius: 50%;\n  background: #fff; box-shadow: 0 1px 2px rgba(0, 0, 0, .3); transition: transform .2s cubic-bezier(.3, .7, .4, 1.2);\n}\n.toggle input:checked + span { background: var(--accent); }\n.toggle input:checked + span::after { transform: translateX(13px); }\n\n.tag { display: inline-flex; align-items: center; height: 17px; padding: 0 6px; border-radius: 5px; font-size: 10.5px; font-weight: 600; white-space: nowrap; background: var(--track); color: var(--text2); }\n.tag.is-blue { background: var(--accent-soft); color: var(--accent); }\n.tag.is-orange { background: color-mix(in srgb, var(--orange) 18%, transparent); color: var(--orange); }\n\n/* ── 목록 카드 (시스템 설정처럼) ─────────────────────── */\n.caption { display: flex; align-items: center; gap: 6px; margin: 18px 4px 6px; font-size: 11px; font-weight: 600; color: var(--text2); }\n.caption:first-child { margin-top: 0; }\n.caption .fill + * { font-weight: 500; }\n.card { border-radius: 10px; background: var(--card); box-shadow: 0 0 0 .5px var(--line); }\n.card > .cell { position: relative; display: flex; align-items: center; gap: 10px; min-height: 40px; padding: 9px 12px; }\n.card > .cell + .cell::before { content: ''; position: absolute; top: 0; left: 12px; right: 0; border-top: .5px solid var(--line); }\n.card > .cell.is-col { flex-direction: column; align-items: stretch; gap: 6px; }\n.cell-label { flex: 1; min-width: 0; }\n.cell-label b { display: block; font-weight: 500; }\n.cell-label small { display: block; margin-top: 1px; font-size: 11.5px; color: var(--text2); }\n.aside { margin: 6px 4px 0; font-size: 11.5px; line-height: 1.45; color: var(--text2); }\n.aside code { padding: 0 4px; border-radius: 4px; background: var(--track); font: 11px var(--mono); }\n\n/* ── 스튜디오 ─────────────────────────────────────── */\n.studio { width: min(1180px, calc(100vw - 32px)); height: min(820px, calc(100vh - 32px)); }\n.studio .window-body { display: grid; grid-template-columns: minmax(300px, 1fr) minmax(380px, 460px); }\n.stage { position: relative; display: flex; flex-direction: column; min-height: 0; background: var(--stage); border-right: .5px solid var(--line-strong); }\n.canvas { position: relative; flex: 1 1 0; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 20px; overflow: hidden; }\n.canvas img { display: block; max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 6px; box-shadow: 0 8px 30px rgba(0, 0, 0, .18), 0 0 0 .5px var(--line); cursor: zoom-in; }\n.empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; max-width: 280px; text-align: center; color: var(--text3); }\n.empty-state svg { width: 44px; height: 44px; opacity: .6; }\n.empty-state b { font-size: 14px; font-weight: 600; color: var(--text2); }\n.busy {\n  position: absolute; inset: 0; display: grid; place-items: center;\n  background: color-mix(in srgb, var(--stage) 55%, transparent);\n  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);\n}\n.busy-card { display: flex; flex-direction: column; align-items: center; gap: 10px; min-width: 220px; padding: 18px 22px; border-radius: 14px; background: var(--win); box-shadow: var(--shadow); }\n.spinner { position: relative; width: 22px; height: 22px; }\n.spinner i { position: absolute; left: 10px; top: 1px; width: 2.2px; height: 6px; border-radius: 2px; background: var(--text2); transform-origin: 1.1px 10px; animation: tick 1s linear infinite; }\n@keyframes tick { from { opacity: 1; } to { opacity: .15; } }\n.strip { flex: none; display: flex; align-items: center; gap: 8px; padding: 10px 14px; overflow-x: auto; background: var(--bar); border-top: .5px solid var(--line); }\n.thumb { position: relative; flex: none; width: 46px; height: 46px; padding: 0; border: 0; border-radius: 7px; overflow: hidden; background: var(--track); box-shadow: 0 0 0 .5px var(--line); cursor: default; }\n.thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }\n.thumb.is-on { box-shadow: 0 0 0 2px var(--accent); }\n.pin { position: absolute; display: grid; place-items: center; border-radius: 50%; background: var(--accent); color: #fff; }\n.thumb .pin { right: 2px; bottom: 2px; width: 12px; height: 12px; }\n.thumb .pin svg { width: 8px; height: 8px; }\n.strip-tools { display: flex; gap: 2px; margin-left: auto; }\n\n.panel { display: flex; flex-direction: column; min-height: 0; background: var(--win); }\n.panel-scroll { flex: 1; padding: 14px 16px 24px; }\n.panel-foot { flex: none; display: flex; flex-direction: column; gap: 8px; padding: 10px 14px; background: var(--bar); border-top: .5px solid var(--line-strong); }\n\n.block { display: flex; flex-direction: column; gap: 7px; padding: 10px 12px 12px; }\n.block + .block { border-top: .5px solid var(--line); }\n.block-head { display: flex; align-items: center; gap: 7px; min-height: 22px; }\n.block-name { font-size: 13px; font-weight: 600; }\n.swatch { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }\n.block-head .tokens { margin-left: auto; font-variant-numeric: tabular-nums; }\n.sublabel { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: var(--text2); }\n.sublabel .dim { font-weight: 400; }\n.block.is-off > :not(.block-head) { display: none; }\n.block.is-off .block-name { color: var(--text3); }\n.layer-hint { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 600; letter-spacing: .02em; color: var(--text2); }\n.layer-hint svg { width: 11px; height: 11px; }\n\n.hints { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; }\n.hint { display: flex; align-items: flex-start; gap: 8px; padding: 8px 10px; border-radius: 8px; font-size: 12px; background: var(--card); box-shadow: 0 0 0 .5px var(--line); }\n.hint svg { flex: none; width: 14px; height: 14px; margin-top: 1px; color: var(--accent); }\n.hint.is-warn svg { color: var(--orange); }\n.hint.is-error svg { color: var(--red); }\n.hint code { font: 11px var(--mono); }\n\ndetails > summary { list-style: none; cursor: default; }\ndetails > summary::-webkit-details-marker { display: none; }\ndetails > summary svg { width: 10px; height: 10px; transition: transform .15s; }\ndetails[open] > summary svg { transform: rotate(90deg); }\ndetails.more > summary { margin-top: 18px; }\ndetails.payload { margin-top: 12px; }\ndetails.payload > summary { display: flex; align-items: center; gap: 4px; padding: 4px; font-size: 11px; font-weight: 600; color: var(--text2); }\ndetails.payload pre {\n  max-height: 320px; overflow: auto; margin: 4px 0 0; padding: 10px 12px; border-radius: 8px;\n  white-space: pre-wrap; word-break: break-word; font: 11px/1.5 var(--mono);\n  background: var(--card); box-shadow: 0 0 0 .5px var(--line);\n}\ndetails.payload pre .key { color: var(--purple); }\n\n.gauge { display: flex; flex-direction: column; gap: 4px; }\n.gauge-bar { display: flex; height: 6px; overflow: hidden; border-radius: 99px; background: var(--track); }\n.gauge-bar i { display: block; height: 100%; background: var(--c); }\n.gauge-bar i + i { box-shadow: -1px 0 0 var(--win-solid); }\n.gauge-legend { display: flex; flex-wrap: wrap; gap: 2px 10px; font-size: 11px; color: var(--text2); font-variant-numeric: tabular-nums; }\n.gauge-legend span { display: inline-flex; align-items: center; gap: 4px; }\n.gauge-legend span::before { content: ''; width: 7px; height: 7px; border-radius: 2px; background: var(--c); }\n.gauge-legend .gauge-total { margin-left: auto; font-weight: 600; color: var(--text); }\n.gauge.is-over .gauge-total { color: var(--red); }\n.k-style { --c: var(--purple); } .k-scene { --c: var(--accent); }\n.k-0 { --c: var(--orange); } .k-1 { --c: var(--green); } .k-2 { --c: var(--pink); } .k-3 { --c: var(--teal); } .k-4 { --c: var(--yellow); } .k-5 { --c: #8e8e93; }\n\n/* ── 팝오버 ──────────────────────────────────────── */\n.popover {\n  position: fixed; z-index: 5; min-width: 200px; max-width: 320px; max-height: 60vh; overflow: auto; padding: 5px;\n  pointer-events: auto; border-radius: 9px; background: var(--win); box-shadow: var(--shadow);\n  -webkit-backdrop-filter: blur(30px) saturate(180%); backdrop-filter: blur(30px) saturate(180%);\n  animation: fade-in .1s;\n}\n.popover > button { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 24px; padding: 4px 10px; border: 0; border-radius: 5px; background: transparent; font-size: 13px; text-align: left; cursor: default; }\n.popover > button small { display: block; font-size: 11px; color: var(--text2); }\n.popover > button:hover { background: var(--accent); color: #fff; }\n.popover > button:hover small { color: rgba(255, 255, 255, .8); }\n.popover hr { margin: 4px 8px; border: 0; border-top: .5px solid var(--line-strong); }\n.popover-head { padding: 4px 10px 2px; font-size: 11px; font-weight: 600; color: var(--text2); }\n.popover-ask { min-width: 300px; }\n.popover-ask .line { padding: 4px 6px 6px; }\n.popover-ask .input { flex: 1; min-width: 0; }\n.popover-ask .button { flex: none; padding: 0 12px; }\n\n/* ── 설정 ─────────────────────────────────────────── */\n.settings { width: min(860px, calc(100vw - 32px)); height: min(640px, calc(100vh - 32px)); }\n.settings .window-body { display: grid; grid-template-columns: 210px 1fr; }\n.settings-side { display: flex; flex-direction: column; min-height: 0; background: var(--side); border-right: .5px solid var(--line-strong); }\n.settings-side .chrome { grid-template-columns: auto 1fr; background: transparent; border: 0; }\n.settings-nav { display: flex; flex-direction: column; gap: 1px; padding: 4px 10px 12px; }\n.settings-nav button { display: flex; align-items: center; gap: 9px; height: 30px; padding: 0 8px; border: 0; border-radius: 6px; background: transparent; font-size: 13px; text-align: left; cursor: default; }\n.settings-nav button:hover { background: var(--hover); }\n.settings-nav button.is-on { background: var(--accent); color: #fff; }\n.nav-icon { flex: none; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 5px; color: #fff; }\n.nav-icon svg { width: 12px; height: 12px; }\n.settings-main { display: flex; flex-direction: column; min-height: 0; }\n.settings-main .chrome { grid-template-columns: auto 1fr auto; }\n.settings-main .chrome-c { text-align: left; }\n.settings-main .chrome-c b { font-size: 15px; font-weight: 700; }\n.settings-pane { flex: 1; padding: 6px 24px 28px; }\n.ok-text { color: var(--green); }\n.warn-text { color: var(--orange); }\n.bad-text { color: var(--red); }\n.people { display: flex; flex-direction: column; }\n.people button { position: relative; display: flex; align-items: center; gap: 10px; padding: 8px 12px; border: 0; background: transparent; text-align: left; cursor: default; }\n.people button + button::before { content: ''; position: absolute; top: 0; left: 46px; right: 0; border-top: .5px solid var(--line); }\n.people button:hover { background: var(--hover); }\n.people button:first-child { border-radius: 10px 10px 0 0; }\n.people button:last-child { border-radius: 0 0 10px 10px; }\n.people .who { flex: 1; min-width: 0; }\n.people .who b { display: block; font-weight: 500; }\n.people .who small { display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 11.5px; color: var(--text2); }\n.avatar { flex: none; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; color: #fff; font-size: 12px; font-weight: 600; }\n.chev { flex: none; width: 8px; height: 13px; color: var(--text3); }\n\n/* ── 알림 ─────────────────────────────────────────── */\n.notices { position: fixed; top: 14px; right: 14px; z-index: 10; display: flex; flex-direction: column; gap: 8px; width: min(356px, calc(100vw - 28px)); pointer-events: none; }\n.notice {\n  display: flex; align-items: flex-start; gap: 10px; padding: 11px 12px; border-radius: 16px; pointer-events: auto;\n  background: var(--win); box-shadow: var(--shadow);\n  -webkit-backdrop-filter: blur(30px) saturate(180%); backdrop-filter: blur(30px) saturate(180%);\n  animation: slide-in .32s cubic-bezier(.2, .9, .3, 1.1);\n}\n.notice.is-leaving { animation: slide-out .2s ease forwards; }\n@keyframes slide-in { from { opacity: 0; transform: translateX(30px); } }\n@keyframes slide-out { to { opacity: 0; transform: translateX(30px); } }\n.notice-icon { flex: none; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 8px; color: #fff; background: linear-gradient(180deg, #2c9bff, #047cff); }\n.notice-icon svg { width: 18px; height: 18px; }\n.notice-icon.is-err { background: linear-gradient(135deg, #ff6a5c, #ff3b30); }\n.notice-icon.is-ok { background: linear-gradient(135deg, #5ee07a, #28c840); }\n.notice-text { flex: 1; min-width: 0; }\n.notice-text b { display: block; font-size: 13px; font-weight: 600; }\n.notice-text p { margin: 1px 0 0; font-size: 12.5px; color: var(--text2); word-break: break-word; }\n.notice-acts { display: flex; gap: 6px; margin-top: 8px; }\n.notice-progress { height: 3px; margin-top: 8px; overflow: hidden; border-radius: 99px; background: var(--track); }\n.notice-progress i { display: block; width: 40%; height: 100%; border-radius: 99px; background: var(--accent); animation: sweep 1.2s ease-in-out infinite; }\n@keyframes sweep { from { transform: translateX(-100%); } to { transform: translateX(250%); } }\n.notice-x { margin: -4px -4px 0 0; opacity: 0; transition: opacity .15s; }\n.notice:hover .notice-x { opacity: 1; }\n\n.fullview { position: fixed; inset: 0; display: grid; place-items: center; pointer-events: auto; background: rgba(0, 0, 0, .82); cursor: zoom-out; animation: fade-in .15s; }\n.fullview img { max-width: 94vw; max-height: 94vh; border-radius: 6px; }\n\n/* ── 갤러리 ─────────────────────────────────────── */\n.gallery { width: min(1100px, calc(100vw - 32px)); height: min(780px, calc(100vh - 32px)); }\n.gallery .window-body { display: flex; flex-direction: column; }\n.wall { flex: 1; min-height: 0; padding: 6px 18px 24px; }\n.wall-day { position: sticky; top: 0; z-index: 1; padding: 12px 2px 8px; font-size: 13px; font-weight: 700; background: linear-gradient(var(--win-solid) 70%, transparent); }\n.wall-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 4px; }\n.tile { position: relative; aspect-ratio: 2 / 3; padding: 0; border: 0; border-radius: 4px; overflow: hidden; background: var(--track); cursor: default; }\n.tile img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform .2s; }\n.tile:hover img { transform: scale(1.025); }\n.tile:focus-visible { outline: 3px solid var(--ring); }\n.tile .pin { right: 5px; bottom: 5px; width: 16px; height: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, .3); }\n.tile .pin svg { width: 9px; height: 9px; }\n.wall-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 24px; text-align: center; color: var(--text3); }\n.wall-empty svg { width: 46px; height: 46px; opacity: .55; }\n.wall-empty b { font-size: 14px; color: var(--text2); }\n.look { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 340px; }\n.look-stage { position: relative; display: flex; align-items: center; justify-content: center; min-height: 0; padding: 16px 52px; overflow: hidden; background: var(--stage); border-right: .5px solid var(--line-strong); }\n.look-stage img { display: block; max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 6px; box-shadow: 0 8px 30px rgba(0, 0, 0, .18); cursor: zoom-in; }\n.look-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 32px; height: 32px; border-radius: 50%; background: var(--win); box-shadow: var(--ctl); }\n.look-nav.is-prev { left: 12px; }\n.look-nav.is-next { right: 12px; }\n.look-nav:disabled { opacity: .3; }\n.look-side { min-height: 0; padding: 12px 16px 20px; }\n.look-prompt { margin: 0; padding: 10px 12px; border-radius: 8px; white-space: pre-wrap; word-break: break-word; font: 11.5px/1.55 var(--mono); background: var(--card); box-shadow: 0 0 0 .5px var(--line); }\n\n/* ── 오류 자세히 ─────────────────────────────────── */\n.errors { width: min(720px, calc(100vw - 32px)); height: min(560px, calc(100vh - 32px)); }\n.errors .window-body { display: flex; flex-direction: column; }\n.errors pre { margin: 0; white-space: pre-wrap; word-break: break-word; font: 11.5px/1.55 var(--mono); }\n.errors .errors-text { flex: 1; min-height: 0; padding: 14px 16px; }\n.errors .errors-foot { padding: 10px 14px; background: var(--bar); border-top: .5px solid var(--line-strong); }\n\n/* ── 좁은 화면: 꽉 채운 시트 ──────────────────────── */\n@media (max-width: 760px) {\n  .window { inset: 0 !important; width: auto !important; height: auto !important; border-radius: 0; }\n  .chrome { grid-template-columns: auto minmax(0, 1fr) auto; gap: 8px; padding: 0 10px; }\n  .chrome-c { text-align: left; }\n  .chrome-c small { display: none; }\n  .chrome-r .dropdown { max-width: 116px; }\n  .traffic { margin-right: 0; }\n  .studio .window-body { grid-template-columns: 1fr; grid-template-rows: minmax(220px, 42%) 1fr; }\n  .stage { border-right: 0; border-bottom: .5px solid var(--line-strong); }\n  .panel-scroll { padding: 12px 12px 20px; }\n  .block-head .dim.small, .keys { display: none; }\n  .settings .window-body { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }\n  .settings-side { border-right: 0; border-bottom: .5px solid var(--line-strong); }\n  .settings-side .chrome { display: none; }\n  .settings-nav { flex-direction: row; overflow-x: auto; padding: 8px; }\n  .settings-nav button { flex: none; }\n  .settings-pane { padding: 6px 14px 24px; }\n  .look { grid-template-columns: 1fr; grid-template-rows: 55% 1fr; }\n  .look-stage { padding: 10px 44px; border-right: 0; border-bottom: .5px solid var(--line-strong); }\n  .wall { padding: 4px 8px 16px; }\n  .wall-grid { grid-template-columns: repeat(3, 1fr); gap: 2px; }\n}\n";

const PAGE_CSS = "/* 크랙 페인터 · 채팅 화면에 직접 붙는 것 (메시지 버튼, 채팅 속 삽화) */\n.kp-msg-btn {\n  all: unset; box-sizing: border-box;\n  display: inline-flex; align-items: center; justify-content: center;\n  width: 28px; height: 28px; border-radius: 8px;\n  color: currentColor; opacity: .62; cursor: pointer;\n  transition: opacity .15s, background-color .15s;\n}\n.kp-msg-btn:hover { opacity: 1; background-color: rgba(127, 127, 127, .14); }\n.kp-msg-btn svg { display: block; width: 18px; height: 18px; }\n.kp-msg-btn.kp-run { opacity: 1; color: #0a84ff; animation: kp-blink 1.2s ease-in-out infinite; }\n@keyframes kp-blink { 50% { opacity: .45; } }\n\n.kp-figure { position: relative; display: flex; flex-direction: column; align-items: center; max-width: 100%; margin: 14px 0; }\n.kp-frame {\n  position: relative; display: inline-block; max-width: 100%; line-height: 0;\n  border-radius: 10px; overflow: hidden;\n  box-shadow: 0 0 0 .5px rgba(0, 0, 0, .12), 0 6px 22px rgba(0, 0, 0, .14);\n}\n.kp-frame img { display: block; max-width: 100%; max-height: 78vh; height: auto; cursor: zoom-in; }\n.kp-tools {\n  position: absolute; left: 50%; bottom: 10px; transform: translate(-50%, 6px);\n  display: flex; align-items: center; gap: 2px; padding: 3px; border-radius: 10px;\n  line-height: 1; white-space: nowrap; color: #fff;\n  font: 500 12px -apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Apple SD Gothic Neo\", Pretendard, system-ui, sans-serif;\n  background: rgba(30, 30, 32, .62);\n  -webkit-backdrop-filter: blur(20px) saturate(180%); backdrop-filter: blur(20px) saturate(180%);\n  box-shadow: 0 0 0 .5px rgba(255, 255, 255, .14), 0 4px 16px rgba(0, 0, 0, .25);\n  opacity: 0; transition: opacity .16s, transform .16s;\n}\n.kp-figure:hover .kp-tools, .kp-figure:focus-within .kp-tools, .kp-figure.kp-tapped .kp-tools { opacity: 1; transform: translate(-50%, 0); }\n.kp-tools button {\n  all: unset; display: inline-flex; align-items: center; justify-content: center;\n  min-width: 28px; height: 26px; padding: 0 4px; border-radius: 7px; color: #fff; cursor: pointer;\n}\n.kp-tools button:hover { background: rgba(255, 255, 255, .16); }\n.kp-tools button:disabled { opacity: .35; pointer-events: none; }\n.kp-tools button.is-armed { gap: 4px; padding: 0 8px; background: #ff3b30; font-size: 12px; font-weight: 600; }\n.kp-tools svg { display: block; width: 15px; height: 15px; }\n.kp-tools button.is-armed svg { width: 13px; height: 13px; }\n.kp-count { padding: 0 4px; font-size: 11.5px; font-variant-numeric: tabular-nums; opacity: .9; }\n.kp-divider { width: .5px; height: 16px; margin: 0 3px; background: rgba(255, 255, 255, .25); }\n.kp-busy {\n  position: absolute; inset: 0; display: grid; place-items: center;\n  background: rgba(0, 0, 0, .28); color: #fff; line-height: 1.4;\n  font: 600 12px -apple-system, system-ui, sans-serif;\n}\nbody.kp-off .kp-figure, body.kp-off .kp-msg-btn { display: none !important; }\n";

// ── lib/tags.js ──
// Tags — 쉼표 태그 문자열 다루기. DOM·네트워크를 쓰지 않아서 Node에서 바로 테스트한다.
const Tags = (() => {
    'use strict';

    const OPENERS = '{[(';
    const CLOSERS = '}])';
    // `1.2::` 처럼 숫자 바로 뒤에 오는 :: 는 가중치 묶음의 시작이다.
    const WEIGHT_START = /(?:^|[\s,])-?\d+(?:\.\d+)?$/;

    /** 맨 바깥 쉼표·줄바꿈에서만 나눈다. 괄호와 `N::…::` 묶음 안은 한 덩어리로 둔다. */
    function split(input) {
        const text = input == null ? '' : String(input);
        const out = [];
        let piece = '';
        let nesting = 0;
        let inWeight = false;
        const push = () => {
            const t = piece.trim();
            if (t) out.push(t);
            piece = '';
        };
        for (let i = 0; i < text.length; i += 1) {
            const c = text[i];
            if (c === ':' && text[i + 1] === ':') {
                inWeight = inWeight ? false : WEIGHT_START.test(piece);
                piece += '::';
                i += 1;
                continue;
            }
            if (OPENERS.includes(c)) nesting += 1;
            else if (CLOSERS.includes(c) && nesting > 0) nesting -= 1;
            if ((c === ',' || c === '\n') && nesting === 0 && !inWeight) {
                push();
                continue;
            }
            piece += c;
        }
        push();
        return out;
    }

    function join(list) {
        const flat = [];
        for (const item of list) {
            if (Array.isArray(item)) flat.push(...item);
            else flat.push(item);
        }
        return flat.map(x => (x == null ? '' : String(x)).trim()).filter(x => x !== '').join(', ');
    }

    const PAIR = { '{': '}', '[': ']', '(': ')' };
    function peel(s) {
        let t = s.trim();
        while (t.length > 1 && PAIR[t[0]] && t.endsWith(PAIR[t[0]])) t = t.slice(1, -1).trim();
        return t;
    }

    /** 비교용 이름: 가중치·감싼 괄호·밑줄을 걷어내고 소문자로. */
    function key(tag) {
        const bare = String(tag || '').trim().replace(/^-?\d+(?:\.\d+)?::\s*/, '').replace(/\s*::$/, '');
        return peel(bare).split('_').join(' ').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    function unique(list) {
        const seen = new Set();
        return list.filter(t => {
            const k = key(t);
            if (!k || seen.has(k)) return false;
            seen.add(k);
            return true;
        });
    }

    // ── 종류 판별 ─────────────────────────────────────────
    const QUALITY_WORDS = new Set(('masterpiece|best quality|high quality|good quality|great quality|amazing quality|normal quality|'
        + 'very aesthetic|aesthetic|absurdres|highres|incredibly absurdres|no text|very awa|newest|recent|ultra detailed|'
        + 'extremely detailed|8k|4k|hdr').split('|'));
    const STYLE_WORDS = new Set(('traditional media|digital media|official art|game cg|anime coloring|anime screencap|realistic|'
        + 'photorealistic|semi-realistic|lineart|flat color|cel shading|oekaki|watercolor|oil painting|impasto|pixel art|chibi').split('|'));
    const COUNT_FORM = /^(?:(?:\d+|6\+)(?:girls?|boys?|others?)|solo|solo focus|multiple (?:girls|boys|others)|no humans|\d+people)$/;

    const COLOR = '(?:light |dark |pale |bright )?(?:black|brown|blonde|blond|red|white|silver|grey|gray|pink|blue|green|purple|orange|aqua|yellow|multicolored|two-tone|gradient|streaked)';
    const LOOK_FORMS = [
        new RegExp(`^${COLOR} (?:hair|eyes)$`),
        /^(?:very short|short|medium|long|very long|absurdly long) hair$/,
        /^(?:straight|wavy|curly) hair$/,
        /^(?:(?:high|low|side|short) )?ponytail$/,
        /^(?:(?:low|short) )?twintails$/,
        /^(?:single |twin |side |french )?braids?$/,
        /^(?:single |double )?hair bun$/,
        /^(?:bob|hime|pixie) cut$/,
        /^(?:twin drills|drill hair|ahoge|sidelocks|hair between eyes|hair intakes|heterochromia)$/,
        /^(?:(?:blunt|swept|parted|asymmetrical) )?bangs$/,
        /^(?:dark|pale|tan|tanned) skin$/,
        /^dark-skinned (?:male|female)$/
    ];

    const isStyle = k => k.startsWith('artist:') || k.endsWith('(artist)') || /^by [a-z0-9]/.test(k)
        || /^(?:year )?\d{4}s?$/.test(k)
        || /\((?:style|medium)\)$/.test(k) || /(?:^| )style$/.test(k) || STYLE_WORDS.has(k);

    /** 'style' | 'quality' | 'count' | 'appearance' | 'other' | 'empty' */
    function kind(tag) {
        const k = key(tag);
        if (!k) return 'empty';
        if (isStyle(k)) return 'style';
        if (QUALITY_WORDS.has(k)) return 'quality';
        if (COUNT_FORM.test(k)) return 'count';
        if (LOOK_FORMS.some(re => re.test(k))) return 'appearance';
        return 'other';
    }

    const isFrame = t => { const k = kind(t); return k === 'style' || k === 'quality'; };

    /** 캐릭터 칸에서는 2girls 같은 인원수 대신 girl/boy/other 를 쓴다. */
    function countAsSubject(tag) {
        const m = key(tag).match(/^(?:\d+|6\+)(girl|boy|other)s?$/);
        return m ? m[1] : '';
    }

    function subjectOf(text) {
        const ks = split(text).map(key);
        if (ks.some(k => ['1boy', 'boy', 'male', 'man', 'bishounen', 'old man'].includes(k))) return 'boy';
        if (ks.some(k => ['1girl', 'girl', 'female', 'woman', 'old woman'].includes(k))) return 'girl';
        return 'other';
    }

    /** ['girl','boy','boy'] → '1girl, 2boys' */
    function countLabel(subjects) {
        const tally = { girl: 0, boy: 0, other: 0 };
        for (const s of subjects) tally[s] = (tally[s] || 0) + 1;
        const word = (n, noun) => (n === 0 ? '' : n === 1 ? `1${noun}` : `${n > 5 ? '6+' : n}${noun}s`);
        return [word(tally.girl, 'girl'), word(tally.boy, 'boy'), word(tally.other, 'other')].filter(Boolean).join(', ');
    }

    const reEscape = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    /** NAI는 이름을 엉뚱한 인물로 읽어서, AI가 쓴 글에서 인물 이름을 지운다. */
    function dropNames(text, names) {
        let out = String(text || '');
        for (const n of names) {
            const name = String(n || '').trim();
            if (name.length < 2) continue;
            const pattern = /^[A-Za-z0-9 _-]+$/.test(name)
                ? new RegExp(`(^|[^A-Za-z0-9_])${reEscape(name)}(?=$|[^A-Za-z0-9_])`, 'gi')
                : new RegExp(reEscape(name), 'g');
            out = out.replace(pattern, pattern.flags.includes('i') ? '$1' : '');
        }
        return out.replace(/\s*,\s*(,\s*)+/g, ', ').replace(/^[\s,]+|[\s,]+$/g, '').replace(/ {2,}/g, ' ');
    }

    /** T5 토큰 수 어림값 (쉼표 조각마다 단어 수 × 1.3 + 구분자 1). */
    function tokens(text) {
        let total = 0;
        for (const raw of String(text || '').trim().split(',')) {
            const p = raw.trim();
            if (!p) continue;
            const words = p.split(/[\s_\-()[\]{}:.|]+/).filter(Boolean).length;
            total += Math.max(1, Math.round(words * 1.3)) + 1;
        }
        return total;
    }

    /** 값이 무엇이든 태그 문자열 하나로 (배열·객체는 펼쳐서). */
    function text(v) {
        if (v == null) return '';
        if (Array.isArray(v)) return join(v.map(text));
        if (typeof v === 'object') return join(Object.values(v).map(text));
        return String(v).trim();
    }

    return { split, join, key, unique, kind, isFrame, countAsSubject, subjectOf, countLabel, dropNames, tokens, text };
})();


// ── lib/compose.js ──
// Models · Compose — 스튜디오 상태를 NAI가 받는 두 갈래로 나눈다.
//   베이스(base_caption)   : 그림 전체 — 작가·화풍·퀄리티, 인원수, 구도·배경·조명
//   캐릭터(char_captions)  : 인물 한 명 — 외형·의상·자세·표정
// 칸에 맞지 않는 태그는 보내기 직전에 옮기거나 빼고, 한 일을 notes 로 알려 준다.
const Models = (() => {
    'use strict';
    const make = (id, family, label, maxChars, budget) => Object.freeze({ id, family, label, maxChars, budget, shared: family === 'v4.5', grid: family === 'v4.5' });
    const ALL = Object.freeze({
        'nai-diffusion-5-full': make('nai-diffusion-5-full', 'v5', 'V5 Full', 22, 1471),
        'nai-diffusion-5-curated': make('nai-diffusion-5-curated', 'v5', 'V5 Curated', 22, 703),
        'nai-diffusion-4-5-full': make('nai-diffusion-4-5-full', 'v4.5', 'V4.5 Full', 6, 512),
        'nai-diffusion-4-5-curated': make('nai-diffusion-4-5-curated', 'v4.5', 'V4.5 Curated', 6, 512)
    });
    const DEFAULT = 'nai-diffusion-5-full';
    const get = id => ALL[id] || ALL[DEFAULT];
    const list = () => Object.values(ALL);
    const isV5 = id => get(id).family === 'v5';
    return { ALL, DEFAULT, get, list, isV5 };
})();

const Compose = (() => {
    'use strict';
    const T = Tags;

    /** left/center/right 또는 {x,y} → NAI 좌표. V4.5는 5×5 칸 가운데(0.1, 0.3 …)에 맞춘다. */
    function center(position, index, total, snapToGrid) {
        let x;
        let y = 0.5;
        if (position && typeof position === 'object' && Number.isFinite(+position.x)) {
            x = +position.x;
            if (Number.isFinite(+position.y)) y = +position.y;
        } else {
            const spots = { left: 0.3, center: 0.5, right: 0.7 };
            const named = spots[String(position || '').toLowerCase()];
            x = named != null ? named : total <= 1 ? 0.5 : 0.2 + (0.6 * index) / (total - 1);
        }
        const clamp = v => Math.min(0.9, Math.max(0.1, v));
        x = clamp(x);
        y = clamp(y);
        if (snapToGrid) {
            const snap = v => Math.round((Math.round((v - 0.1) / 0.2) * 0.2 + 0.1) * 10) / 10;
            x = snap(x);
            y = snap(y);
        }
        const r3 = v => Math.round(v * 1000) / 1000;
        return { x: r3(x), y: r3(y) };
    }

    const allNames = chars => (chars || []).flatMap(c => [c.name, ...(c.aliases || [])]).filter(Boolean);

    // 사용자 외형 칸 정리: 작가·퀄리티는 베이스로 보내고, 인원수는 girl/boy 로 바꾼다.
    function sortLook(look) {
        const keep = [];
        const lifted = [];
        for (const t of T.split(look)) {
            const k = T.kind(t);
            if (k === 'style' || k === 'quality') lifted.push(t);
            else if (k === 'count') { const s = T.countAsSubject(t); if (s) keep.push(s); }
            else keep.push(t);
        }
        return { keep, lifted };
    }

    const notFrameOrCount = t => !['style', 'quality', 'count'].includes(T.kind(t));

    /**
     * state = { style:{pos,neg}, scene:{tags,caption,count}, chars:[{id,name,aliases,look,action,caption,uc,position,enabled,source}], neg }
     * → { model, family, base, baseNeg, count, chars:[{id,name,prompt,uc,center,tokens}], budget, notes }
     */
    function build(state, modelId) {
        const m = Models.get(modelId);
        const v5 = m.family === 'v5';
        const st = state || {};
        const style = st.style || {};
        const scene = st.scene || {};
        const notes = [];
        const names = allNames(st.chars);

        const active = (st.chars || []).filter(c => c && c.enabled !== false);
        if (active.length > m.maxChars) {
            notes.push({ level: 'warn', text: `${m.label}는 캐릭터 칸이 최대 ${m.maxChars}개라서 ${active.length - m.maxChars}명은 빠졌어.` });
        }
        const slots = active.slice(0, m.maxChars);

        const liftedStyle = [];
        const subjects = [];
        const chars = [];
        slots.forEach((c, i) => {
            const label = c.name || `인물 ${i + 1}`;
            const { keep, lifted } = sortLook(c.look);
            if (lifted.length) {
                liftedStyle.push(...lifted);
                notes.push({ level: 'info', text: `'${label}' 외형 칸의 작가·화풍 태그 ${lifted.length}개를 베이스로 옮겼어.` });
            }
            const action = T.split(T.dropNames(c.action, names)).filter(notFrameOrCount);
            const sentence = v5 ? T.dropNames(c.caption, names).trim() : '';
            const prompt = T.join(T.unique([...keep, ...action, ...(sentence ? [sentence] : [])]));
            if (!prompt) return;
            subjects.push(T.subjectOf(T.join(keep)));
            chars.push({
                id: c.id || `c${i}`,
                name: label,
                prompt,
                uc: T.join(T.unique(T.split(c.uc))),
                center: center(c.position, i, slots.length, m.grid),
                tokens: T.tokens(prompt)
            });
        });

        // 장면 칸: 작가·퀄리티·인원수는 빼고, 캐릭터 칸이 있으면 머리색 같은 외형도 뺀다(다른 인물에게 번진다).
        let droppedLooks = 0;
        const sceneTags = T.split(T.dropNames(scene.tags, names)).filter(t => {
            if (!notFrameOrCount(t)) return false;
            if (chars.length && T.kind(t) === 'appearance') { droppedLooks += 1; return false; }
            return true;
        });
        if (droppedLooks) notes.push({ level: 'info', text: `장면 칸의 머리색·눈색 같은 외형 태그 ${droppedLooks}개는 캐릭터 칸이 맡으니까 뺐어.` });
        const sceneSentence = v5 ? T.dropNames(scene.caption, names).trim() : '';

        let count = String(scene.count || '').trim();
        if (!count && chars.length) count = chars.length === 1 ? `${T.countLabel(subjects)}, solo` : T.countLabel(subjects);

        const styleTags = T.unique([...T.split(style.pos), ...liftedStyle]);
        const baseTags = T.unique([...styleTags, ...T.split(count), ...sceneTags]);
        const base = T.join([...baseTags, ...(sceneSentence ? [sceneSentence] : [])]);
        const baseNeg = T.join(T.unique([...T.split(style.neg), ...T.split(st.neg)]));

        const baseTokens = T.tokens(base);
        const charTokens = chars.reduce((sum, c) => sum + c.tokens, 0);
        const used = m.shared ? baseTokens + charTokens : baseTokens;
        const budget = {
            shared: m.shared, limit: m.budget, used, base: baseTokens, chars: charTokens, over: used > m.budget,
            parts: {
                style: T.tokens(T.join(styleTags)),
                scene: T.tokens(T.join([count, ...sceneTags, sceneSentence])),
                chars: chars.map(c => ({ name: c.name, tokens: c.tokens }))
            }
        };
        if (budget.over) {
            notes.push({
                level: 'warn',
                text: m.shared
                    ? `${m.label}는 베이스와 캐릭터 칸이 ${m.budget}토큰을 나눠 써. 지금 약 ${used}토큰이라 뒤쪽 태그가 잘릴 수 있어.`
                    : `베이스가 약 ${used}/${m.budget}토큰이라 뒤쪽이 잘릴 수 있어.`
            });
        }
        return { model: m.id, family: m.family, base, baseNeg, count, chars, budget, notes };
    }

    /** 인원수 칸을 비워 두면 들어갈 자동 값 (입력칸 안내 문구용). */
    function autoCount(state, modelId) {
        return build({ ...state, scene: { ...(state?.scene || {}), count: '' } }, modelId).count;
    }

    return { build, center, autoCount, allNames };
})();


// ── lib/plan.js ──
// Plan — 분석 AI가 돌려준 장면 JSON을 스튜디오 상태로 바꾼다.
const Plan = (() => {
    'use strict';
    const T = Tags;

    const norm = s => String(s || '').normalize('NFKC').replace(/\s+/g, '').toLowerCase();

    function lookup(item, library) {
        const id = String(item?.id || '').trim();
        if (id) {
            const hit = library.find(c => c.id === id);
            if (hit) return hit;
        }
        const want = norm(item?.name);
        if (!want) return null;
        return library.find(c => norm(c.name) === want || (c.aliases || []).some(a => norm(a) === want)) || null;
    }

    /** 장면에서 옷을 바꿨을 때: keep(그대로) · replace(새 옷) · modify(일부 빼고 더하기) */
    function dress(saved, outfit) {
        const look = saved.look || '';
        const usual = saved.outfit || '';
        const add = T.text(outfit?.add);
        const mode = String(outfit?.mode || 'keep').toLowerCase();
        if (mode === 'replace' && add) return T.join([look, add]);
        if (mode === 'modify') {
            const gone = new Set(T.split(outfit?.remove).map(T.key));
            return T.join([look, ...T.split(usual).filter(t => !gone.has(T.key(t))), add]);
        }
        return T.join([look, usual]);
    }

    function slot(fields) {
        return { aliases: [], uc: '', position: null, enabled: true, caption: '', action: '', ...fields };
    }

    /** characters: 등록 인물 [{id,name,aliases,look,outfit,uc}] */
    function toState(plan, characters, style) {
        const p = plan && typeof plan === 'object' ? plan : {};
        const library = Array.isArray(characters) ? characters : [];
        const chars = [];
        const taken = new Set();
        for (const item of Array.isArray(p.characters) ? p.characters : []) {
            const saved = lookup(item, library);
            const common = { action: T.text(item?.tags), caption: T.text(item?.caption), position: item?.position || null };
            if (saved) {
                if (taken.has(saved.id)) continue;
                taken.add(saved.id);
                chars.push(slot({ ...common, id: saved.id, source: 'saved', name: saved.name, aliases: saved.aliases || [], look: dress(saved, item?.outfit), uc: saved.uc || '' }));
                continue;
            }
            const look = T.text(item?.look || item?.appearance);
            if (!look) continue;
            chars.push(slot({ ...common, id: `extra${chars.length}`, source: 'extra', name: String(item?.name || '').trim() || `엑스트라 ${chars.length + 1}`, look }));
        }
        const para = Number.parseInt(p.insertAfterParagraph, 10);
        return {
            title: String(p.title || p.sceneTitle || '').trim().slice(0, 80),
            moment: String(p.moment || '').trim(),
            paragraph: Number.isFinite(para) && para >= 0 ? para : 0,
            style: { pos: style?.pos || '', neg: style?.neg || '' },
            scene: { tags: T.join([T.text(p.scene?.composition), T.text(p.scene?.tags)]), caption: T.text(p.scene?.caption), count: '' },
            chars,
            neg: ''
        };
    }

    /** AI가 채운 칸에서 그 칸에 올 수 없는 태그를 미리 뺀다. 그래야 스튜디오에 보이는 것 = 보내는 것. */
    function clean(state) {
        const names = Compose.allNames(state.chars);
        const tidy = (text, noLooks) => T.join(T.unique(T.split(T.dropNames(text, names)).filter(t => {
            const k = T.kind(t);
            if (k === 'style' || k === 'quality' || k === 'count') return false;
            return !(noLooks && k === 'appearance');
        })));
        const hasPeople = (state.chars || []).length > 0;
        state.scene.tags = tidy(state.scene.tags, hasPeople);
        state.scene.caption = T.dropNames(state.scene.caption, names);
        for (const c of state.chars || []) {
            c.action = tidy(c.action, false);
            c.caption = T.dropNames(c.caption, names);
            if (c.source === 'extra') c.look = T.join(T.split(c.look).filter(t => !T.isFrame(t)));
        }
        return state;
    }

    /** 코드펜스나 앞뒤 설명이 붙은 응답에서도 JSON을 꺼낸다. */
    function parse(reply) {
        const raw = String(reply || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
        try {
            return JSON.parse(raw);
        } catch (_) {
            const from = raw.indexOf('{');
            const to = raw.lastIndexOf('}');
            if (from < 0 || to <= from) throw new Error('분석 응답에서 JSON을 찾지 못했어.');
            return JSON.parse(raw.slice(from, to + 1));
        }
    }

    return { toState, clean, dress, parse };
})();


// ── lib/novelai.js ──
// Nai — NovelAI 이미지 요청 만들기·보내기·응답에서 그림 꺼내기.
// 요청 필드는 NovelAI 웹판이 보내는 것과 같다 (V5 = params_version 4, V4.5 = 3).
const Nai = (() => {
    'use strict';
    const T = Tags;

    // NovelAI 웹판의 UC 프리셋 문구
    const HEAVY = 'lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page';
    const HUMAN = `${HEAVY}, @_@, mismatched pupils, glowing eyes, bad anatomy`;
    const FURRY = '{worst quality}, distracting watermark, unfinished, bad quality, {widescreen}, upscale, {sequence}, {{grandfathered content}}, blurred foreground, chromatic aberration, sketch, everyone, [sketch background], simple, [flat colors], ych (character), outline, multiple scenes, [[horror (theme)]], comic';
    const UC = Object.freeze({
        v5: { 0: HEAVY, 1: 'lowres, bad hands, bad anatomy, artistic error, sepia, white haze, worst quality, very displeasing, jpeg artifacts, 0::ai-generated::', 3: HUMAN, 4: FURRY },
        full: { 0: HEAVY, 1: 'lowres, artistic error, scan artifacts, worst quality, bad quality, jpeg artifacts, multiple views, very displeasing, too many watermarks, negative space, blank page', 3: HUMAN, 4: FURRY },
        curated: {
            0: 'blurry, lowres, upscaled, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, negative space, blank page',
            1: 'blurry, lowres, upscaled, artistic error, scan artifacts, jpeg artifacts, logo, too many watermarks, negative space, blank page',
            3: 'blurry, lowres, upscaled, artistic error, film grain, scan artifacts, bad anatomy, bad hands, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, @_@, mismatched pupils, glowing eyes, negative space, blank page'
        }
    });
    const UC_NAMES = Object.freeze({ 0: 'Heavy', 1: 'Light', 3: 'Human Focus', 4: 'Furry Focus', 2: 'None' });
    const NONE = 2;
    const V5_UC_ID = { 0: 'heavy', 1: 'light', 2: 'none', 3: 'human', 4: 'furry' };
    const V5_UC_HINT = { 0: 2, 1: 1, 2: 0, 3: 3, 4: 4 };
    const V5_QUALITY = Object.freeze({ none: '', light: 'very aesthetic, amazing quality, no text', standard: 'very aesthetic, masterpiece, no text' });

    const SIZES = Object.freeze({
        portrait: { w: 832, h: 1216, label: '세로' },
        landscape: { w: 1216, h: 832, label: '가로' },
        square: { w: 1024, h: 1024, label: '정사각' }
    });

    const GEN_DEFAULTS = Object.freeze({
        size: 'portrait', steps: 28, scaleV5: 5, scaleV45: 6, rescaleV5: 0, rescaleV45: 0,
        sampler: 'k_euler_ancestral', noise: 'karras', seed: '', ucPreset: 0,
        qualityV45: true, qualityV5: 'standard', useCoords: false
    });

    function ucTable(modelId) {
        const m = Models.get(modelId);
        if (m.family === 'v5') return UC.v5;
        return m.id.includes('curated') ? UC.curated : UC.full;
    }

    /** 모델에 없는 프리셋 번호면 Heavy(0)로. */
    function ucPick(modelId, preset) {
        const n = Number(preset);
        if (n === NONE) return NONE;
        return ucTable(modelId)[n] ? n : 0;
    }

    function negative(neg, modelId, preset) {
        const p = ucPick(modelId, preset);
        const fromPreset = p === NONE ? '' : ucTable(modelId)[p] || '';
        return T.join(T.unique([...T.split(fromPreset), ...T.split(neg)]));
    }

    const randomSeed = () => Math.floor(Math.random() * 4294967295);

    /** assembled = Compose.build() 결과 */
    function payload(assembled, gen, seed) {
        const g = { ...GEN_DEFAULTS, ...(gen || {}) };
        const m = Models.get(assembled.model);
        const { w, h } = SIZES[g.size] || SIZES.portrait;
        const chars = assembled.chars || [];
        const coords = Boolean(g.useCoords) && chars.length > 1;
        const neg = negative(assembled.baseNeg, m.id, g.ucPreset);
        const uc = ucPick(m.id, g.ucPreset);
        const captions = pick => chars.map(c => ({ char_caption: pick(c), centers: [c.center] }));
        const common = {
            width: w, height: h, sampler: g.sampler, steps: Number(g.steps), seed, n_samples: 1, noise_schedule: g.noise,
            dynamic_thresholding: false, controlnet_strength: 1, legacy: false, legacy_v3_extend: false,
            deliberate_euler_ancestral_bug: false, prefer_brownian: true, negative_prompt: neg
        };

        if (m.family === 'v5') {
            const quality = V5_QUALITY[g.qualityV5] ?? V5_QUALITY.standard;
            const base = T.join([assembled.base, quality]);
            return {
                input: base, model: m.id, action: 'generate', use_new_shared_trial: true,
                parameters: {
                    ...common,
                    params_version: 4,
                    scale: Number(g.scaleV5),
                    cfg_rescale: Number(g.rescaleV5),
                    ucPresetId: V5_UC_ID[uc] || 'heavy',
                    qualityPresetId: 'none',
                    autoSmea: false,
                    add_original_image: true,
                    use_coords: coords,
                    legacy_uc: false,
                    normalize_reference_strength_multiple: true,
                    inpaintImg2ImgStrength: 1,
                    characterPrompts: [],
                    straight_alpha: true,
                    tag_hint_qt: quality ? 1 : 0,
                    tag_hint_uc_preset: V5_UC_HINT[uc] ?? 2,
                    v4_prompt: { caption: { base_caption: base, char_captions: captions(c => c.prompt) }, use_coords: coords, use_order: true },
                    v4_negative_prompt: { caption: { base_caption: neg, char_captions: captions(c => c.uc || '') }, legacy_uc: false },
                    image_format: 'png',
                    stream: 'msgpack'
                }
            };
        }

        const flags = { use_coords: coords, use_order: true, legacy_uc: false };
        return {
            input: assembled.base, model: m.id, action: 'generate',
            parameters: {
                ...common,
                params_version: 3,
                scale: Number(g.scaleV45),
                cfg_rescale: Number(g.rescaleV45),
                uc: neg,
                ucPreset: uc,
                qualityToggle: g.qualityV45 !== false,
                sm: false,
                sm_dyn: false,
                add_original_image: false,
                uncond_scale: 1,
                reference_information_extracted_multiple: [],
                reference_strength_multiple: [],
                v4_prompt: { caption: { base_caption: assembled.base, char_captions: captions(c => c.prompt) }, ...flags },
                v4_negative_prompt: { caption: { base_caption: neg, char_captions: captions(c => c.uc || '') }, ...flags }
            }
        };
    }

    // ── 응답에서 그림 꺼내기 ───────────────────────────────
    const starts = (b, sig, at = 0) => sig.every((v, i) => v == null || b[at + i] === v);
    const SIG = { png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], jpeg: [0xFF, 0xD8, 0xFF], zip: [0x50, 0x4B, 0x03, 0x04] };

    function sniff(b) {
        if (!b || !b.length) return 'empty';
        if (starts(b, SIG.zip)) return 'zip';
        if (starts(b, SIG.png.slice(0, 4))) return 'png';
        if (starts(b, SIG.jpeg)) return 'jpeg';
        if (starts(b, [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45])) return 'webp';
        const head = new TextDecoder().decode(b.subarray(0, 200)).trim();
        return /^[{[<]/.test(head) ? 'text' : 'unknown';
    }

    function indexOf(b, sig, from) {
        for (let i = from; i <= b.length - sig.length; i += 1) if (starts(b, sig, i)) return i;
        return -1;
    }

    // V5 스트림에는 중간 미리보기(JPEG)들 뒤에 최종 PNG가 있다. 끝까지 온전한 마지막 PNG를 고른다.
    function lastPng(b) {
        let found = null;
        for (let at = indexOf(b, SIG.png, 0); at >= 0; at = indexOf(b, SIG.png, at + 1)) {
            let o = at + 8;
            while (o + 12 <= b.length) {
                const len = ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
                if (len > b.length - o - 12) break;
                const isEnd = starts(b, [0x49, 0x45, 0x4E, 0x44], o + 4);
                o += 12 + len;
                if (isEnd) { found = b.slice(at, o); break; }
            }
        }
        return found;
    }

    function firstJpeg(b) {
        const at = indexOf(b, SIG.jpeg, 0);
        if (at < 0) return null;
        for (let end = b.length - 2; end > at; end -= 1) if (b[end] === 0xFF && b[end + 1] === 0xD9) return b.slice(at, end + 2);
        return null;
    }

    function serverText(b) {
        try {
            const t = new TextDecoder().decode(b.subarray(0, 4000)).trim();
            try {
                const j = JSON.parse(t);
                return j.message || j.error?.message || j.error || t;
            } catch (_) {
                return t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            }
        } catch (_) {
            return '';
        }
    }

    const MIME = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' };
    const mimeOfName = n => (/\.webp$/i.test(n) ? MIME.webp : /\.jpe?g$/i.test(n) ? MIME.jpeg : MIME.png);

    function image(arrayBuffer) {
        const b = new Uint8Array(arrayBuffer);
        const type = sniff(b);
        if (MIME[type]) return new Blob([b], { type: MIME[type] });
        if (type === 'zip') {
            const unzip = (typeof fflate !== 'undefined' ? fflate : window.fflate).unzipSync;
            const files = unzip(b);
            const hit = Object.keys(files).find(n => /\.(png|jpe?g|webp)$/i.test(n));
            if (!hit) throw new Error(serverText(Object.values(files)[0] || new Uint8Array()) || 'NAI 응답 압축 안에 이미지가 없어.');
            return new Blob([files[hit]], { type: mimeOfName(hit) });
        }
        if (type === 'unknown') {
            const png = lastPng(b);
            if (png) return new Blob([png], { type: MIME.png });
            const jpg = firstJpeg(b);
            if (jpg) return new Blob([jpg], { type: MIME.jpeg });
        }
        throw new Error(serverText(b) || 'NAI 응답에서 이미지를 찾지 못했어.');
    }

    // 서버가 400으로 거절할 값은 보내기 전에 잡는다
    function check(body) {
        const p = body.parameters;
        const bad = [];
        if (!Number.isInteger(p.steps) || p.steps < 1 || p.steps > 50) bad.push(`스텝 ${p.steps} (1~50)`);
        if (!Number.isFinite(p.scale) || p.scale < 0 || p.scale > 10) bad.push(`Guidance ${p.scale} (0~10)`);
        if (!Number.isFinite(p.cfg_rescale) || p.cfg_rescale < 0 || p.cfg_rescale > 1) bad.push(`Rescale ${p.cfg_rescale} (0~1)`);
        if (p.width % 64 || p.height % 64) bad.push(`크기 ${p.width}×${p.height}`);
        if (!String(body.input || '').trim()) bad.push('베이스 프롬프트가 비어 있음');
        if (bad.length) throw Object.assign(new Error(`생성 옵션 값이 잘못됐어: ${bad.join(', ')}. 설정 → 생성 옵션에서 고쳐줘.`), { pane: 'gen' });
    }

    function summary(body, assembled) {
        const p = body.parameters;
        const cap = p.v4_prompt.caption;
        return [
            `model: ${body.model} (params_version ${p.params_version})`,
            `size: ${p.width}x${p.height} · steps ${p.steps} · scale ${p.scale} · rescale ${p.cfg_rescale} · ${p.sampler}/${p.noise_schedule}`,
            `uc preset: ${p.ucPresetId ?? p.ucPreset} · coords: ${p.v4_prompt.use_coords} · characters: ${cap.char_captions.length}`,
            `tokens(추정): base ${assembled.budget.base} · chars ${assembled.budget.chars} / ${assembled.budget.limit}`,
            '',
            `[base_caption] ${cap.base_caption}`,
            ...cap.char_captions.map((c, i) => `[char ${i}] (${c.centers[0].x},${c.centers[0].y}) ${c.char_caption}`),
            `[negative] ${p.negative_prompt}`
        ].join('\n');
    }

    async function draw({ assembled, gen, apiKey, seed, signal }) {
        if (!apiKey) throw Object.assign(new Error('NovelAI 키가 없어. 설정 → 연결에서 넣어줘.'), { code: 'NO_KEY', pane: 'api' });
        const useSeed = seed === '' || seed == null || !Number.isFinite(Number(seed)) ? randomSeed() : Number(seed);
        const body = payload(assembled, gen, useSeed);
        check(body);
        const v5 = assembled.family === 'v5';
        let data = body;
        if (v5) {
            data = new FormData();
            data.append('request', new Blob([JSON.stringify(body)], { type: 'application/json' }), 'blob');
        }
        const headers = { Authorization: `Bearer ${apiKey}` };
        if (!v5) headers['Content-Type'] = 'application/json';
        const buffer = await Http.send({
            method: 'POST',
            url: 'https://image.novelai.net/ai/generate-image',
            headers, data, raw: v5, responseType: 'arraybuffer', timeout: 180000, signal,
            onFail: err => { err.diag = summary(body, assembled); }
        });
        return { blob: image(buffer), seed: useSeed, payload: body };
    }

    return { SIZES, GEN_DEFAULTS, UC_NAMES, V5_QUALITY, ucTable, ucPick, negative, payload, image, draw, randomSeed };
})();


// ── net/http.js ──
// Http — GM_xmlhttpRequest를 Promise로. 실패하면 사람 말로 된 오류를 만든다.
const Http = (() => {
    'use strict';

    const SERVICES = [[/novelai\.net/, 'NovelAI'], [/googleapis\.com/, 'Gemini'], [/deepseek\.com/, 'DeepSeek']];
    const serviceOf = url => (SERVICES.find(([re]) => re.test(String(url || ''))) || [null, '서버'])[1];

    const STATUS_WORDS = {
        400: '요청 형식 오류', 401: '키가 틀렸거나 만료됐어', 402: 'Anlas(결제 잔액)가 부족해', 403: '권한이 없어',
        404: '주소나 모델을 찾지 못했어', 409: '이미 다른 생성이 진행 중이야', 429: '요청이 너무 잦아 · 잠깐 뒤에 다시',
        500: '서버 오류', 503: '서버가 바빠'
    };

    function detailOf(text) {
        try {
            const j = JSON.parse(text);
            return j?.error?.message || j?.message || (typeof j?.error === 'string' ? j.error : '') || '';
        } catch (_) {
            return String(text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
        }
    }

    // 서비스마다 흔한 실패는 원인과 고칠 곳(pane)을 같이 알려 준다.
    function known(service, status, detail) {
        if (service === 'Gemini' && (status === 403 || /API key not valid|API_KEY_INVALID|api key/i.test(detail))) {
            return { text: 'Gemini 키가 올바르지 않아. NovelAI 토큰(pst-…)이 아니라 Google AI Studio에서 받은 AIza… 키를 넣어야 해.', pane: 'api' };
        }
        if (service === 'DeepSeek' && status === 401) return { text: 'DeepSeek 키가 올바르지 않아.', pane: 'api' };
        if (service === 'NovelAI') {
            if (status === 401) return { text: 'NovelAI 토큰이 틀렸거나 만료됐어. NovelAI 설정에서 새 토큰을 받아 넣어줘.', pane: 'api' };
            if (status === 402) return { text: 'NovelAI 구독이 없거나 Anlas가 부족해.' };
            if (status === 400) return { text: `NovelAI가 요청 내용을 거부했어. 토큰 문제는 아니야(토큰이 틀리면 401이 떠).${detail ? ` 서버 메시지: ${detail}` : ''}` };
        }
        return null;
    }

    function cancelled() {
        return Object.assign(new Error('취소했어.'), { name: 'AbortError' });
    }

    function bodyText(res) {
        if (typeof res.responseText === 'string' && res.responseText) return res.responseText;
        if (res.response instanceof ArrayBuffer) {
            try { return new TextDecoder().decode(new Uint8Array(res.response).subarray(0, 4000)); } catch (_) { return ''; }
        }
        return String(res.response || '');
    }

    function failure(url, res) {
        const text = bodyText(res);
        const service = serviceOf(url);
        const detail = detailOf(text);
        const hit = known(service, res.status, detail);
        const message = hit ? hit.text : `${service}: ${STATUS_WORDS[res.status] || '요청 실패'} (HTTP ${res.status})${detail ? ` · ${detail}` : ''}`;
        const err = Object.assign(new Error(message), { status: res.status, service, body: text });
        if (hit?.pane) err.pane = hit.pane;
        return err;
    }

    /** raw: data를 그대로 보냄(FormData 등). 아니면 JSON으로. responseType 'arraybuffer' 면 버퍼, 아니면 JSON을 돌려준다. */
    function send({ method = 'GET', url, headers = {}, data, raw = false, responseType = 'text', timeout = 120000, signal, onFail }) {
        return new Promise((resolve, reject) => {
            if (signal?.aborted) { reject(cancelled()); return; }
            let settled = false;
            let handle = null;
            const settle = (fn, value) => {
                if (settled) return;
                settled = true;
                signal?.removeEventListener?.('abort', stop);
                fn(value);
            };
            const stop = () => {
                try { handle?.abort?.(); } catch (_) { /* 이미 끝남 */ }
                settle(reject, cancelled());
            };
            signal?.addEventListener?.('abort', stop, { once: true });
            handle = GM_xmlhttpRequest({
                method, url, headers, timeout, responseType,
                data: data == null ? undefined : raw ? data : JSON.stringify(data),
                onload: res => {
                    if (res.status < 200 || res.status >= 300) {
                        const err = failure(url, res);
                        try { onFail?.(err); } catch (_) { /* 진단 정보는 없어도 됨 */ }
                        settle(reject, err);
                        return;
                    }
                    if (responseType === 'arraybuffer') { settle(resolve, res.response); return; }
                    try { settle(resolve, JSON.parse(res.responseText)); } catch (_) { settle(reject, new Error('응답을 JSON으로 읽지 못했어.')); }
                },
                onerror: () => settle(reject, new Error('네트워크 오류 · 연결이나 확장 프로그램의 도메인 허용을 확인해줘.')),
                ontimeout: () => settle(reject, new Error('응답 시간이 초과됐어.')),
                onabort: () => settle(reject, cancelled())
            });
        });
    }

    return { send, cancelled };
})();


// ── net/analyst.js ──
// Analyst — 채팅 답변을 읽고 그릴 장면을 JSON으로 받아 온다 (Gemini / DeepSeek).
// AI 몫은 장면과 인물별 행동뿐이다. 작가·화풍·퀄리티는 사용자가 정하고, 섞여 와도 Compose가 걸러 낸다.
const Analyst = (() => {
    'use strict';

    const GEMINI_MODELS = Object.freeze([
        ['gemini-3.8-flash', 'Gemini 3.8 Flash'],
        ['gemini-3.7-flash', 'Gemini 3.7 Flash'],
        ['gemini-3.6-flash', 'Gemini 3.6 Flash'],
        ['gemini-3.5-flash', 'Gemini 3.5 Flash'],
        ['gemini-3.5-flash-lite', 'Gemini 3.5 Flash-Lite'],
        ['gemini-3.1-flash-lite', 'Gemini 3.1 Flash-Lite'],
        ['gemini-3.1-pro-preview', 'Gemini 3.1 Pro (Preview)'],
        ['gemini-3-flash-preview', 'Gemini 3 Flash (Preview)']
    ]);
    const DEEPSEEK_MODELS = Object.freeze([
        ['deepseek-v4-flash', 'DeepSeek V4 Flash'],
        ['deepseek-v4-pro', 'DeepSeek V4 Pro']
    ]);

    // ── 지시문 ──────────────────────────────────────────
    function system(family) {
        const v5 = family === 'v5';
        const sceneCaption = v5 ? '영어 현재형 짧은 문장 1~3개. 인물·사물의 공간 배치, 빛이 오는 방향, 앞뒤 거리감, 시선이 흐르는 방향' : '빈 문자열';
        const charCaption = v5 ? '이 인물에게만 해당하는 영어 문장 0~2개 (향한 방향, 거리, 태그로 못 쓰는 복합 동작)' : '빈 문자열';
        return `역할: 롤플레이 채팅 답변 하나를 NovelAI 삽화 한 장으로 바꾸는 연출 담당.
할 일: 대상 답변에서 멈춘 그림 한 장으로 담을 수 있는 딱 한 순간을 골라, 아래 모양의 JSON 하나만 돌려준다. JSON 밖에 아무것도 쓰지 않는다(설명, 코드펜스 없음).

{
  "insertAfterParagraph": 0,
  "title": "장면 제목, 한국어 15자 이내",
  "moment": "고른 순간을 한국어 한 문장으로",
  "scene": {
    "composition": "카메라 거리와 각도 Danbooru 태그 (예: cowboy shot, from side)",
    "tags": "장소, 배경, 시간대, 날씨, 조명, 꼭 필요한 소품 Danbooru 태그",
    "caption": "${sceneCaption}"
  },
  "characters": [
    {
      "id": "등록 인물이면 그 id, 아니면 빈 문자열",
      "name": "등록 인물은 등록 이름 그대로, 아니면 짧은 한국어 호칭",
      "look": "등록 안 된 인물만 채운다: 1girl/1boy 같은 성별 하나 + 외형 + 옷 태그. 등록 인물은 빈 문자열",
      "tags": "이 인물의 자세, 표정, 시선, 동작 Danbooru 태그",
      "caption": "${charCaption}",
      "position": "left | center | right",
      "outfit": { "mode": "keep | replace | modify", "add": "", "remove": "" }
    }
  ]
}

규칙 1 · 칸마다 맡은 것이 따로 있다
- 작가, 화풍, 퀄리티, 연도 태그(artist:…, masterpiece, very aesthetic, year 2024, …style 같은 것)는 어디에도 쓰지 않는다. 사용자가 따로 정해 둔다.
- 인원수 태그(1girl, 2boys, solo …)는 scene 과 tags 에 쓰지 않는다. 프로그램이 직접 센다. 예외는 미등록 인물 look 의 성별 태그 하나.
- 등록 인물의 머리색, 눈색, 체형, 평소 옷은 다시 쓰지 않는다. 이미 저장돼 있다.
- outfit 은 이 장면에서 옷이 실제로 바뀐 경우에만 replace 나 modify 로 쓴다. 예: 재킷을 벗었다 → modify, remove "jacket".
- 이름과 고유명사는 tags 에도 caption 에도 넣지 않는다. caption 에서 인물을 가리킬 때는 "the man on the right" 처럼 화면 속 위치로 부른다.

규칙 2 · 원문에 있는 것만
- 대상 답변과 앞 대화에 나온 것만 그린다. 원문에 없는 스킨십, 표정, 소품, 노출을 지어내지 않는다.
- 다른 시점에 일어난 동작들을 한 화면에 합치지 않는다. 대사 속의 상상이나 계획은 그리지 않는다.
- characters 에는 그 순간 화면에 실제로 보이는 인물만 넣는다. 1인칭 화자 본인은 넣지 않는다.
- insertAfterParagraph 는 고른 순간이 끝나는 문단의 번호다.

규칙 3 · 태그 쓰는 법
- 쉼표로 구분한 영어 Danbooru 태그. 널리 쓰이고 결과가 안정적인 태그로 짧게.
- 뜻이 같은 분위기 형용사를 여러 개 겹쳐 쓰지 않는다.
${v5
        ? '- V5 는 문장을 잘 알아듣는다. 태그로는 빠지기 쉬운 관계, 배치, 빛의 방향은 caption 에 영어 문장으로 쓴다. 감정을 선언하거나 줄거리를 요약하는 문장은 쓰지 않는다.'
        : '- V4.5 는 문장보다 태그가 안정적이다. caption 은 전부 빈 문자열로 둔다.'}`;
    }

    function castRule(people, focus) {
        const n = Number(people);
        if (!n) return '';
        const who = focus ? ` 한 명만 그릴 때는 '${focus.name}'(id=${focus.id})를 그린다.` : '';
        if (n === 1) return `[인원 · 가장 먼저 지킬 것] characters 에는 딱 1명만 넣는다. 장면의 중심 인물 한 명을 혼자(solo) 있는 구도로 그리고, 다른 인물은 화면 밖에 둔다. 손이나 뒷모습 같은 일부도 넣지 않는다.${who}`;
        return `[인원 · 가장 먼저 지킬 것] characters 는 ${n}명까지. 중요한 인물부터 순서대로 넣는다.${who}`;
    }

    // 카메라 기본값: 유저(1인칭 화자)가 자기 눈높이에서 몰래 찍은 스냅사진처럼.
    function cameraRule(camera) {
        if (camera === 'free') return '';
        return `[카메라 · 기본]
- 이 그림은 유저(1인칭 화자)의 눈높이에서 찍힌 스냅사진 한 장이다. scene.composition 맨 앞에 pov, candid shot, snapshot 을 넣는다.
- 인물은 카메라를 모르는 듯 자연스러운 순간으로 잡는다. 포즈를 잡거나 정면으로 서 있는 증명사진, 전신 컷은 피한다.
- looking at viewer 는 원문에서 인물이 유저를 보고 있을 때만 쓴다. 아니면 하던 동작과 시선을 그대로 둔다.
- 거리와 각도는 유저가 실제로 있는 자리를 기준으로 정한다 (마주 앉음 → 정면 가까이, 옆에 누움 → from side 가까이, 올려다봄 → from below).
- 그 순간 원문에서 유저의 손이나 팔이 화면에 들어온다면 composition 에 pov hands 를 넣는다. 유저의 얼굴과 몸은 그리지 않는다.`;
    }

    function user({ characters, note, context, paragraphs, fixedParagraph, request, people, focus, camera }) {
        const cast = characters.length
            ? characters.map(c => {
                const alias = c.aliases?.length ? ` | 별칭=${c.aliases.join(', ')}` : '';
                const look = Tags.join([c.look, c.outfit]).slice(0, 200);
                return `- id=${c.id} | 이름=${c.name}${alias} | 외형(참고만, 다시 쓰지 말 것)=${look}`;
            }).join('\n')
            : '(등록 인물 없음 · 화면에 나오는 인물은 모두 미등록으로 보고 look 을 채운다)';
        const blocks = [
            `[등록 인물]\n${cast}`,
            note && `[세계관·장소 메모]\n${note}`,
            context && `[앞 대화]\n${context}`,
            `[대상 답변 · 앞의 숫자가 문단 번호]\n${paragraphs.map(p => `[${p.index}] ${p.text}`).join('\n')}`,
            Number.isInteger(fixedParagraph) && `[고정] insertAfterParagraph=${fixedParagraph} 문단의 순간을 그린다. 다른 장면으로 바꾸지 않는다.`,
            castRule(people, focus),
            cameraRule(camera),
            request && `[사용자 수정 요청 · 가장 우선]\n${request}`
        ];
        return blocks.filter(Boolean).join('\n\n');
    }

    // ── Gemini ──────────────────────────────────────────
    function geminiConfig(model, thinking) {
        const cfg = {};
        const m = String(model);
        const newFlash = /^gemini-3\.(?:6|7|8)-flash$/.test(m);
        if (!newFlash) Object.assign(cfg, { temperature: 0.3, topP: 0.9 });
        if (m === 'gemini-3.8-flash') cfg.responseFormat = { text: { mimeType: 'application/json' } };
        else cfg.responseMimeType = 'application/json';
        if (m.startsWith('gemini-3')) {
            const level = { fast: 'low', normal: 'medium', deep: 'high' }[thinking] || (m === 'gemini-3.8-flash' ? 'medium' : '');
            if (level) cfg.thinkingConfig = { thinkingLevel: level };
        }
        return cfg;
    }

    const OPEN_SAFETY = ['SEXUALLY_EXPLICIT', 'HATE_SPEECH', 'HARASSMENT', 'DANGEROUS_CONTENT'].map(c => ({ category: `HARM_CATEGORY_${c}`, threshold: 'BLOCK_NONE' }));
    const wait = ms => new Promise(r => setTimeout(r, ms));

    async function gemini({ key, model, thinking, sys, prompt, signal }) {
        if (!key) throw Object.assign(new Error('Gemini 키가 없어. 설정 → 연결에서 넣어줘.'), { code: 'NO_KEY', pane: 'api' });
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
        const body = {
            systemInstruction: { parts: [{ text: sys }] },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: geminiConfig(model, thinking),
            safetySettings: OPEN_SAFETY
        };
        const post = () => Http.send({ method: 'POST', url, headers: { 'Content-Type': 'application/json' }, data: body, signal, timeout: 120000 });
        let res;
        try {
            res = await post();
        } catch (e) {
            if (e.status === 400 && /mime|responseFormat|response_format|json/i.test(e.message)) {
                // 이 모델이 JSON 출력 옵션을 모르면 그 옵션만 빼고 다시
                delete body.generationConfig.responseFormat;
                delete body.generationConfig.responseMimeType;
                res = await post();
            } else if (e.status === 503 || e.status === 429) {
                await wait(2500);
                res = await post();
            } else {
                throw e;
            }
        }
        if (res?.promptFeedback?.blockReason) throw new Error(`Gemini가 요청을 막았어 (${res.promptFeedback.blockReason}).`);
        const first = res?.candidates?.[0];
        const reply = (first?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('').trim();
        if (!reply) throw new Error(`Gemini 응답이 비었어${first?.finishReason ? ` (${first.finishReason})` : ''}.`);
        return reply;
    }

    // ── DeepSeek ────────────────────────────────────────
    async function deepseek({ key, model, thinking, sys, prompt, signal }) {
        if (!key) throw Object.assign(new Error('DeepSeek 키가 없어. 설정 → 연결에서 넣어줘.'), { code: 'NO_KEY', pane: 'api' });
        const body = {
            model,
            messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }],
            stream: false,
            response_format: { type: 'json_object' }
        };
        if (thinking === 'fast') body.thinking = { type: 'disabled' };
        else Object.assign(body, { thinking: { type: 'enabled' }, reasoning_effort: thinking === 'deep' ? 'max' : 'high' });
        const post = () => Http.send({
            method: 'POST', url: 'https://api.deepseek.com/chat/completions',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
            data: body, signal, timeout: 180000
        });
        let res;
        try {
            res = await post();
        } catch (first) {
            // 400이면 선택 옵션(생각 모드, JSON 강제)을 빼고 한 번만 더. 또 실패하면 처음 오류를 보여 준다.
            if (first.status !== 400) throw first;
            ['thinking', 'reasoning_effort', 'response_format'].forEach(k => delete body[k]);
            try { res = await post(); } catch (_) { throw first; }
        }
        const reply = String(res?.choices?.[0]?.message?.content || '').trim();
        if (!reply) throw new Error('DeepSeek 응답이 비었어.');
        return reply;
    }

    function ask(provider, opts) {
        return provider === 'deepseek' ? deepseek(opts) : gemini(opts);
    }

    async function run(input, { prefs, keys, signal }) {
        const a = prefs.analyzer;
        const deep = a.provider === 'deepseek';
        const reply = await ask(a.provider, {
            key: deep ? keys.deepseekKey : keys.geminiKey,
            model: deep ? a.deepseekModel : a.geminiModel,
            thinking: a.thinking,
            sys: system(Models.get(prefs.model).family),
            prompt: user(input),
            signal
        });
        return Plan.parse(reply);
    }

    async function ping(provider, key, model) {
        return Plan.parse(await ask(provider, { key, model, thinking: 'fast', sys: 'Reply with JSON only.', prompt: 'Return {"ok":true}' }));
    }

    return { GEMINI_MODELS, DEEPSEEK_MODELS, system, user, run, ping };
})();


// ── data/prefs.js ──
// Prefs — 설정과 API 키 (유저스크립트 저장소).
// 탭마다 낡은 사본을 들고 있다가 통째로 덮어쓰면 다른 탭에서 넣은 키가 지워진다.
// 그래서 사본을 두지 않는다: 읽을 때마다 새로 읽고, 쓸 때도 새로 읽어서 바꾼 곳만 고친다.
// 저장 이름(cp_settings_v1, cp_secrets_v1)은 예전 버전과 같아서 쓰던 설정·키가 그대로 이어진다.
const Prefs = (() => {
    'use strict';

    const SETTINGS = 'cp_settings_v1';
    const SECRETS = 'cp_secrets_v1';
    const KEY_FIELDS = ['naiKey', 'geminiKey', 'deepseekKey'];

    const subscribers = new Set();
    const subscribe = fn => { subscribers.add(fn); return () => subscribers.delete(fn); };
    const notify = (what, fromOtherTab = false) => {
        for (const fn of subscribers) {
            try { fn(what, fromOtherTab); } catch (e) { console.error('[크랙 페인터]', e); }
        }
    };

    function load(name) {
        try {
            const raw = GM_getValue(name, null);
            if (raw == null) return {};
            const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return value && typeof value === 'object' ? value : {};
        } catch (e) {
            console.warn('[크랙 페인터] 저장값을 읽지 못했어', name, e);
            return {};
        }
    }
    const store = (name, value) => GM_setValue(name, JSON.stringify(value));

    function newId(prefix = 'id') {
        const tail = globalThis.crypto?.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
        return `${prefix}_${Date.now().toString(36)}${tail}`;
    }

    function blank() {
        return {
            v: 1,
            analyzer: { provider: 'gemini', geminiModel: 'gemini-3.7-flash', deepseekModel: 'deepseek-v4-flash', thinking: 'auto' },
            model: Models.DEFAULT,
            gen: { ...Nai.GEN_DEFAULTS },
            style: { pos: '', neg: '' },
            presets: [],
            characters: [],
            rooms: {},
            ui: { contextTurns: 4 },
            scene: { people: 'auto', camera: 'pov' },
            folder: { enabled: false, perRoom: true, download: false }
        };
    }

    const list = v => (Array.isArray(v) ? v : []);
    const obj = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

    function person(c) {
        const aliases = Array.isArray(c?.aliases) ? c.aliases : String(c?.aliases || '').split(',');
        return {
            id: String(c?.id || newId('ch')),
            name: String(c?.name || '').trim(),
            aliases: aliases.map(a => String(a).trim()).filter(Boolean),
            look: String(c?.look || ''),
            outfit: String(c?.outfit || ''),
            uc: String(c?.uc || '')
        };
    }

    function shape(raw) {
        const d = blank();
        const s = obj(raw);
        const out = { ...d, ...s };
        for (const part of ['analyzer', 'gen', 'style', 'ui', 'scene', 'folder']) out[part] = { ...d[part], ...obj(s[part]) };
        out.presets = list(s.presets);
        out.characters = list(s.characters).map(person);
        out.rooms = s.rooms && typeof s.rooms === 'object' ? s.rooms : {};
        if (!Models.ALL[out.model]) out.model = Models.DEFAULT;
        return out;
    }

    const get = () => shape(load(SETTINGS));

    /** edit(draft => { draft.x = … }) — 쓰기 직전에 새로 읽어서 다른 탭이 바꾼 걸 덮지 않는다. */
    function edit(change) {
        const draft = shape(load(SETTINGS));
        const replaced = change(draft);
        store(SETTINGS, shape(replaced || draft));
        notify('settings');
    }

    function keys() {
        const s = load(SECRETS);
        return Object.fromEntries(KEY_FIELDS.map(f => [f, typeof s[f] === 'string' ? s[f].trim() : '']));
    }

    function setKey(field, value) {
        if (!KEY_FIELDS.includes(field)) return;
        const s = load(SECRETS);
        s[field] = String(value || '').trim();
        store(SECRETS, s);
        notify('secrets');
    }

    try {
        if (typeof GM_addValueChangeListener === 'function') {
            GM_addValueChangeListener(SETTINGS, (_k, _old, _new, remote) => { if (remote) notify('settings', true); });
            GM_addValueChangeListener(SECRETS, (_k, _old, _new, remote) => { if (remote) notify('secrets', true); });
        }
    } catch (_) { /* 리스너 없는 환경 */ }

    /** 이 채팅방에서 켠 등록 인물 */
    function cast(roomId, s = get()) {
        const on = new Set(s.rooms?.[roomId]?.chars || []);
        return s.characters.filter(c => on.has(c.id));
    }

    function room(s, roomId) {
        if (!s.rooms[roomId]) s.rooms[roomId] = {};
        return s.rooms[roomId];
    }

    return { get, edit, keys, setKey, subscribe, notify, cast, room, newId };
})();


// ── data/vault.js ──
// Vault — 그림과 기록 (IndexedDB 'crack-painter').
// 표 이름과 기록 모양은 예전 버전과 같아서 그동안 만든 삽화가 그대로 보인다.
//   images  : imageId → Blob
//   meta    : 'folder' → 폴더 핸들 …
//   records : { key:'방|메시지', roomId, messageKey, roomName, title, paragraph, index,
//               history:[{ imageId, seed, model, gen, state, sent, createdAt }], updatedAt }
const Vault = (() => {
    'use strict';
    let opening = null;

    function open() {
        if (opening) return opening;
        opening = new Promise((resolve, reject) => {
            const req = indexedDB.open('crack-painter', 2);
            req.onupgradeneeded = () => {
                const db = req.result;
                const has = n => db.objectStoreNames.contains(n);
                if (!has('images')) db.createObjectStore('images');
                if (!has('meta')) db.createObjectStore('meta');
                if (!has('records')) db.createObjectStore('records', { keyPath: 'key' }).createIndex('room', 'roomId');
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => { opening = null; reject(req.error); };
        });
        return opening;
    }

    const done = request => new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    async function read(table, use) {
        const db = await open();
        return done(use(db.transaction(table).objectStore(table)));
    }

    async function write(table, use) {
        const db = await open();
        return new Promise((resolve, reject) => {
            const t = db.transaction(table, 'readwrite');
            use(t.objectStore(table));
            t.oncomplete = () => resolve();
            t.onerror = () => reject(t.error);
            t.onabort = () => reject(t.error || new Error('저장소 작업이 중단됐어.'));
        });
    }

    // 다른 탭에 "이 방 기록이 바뀌었다"고 알린다
    const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('crack-painter') : null;
    if (channel) channel.onmessage = ev => Prefs.notify(`records:${ev.data?.roomId || ''}`);
    const changed = roomId => { channel?.postMessage({ roomId }); Prefs.notify(`records:${roomId}`); };

    const recordKey = (roomId, messageKey) => `${roomId}|${messageKey}`;

    async function saveImage(blob) {
        const id = Prefs.newId('img');
        await write('images', s => s.put(blob, id));
        return id;
    }
    const image = id => read('images', s => s.get(id));
    const dropImage = id => write('images', s => s.delete(id));

    const record = async (roomId, messageKey) => (await read('records', s => s.get(recordKey(roomId, messageKey)))) || null;
    const roomList = roomId => read('records', s => s.index('room').getAll(roomId));
    const everything = () => read('records', s => s.getAll());

    async function saveRecord(rec) {
        rec.key = recordKey(rec.roomId, rec.messageKey);
        rec.updatedAt = Date.now();
        await write('records', s => s.put(rec));
        changed(rec.roomId);
        return rec;
    }

    async function dropRecord(roomId, messageKey) {
        const rec = await record(roomId, messageKey);
        if (!rec) return;
        for (const h of rec.history || []) await dropImage(h.imageId).catch(() => {});
        await write('records', s => s.delete(recordKey(roomId, messageKey)));
        changed(roomId);
    }

    const meta = key => read('meta', s => s.get(key));
    const setMeta = (key, value) => write('meta', s => (value == null ? s.delete(key) : s.put(value, key)));

    async function usage() {
        try {
            const e = await navigator.storage?.estimate?.();
            return e ? { used: e.usage || 0, quota: e.quota || 0 } : null;
        } catch (_) {
            return null;
        }
    }

    return { saveImage, image, dropImage, record, roomList, everything, saveRecord, dropRecord, meta, setMeta, usage };
})();


// ── page/site.js ──
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


// ── page/disk.js ──
// Disk — 만든 삽화를 내 컴퓨터 폴더에도 PNG로 저장.
// Chromium 계열(Chrome·Edge·Whale)의 폴더 접근 기능을 쓰고, 안 되는 브라우저는 "생성할 때마다 다운로드"로 대신한다.
// 폴더 권한은 브라우저를 다시 열면 다시 물어볼 수 있고, 클릭 직후에만 물을 수 있다.
// 그래서 생성 버튼을 누른 순간 warm()으로 미리 물어 둔다.
const Disk = (() => {
    'use strict';
    const supported = typeof window.showDirectoryPicker === 'function';
    let dir = null;
    let loading = null;
    let warnedOnce = false;

    const load = () => (loading ||= Vault.meta('folder').then(h => (dir = h || null)).catch(() => null));

    async function choose() {
        if (!supported) throw new Error('이 브라우저는 폴더 지정을 지원하지 않아. Chrome·Edge·Whale에서 쓸 수 있어.');
        dir = await window.showDirectoryPicker({ id: 'crack-painter', mode: 'readwrite', startIn: 'pictures' });
        loading = Promise.resolve(dir);
        await Vault.setMeta('folder', dir);
        return dir;
    }

    async function status() {
        await load();
        if (!dir) return { set: false };
        let permission = 'prompt';
        try { permission = await dir.queryPermission({ mode: 'readwrite' }); } catch (_) { /* 모름 */ }
        return { set: true, name: dir.name, permission };
    }

    /** 클릭 핸들러 안에서 바로 부른다. 권한을 아직 안 줬으면 이때 허용 창이 뜬다. */
    function warm(force = false) {
        if (!dir || (!force && !Prefs.get().folder?.enabled)) return Promise.resolve(false);
        try {
            return dir.queryPermission({ mode: 'readwrite' })
                .then(p => (p === 'granted' ? true : dir.requestPermission({ mode: 'readwrite' }).then(r => r === 'granted')))
                .catch(() => false);
        } catch (_) {
            return Promise.resolve(false);
        }
    }

    function fileName(title, seed) {
        const d = new Date();
        const two = n => String(n).padStart(2, '0');
        const stamp = `${d.getFullYear()}${two(d.getMonth() + 1)}${two(d.getDate())}-${two(d.getHours())}${two(d.getMinutes())}${two(d.getSeconds())}`;
        return `${stamp}_${Site.safeName(title || 'scene')}_${seed}.png`;
    }

    function download(blob, name) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }

    async function save(blob, { title, seed }) {
        const opt = Prefs.get().folder || {};
        const name = fileName(title, seed);
        if (opt.enabled && dir) {
            try {
                if ((await dir.queryPermission({ mode: 'readwrite' })) !== 'granted') throw new Error('폴더 권한이 없어. 설정 → 저장 공간에서 "다시 허용"을 눌러줘.');
                const perRoom = opt.perRoom !== false;
                const target = perRoom ? await dir.getDirectoryHandle(Site.roomTitle(), { create: true }) : dir;
                const w = await (await target.getFileHandle(name, { create: true })).createWritable();
                await w.write(blob);
                await w.close();
                return { ok: true, where: [dir.name, perRoom && Site.roomTitle(), name].filter(Boolean).join('/') };
            } catch (e) {
                if (!warnedOnce) {
                    warnedOnce = true;
                    Kit.toast({ title: '폴더에 저장하지 못했어', body: `${e.message} (브라우저 안에는 저장됐어)`, kind: 'err', actions: [{ label: '설정 열기', onClick: () => Settings.open('storage') }] });
                }
                return { ok: false };
            }
        }
        if (opt.download) {
            download(blob, name);
            return { ok: true, where: `다운로드/${name}` };
        }
        return { ok: false };
    }

    return { supported, load, choose, status, warm, save, download };
})();


// ── data/import2.js ──
// Import2 — 2.0(11/23~11/24에 잠깐 올라갔던 전면 개편판)에서 새로 만든 삽화를 한 번만 가져온다.
// 2.0은 'crack-painter-2' 저장소에 따로 보관했다. 예전 삽화를 복사해 둔 것(legacy)은 원래 자리에 그대로 있으니 건너뛴다.
const Import2 = (() => {
    'use strict';
    const FLAG = 'cp_imported_v2';

    const done = r => new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });

    async function exists() {
        if (!indexedDB.databases) return false;
        return (await indexedDB.databases()).some(d => d.name === 'crack-painter-2');
    }

    function openOld() {
        return new Promise((resolve, reject) => {
            const r = indexedDB.open('crack-painter-2');
            r.onupgradeneeded = () => r.transaction.abort();      // 없으면 만들지 않는다
            r.onsuccess = () => resolve(r.result);
            r.onerror = () => reject(r.error);
        });
    }

    // 2.0이 보낸 내용으로 스튜디오 상태를 만든다 (리롤·프롬프트 불러오기가 같은 그림을 다시 만들게)
    function stateFrom(shot) {
        const sent = shot.sent || {};
        const counts = Tags.split(sent.base).filter(t => Tags.kind(t) === 'count');
        return {
            title: shot.title || '', moment: '', paragraph: shot.para || 0,
            style: { pos: sent.base || '', neg: sent.baseNeg || '' },
            scene: { tags: '', caption: '', count: Tags.join(counts) },
            chars: (sent.chars || []).map((c, i) => ({ id: `v2_${i}`, source: 'extra', name: c.name || `인물 ${i + 1}`, aliases: [], look: c.prompt || '', action: '', caption: '', uc: c.neg || '', position: c.center || null, enabled: true })),
            neg: ''
        };
    }

    async function run() {
        if (GM_getValue(FLAG, false)) return 0;
        let moved = 0;
        try {
            if (await exists()) {
                const db = await openOld();
                const shots = db.objectStoreNames.contains('shots') ? await done(db.transaction('shots').objectStore('shots').getAll()) : [];
                db.close();
                for (const shot of shots.filter(x => !x.legacy && x.blob && x.room && x.msg).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))) {
                    const messageKey = `msg_${Site.fingerprint(shot.msg)}`;
                    const rec = (await Vault.record(shot.room, messageKey)) || { roomId: shot.room, messageKey, history: [], index: 0, paragraph: shot.para || 0, title: shot.title || '', roomName: shot.roomName || '' };
                    const sent = shot.sent || {};
                    rec.history.push({
                        imageId: await Vault.saveImage(shot.blob),
                        seed: shot.seed,
                        model: Models.ALL[shot.model] ? shot.model : Models.DEFAULT,
                        gen: { ...Nai.GEN_DEFAULTS, size: 'landscape', ucPreset: 2, qualityV5: 'none' },
                        state: stateFrom(shot),
                        sent: { base: sent.base || '', negative: sent.baseNeg || '', chars: (sent.chars || []).map(c => ({ name: c.name, prompt: c.prompt, uc: c.neg || '' })) },
                        createdAt: shot.createdAt || Date.now()
                    });
                    rec.index = rec.history.length - 1;
                    await Vault.saveRecord(rec);
                    moved += 1;
                }
            }
        } catch (e) {
            console.warn('[크랙 페인터] 2.0 삽화 가져오기 실패', e);
            return 0;    // 다음에 다시 시도
        }
        GM_setValue(FLAG, true);
        if (moved) Kit.toast({ title: `2.0에서 만든 삽화 ${moved}장을 가져왔어`, kind: 'ok', body: '채팅과 삽화 갤러리에서 볼 수 있어.' });
        return moved;
    }

    return { run, stateFrom };
})();


// ── ui/kit.js ──
// Kit — 화면 부품: Shadow DOM 무대, 테마, 아이콘, 창, 팝오버, 알림, 크게 보기, 작은 컨트롤.
const Kit = (() => {
    'use strict';

    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
    const attr = (name, on) => (on ? ` ${name}` : '');

    const svg = (paths, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${paths}</svg>`;
    const icon = {
        art: svg('<path d="M13 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M4.5 17.5 9 13l3.5 3.5 2-2 5 4.5"/><circle cx="9" cy="8.8" r="1.4"/><path d="M18 2.6l.85 2.05 2.05.85-2.05.85L18 8.4l-.85-2.05-2.05-.85 2.05-.85z" fill="currentColor" stroke-width="1"/>'),
        bolt: svg('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
        again: svg('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>'),
        back: svg('<path d="m15 18-6-6 6-6"/>'),
        next: svg('<path d="m9 18 6-6-6-6"/>'),
        save: svg('<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>'),
        bin: svg('<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>'),
        pen: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
        cog: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
        close: svg('<path d="M6 6l12 12M18 6 6 18"/>', 'stroke-width="3"'),
        add: svg('<path d="M12 5v14M5 12h14"/>'),
        magic: svg('<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
        info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5v.5"/>'),
        warn: svg('<path d="M12 3 2 20h20z"/><path d="M12 10v4"/><path d="M12 17v.5"/>'),
        photo: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 8"/>'),
        key: svg('<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9"/><path d="m17 6 3 3"/><path d="m15 8 2 2"/>'),
        person: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'),
        palette: svg('<path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>'),
        sliders: svg('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'),
        house: svg('<path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/>'),
        disk: svg('<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'),
        check: svg('<path d="m5 12 5 5 9-10"/>', 'stroke-width="2.4"'),
        chevron: svg('<path d="m9 6 6 6-6 6"/>', 'stroke-width="2.6"'),
        pin: svg('<path d="m5 12 5 5 9-10"/>', 'stroke-width="3.4"'),
        stack: svg('<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>')
    };

    // ── 무대 (Shadow DOM) ─────────────────────────────────
    let host = null;
    let stage = null;
    let shell = null;
    let notices = null;

    function mount() {
        if (shell?.isConnected) return shell;
        host = document.createElement('div');
        host.id = 'kp-host';
        const shadow = host.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = SHELL_CSS;
        shell = document.createElement('div');
        shell.className = 'shell';
        stage = document.createElement('div');
        stage.className = 'stage-layer';
        notices = document.createElement('div');
        notices.className = 'notices';
        shell.append(stage, notices);
        shadow.append(style, shell);
        document.body.append(host);
        followTheme();
        const watch = new MutationObserver(followTheme);
        for (const el of [document.body, document.documentElement]) watch.observe(el, { attributes: true, attributeFilter: ['data-theme', 'class'] });
        matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', followTheme);
        return shell;
    }

    function followTheme() {
        shell?.classList.toggle('dark', Site.theme() === 'dark');
    }

    function pageStyle() {
        if (document.getElementById('kp-page-style')) return;
        const st = document.createElement('style');
        st.id = 'kp-page-style';
        st.textContent = PAGE_CSS;
        document.head.append(st);
    }

    // ── 창 ──────────────────────────────────────────────
    const windows = new Map();
    const topWindow = () => [...windows.values()].pop();
    const isTyping = el => el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);

    const trafficLights = (zoom = true) => `<div class="traffic"><i class="t-close" data-light="close" aria-label="닫기"></i><i class="t-off"></i><i class="${zoom ? 't-zoom' : 't-off'}" data-light="${zoom ? 'zoom' : ''}" aria-label="크게"></i></div>`;

    /** sidebar: 창 위 제목 줄 없이 몸통이 스스로 제목 줄을 그린다(설정 창). */
    function window_({ id, cls = '', title = '', sub = '', sidebar = false, onClose }) {
        mount();
        if (windows.has(id)) {
            const w = windows.get(id);
            w.raise();
            return w;
        }
        const scrim = document.createElement('div');
        scrim.className = 'scrim';
        const el = document.createElement('div');
        el.className = `window ${cls}`;
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-label', title);
        el.innerHTML = `${sidebar ? '' : `
            <header class="chrome" data-drag>
              <div class="chrome-l">${trafficLights()}</div>
              <div class="chrome-c"><b></b><small></small></div>
              <div class="chrome-r"></div>
            </header>`}<div class="window-body"></div>`;
        stage.append(scrim, el);

        const onKey = ev => {
            if (topWindow() !== win || ev.key !== 'Escape' || ev.target.closest?.('.popover')) return;
            ev.stopPropagation();
            if (closeMenu()) return;
            // 입력하던 중이면 창은 그대로 두고 입력칸에서만 빠져나온다
            const target = ev.composedPath?.()[0];
            if (isTyping(target)) { target.blur(); return; }
            win.close();
        };

        const win = {
            id, el,
            body: el.querySelector('.window-body'),
            title(text, subtitle = '') {
                const b = el.querySelector('.chrome-c b');
                const s = el.querySelector('.chrome-c small');
                if (b) b.textContent = text;
                if (s) { s.textContent = subtitle; s.classList.toggle('hide', !subtitle); }
            },
            right(html) { const r = el.querySelector('.chrome-r'); if (r) r.innerHTML = html; },
            raise() { stage.append(scrim, el); windows.delete(id); windows.set(id, win); },
            close() {
                if (windows.get(id) !== win) return;
                windows.delete(id);
                el.remove();
                scrim.remove();
                document.removeEventListener('keydown', onKey, true);
                onClose?.();
            }
        };
        win.title(title, sub);

        el.addEventListener('click', ev => {
            const light = ev.target.closest('[data-light]')?.dataset.light;
            if (light === 'close') win.close();
            else if (light === 'zoom') el.classList.toggle('is-zoomed');
        });
        scrim.addEventListener('click', () => win.close());
        document.addEventListener('keydown', onKey, true);
        dragByTitle(el);
        requestAnimationFrame(() => {
            const r = el.getBoundingClientRect();
            el.style.left = `${Math.max(8, (innerWidth - r.width) / 2)}px`;
            el.style.top = `${Math.max(8, (innerHeight - r.height) / 2 - 10)}px`;
        });
        windows.set(id, win);
        return win;
    }

    function dragByTitle(el) {
        const interactive = 'button, input, select, textarea, a, .traffic, .segmented';
        el.addEventListener('pointerdown', ev => {
            if (!ev.target.closest('[data-drag]') || ev.target.closest(interactive) || el.classList.contains('is-zoomed') || innerWidth <= 760) return;
            const r = el.getBoundingClientRect();
            const ox = ev.clientX - r.left;
            const oy = ev.clientY - r.top;
            const move = e => {
                el.style.left = `${Math.min(innerWidth - 80, Math.max(120 - r.width, e.clientX - ox))}px`;
                el.style.top = `${Math.min(innerHeight - 40, Math.max(0, e.clientY - oy))}px`;
            };
            const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
            addEventListener('pointermove', move);
            addEventListener('pointerup', up);
        });
        el.addEventListener('dblclick', ev => {
            if (ev.target.closest('[data-drag]') && !ev.target.closest(interactive)) el.classList.toggle('is-zoomed');
        });
    }

    // ── 누른 자리에서 한 번 더 눌러 확인 (3초 안) ─────────────
    function confirmTap(btn, label = '한 번 더') {
        if (btn.dataset.armed) {
            clearTimeout(btn.kpTimer);
            delete btn.dataset.armed;
            btn.classList.remove('is-armed');
            btn.innerHTML = btn.kpHtml;
            return true;
        }
        btn.dataset.armed = '1';
        btn.kpHtml = btn.innerHTML;
        btn.classList.add('is-armed');
        btn.innerHTML = `${icon.bin}<span>${esc(label)}</span>`;
        btn.kpTimer = setTimeout(() => {
            delete btn.dataset.armed;
            btn.classList.remove('is-armed');
            btn.innerHTML = btn.kpHtml;
        }, 3000);
        return false;
    }

    // ── 팝오버 ──────────────────────────────────────────
    let popover = null;
    function closeMenu() {
        const el = popover;
        if (!el) return false;
        popover = null;
        el.remove();
        el.kpCancel?.();
        return true;
    }

    function showPopover(anchor, cls, html) {
        closeMenu();
        mount();
        const el = document.createElement('div');
        el.className = `popover ${cls}`;
        el.innerHTML = html;
        stage.append(el);
        const a = anchor.getBoundingClientRect();
        const p = el.getBoundingClientRect();
        el.style.left = `${Math.max(8, Math.min(innerWidth - p.width - 8, a.left))}px`;
        el.style.top = `${a.bottom + 4 + p.height > innerHeight ? Math.max(8, a.top - p.height - 4) : a.bottom + 4}px`;
        popover = el;
        return el;
    }

    // 팝오버 바깥을 누르면 닫는다 (여는 클릭은 건너뛰도록 다음 틱부터)
    function closeOnOutside(el, onOutside) {
        setTimeout(() => {
            const off = ev => {
                if (popover === el && ev.composedPath().includes(el)) return;
                document.removeEventListener('pointerdown', off, true);
                if (popover === el) onOutside();
            };
            document.addEventListener('pointerdown', off, true);
        });
    }

    /** items: [{label, sub, value} | {header} | {sep:true}] */
    function menu(anchor, items, onPick) {
        const el = showPopover(anchor, '', items.map((it, i) => {
            if (it.sep) return '<hr>';
            if (it.header) return `<div class="popover-head">${esc(it.header)}</div>`;
            return `<button data-i="${i}"><span class="fill">${esc(it.label)}${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</span></button>`;
        }).join(''));
        el.addEventListener('click', ev => {
            const i = ev.target.closest('button')?.dataset.i;
            if (i == null) return;
            closeMenu();
            onPick(items[Number(i)]);
        });
        closeOnOutside(el, closeMenu);
    }

    /** 작은 이름 입력 팝오버 → 입력값 또는 null */
    function ask(anchor, { title = '', placeholder = '', value = '', ok = '저장' } = {}) {
        return new Promise(resolve => {
            const el = showPopover(anchor, 'popover-ask', `${title ? `<div class="popover-head">${esc(title)}</div>` : ''}
                <div class="line"><input class="input" placeholder="${esc(placeholder)}" value="${esc(value)}"><button class="button is-primary" data-ok>${esc(ok)}</button></div>`);
            const input = el.querySelector('input');
            let answered = false;
            const answer = v => {
                if (answered) return;
                answered = true;
                if (popover === el) closeMenu();
                resolve(v);
            };
            el.kpCancel = () => answer(null);
            input.focus();
            input.addEventListener('keydown', ev => {
                if (ev.key === 'Enter') { ev.preventDefault(); answer(input.value.trim() || null); }
                if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); answer(null); }
            });
            el.querySelector('[data-ok]').addEventListener('click', () => answer(input.value.trim() || null));
            closeOnOutside(el, () => answer(null));
        });
    }

    // ── 알림 ─────────────────────────────────────────────
    /** toast({ title, body, kind:'info'|'ok'|'err', progress, actions:[{label, primary, onClick}], timeout, onDismiss }) */
    function toast(opts) {
        mount();
        const el = document.createElement('div');
        el.className = 'notice';
        let timer = 0;
        const handle = { el, update, close };

        function update(more = {}) {
            Object.assign(opts, more);
            const kind = opts.kind || 'info';
            const badge = kind === 'err' ? ['is-err', icon.warn] : kind === 'ok' ? ['is-ok', icon.check] : ['', icon.art];
            const acts = opts.actions || [];
            el.innerHTML = `
              <div class="notice-icon ${badge[0]}">${badge[1]}</div>
              <div class="notice-text"><b>${esc(opts.title || '크랙 페인터')}</b>${opts.body ? `<p>${esc(opts.body)}</p>` : ''}
                ${opts.progress ? '<div class="notice-progress"><i></i></div>' : ''}
                ${acts.length ? `<div class="notice-acts">${acts.map((a, i) => `<button class="button${a.primary ? ' is-primary' : ''}" data-i="${i}">${esc(a.label)}</button>`).join('')}</div>` : ''}
              </div>
              <button class="iconbutton is-small notice-x" data-x title="닫기">${icon.close}</button>`;
            clearTimeout(timer);
            const stay = opts.progress || acts.length;
            const ms = opts.timeout ?? (stay ? 0 : kind === 'err' ? 7000 : 3200);
            if (ms) timer = setTimeout(close, ms);
        }

        function close() {
            clearTimeout(timer);
            el.classList.add('is-leaving');
            setTimeout(() => el.remove(), 200);
        }

        el.addEventListener('click', ev => {
            if (ev.target.closest('[data-x]')) { opts.onDismiss?.(); close(); return; }
            const i = ev.target.closest('[data-i]')?.dataset.i;
            if (i == null) return;
            const a = opts.actions[Number(i)];
            if (a.keepOpen !== true) close();
            a.onClick?.();
        });
        update();
        notices.prepend(el);
        return handle;
    }

    function lightbox(src) {
        mount();
        const el = document.createElement('div');
        el.className = 'fullview';
        const img = document.createElement('img');
        img.alt = '';
        img.src = src;
        el.append(img);
        const leave = () => { el.remove(); document.removeEventListener('keydown', onKey, true); };
        const onKey = ev => { if (ev.key === 'Escape') { ev.stopPropagation(); leave(); } };
        el.addEventListener('click', leave);
        document.addEventListener('keydown', onKey, true);
        stage.append(el);
    }

    // ── 작은 컨트롤 (HTML 문자열) ──────────────────────────
    const spinner = () => `<div class="spinner">${Array.from({ length: 8 }, (_, i) => `<i style="transform:rotate(${i * 45}deg);animation-delay:${(i - 8) / 8}s"></i>`).join('')}</div>`;

    const seg = (name, choices, value, cls = '') => `<div class="segmented ${cls}" data-seg="${esc(name)}">${choices.map(([v, label]) => `<button type="button" data-v="${esc(v)}"${String(v) === String(value) ? ' class="is-on"' : ''}>${esc(label)}</button>`).join('')}</div>`;

    const options = (choices, value) => choices.map(([v, label]) => `<option value="${esc(v)}"${attr('selected', String(v) === String(value))}>${esc(label)}</option>`).join('');

    const toggle = (name, on) => `<label class="toggle"><input type="checkbox" data-sw="${esc(name)}"${attr('checked', on)}><span></span></label>`;

    return { esc, icon, mount, pageStyle, window: window_, windows, menu, closeMenu, confirmTap, ask, toast, lightbox, spinner, seg, options, toggle };
})();


// ── app/engine.js ──
// Engine — 분석 → 생성 → 기록 저장 흐름과 오류 안내.
const Engine = (() => {
    'use strict';
    const HISTORY_LIMIT = 20;              // 답변 하나에 남기는 그림 수
    const running = new Map();             // messageKey → { controller }
    const copy = v => JSON.parse(JSON.stringify(v ?? null));

    // ── 그림 주소 (Blob URL) ───────────────────────────
    const urls = new Map();
    async function imageUrl(id) {
        if (!id) return '';
        if (!urls.has(id)) {
            const blob = await Vault.image(id);
            if (!blob) return '';
            urls.set(id, URL.createObjectURL(blob));
        }
        return urls.get(id);
    }
    function forget(id) {
        if (urls.has(id)) URL.revokeObjectURL(urls.get(id));
        urls.delete(id);
    }
    function forgetAll() {
        for (const u of urls.values()) URL.revokeObjectURL(u);
        urls.clear();
    }

    // ── 지금 방의 기록 (다른 탭이 바꾸면 BroadcastChannel로 알림이 온다) ──
    let book = { roomId: null, map: new Map(), loading: null };
    function records(roomId = Site.room()) {
        if (book.roomId !== roomId || !book.loading) {
            const b = { roomId, map: new Map(), loading: null };
            b.loading = Vault.roomList(roomId)
                .then(list => { for (const r of list) b.map.set(r.messageKey, r); return b.map; })
                .catch(() => b.map);
            book = b;
        }
        return book.loading;
    }
    Prefs.subscribe(what => {
        if (what === `records:${book.roomId}`) {
            book.loading = null;
            records().then(() => Inline.scan());
        }
        if (what === 'settings') Studio.prefsChanged();
    });

    // ── 오류 ───────────────────────────────────────────
    function report(err, title = '실패했어') {
        if (err?.name === 'AbortError') { Kit.toast({ title: '취소했어' }); return; }
        console.error('[크랙 페인터]', err, err?.diag || '');
        const actions = [];
        if (err?.pane) actions.push({ label: '설정 열기', primary: true, onClick: () => Settings.open(err.pane) });
        if (err?.diag || err?.body) actions.push({ label: '자세히', onClick: () => details(title, err) });
        Kit.toast({ title, body: err?.message || String(err), kind: 'err', actions, timeout: actions.length ? 0 : 8000 });
    }

    // 서버 원문과 보낸 요청 요약 (키는 넣지 않는다)
    function details(title, err) {
        const text = [
            `[${err.service || '오류'}] HTTP ${err.status || '-'}`,
            err.message,
            '',
            '── 서버 응답 원문 ──',
            String(err.body || '(없음)').slice(0, 3000),
            ...(err.diag ? ['', '── 보낸 요청 요약 ──', err.diag] : [])
        ].join('\n');
        const w = Kit.window({ id: 'error-detail', cls: 'errors', title: '오류 자세히', sub: title });
        w.body.innerHTML = `<div class="errors-text scroll"><pre>${Kit.esc(text)}</pre></div>
          <div class="errors-foot line"><span class="dim small fill">API 키는 들어 있지 않아.</span><button class="button is-primary" data-copy>복사</button></div>`;
        w.body.querySelector('[data-copy]').addEventListener('click', async ev => {
            try { await navigator.clipboard.writeText(text); ev.target.textContent = '복사했어'; } catch (_) { ev.target.textContent = '복사 실패'; }
        });
    }

    // ── 분석 ───────────────────────────────────────────
    /** 그릴 인원: 이 방 설정이 있으면 그것, 없으면 전체 설정. 1명일 때 그릴 인물(focus)은 방 설정. */
    function castFor(roomId, s = Prefs.get()) {
        const r = s.rooms?.[roomId] || {};
        const setting = r.people && r.people !== 'default' ? r.people : s.scene.people;
        const chars = Prefs.cast(roomId, s);
        return { people: setting === 'auto' ? 0 : Number(setting) || 0, focus: chars.find(c => c.id === r.focus) || null, chars };
    }

    function limit(state, people, focus) {
        if (!people) return state;
        if (focus) {
            const at = state.chars.findIndex(c => c.id === focus.id);
            if (at > 0) state.chars.unshift(...state.chars.splice(at, 1));
        }
        state.chars.forEach((c, i) => { if (i >= people) c.enabled = false; });
        return state;
    }

    function inputFor(markdown, { fixedParagraph, request } = {}) {
        const s = Prefs.get();
        const roomId = Site.room();
        const { people, focus, chars } = castFor(roomId, s);
        return {
            people, focus, characters: chars,
            note: s.rooms?.[roomId]?.note || '',
            context: Site.history(markdown, Number(s.ui.contextTurns) || 4),
            paragraphs: Site.paragraphs(markdown),
            fixedParagraph, request,
            camera: s.scene.camera || 'pov'
        };
    }

    async function analyze(markdown, opts = {}, signal) {
        const s = Prefs.get();
        const input = inputFor(markdown, opts);
        if (!input.paragraphs.length) throw new Error('이 답변에서 문단을 찾지 못했어.');
        if (s.analyzer.provider === 'none') {
            // 분석 AI 없이: 등록 인물만 넣은 빈 장면. 장면 태그는 스튜디오에서 직접 쓴다.
            const who = input.focus ? [input.focus] : input.characters;
            const plan = { insertAfterParagraph: input.paragraphs.length - 1, characters: who.map(c => ({ id: c.id, name: c.name })) };
            return limit(Plan.toState(plan, input.characters, s.style), input.people || 1, input.focus);
        }
        const plan = await Analyst.run(input, { prefs: s, keys: Prefs.keys(), signal });
        const state = limit(Plan.clean(Plan.toState(plan, input.characters, s.style)), input.people, input.focus);
        state.paragraph = Number.isInteger(opts.fixedParagraph) ? opts.fixedParagraph : Math.min(state.paragraph, input.paragraphs.length - 1);
        return state;
    }

    // ── 생성 → 저장 → 채팅에 표시 ───────────────────────
    async function generate({ roomId, messageKey, markdown, state, model, gen, signal }) {
        const assembled = Compose.build(state, model);
        if (!assembled.base && !assembled.chars.length) throw new Error('프롬프트가 비어 있어.');
        const { blob, seed } = await Nai.draw({ assembled, gen, apiKey: Prefs.keys().naiKey, seed: gen.seed, signal });
        const imageId = await Vault.saveImage(blob);
        Disk.save(blob, { title: state.title, seed }).catch(() => {});

        const rec = (await Vault.record(roomId, messageKey)) || { roomId, messageKey, history: [], index: 0 };
        rec.paragraph = state.paragraph ?? rec.paragraph ?? 0;
        rec.title = state.title || rec.title || '';
        const here = roomId === Site.room();
        if (here) rec.roomName = Site.roomTitle();
        rec.history.push({
            imageId, seed, model, gen: copy(gen), state: copy(state),
            sent: {
                base: assembled.base,
                negative: Nai.negative(assembled.baseNeg, model, gen.ucPreset),
                chars: assembled.chars.map(({ name, prompt, uc }) => ({ name, prompt, uc }))
            },
            createdAt: Date.now()
        });
        while (rec.history.length > HISTORY_LIMIT) {
            const oldest = rec.history.shift();
            await Vault.dropImage(oldest.imageId).catch(() => {});
            forget(oldest.imageId);
        }
        rec.index = rec.history.length - 1;
        await Vault.saveRecord(rec);
        (await records(roomId)).set(messageKey, rec);
        if (here) {
            const md = markdown?.isConnected ? markdown : Site.byKey(messageKey);
            if (md) await Inline.render(md, rec);
        }
        return { rec, blob, seed, assembled };
    }

    const genPrefs = () => { const s = Prefs.get(); return { model: s.model, gen: { ...s.gen } }; };

    /** 시작 전에 필요한 키가 다 있는지. 없으면 설정의 그 칸을 바로 연다. */
    function ready() {
        const s = Prefs.get();
        const k = Prefs.keys();
        const need = [];
        if (!k.naiKey) need.push('NovelAI 토큰');
        if (s.analyzer.provider === 'gemini' && !k.geminiKey) need.push('Gemini 키');
        if (s.analyzer.provider === 'deepseek' && !k.deepseekKey) need.push('DeepSeek 키');
        if (!need.length) return true;
        Settings.open('api');
        Kit.toast({ title: '시작하려면 키가 필요해', body: `빠진 것: ${need.join(', ')}. 분석 AI 없이 쓰려면 '사용할 AI'를 '안 씀'으로 바꿔.`, timeout: 7000 });
        return false;
    }

    /** 스튜디오의 엑스트라 칸을 등록 인물로 저장하고 이 방에서 켠다 → 새 id */
    function adopt(slot) {
        const id = Prefs.newId('ch');
        const roomId = Site.room();
        Prefs.edit(d => {
            d.characters.push({ id, name: slot.name, aliases: [], look: slot.look || '', outfit: '', uc: slot.uc || '' });
            if (roomId) { const r = Prefs.room(d, roomId); r.chars = [...new Set([...(r.chars || []), id])]; }
        });
        return id;
    }

    function begin(messageKey) {
        const controller = new AbortController();
        running.set(messageKey, { controller });
        return controller;
    }

    /** ⚡ 바로 생성: 분석과 생성을 알림 하나로 */
    async function quick(markdown) {
        if (!ready()) return;
        const roomId = Site.room();
        const messageKey = Site.keyOf(markdown);
        if (running.has(messageKey)) { Kit.toast({ title: '이미 만들고 있어', body: '이 답변의 삽화를 생성 중이야.' }); return; }
        Disk.warm();
        const controller = begin(messageKey);
        Inline.markRunning(messageKey, true);
        const t = Kit.toast({ title: '장면 분석 중', body: '어떤 순간을 그릴지 고르고 있어.', progress: true, actions: [{ label: '취소', onClick: () => controller.abort() }] });
        try {
            const state = await analyze(markdown, {}, controller.signal);
            t.update({ title: '그리는 중', body: state.title || state.moment || 'NovelAI에 요청했어.' });
            await generate({ roomId, messageKey, markdown, state, ...genPrefs(), signal: controller.signal });
            t.close();
            Kit.toast({ title: '삽화 완성', body: state.title || '', kind: 'ok' });
        } catch (err) {
            t.close();
            report(err, '삽화를 만들지 못했어');
        } finally {
            running.delete(messageKey);
            Inline.markRunning(messageKey, false);
        }
    }

    /** ↻ 지금 보이는 그림의 프롬프트 그대로, 시드만 새로 */
    async function reroll(messageKey) {
        if (running.has(messageKey)) return;
        const roomId = Site.room();
        const rec = (await records(roomId)).get(messageKey);
        const shown = rec?.history?.[rec.index];
        if (!shown) return;
        Disk.warm();
        const controller = begin(messageKey);
        Inline.busy(messageKey, true);
        try {
            await generate({ roomId, messageKey, markdown: Site.byKey(messageKey), state: shown.state, model: shown.model, gen: { ...shown.gen, seed: '' }, signal: controller.signal });
        } catch (err) {
            report(err, '리롤 실패');
        } finally {
            running.delete(messageKey);
            Inline.busy(messageKey, false);
        }
    }

    /** 기록에서 그림 한 장 지우기. 마지막 장이면 기록째 지운다. */
    async function removeShot(roomId, messageKey, index) {
        // 다른 방 기록(갤러리 '전체')을 지울 때는 지금 방 캐시를 건드리지 않는다
        const map = roomId === Site.room() ? await records(roomId) : null;
        const rec = map?.get(messageKey) || (await Vault.record(roomId, messageKey));
        if (!rec) return;
        const [gone] = rec.history.splice(index, 1);
        if (gone) { await Vault.dropImage(gone.imageId).catch(() => {}); forget(gone.imageId); }
        if (!rec.history.length) {
            await Vault.dropRecord(roomId, messageKey);
            map?.delete(messageKey);
            Inline.figureOf(messageKey)?.remove();
        } else {
            rec.index = Math.min(rec.index, rec.history.length - 1);
            await Vault.saveRecord(rec);
            const md = Site.byKey(messageKey);
            if (md) Inline.render(md, rec);
        }
        Studio.recordChanged(messageKey);
    }

    function downloadShot(blob, title, seed) {
        Disk.download(blob, `crack-painter_${(title || 'scene').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40)}_${seed}.png`);
    }

    return { running, copy, imageUrl, forgetAll, records, report, analyze, generate, genPrefs, ready, adopt, begin, quick, reroll, removeShot, downloadShot };
})();


// ── app/inline.js ──
// Inline — 채팅 화면 안: 답변 아래 버튼 두 개, 답변 사이 삽화, 오른쪽 메뉴 두 줄, 화면 감시.
const Inline = (() => {
    'use strict';
    const { esc, icon } = Kit;

    // ── 켜기/끄기 (이 브라우저에만) ────────────────────
    function enabled() {
        try { return localStorage.getItem('cp_enabled') !== 'off'; } catch (_) { return true; }
    }
    function setEnabled(on) {
        try { localStorage.setItem('cp_enabled', on ? 'on' : 'off'); } catch (_) { /* 저장 못 해도 이번엔 적용 */ }
        document.body.classList.toggle('kp-off', !on);
        scan();
    }

    // ── 채팅 속 삽화 ────────────────────────────────────
    function toolbar(rec) {
        const n = rec.history.length;
        const i = rec.index;
        const b = (act, title, svg, off = false) => `<button data-kp="${act}" title="${title}"${off ? ' disabled' : ''}>${svg}</button>`;
        return [
            b('prev', '이전', icon.back, i <= 0),
            `<span class="kp-count">${i + 1} / ${n}</span>`,
            b('next', '다음', icon.next, i >= n - 1),
            '<span class="kp-divider"></span>',
            b('reroll', '같은 프롬프트로 다시', icon.again),
            b('studio', '스튜디오에서 편집', icon.pen),
            b('save', '저장', icon.save),
            b('delete', '이 장 삭제', icon.bin)
        ].join('');
    }

    async function render(markdown, rec) {
        const shot = rec.history[rec.index];
        if (!shot) { markdown.querySelectorAll(':scope > .kp-figure').forEach(f => f.remove()); return; }
        let fig = markdown.querySelector(':scope > .kp-figure');
        if (!fig) {
            fig = document.createElement('div');
            fig.className = 'kp-figure';
            fig.contentEditable = 'false';
            fig.innerHTML = '<div class="kp-frame"><img alt="" loading="lazy" decoding="async"><div class="kp-tools"></div></div>';
        }
        fig.dataset.key = rec.messageKey;
        const img = fig.querySelector('img');
        const url = await Engine.imageUrl(shot.imageId);
        if (img.getAttribute('src') !== url) img.src = url;
        img.alt = rec.title || '장면 삽화';
        fig.querySelector('.kp-tools').innerHTML = toolbar(rec);
        Site.place(markdown, fig, rec.paragraph);
    }

    const figureOf = key => [...document.querySelectorAll('.kp-figure')].find(f => f.dataset.key === key) || null;

    function busy(key, on) {
        const fig = figureOf(key);
        if (!fig) return;
        fig.querySelector('.kp-busy')?.remove();
        if (!on) return;
        const veil = document.createElement('div');
        veil.className = 'kp-busy';
        veil.textContent = '다시 그리는 중…';
        fig.querySelector('.kp-frame').append(veil);
    }

    async function onFigure(fig, act, btn) {
        const key = fig.dataset.key;
        const roomId = Site.room();
        const rec = (await Engine.records(roomId)).get(key);
        if (!rec) return;
        const md = fig.closest('.wrtn-markdown');
        const shot = rec.history[rec.index];
        switch (act) {
            case 'prev':
            case 'next':
                rec.index = Math.max(0, Math.min(rec.history.length - 1, rec.index + (act === 'next' ? 1 : -1)));
                await Vault.saveRecord(rec);
                if (md) render(md, rec);
                break;
            case 'reroll': Engine.reroll(key); break;
            case 'studio': if (md) Studio.open(md); break;
            case 'save': {
                const blob = await Vault.image(shot.imageId);
                if (blob) Engine.downloadShot(blob, rec.title, shot.seed);
                break;
            }
            case 'delete':
                if (Kit.confirmTap(btn, '삭제')) await Engine.removeShot(roomId, key, rec.index);
                break;
            default:
        }
    }

    document.addEventListener('click', ev => {
        const fig = ev.target.closest?.('.kp-figure');
        if (!fig) return;
        const btn = ev.target.closest('[data-kp]');
        if (btn) {
            ev.preventDefault();
            ev.stopPropagation();
            onFigure(fig, btn.dataset.kp, btn).catch(err => Engine.report(err));
            return;
        }
        if (ev.target.tagName !== 'IMG') return;
        ev.preventDefault();
        ev.stopPropagation();
        // 터치 화면: 첫 탭은 도구 줄만 보이기
        if (matchMedia('(hover: none)').matches && !fig.classList.contains('kp-tapped')) { fig.classList.add('kp-tapped'); return; }
        Kit.lightbox(ev.target.src);
    }, true);

    // ── 답변 아래 버튼 ──────────────────────────────────
    function messageButton(kind, title, svg) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `kp-msg-btn kp-${kind}`;
        b.title = title;
        b.setAttribute('aria-label', title);
        b.innerHTML = svg;
        return b;
    }

    function markRunning(key, on) {
        for (const b of document.querySelectorAll('.kp-msg-btn.kp-quick')) if (b.dataset.key === key) b.classList.toggle('kp-run', on);
    }

    document.addEventListener('click', ev => {
        const btn = ev.target.closest?.('.kp-msg-btn');
        if (!btn) return;
        ev.preventDefault();
        ev.stopPropagation();
        const reply = Site.replies(btn.closest('[data-message-group-id]') || document).find(r => r.footer.contains(btn));
        if (!reply) return;
        if (btn.classList.contains('kp-quick')) Engine.quick(reply.markdown);
        else if (Engine.ready()) Studio.open(reply.markdown);
    }, true);

    function addButtons(footer, key) {
        let slot = footer.children[0];
        if (!slot) {
            slot = document.createElement('div');
            slot.className = 'flex items-center space-x-3';
            footer.prepend(slot);
        }
        if (!slot.querySelector('.kp-studio')) slot.prepend(messageButton('studio', '삽화 스튜디오', icon.art), messageButton('quick', '바로 삽화 생성', icon.bolt));
        for (const b of slot.querySelectorAll('.kp-msg-btn')) b.dataset.key = key;
        slot.querySelector('.kp-quick')?.classList.toggle('kp-run', Engine.running.has(key));
    }

    // ── 오른쪽 메뉴: "상황 이미지 보기" 줄을 본떠 두 줄을 붙인다 ─────────
    //   AI 삽화 (스위치 = 켜고 끄기, 글자 = 설정)   ·   삽화 갤러리
    const MENU_GLYPHS = {
        sparkle: '<path d="M10 2.8l1.95 5.25L17.2 10l-5.25 1.95L10 17.2l-1.95-5.25L2.8 10l5.25-1.95z"/><path d="M18.2 13.2l.95 2.45 2.45.95-2.45.95-.95 2.45-.95-2.45-2.45-.95 2.45-.95z"/><path d="M17.6 2.4l.65 1.55 1.55.65-1.55.65-.65 1.55-.65-1.55-1.55-.65 1.55-.65z"/>',
        frame: '<path fill-rule="evenodd" clip-rule="evenodd" d="M20.2 2.2a1.3 1.3 0 0 1 1.3 1.3v16.7a1.3 1.3 0 0 1-1.3 1.3H3.5a1.3 1.3 0 0 1-1.3-1.3V3.5a1.3 1.3 0 0 1 1.3-1.3zM3.8 19.9h16.1V3.8H3.8z"/><path d="m5.6 17.6 4-5.2 2.9 3.5 1.9-2.3 3.9 4z"/><circle cx="15.6" cy="7.9" r="1.7"/>'
    };
    const SVG_NS = 'http://www.w3.org/2000/svg';

    // 크랙 원래 줄을 복제해서 글자와 아이콘만 바꾼다 (그래야 글자 크기·간격이 크랙과 같다)
    function menuRow(model, cls, label, glyph, withSwitch) {
        const row = model.cloneNode(true);
        row.classList.add('kp-menu-row', cls);
        const textSpan = [...row.querySelectorAll('span')].find(s => !s.querySelector('span') && s.textContent.trim() === '상황 이미지 보기');
        if (textSpan) textSpan.textContent = label;
        const old = row.querySelector('svg');
        if (old) {
            const fresh = document.createElementNS(SVG_NS, 'svg');
            for (const a of ['xmlns', 'fill', 'viewBox', 'width', 'height', 'color', 'class']) if (old.hasAttribute(a)) fresh.setAttribute(a, old.getAttribute(a));
            fresh.innerHTML = MENU_GLYPHS[glyph];
            old.replaceWith(fresh);
        }
        if (!withSwitch) row.querySelector('button[role="switch"]')?.closest('span')?.remove();
        return row;
    }

    function paintSwitch(sw) {
        if (!sw) return;
        const on = enabled();
        const state = on ? 'checked' : 'unchecked';
        sw.setAttribute('aria-checked', String(on));
        sw.setAttribute('data-state', state);
        sw.querySelector('span')?.setAttribute('data-state', state);
    }

    function addMenuRows() {
        const model = Site.menuModelRow();
        if (!model) return;
        const a = model.nextElementSibling;
        if (a?.classList?.contains('kp-row-main') && a.nextElementSibling?.classList?.contains('kp-row-gallery')) return;
        document.querySelectorAll('.kp-menu-row').forEach(r => r.remove());

        const main = menuRow(model, 'kp-row-main', 'AI 삽화', 'sparkle', true);
        const sw = main.querySelector('button[role="switch"]');
        paintSwitch(sw);
        main.addEventListener('click', ev => {
            ev.preventDefault();
            ev.stopPropagation();
            if (ev.target.closest('button[role="switch"]')) { setEnabled(!enabled()); paintSwitch(sw); } else Settings.open();
        }, true);

        const gallery = menuRow(model, 'kp-row-gallery', '삽화 갤러리', 'frame', false);
        gallery.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); Gallery.open(); }, true);

        model.after(main, gallery);
    }

    // ── 화면 훑기 ───────────────────────────────────────
    let scanning = false;
    async function scan() {
        if (scanning) return;
        scanning = true;
        try {
            Kit.pageStyle();
            const on = enabled();
            document.body.classList.toggle('kp-off', !on);
            addMenuRows();
            const roomId = Site.room();
            if (!roomId) return;
            const map = await Engine.records(roomId);
            for (const { markdown, footer } of Site.replies()) {
                const key = Site.keyOf(markdown);
                if (on) addButtons(footer, key);
                const rec = map.get(key);
                const fig = markdown.querySelector(':scope > .kp-figure');
                if (rec?.history?.length) { if (!fig || fig.dataset.key !== key) await render(markdown, rec); }
                else if (fig) fig.remove();
            }
        } catch (e) {
            console.warn('[크랙 페인터] 화면 훑기', e);
        } finally {
            scanning = false;
        }
    }

    let timer = 0;
    const soon = () => { clearTimeout(timer); timer = setTimeout(scan, 180); };

    function start() {
        Kit.pageStyle();
        Disk.load();
        let path = location.pathname;
        new MutationObserver(changes => {
            if (changes.some(c => !c.target.closest?.(Site.MINE) && c.target.id !== 'kp-host')) soon();
            if (location.pathname !== path) {
                path = location.pathname;
                Engine.forgetAll();
                soon();
            }
        }).observe(document.body, { childList: true, subtree: true });
        soon();
        setInterval(scan, 4000);
        Import2.run().then(n => { if (n) soon(); });
        try {
            GM_registerMenuCommand?.('설정 열기', () => Settings.open());
            GM_registerMenuCommand?.('삽화 갤러리', () => Gallery.open());
            GM_registerMenuCommand?.('삽화 보이기/숨기기', () => setEnabled(!enabled()));
        } catch (_) { /* 메뉴 없는 관리자 */ }
    }

    return { start, scan, render, figureOf, busy, markRunning, enabled, setEnabled };
})();


// ── app/studio.js ──
// Studio — 답변 하나를 분석해서 칸별로 확인·수정하고 그린다.
// 오른쪽 칸 구성이 NAI 요청 모양 그대로다:
//   베이스 프롬프트 = 스타일(직접 고정) + 장면(AI)   → base_caption
//   캐릭터 프롬프트 = 인물마다 한 칸                 → char_captions[]
const Studio = (() => {
    'use strict';
    const { esc, icon } = Kit;

    let s = null;                 // 열린 스튜디오 하나
    const drafts = new Map();     // 실수로 닫아도 고치던 내용을 메시지별로 기억

    const busy = () => Boolean(s && s.phase !== 'idle');
    const v5 = () => Models.isV5(s.model);
    const swatch = i => `k-${i % 6}`;

    function open(markdown) {
        const messageKey = Site.keyOf(markdown);
        const existing = Kit.windows.get('studio');
        if (s && existing && s.messageKey === messageKey) { existing.raise(); return; }
        if (s) existing?.close();
        const p = Prefs.get();
        s = {
            roomId: Site.room(), messageKey, markdown,
            paragraphs: Site.paragraphs(markdown),
            state: null, model: p.model, gen: { ...p.gen, seed: '' },
            styleEdited: false, dirty: false, restored: false, showMore: false,
            phase: 'idle', phaseText: '', error: '', controller: null,
            rec: null, view: -1, request: ''
        };
        const me = s;
        s.win = Kit.window({
            id: 'studio', cls: 'studio', title: '삽화 스튜디오',
            onClose: () => {
                if (me.phase === 'analyzing') me.controller?.abort();
                if (me.state && me.dirty) drafts.set(me.messageKey, { state: Engine.copy(me.state), gen: { ...me.gen }, styleEdited: me.styleEdited });
                if (s === me) s = null;
            }
        });
        s.win.right(`
            <select class="dropdown" data-model style="width:auto">${Kit.options(Models.list().map(m => [m.id, `NAI ${m.label}`]), s.model)}</select>
            <button class="iconbutton" data-do="gallery" title="삽화 갤러리">${icon.photo}</button>
            <button class="iconbutton" data-do="settings" title="설정">${icon.cog}</button>`);
        wire(s.win.el);
        start(s);
    }

    async function start(me) {
        me.rec = (await Engine.records(me.roomId)).get(me.messageKey) || null;
        if (s !== me) return;
        const shots = me.rec?.history || [];
        if (shots.length) me.view = me.rec.index;
        const draft = drafts.get(me.messageKey);
        if (draft) {
            Object.assign(me, { state: draft.state, styleEdited: draft.styleEdited, dirty: true, restored: true });
            me.gen = { ...me.gen, ...draft.gen };
            draw();
        } else if (shots.length) {
            const shown = shots[me.rec.index];
            me.state = Engine.copy(shown.state);
            me.gen.size = shown.gen?.size || me.gen.size;
            draw();
        } else {
            draw();
            analyze();
        }
    }

    // ── 동작 ───────────────────────────────────────────
    async function analyze(opts = {}) {
        const me = s;
        if (!me || busy()) return;
        me.controller = new AbortController();
        Object.assign(me, { phase: 'analyzing', phaseText: opts.request ? '요청을 반영해 다시 고르는 중' : '어떤 순간을 그릴지 고르는 중', error: '' });
        draw();
        try {
            const before = me.state;
            const next = await Engine.analyze(me.markdown, opts, me.controller.signal);
            if (s !== me) return;
            if (before && me.styleEdited) next.style = before.style;   // 손본 스타일은 재분석해도 남긴다
            Object.assign(me, { state: next, request: '', dirty: true, restored: false });
        } catch (err) {
            if (s !== me) return;
            if (err?.name !== 'AbortError') { me.error = err.message; Engine.report(err, '장면 분석 실패'); }
            if (!me.state) me.state = Plan.toState({ insertAfterParagraph: 0 }, Prefs.cast(me.roomId), Prefs.get().style);
        } finally {
            if (s === me) { Object.assign(me, { phase: 'idle', controller: null }); draw(); }
        }
    }

    function reanalyze() {
        const request = s.request.trim();
        analyze({ fixedParagraph: request ? s.state?.paragraph : undefined, request: request || undefined });
    }

    async function generate() {
        const me = s;
        if (!me || busy() || !me.state) return;
        const assembled = Compose.build(me.state, me.model);
        if (!assembled.base && !assembled.chars.length) { Engine.report(new Error('프롬프트가 비어 있어.')); return; }
        if (Engine.running.has(me.messageKey)) { Kit.toast({ title: '이 답변은 이미 생성 중이야' }); return; }
        Disk.warm();
        me.controller = Engine.begin(me.messageKey);
        Object.assign(me, { phase: 'generating', phaseText: 'NovelAI가 그리는 중', error: '' });
        draw();
        try {
            const { rec } = await Engine.generate({
                roomId: me.roomId, messageKey: me.messageKey, markdown: me.markdown,
                state: me.state, model: me.model, gen: { ...me.gen }, signal: me.controller.signal
            });
            drafts.delete(me.messageKey);
            if (s !== me) { Kit.toast({ title: '삽화 완성', kind: 'ok', body: me.state.title || '채팅에 넣었어.' }); return; }
            Object.assign(me, { rec, view: rec.index, dirty: false, restored: false });
        } catch (err) {
            if (s === me && err?.name !== 'AbortError') me.error = err.message;
            Engine.report(err, '생성 실패');
        } finally {
            Engine.running.delete(me.messageKey);
            if (s === me) { Object.assign(me, { phase: 'idle', controller: null }); draw(); }
        }
    }

    // ── 그리기 ─────────────────────────────────────────
    function draw() {
        if (!s) return;
        const st = s.state;
        s.win.title(st?.title || '삽화 스튜디오', s.paragraphs.length ? `문단 ${(st?.paragraph ?? 0) + 1} 뒤에 넣음 · ${Models.get(s.model).label}` : '');
        const keepScroll = s.win.body.querySelector('.panel-scroll')?.scrollTop || 0;
        s.win.body.innerHTML = `${stageHtml()}<div class="panel">${st ? `<div class="panel-scroll scroll">${panelHtml()}</div>${footHtml()}` : '<div class="panel-scroll"></div>'}</div>`;
        const scroller = s.win.body.querySelector('.panel-scroll');
        if (scroller) scroller.scrollTop = keepScroll;
        loadImages();
        s.win.body.querySelectorAll('textarea').forEach(grow);
        update();
    }

    function grow(ta) {
        ta.style.height = 'auto';
        ta.style.height = `${Math.min(260, ta.scrollHeight + 2)}px`;
    }

    async function loadImages() {
        for (const img of s.win.body.querySelectorAll('img[data-img]')) {
            const url = await Engine.imageUrl(img.dataset.img);
            if (url) img.src = url;
        }
    }

    function stageHtml() {
        const shots = s.rec?.history || [];
        const shot = shots[s.view];
        const overlay = busy() ? `<div class="busy"><div class="busy-card">${Kit.spinner()}<b>${esc(s.phaseText)}</b><button class="button" data-do="cancel">취소</button></div></div>` : '';
        const picture = shot
            ? `<img data-img="${esc(shot.imageId)}" alt="">`
            : `<div class="empty-state">${icon.photo}<b>${s.state ? '아직 그림이 없어' : '장면을 읽는 중'}</b><span>${s.state ? '칸별 프롬프트를 확인하고 생성을 눌러줘.' : ''}</span></div>`;
        const strip = shots.length ? `
          <div class="strip scroll">
            ${shots.map((x, i) => `<button class="thumb${i === s.view ? ' is-on' : ''}" data-thumb="${i}" title="${i + 1}번째 · seed ${x.seed}"><img data-img="${esc(x.imageId)}" alt="">${i === s.rec.index ? `<span class="pin" title="채팅에 보이는 그림">${icon.pin}</span>` : ''}</button>`).join('')}
            <div class="strip-tools">
              <button class="iconbutton" data-do="show-in-chat" title="이 그림을 채팅에 표시"${s.view === s.rec.index ? ' disabled' : ''}>${icon.check}</button>
              <button class="iconbutton" data-do="load-prompt" title="이 그림의 프롬프트 불러오기">${icon.stack}</button>
              <button class="iconbutton" data-do="reuse-seed" title="이 그림의 시드 쓰기">${icon.again}</button>
              <button class="iconbutton" data-do="delete-view" title="이 그림 삭제">${icon.bin}</button>
            </div>
          </div>` : '';
        return `<div class="stage"><div class="canvas">${picture}${overlay}</div>${strip}</div>`;
    }

    const sub = (label, note = '') => `<span class="sublabel">${label}${note ? ` <span class="dim">${note}</span>` : ''}</span>`;
    const area = (bind, value, { mono = true, short = false, placeholder = '' } = {}) =>
        `<textarea class="textarea${mono ? ' is-mono' : ''}${short ? ' is-short' : ''}" data-bind="${bind}" spellcheck="false" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`;

    function panelHtml() {
        const st = s.state;
        const m = Models.get(s.model);
        const paraChoices = s.paragraphs.map(p => [p.index, `문단 ${p.index + 1} · ${p.text.slice(0, 34)}${p.text.length > 34 ? '…' : ''}`]);
        const ucChoices = [[2, 'UC 프리셋 없음'], ...Object.keys(Nai.ucTable(s.model)).map(k => [k, `${Nai.UC_NAMES[k]} UC`])];
        return `
        <div class="caption">장면</div>
        <div class="card">
          <div class="cell"><span class="cell-label"><b>넣을 위치</b></span><select class="dropdown" data-para style="max-width:240px">${Kit.options(paraChoices, st.paragraph)}</select></div>
          ${st.moment ? `<div class="cell"><span class="cell-label dim">${esc(st.moment)}</span></div>` : ''}
          <div class="cell">
            <input class="input" data-request placeholder="고쳐 달라고 하기 · 예: 더 멀리서, 창가 쪽 순간으로" value="${esc(s.request)}">
            <button class="button" data-do="reanalyze">${icon.magic}다시 분석</button>
          </div>
        </div>

        <div class="caption"><span>베이스 프롬프트</span><span class="layer-hint">${icon.stack}base_caption · 그림 전체</span><span class="fill"></span><span class="tag" data-tok="base"></span></div>
        <div class="card">
          <div class="block">
            <div class="block-head"><span class="swatch k-style"></span><span class="block-name">스타일</span><span class="dim small">작가 · 화풍 · 퀄리티 — 직접 고정</span>
              <span class="fill"></span>
              <button class="button is-ghost" data-do="preset">프리셋</button>
              <button class="button is-ghost" data-do="save-style" title="모든 장면에 쓰는 기본 스타일로 저장">기본값으로 저장</button>
            </div>
            ${area('style.pos', st.style.pos, { placeholder: 'artist:이름, 화풍 태그…  (캐릭터 칸에 넣은 작가 태그도 여기로 올라와)' })}
          </div>
          <div class="block">
            <div class="block-head"><span class="swatch k-scene"></span><span class="block-name">장면</span><span class="dim small">인원수 · 구도 · 배경 · 조명 — AI</span></div>
            <div class="line"><span class="sublabel" style="width:44px">인원수</span><input class="input is-mono" data-bind="scene.count" placeholder="자동: ${esc(Compose.autoCount(st, s.model) || '없음')}" value="${esc(st.scene.count)}"></div>
            ${area('scene.tags', st.scene.tags, { placeholder: 'cowboy shot, indoors, bedroom, night, lamplight…' })}
            ${v5() ? `${sub('장면 문장', 'V5 자연어')}${area('scene.caption', st.scene.caption, { mono: false, short: true, placeholder: 'Soft light falls from the window on the left…' })}` : ''}
          </div>
        </div>

        <div class="caption"><span>캐릭터 프롬프트</span><span class="layer-hint">${icon.person}char_captions · 인물마다</span><span class="fill"></span><span class="tag" data-tok="chars"></span></div>
        <div class="card">
          ${st.chars.length ? st.chars.map(charHtml).join('') : '<div class="cell"><span class="cell-label dim">이 장면에 인물 칸이 없어. 배경만 그리거나 아래에서 추가해.</span></div>'}
          <div class="cell"><button class="button is-ghost" data-do="add-char">${icon.add}인물 추가</button><span class="fill"></span><span class="dim small">${m.label} 최대 ${m.maxChars}명</span></div>
        </div>

        <details class="more"${s.showMore ? ' open' : ''}><summary class="caption">${icon.chevron}<span>네거티브 · UC</span><span class="dim" style="font-weight:400">필요할 때만</span></summary>
          <div class="card"><div class="block">
            <div class="line"><span class="sublabel fill">기본 네거티브 <span class="dim">스타일과 같이 저장</span></span>
              <select class="dropdown" data-uc style="width:auto">${Kit.options(ucChoices, Nai.ucPick(s.model, s.gen.ucPreset))}</select></div>
            ${area('style.neg', st.style.neg, { short: true, placeholder: 'lowres, bad anatomy…' })}
            ${sub('이 장면만')}
            ${area('neg', st.neg, { short: true })}
          </div></div>
        </details>

        <div class="hints" data-hints></div>
        <details class="payload"><summary>${icon.chevron}실제로 보내는 내용</summary><pre data-payload></pre></details>`;
    }

    function charHtml(c, i) {
        const off = c.enabled === false;
        const saved = c.source === 'saved';
        return `
          <div class="block${off ? ' is-off' : ''}" data-slot="${i}">
            <div class="block-head">
              <span class="swatch ${swatch(i)}"></span>
              <span class="block-name">${esc(c.name || `인물 ${i + 1}`)}</span>
              <span class="tag ${saved ? 'is-blue' : 'is-orange'}">${saved ? '등록' : '엑스트라'}</span>
              <span class="tag tokens" data-tok="char${i}"></span>
              <span class="fill"></span>
              ${s.gen.useCoords ? Kit.seg(`pos${i}`, [['left', '좌'], ['center', '중'], ['right', '우']], c.position || '', 'is-small') : ''}
              ${saved
                ? `<button class="iconbutton is-small" data-do="reload-look" data-i="${i}" title="저장된 외형으로 되돌리기">${icon.again}</button>`
                : `<button class="button is-ghost" data-do="adopt" data-i="${i}" title="다음 장면부터 같은 외형으로 그리게 캐릭터로 저장">${icon.add}등록</button>`}
              <button class="iconbutton is-small" data-do="remove-char" data-i="${i}" title="이 칸 빼기">${icon.close}</button>
              ${Kit.toggle(`char${i}`, !off)}
            </div>
            ${sub('외형 · 의상')}
            ${area(`chars.${i}.look`, c.look, { short: true, placeholder: 'girl, black hair, school uniform…' })}
            ${sub('행동 · 표정 · 자세', 'AI')}
            ${area(`chars.${i}.action`, c.action, { short: true, placeholder: 'sitting, looking at viewer…' })}
            ${v5() ? `${sub('인물 문장', 'V5')}${area(`chars.${i}.caption`, c.caption, { mono: false, short: true })}` : ''}
            ${s.showMore || c.uc ? `${sub('UC')}<input class="input is-mono" data-bind="chars.${i}.uc" spellcheck="false" value="${esc(c.uc)}">` : ''}
          </div>`;
    }

    function footHtml() {
        const mac = /Mac/.test(navigator.platform);
        return `
          <div class="panel-foot">
            <div class="gauge" data-gauge></div>
            <div class="line">
              ${Kit.seg('size', Object.entries(Nai.SIZES).map(([k, v]) => [k, v.label]), s.gen.size)}
              <input class="input is-num is-mono" data-seed placeholder="랜덤" title="시드 (비우면 랜덤)" value="${esc(s.gen.seed)}">
              <span class="fill"></span>
              ${busy()
                ? '<button class="button is-large" data-do="cancel">취소</button>'
                : `<button class="button is-primary is-large" data-do="generate">${icon.art}생성<span class="keys">${mac ? '⌘↵' : 'Ctrl+↵'}</span></button>`}
            </div>
          </div>`;
    }

    // 글자를 칠 때마다 전체를 다시 그리지 않고, 계산해서 나오는 부분만 바꾼다
    function update() {
        if (!s?.state) return;
        const out = Compose.build(s.state, s.model);
        const box = s.win.body;
        const b = out.budget;
        const put = (sel, text) => { const el = box.querySelector(sel); if (el) el.textContent = text; };
        put('[data-tok="base"]', `약 ${b.base} 토큰`);
        put('[data-tok="chars"]', `약 ${b.chars} 토큰`);
        s.state.chars.forEach((c, i) => {
            const sent = out.chars.find(x => x.id === (c.id || `c${i}`));
            put(`[data-tok="char${i}"]`, sent ? String(sent.tokens) : '—');
        });
        const count = box.querySelector('[data-bind="scene.count"]');
        if (count && !s.state.scene.count) count.placeholder = `자동: ${Compose.autoCount(s.state, s.model) || '없음'}`;

        const gauge = box.querySelector('[data-gauge]');
        if (gauge) {
            const parts = [['k-style', '스타일', b.parts.style], ['k-scene', '장면', b.parts.scene]];
            if (b.shared) {
                for (const c of out.chars) {
                    const at = s.state.chars.findIndex((x, j) => (x.id || `c${j}`) === c.id);
                    parts.push([swatch(at >= 0 ? at : 0), c.name, c.tokens]);
                }
            }
            gauge.className = `gauge${b.over ? ' is-over' : ''}`;
            gauge.innerHTML = `
              <div class="gauge-bar">${parts.map(([k, , n]) => `<i class="${k}" style="width:${Math.min(100, (n / b.limit) * 100)}%"></i>`).join('')}</div>
              <div class="gauge-legend">${parts.map(([k, name, n]) => `<span class="${k}">${esc(name)} ${n}</span>`).join('')}
                <span class="gauge-total">${b.shared ? '합산' : '베이스'} 약 ${b.shared ? b.used : b.base} / ${b.limit}</span></div>
              ${!b.shared && b.chars ? `<div class="gauge-legend"><span class="dim">V5는 캐릭터 칸(약 ${b.chars})이 베이스 예산과 따로야.</span></div>` : ''}`;
        }

        const hints = box.querySelector('[data-hints]');
        if (hints) {
            const list = [...out.notes];
            if (s.error) list.unshift({ level: 'error', text: s.error });
            if (s.restored) list.unshift({ level: 'info', text: '창을 닫기 전에 고치던 내용을 불러왔어.', act: ['discard-draft', '버리고 처음부터'] });
            hints.innerHTML = list.map(n => `<div class="hint is-${n.level}">${n.level === 'info' ? icon.info : icon.warn}<span class="fill">${esc(n.text)}</span>${n.act ? `<button class="button" data-do="${n.act[0]}">${esc(n.act[1])}</button>` : ''}</div>`).join('');
        }

        const pre = box.querySelector('[data-payload]');
        if (pre) {
            const quality = v5() ? Nai.V5_QUALITY[s.gen.qualityV5] : s.gen.qualityV45 !== false ? '(서버가 퀄리티 태그 추가)' : '';
            pre.innerHTML = [
                `<span class="key">base_caption</span>\n${esc(out.base)}${quality ? `\n<span class="dim">+ ${esc(quality)}</span>` : ''}`,
                ...out.chars.map((c, i) => `<span class="key">char_captions[${i}] · ${esc(c.name)}</span> <span class="dim">(${c.center.x}, ${c.center.y})</span>\n${esc(c.prompt)}${c.uc ? `\n<span class="dim">UC: ${esc(c.uc)}</span>` : ''}`),
                `<span class="key">negative</span>\n${esc(Nai.negative(out.baseNeg, s.model, s.gen.ucPreset))}`
            ].join('\n\n');
        }
    }

    // ── 입력 ───────────────────────────────────────────
    function assign(target, path, value) {
        const keys = path.split('.');
        const last = keys.pop();
        keys.reduce((o, k) => o[k], target)[last] = value;
    }

    function wire(el) {
        el.addEventListener('input', ev => {
            if (!s) return;
            const t = ev.target;
            if (t.dataset.bind) {
                assign(s.state, t.dataset.bind, t.value);
                s.dirty = true;
                if (t.dataset.bind.startsWith('style.')) s.styleEdited = true;
                if (t.tagName === 'TEXTAREA') grow(t);
                update();
            } else if ('request' in t.dataset) {
                s.request = t.value;
            } else if ('seed' in t.dataset) {
                s.gen.seed = t.value.replace(/\D/g, '');
            }
        });
        el.addEventListener('change', ev => {
            if (!s) return;
            const t = ev.target;
            if ('model' in t.dataset) {
                s.model = t.value;
                Prefs.edit(d => { d.model = t.value; });
                draw();
            } else if ('para' in t.dataset) {
                s.state.paragraph = Number(t.value);
                draw();
            } else if ('uc' in t.dataset) {
                s.gen.ucPreset = Number(t.value);
                Prefs.edit(d => { d.gen.ucPreset = Number(t.value); });
                update();
            } else if (t.dataset.sw?.startsWith('char')) {
                s.state.chars[Number(t.dataset.sw.slice(4))].enabled = t.checked;
                draw();
            }
        });
        el.addEventListener('toggle', ev => {
            if (!s || !ev.target.matches?.('details.more')) return;
            if (s.showMore !== ev.target.open) { s.showMore = ev.target.open; draw(); }
        }, true);
        el.addEventListener('keydown', ev => {
            if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') { ev.preventDefault(); generate(); }
            else if (ev.key === 'Enter' && ev.target.dataset && 'request' in ev.target.dataset) { ev.preventDefault(); reanalyze(); }
        });
        el.addEventListener('click', ev => {
            if (!s) return;
            const seg = ev.target.closest('.segmented button');
            if (seg) { pickSegment(seg.parentElement.dataset.seg, seg.dataset.v); return; }
            const thumb = ev.target.closest('[data-thumb]');
            if (thumb) { s.view = Number(thumb.dataset.thumb); draw(); return; }
            const big = ev.target.closest('.canvas img');
            if (big) { Kit.lightbox(big.src); return; }
            const btn = ev.target.closest('[data-do]');
            if (btn && !btn.closest('.traffic')) actions[btn.dataset.do]?.(btn);
        });
    }

    function pickSegment(name, v) {
        if (name === 'size') {
            s.gen.size = v;
            Prefs.edit(d => { d.gen.size = v; });
        } else if (name.startsWith('pos')) {
            const c = s.state.chars[Number(name.slice(3))];
            c.position = c.position === v ? null : v;
        }
        draw();
    }

    const shotInView = () => s.rec?.history?.[s.view];

    const actions = {
        settings: () => Settings.open(),
        gallery: () => Gallery.open(),
        cancel: () => s.controller?.abort(),
        generate: () => generate(),
        reanalyze: () => reanalyze(),
        'save-style': () => {
            const { pos, neg } = s.state.style;
            Prefs.edit(d => { d.style = { pos, neg }; });
            s.styleEdited = false;
            Kit.toast({ title: '기본 스타일로 저장했어', kind: 'ok', body: '앞으로 모든 장면의 베이스 맨 앞에 들어가.' });
        },
        preset: btn => {
            const p = Prefs.get();
            const saved = p.presets.length
                ? p.presets.map(x => ({ label: x.name, sub: x.pos.slice(0, 60), value: x }))
                : [{ label: '저장된 프리셋 없음', sub: '설정 → 스타일에서 만들 수 있어', value: null }];
            Kit.menu(btn, [{ header: '스타일 프리셋' }, ...saved, { sep: true }, { label: '설정의 기본 스타일 불러오기', value: 'default' }, { label: '지금 스타일을 새 프리셋으로 저장…', value: 'new' }], async ({ value }) => {
                if (!value) return;
                if (value === 'new') {
                    const name = await Kit.ask(btn, { title: '새 스타일 프리셋', placeholder: '이름 · 예: 수채화 kawacy' });
                    if (!name) return;
                    const { pos, neg } = s.state.style;
                    Prefs.edit(d => { d.presets.push({ id: Prefs.newId('ps'), name: name.trim().slice(0, 40), pos, neg }); });
                    Kit.toast({ title: '프리셋 저장', kind: 'ok', body: name });
                    return;
                }
                if (value === 'default') {
                    s.state.style = { ...Prefs.get().style };
                    s.styleEdited = false;
                } else {
                    s.state.style = { pos: value.pos, neg: value.neg ?? s.state.style.neg };
                    s.styleEdited = true;
                }
                draw();
            });
        },
        'add-char': btn => {
            const p = Prefs.get();
            const here = new Set(s.state.chars.map(c => c.id));
            const inRoom = new Set(p.rooms?.[s.roomId]?.chars || []);
            const left = p.characters.filter(c => !here.has(c.id));
            const items = left.length ? [{ header: '등록 인물' }, ...left.map(c => ({ label: c.name, sub: inRoom.has(c.id) ? '이 방에서 사용 중' : '다른 방 인물', value: c }))] : [];
            Kit.menu(btn, [...items, { sep: true }, { label: '빈 엑스트라 칸', value: 'extra' }], ({ value }) => {
                const base = { aliases: [], action: '', caption: '', position: null, enabled: true };
                if (value === 'extra') s.state.chars.push({ ...base, id: `extra${Date.now()}`, source: 'extra', name: `엑스트라 ${s.state.chars.length + 1}`, look: '', uc: '' });
                else if (value?.id) s.state.chars.push({ ...base, id: value.id, source: 'saved', name: value.name, aliases: value.aliases, look: Tags.join([value.look, value.outfit]), uc: value.uc });
                draw();
            });
        },
        'discard-draft': () => {
            drafts.delete(s.messageKey);
            Object.assign(s, { restored: false, dirty: false });
            const shown = s.rec?.history?.[s.rec.index];
            if (shown) { s.state = Engine.copy(shown.state); draw(); } else { s.state = null; draw(); analyze(); }
        },
        adopt: btn => {
            const c = s.state.chars[Number(btn.dataset.i)];
            if (!c.look.trim()) { Kit.toast({ title: '외형을 먼저 채워줘', body: '외형·의상 칸이 비어 있으면 등록해도 쓸 게 없어.' }); return; }
            c.id = Engine.adopt(c);
            c.source = 'saved';
            draw();
            Kit.toast({ title: `'${c.name}'을(를) 등록했어`, kind: 'ok', body: '이 채팅방에서 켜졌어. 이름과 외형은 설정 → 캐릭터에서 다듬을 수 있어.' });
        },
        'remove-char': btn => { s.state.chars.splice(Number(btn.dataset.i), 1); draw(); },
        'reload-look': btn => {
            const c = s.state.chars[Number(btn.dataset.i)];
            const saved = Prefs.get().characters.find(x => x.id === c.id);
            if (!saved) { Kit.toast({ title: '저장된 인물을 찾지 못했어', kind: 'err' }); return; }
            Object.assign(c, { look: Tags.join([saved.look, saved.outfit]), uc: saved.uc, name: saved.name });
            draw();
        },
        'show-in-chat': async () => {
            s.rec.index = s.view;
            await Vault.saveRecord(s.rec);
            const md = s.markdown?.isConnected ? s.markdown : Site.byKey(s.messageKey);
            if (md) Inline.render(md, s.rec);
            draw();
        },
        'load-prompt': () => {
            const shot = shotInView();
            if (!shot) return;
            s.state = Engine.copy(shot.state);
            s.styleEdited = true;
            draw();
            Kit.toast({ title: '그 그림의 프롬프트를 불러왔어' });
        },
        'reuse-seed': () => {
            const shot = shotInView();
            if (!shot) return;
            s.gen.seed = String(shot.seed);
            draw();
        },
        'delete-view': async btn => {
            if (Kit.confirmTap(btn, '삭제')) await Engine.removeShot(s.roomId, s.messageKey, s.view);
        }
    };

    // ── 바깥에서 바뀐 것 반영 ──────────────────────────
    async function recordChanged(key) {
        if (!s || s.messageKey !== key) return;
        const me = s;
        const rec = (await Engine.records(me.roomId)).get(key) || null;
        if (s !== me) return;
        me.rec = rec;
        me.view = rec ? Math.min(me.view, rec.history.length - 1) : -1;
        draw();
    }

    function prefsChanged() {
        if (!s || busy()) return;
        const p = Prefs.get();
        let changed = false;
        if (p.model !== s.model) { s.model = p.model; changed = true; }
        if (s.state && !s.styleEdited && (p.style.pos !== s.state.style.pos || p.style.neg !== s.state.style.neg)) { s.state.style = { ...p.style }; changed = true; }
        if (p.gen.useCoords !== s.gen.useCoords) { s.gen.useCoords = p.gen.useCoords; changed = true; }
        for (const k of ['steps', 'scaleV5', 'scaleV45', 'rescaleV5', 'rescaleV45', 'sampler', 'noise', 'qualityV45', 'qualityV5', 'ucPreset']) s.gen[k] = p.gen[k];
        if (!changed) return;
        const select = s.win.el.querySelector('[data-model]');
        if (select) select.value = s.model;
        const focused = s.win.el.getRootNode().activeElement;
        if (focused && s.win.el.contains(focused)) update(); else draw();   // 입력 중이면 통째로 다시 그리지 않는다
    }

    return { open, recordChanged, prefsChanged };
})();


// ── app/gallery.js ──
// Gallery — 지금까지 만든 삽화 모아 보기 (이 채팅방 / 전체, 날짜별, 크게 보기).
const Gallery = (() => {
    'use strict';
    const { esc, icon } = Kit;
    let g = null;

    async function open() {
        const existing = Kit.windows.get('gallery');
        if (g && existing) { existing.raise(); return; }
        const win = Kit.window({ id: 'gallery', cls: 'gallery', title: '삽화 갤러리', onClose: () => { g?.watcher?.disconnect(); document.removeEventListener('keydown', onKey, true); g = null; } });
        g = { win, scope: Site.room() ? 'room' : 'all', all: [], items: [], view: -1, watcher: null };
        win.el.addEventListener('click', onClick);
        document.addEventListener('keydown', onKey, true);
        await reload();
    }

    async function reload() {
        const recs = await Vault.everything().catch(() => []);
        if (!g) return;
        const here = Site.room();
        const items = [];
        for (const rec of recs) {
            const roomName = rec.roomName || (rec.roomId === here ? Site.roomTitle() : `채팅방 ${String(rec.roomId).slice(0, 6)}`);
            (rec.history || []).forEach((shot, index) => items.push({
                roomId: rec.roomId, roomName, messageKey: rec.messageKey,
                title: shot.state?.title || rec.title || '',
                index, shot, shown: index === rec.index
            }));
        }
        g.all = items.sort((a, b) => (b.shot.createdAt || 0) - (a.shot.createdAt || 0));
        narrow();
    }

    function narrow() {
        const here = Site.room();
        g.items = g.scope === 'room' ? g.all.filter(x => x.roomId === here) : g.all;
        g.view = -1;
        draw();
    }

    function day(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (d.toDateString() === now.toDateString()) return '오늘';
        if (d.toDateString() === yesterday.toDateString()) return '어제';
        return `${d.getFullYear() !== now.getFullYear() ? `${d.getFullYear()}년 ` : ''}${d.getMonth() + 1}월 ${d.getDate()}일`;
    }

    const clock = ts => { const d = new Date(ts || 0); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

    function draw() {
        g.win.title('삽화 갤러리', `${g.items.length}장`);
        g.win.right(Kit.seg('scope', [['room', '이 채팅방'], ['all', '전체']], g.scope));
        if (g.view >= 0) { drawOne(); return; }
        if (!g.items.length) {
            g.win.body.innerHTML = `<div class="wall-empty">${icon.photo}<b>${g.scope === 'room' ? '이 채팅방에서 만든 삽화가 없어' : '아직 만든 삽화가 없어'}</b><span>답변 아래의 붓이나 번개 버튼으로 만들어 봐.</span></div>`;
            return;
        }
        // 같은 날(전체 보기면 같은 날·같은 방)끼리 묶는다
        const sections = [];
        g.items.forEach((it, i) => {
            const label = `${day(it.shot.createdAt)}${g.scope === 'all' ? ` · ${it.roomName}` : ''}`;
            if (sections.at(-1)?.label !== label) sections.push({ label, cells: [] });
            sections.at(-1).cells.push(`<button class="tile" data-i="${i}" title="${esc(it.title || '장면')} · ${clock(it.shot.createdAt)}"><img data-lazy="${esc(it.shot.imageId)}" alt="">${it.shown ? `<span class="pin" title="채팅에 보이는 그림">${icon.pin}</span>` : ''}</button>`);
        });
        g.win.body.innerHTML = `<div class="wall scroll">${sections.map(sec => `<div class="wall-day">${esc(sec.label)}</div><div class="wall-grid">${sec.cells.join('')}</div>`).join('')}</div>`;
        lazyLoad();
    }

    // 화면에 들어온 썸네일만 불러온다
    function lazyLoad() {
        g.watcher?.disconnect();
        const wall = g.win.body.querySelector('.wall');
        if (!wall) return;
        const watcher = new IntersectionObserver(seen => {
            for (const e of seen) {
                if (!e.isIntersecting) continue;
                watcher.unobserve(e.target);
                Engine.imageUrl(e.target.dataset.lazy).then(u => { if (u) e.target.src = u; });
            }
        }, { root: wall, rootMargin: '300px' });
        wall.querySelectorAll('img[data-lazy]').forEach(img => watcher.observe(img));
        g.watcher = watcher;
    }

    function promptText(sent = {}) {
        return [
            `[베이스]\n${sent.base || ''}`,
            ...(sent.chars || []).map(c => `[${c.name}]\n${c.prompt}${c.uc ? `\nUC: ${c.uc}` : ''}`),
            sent.negative ? `[네거티브]\n${sent.negative}` : ''
        ].filter(Boolean).join('\n\n');
    }

    function drawOne() {
        const it = g.items[g.view];
        if (!it) { g.view = -1; draw(); return; }
        const { shot } = it;
        const here = it.roomId === Site.room();
        const away = here ? '' : ' disabled title="그 채팅방에서 열어야 해"';
        const size = Nai.SIZES[shot.gen?.size] || Nai.SIZES.portrait;
        g.win.title(it.title || '장면', `${g.view + 1} / ${g.items.length}`);
        g.win.body.innerHTML = `
          <div class="look">
            <div class="look-stage">
              <button class="iconbutton look-nav is-prev" data-do="prev"${g.view <= 0 ? ' disabled' : ''} title="이전 (←)">${icon.back}</button>
              <img alt="">
              <button class="iconbutton look-nav is-next" data-do="next"${g.view >= g.items.length - 1 ? ' disabled' : ''} title="다음 (→)">${icon.next}</button>
            </div>
            <div class="look-side scroll">
              <button class="button is-ghost" data-do="back">${icon.back}모든 삽화</button>
              <div class="caption">정보</div>
              <div class="card">
                <div class="cell"><span class="cell-label"><b>${esc(it.title || '제목 없음')}</b><small>${esc(it.roomName)} · ${day(shot.createdAt)} ${clock(shot.createdAt)}</small></span></div>
                <div class="cell"><span class="cell-label dim small">${esc(Models.get(shot.model).label)} · ${size.w}×${size.h} · 시드 ${esc(shot.seed)}</span></div>
              </div>
              <div class="line" style="margin:12px 0 0;flex-wrap:wrap">
                <button class="button" data-do="save">${icon.save}저장</button>
                <button class="button" data-do="goto"${away}>${icon.next}채팅에서 보기</button>
                <button class="button" data-do="studio"${away}>${icon.pen}스튜디오</button>
                <span class="fill"></span>
                <button class="button is-danger" data-do="delete">${icon.bin}</button>
              </div>
              <div class="caption"><span>보낸 프롬프트</span><span class="fill"></span><button class="button is-ghost" data-do="copy">복사</button></div>
              <pre class="look-prompt">${esc(promptText(shot.sent))}</pre>
            </div>
          </div>`;
        Engine.imageUrl(shot.imageId).then(u => { const img = g?.win.body.querySelector('.look-stage img'); if (img && u) img.src = u; });
    }

    function answerOnScreen(it) {
        const md = Site.byKey(it.messageKey);
        if (!md) Kit.toast({ title: '그 답변이 화면에 없어', body: '위로 스크롤해서 그 답변을 불러온 다음 다시 눌러줘.' });
        return md;
    }

    async function onClick(ev) {
        if (!g) return;
        const seg = ev.target.closest('.segmented button');
        if (seg) { g.scope = seg.dataset.v; narrow(); return; }
        const tile = ev.target.closest('.tile');
        if (tile) { g.view = Number(tile.dataset.i); draw(); return; }
        const big = ev.target.closest('.look-stage img');
        if (big) { Kit.lightbox(big.src); return; }
        const btn = ev.target.closest('[data-do]');
        const it = g.items[g.view];
        switch (btn?.dataset.do) {
            case 'back': g.view = -1; draw(); break;
            case 'prev': g.view = Math.max(0, g.view - 1); draw(); break;
            case 'next': g.view = Math.min(g.items.length - 1, g.view + 1); draw(); break;
            case 'save': {
                const blob = it && await Vault.image(it.shot.imageId);
                if (blob) Engine.downloadShot(blob, it.title, it.shot.seed);
                break;
            }
            case 'copy':
                try { await navigator.clipboard.writeText(promptText(it.shot.sent)); Kit.toast({ title: '프롬프트를 복사했어', kind: 'ok' }); } catch (_) { Kit.toast({ title: '복사하지 못했어', kind: 'err' }); }
                break;
            case 'goto': {
                const md = it && answerOnScreen(it);
                if (md) { g.win.close(); md.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
                break;
            }
            case 'studio': {
                const md = it && answerOnScreen(it);
                if (md) { g.win.close(); Studio.open(md); }
                break;
            }
            case 'delete': {
                if (!it || !Kit.confirmTap(btn, '삭제')) return;
                const at = g.view;
                await Engine.removeShot(it.roomId, it.messageKey, it.index);
                await reload();
                if (g) { g.view = Math.min(at, g.items.length - 1); draw(); }
                break;
            }
            default:
        }
    }

    function onKey(ev) {
        if (!g || g.view < 0 || Kit.windows.get('gallery') !== g.win) return;
        if (ev.target?.closest?.('input, textarea')) return;
        if (ev.key === 'ArrowLeft' && g.view > 0) { g.view -= 1; draw(); ev.preventDefault(); }
        else if (ev.key === 'ArrowRight' && g.view < g.items.length - 1) { g.view += 1; draw(); ev.preventDefault(); }
    }

    // 새 삽화가 생기거나 지워지면 열린 목록을 새로 고친다
    Prefs.subscribe(what => { if (g && what.startsWith('records:') && g.view < 0) reload(); });

    return { open };
})();


// ── app/settings.js ──
// Settings — 시스템 설정처럼 생긴 창. 입력한 칸 하나만 그때그때 저장한다(Prefs.edit / Prefs.setKey).
const Settings = (() => {
    'use strict';
    const { esc, icon } = Kit;

    const PANES = [
        { id: 'api', label: '연결', icon: icon.key, color: '#0a84ff' },
        { id: 'style', label: '스타일', icon: icon.palette, color: '#bf5af2' },
        { id: 'chars', label: '캐릭터', icon: icon.person, color: '#ff9f0a' },
        { id: 'room', label: '이 채팅방', icon: icon.house, color: '#30b0c7' },
        { id: 'gen', label: '생성 옵션', icon: icon.sliders, color: '#8e8e93' },
        { id: 'storage', label: '저장 공간', icon: icon.disk, color: '#34c759' }
    ];
    const AVATAR_COLORS = ['#ff9f0a', '#34c759', '#ff375f', '#30b0c7', '#bf5af2', '#0a84ff'];

    let win = null;
    let pane = 'api';
    let person = null;      // 캐릭터 화면에서 열어 둔 인물 id
    let stopListening = null;

    function open(which) {
        if (which) pane = which;
        if (win && Kit.windows.has('settings')) { win.raise(); draw(); return; }
        win = Kit.window({ id: 'settings', cls: 'settings', title: '크랙 페인터 설정', sidebar: true, onClose: () => { win = null; stopListening?.(); stopListening = null; } });
        win.body.innerHTML = `
          <div class="settings-side">
            <div class="chrome" data-drag><div class="chrome-l"><div class="traffic"><i class="t-close" data-light="close" aria-label="닫기"></i><i class="t-off"></i><i class="t-off"></i></div></div></div>
            <nav class="settings-nav scroll">${PANES.map(p => `<button data-pane="${p.id}"><span class="nav-icon" style="background:${p.color}">${p.icon}</span>${p.label}</button>`).join('')}</nav>
          </div>
          <div class="settings-main">
            <div class="chrome" data-drag><div class="chrome-l"></div><div class="chrome-c"><b></b></div><div class="chrome-r"></div></div>
            <div class="settings-pane scroll"></div>
          </div>`;
        wire(win.el);
        // 다른 탭에서 바꾸면 새로 그린다 (입력 중이면 기다린다)
        stopListening = Prefs.subscribe((what, remote) => {
            if (!remote || (what !== 'settings' && what !== 'secrets') || !win) return;
            const focused = win.el.getRootNode().activeElement;
            if (!(focused && win.el.contains(focused) && /INPUT|TEXTAREA|SELECT/.test(focused.tagName))) draw();
        });
        draw();
    }

    function draw() {
        if (!win) return;
        for (const b of win.el.querySelectorAll('.settings-nav button')) b.classList.toggle('is-on', b.dataset.pane === pane);
        win.el.querySelector('.settings-main .chrome-c b').textContent = PANES.find(p => p.id === pane).label;
        const box = win.el.querySelector('.settings-pane');
        const y = box.scrollTop;
        box.innerHTML = { api: apiPane, style: stylePane, chars: charsPane, room: roomPane, gen: genPane, storage: storagePane }[pane]();
        box.scrollTop = y;
        if (pane === 'storage') fillStorage();
    }

    const v = x => esc(x ?? '');
    const row = (label, small, control) => `<div class="cell"><span class="cell-label"><b>${label}</b>${small ? `<small>${small}</small>` : ''}</span>${control}</div>`;
    const select = (k, choices, value, extra = '') => `<select class="dropdown" data-k="${k}"${extra} style="width:auto">${Kit.options(choices, value)}</select>`;

    // ── 연결 ───────────────────────────────────────────
    const SHAPES = { naiKey: /^pst-/, geminiKey: /^AIza/, deepseekKey: /^sk-/ };
    const KEY_NAMES = { naiKey: 'NovelAI 토큰(pst-…)', geminiKey: 'Gemini 키(AIza…)', deepseekKey: 'DeepSeek 키(sk-…)' };
    const PREFIX = { naiKey: 'pst-', geminiKey: 'AIza', deepseekKey: 'sk-' };
    const whoseKey = value => Object.keys(SHAPES).find(f => SHAPES[f].test(value)) || null;

    function keyHint(field, value) {
        if (!value) return '아직 없음';
        const owner = whoseKey(value);
        if (owner && owner !== field) return `<span class="bad-text">이건 ${KEY_NAMES[owner]}야. 여기엔 ${KEY_NAMES[field]}를 넣어야 해.</span>`;
        if (!owner) return `<span class="warn-text">저장됨 · 보통 ${PREFIX[field]} 로 시작하는데 형식이 달라</span>`;
        return '저장됨 · 이 브라우저의 확장 프로그램 저장소에만 있어';
    }

    function keyRow(field, label, placeholder, keys) {
        return `<div class="cell"><span class="cell-label"><b>${label}</b><small data-hint="${field}">${keyHint(field, keys[field])}</small></span>
            <input class="input is-mono" type="password" autocomplete="off" data-secret="${field}" placeholder="${placeholder}" value="${v(keys[field])}" style="max-width:260px"></div>`;
    }

    function apiPane() {
        const p = Prefs.get();
        const k = Prefs.keys();
        const a = p.analyzer;
        let analyzer;
        if (a.provider === 'none') {
            analyzer = '<div class="cell"><span class="cell-label dim">분석 AI 없이 NovelAI 토큰만으로 써. 스튜디오를 열면 등록 인물만 채워진 빈 장면이 나오고, 장면 태그와 자세는 직접 쓰면 돼. ⚡ 바로 생성은 외형·스타일만으로 그려.</span></div>';
        } else {
            analyzer = a.provider === 'deepseek'
                ? keyRow('deepseekKey', 'DeepSeek 키', 'sk-…', k) + row('모델', '', select('analyzer.deepseekModel', Analyst.DEEPSEEK_MODELS, a.deepseekModel))
                : keyRow('geminiKey', 'Gemini 키', 'AIza…', k) + row('모델', '<a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color:var(--accent)">Google AI Studio</a>에서 무료로 키를 받을 수 있어', select('analyzer.geminiModel', Analyst.GEMINI_MODELS, a.geminiModel));
            analyzer += row('생각 깊이', '깊을수록 장면 선택이 정확하지만 느려', select('analyzer.thinking', [['auto', '자동'], ['fast', '빠르게'], ['normal', '보통'], ['deep', '깊게']], a.thinking))
                + '<div class="cell"><span class="cell-label" data-llm-status><small>키와 모델이 맞는지 짧은 요청으로 확인해</small></span><button class="button" data-do="test-llm">확인</button></div>';
        }
        return `
          <div class="caption">NovelAI (그림)</div>
          <div class="card">
            ${keyRow('naiKey', 'API 토큰', 'pst-…', k)}
            <div class="cell"><span class="cell-label" data-nai-status><small>NovelAI 계정 설정 → Get Persistent API Token</small></span><button class="button" data-do="test-nai">확인</button></div>
          </div>
          <div class="caption">장면 분석 AI</div>
          <div class="card">
            ${row('사용할 AI', '채팅을 읽고 어떤 장면을 그릴지 고르는 역할 · NovelAI 토큰과는 별개야', Kit.seg('provider', [['gemini', 'Gemini'], ['deepseek', 'DeepSeek'], ['none', '안 씀']], a.provider))}
            ${analyzer}
          </div>
          <p class="aside">키는 Tampermonkey/Violentmonkey 저장소에 저장돼. 탭을 여러 개 열어도 다른 탭이 지우지 않아. 스크립트를 지우고 새로 설치하면 저장소도 같이 지워지니까, 업데이트는 설치된 스크립트를 덮어쓰는 방식으로 해줘.</p>`;
    }

    // 붙여넣은 키 저장. 다른 서비스 키 모양이면 맞는 칸으로 옮긴다.
    const lastSaved = {};
    function saveKey(field, raw) {
        const value = String(raw || '').replace(/^Bearer\s+/i, '').replace(/\s+/g, '');
        if (lastSaved[field] === value) return;
        lastSaved[field] = value;
        const owner = whoseKey(value);
        if (owner && owner !== field) {
            Prefs.setKey(owner, value);
            const current = Prefs.keys()[field];
            if (current && whoseKey(current) && whoseKey(current) !== field) Prefs.setKey(field, '');
            Kit.toast({ title: `${KEY_NAMES[owner]}이라 그 칸에 넣었어`, body: `${KEY_NAMES[field]} 칸에는 그 서비스의 키를 따로 넣어줘.`, kind: 'ok' });
            draw();
            return;
        }
        Prefs.setKey(field, value);
        const hint = win?.el.querySelector(`[data-hint="${field}"]`);
        if (hint) hint.innerHTML = keyHint(field, value);
    }

    // ── 스타일 ─────────────────────────────────────────
    function stylePane() {
        const p = Prefs.get();
        const presets = p.presets.length
            ? p.presets.map(x => `<div class="cell"><span class="cell-label"><b>${esc(x.name)}</b><small class="is-mono">${esc(x.pos.slice(0, 90) || '(포지티브 없음)')}</small></span>
                <button class="button" data-do="preset-apply" data-id="${esc(x.id)}">적용</button>
                <button class="iconbutton is-small" data-do="preset-del" data-id="${esc(x.id)}" title="삭제">${icon.bin}</button></div>`).join('')
            : '<div class="cell"><span class="cell-label dim">저장된 프리셋이 없어. 작가 조합을 바꿔 가며 쓸 때 편해.</span></div>';
        return `
          <p class="aside" style="margin:0 4px 14px">여기 쓴 태그는 <b>모든 장면의 베이스 프롬프트 맨 앞</b>에 들어가. 작가·화풍·퀄리티 태그는 여기에만 넣어줘. 캐릭터 외형 칸에 넣어도 생성할 때 자동으로 이쪽으로 올라와.</p>
          <div class="caption">기본 스타일</div>
          <div class="card">
            <div class="cell is-col"><span>포지티브 · 작가 · 화풍 · 퀄리티</span><textarea class="textarea is-mono" data-k="style.pos" spellcheck="false" placeholder="artist:이름, 0.8::artist:다른작가::, painterly, …">${v(p.style.pos)}</textarea></div>
            <div class="cell is-col"><span>네거티브</span><textarea class="textarea is-mono is-short" data-k="style.neg" spellcheck="false" placeholder="lowres, bad anatomy, …">${v(p.style.neg)}</textarea></div>
          </div>
          <div class="caption"><span>프리셋</span><span class="fill"></span><button class="button" data-do="preset-new">${icon.add}지금 스타일로 추가</button></div>
          <div class="card">${presets}</div>`;
    }

    // ── 캐릭터 ─────────────────────────────────────────
    function charsPane() {
        const p = Prefs.get();
        const roomId = Site.room();
        const inRoom = new Set(p.rooms?.[roomId]?.chars || []);
        const open_ = p.characters.find(x => x.id === person);
        if (open_) return personPane(open_, roomId, inRoom.has(open_.id));
        const list = p.characters.length
            ? `<div class="card people">${p.characters.map((x, i) => `
                <button data-person="${esc(x.id)}"><span class="avatar" style="background:${AVATAR_COLORS[i % AVATAR_COLORS.length]}">${esc((x.name || '?').slice(0, 1))}</span>
                  <span class="who"><b>${esc(x.name || '(이름 없음)')}</b><small class="is-mono">${esc(Tags.join([x.look, x.outfit]).slice(0, 80) || '외형 없음')}</small></span>
                  ${roomId && inRoom.has(x.id) ? '<span class="tag is-blue">이 방</span>' : ''}<span class="chev">${icon.chevron}</span></button>`).join('')}</div>`
            : '<div class="card"><div class="cell"><span class="cell-label dim">아직 없어. 등록 안 해도 AI가 엑스트라로 외형을 지어서 그리지만, 매번 달라져.</span></div></div>';
        return `
          <p class="aside" style="margin:0 4px 14px">인물마다 <b>외형과 기본 의상</b>만 저장해. 자세·표정은 장면마다 AI가 채워. 등록한 인물은 채팅방별로 켜고 끌 수 있어.</p>
          <div class="caption"><span>등록 인물 ${p.characters.length}명</span><span class="fill"></span><button class="button" data-do="person-new">${icon.add}새 인물</button></div>
          ${list}`;
    }

    function personPane(c, roomId, inRoom) {
        const stray = Tags.split(Tags.join([c.look, c.outfit])).filter(Tags.isFrame);
        return `
          <div class="line" style="margin-bottom:12px"><button class="button is-ghost" data-do="person-back">${icon.back}모든 인물</button><span class="fill"></span><button class="button is-danger" data-do="person-del">삭제</button></div>
          <div class="card">
            ${row('이름', '채팅에 나오는 이름 그대로', `<input class="input" data-c="name" value="${v(c.name)}" style="max-width:260px">`)}
            ${row('별칭', '쉼표로 구분 · 성만, 애칭 등', `<input class="input" data-c="aliases" value="${v(c.aliases.join(', '))}" style="max-width:260px">`)}
            ${roomId ? row('이 채팅방에서 사용', '', Kit.toggle('person-room', inRoom)) : ''}
          </div>
          <div class="caption"><span>캐릭터 프롬프트</span><span class="layer-hint">${icon.person}char_captions</span></div>
          <div class="card">
            <div class="cell is-col"><span>외형 · 성별, 머리, 눈, 체형</span><textarea class="textarea is-mono" data-c="look" spellcheck="false" placeholder="girl, long black hair, red eyes, slender">${v(c.look)}</textarea></div>
            <div class="cell is-col"><span>기본 의상 · 장면에서 갈아입으면 AI가 바꿔</span><textarea class="textarea is-mono is-short" data-c="outfit" spellcheck="false" placeholder="white shirt, black skirt">${v(c.outfit)}</textarea></div>
            <div class="cell is-col"><span>이 인물만의 UC</span><input class="input is-mono" data-c="uc" spellcheck="false" value="${v(c.uc)}"></div>
          </div>
          <p class="aside">입력하면 바로 저장돼. 따로 저장 버튼은 없어.</p>
          ${stray.length ? `<div class="hints"><div class="hint is-warn">${icon.warn}<span class="fill">작가·화풍 태그가 섞여 있어: <code>${esc(stray.join(', '))}</code><br>이건 그림 전체에 걸리는 태그라 캐릭터 칸이 아니라 베이스에 있어야 해.</span><button class="button" data-do="person-lift">스타일로 옮기기</button></div></div>` : ''}`;
    }

    // ── 이 채팅방 ──────────────────────────────────────
    function roomPane() {
        const roomId = Site.room();
        if (!roomId) return '<div class="card"><div class="cell"><span class="cell-label dim">채팅방을 열면 방별 설정이 보여.</span></div></div>';
        const p = Prefs.get();
        const r = p.rooms[roomId] || {};
        const inRoom = new Set(r.chars || []);
        const peopleName = { auto: '자동', 1: '1명', 2: '최대 2명', 3: '최대 3명' }[p.scene.people] || '자동';
        const cast = p.characters.length
            ? p.characters.map(c => row(esc(c.name), `<span class="is-mono">${esc(Tags.join([c.look, c.outfit]).slice(0, 70))}</span>`, Kit.toggle(`room-${c.id}`, inRoom.has(c.id)))).join('')
            : '<div class="cell"><span class="cell-label dim">등록한 인물이 없어.</span><button class="button" data-do="goto-chars">캐릭터 등록</button></div>';
        const focusChoices = [['', '자동'], ...p.characters.filter(c => inRoom.has(c.id)).map(c => [c.id, c.name])];
        return `
          <div class="caption">이 방에 나오는 인물</div>
          <div class="card">${cast}</div>
          <div class="caption">인원</div>
          <div class="card">
            ${row('그릴 인원', `기본값: ${esc(peopleName)}`, Kit.seg('room-people', [['default', '기본값'], ['auto', '자동'], ['1', '1명'], ['2', '최대 2명']], String(r.people || 'default')))}
            ${row('꼭 그릴 인물', '인원을 1명으로 하면 이 인물을 그려 · 자동이면 AI가 장면의 중심 인물을 골라', `<select class="dropdown" data-room="focus" style="width:auto">${Kit.options(focusChoices, r.focus || '')}</select>`)}
          </div>
          <div class="caption">세계관 · 장소 메모</div>
          <div class="card"><div class="cell is-col"><textarea class="textarea" data-room="note" placeholder="예: 1920년대 경성. 주인공 집은 한옥, 카페는 서양식 인테리어.">${v(r.note)}</textarea></div></div>
          <p class="aside">장면 분석 AI에게 참고로 줘. 프롬프트에 그대로 들어가지는 않아.</p>
          <div class="caption">맥락</div>
          <div class="card">${row('앞 대화 몇 턴까지 읽을지', '화면에 그려진 메시지 기준', select('ui.contextTurns', [[0, '안 읽음'], [2, '2턴'], [4, '4턴'], [6, '6턴'], [10, '10턴']], p.ui.contextTurns, ' data-num'))}</div>`;
    }

    // ── 생성 옵션 ──────────────────────────────────────
    function genPane() {
        const p = Prefs.get();
        const g = p.gen;
        const isV5 = Models.isV5(p.model);
        const num = (k, label, step, small = '') => row(label, small, `<input class="input is-num is-mono" type="number" step="${step}" data-k="gen.${k}" data-num value="${v(g[k])}">`);
        const samplers = [['k_euler_ancestral', 'Euler Ancestral'], ['k_euler', 'Euler'], ['k_dpmpp_2s_ancestral', 'DPM++ 2S Ancestral'], ['k_dpmpp_2m_sde', 'DPM++ 2M SDE'], ['k_dpmpp_2m', 'DPM++ 2M'], ['k_dpmpp_sde', 'DPM++ SDE']];
        const noises = [['karras', 'Karras'], ['exponential', 'Exponential'], ['polyexponential', 'Polyexponential']];
        const ucChoices = [[2, '없음'], ...Object.keys(Nai.ucTable(p.model)).map(k => [k, Nai.UC_NAMES[k]])];
        return `
          <div class="caption">인원</div>
          <div class="card">
            ${row('그릴 인원', '1명이면 장면의 중심 인물 한 명만 solo로 그려. 채팅방마다 따로 정할 수도 있어.', Kit.seg('people', [['auto', '자동'], ['1', '1명'], ['2', '최대 2명'], ['3', '최대 3명']], String(p.scene.people)))}
            ${row('카메라', 'POV 스냅샷: 내 눈으로 몰래 찍은 듯한 구도(pov, candid shot, snapshot). 자유: 장면마다 AI가 구도를 골라.', Kit.seg('camera', [['pov', 'POV 스냅샷'], ['free', '자유']], String(p.scene.camera || 'pov')))}
          </div>
          <div class="caption">모델</div>
          <div class="card">
            ${row('NovelAI 모델', isV5 ? 'V5: 캐릭터 칸이 베이스 예산과 따로 · 최대 22명' : 'V4.5: 베이스+캐릭터 합산 512토큰 · 최대 6명', select('model', Models.list().map(m => [m.id, m.label]), p.model))}
            ${row('크기', '', Kit.seg('size', Object.entries(Nai.SIZES).map(([k, x]) => [k, `${x.label} ${x.w}×${x.h}`]), g.size))}
          </div>
          <div class="caption">품질</div>
          <div class="card">
            ${isV5
                ? row('퀄리티 태그', `베이스 끝에 붙어 · ${esc(Nai.V5_QUALITY[g.qualityV5] || '없음')}`, Kit.seg('qualityV5', [['none', '없음'], ['light', 'Light'], ['standard', 'Standard']], g.qualityV5))
                : row('퀄리티 태그 추가', 'NovelAI 서버가 붙여', Kit.toggle('qualityV45', g.qualityV45 !== false))}
            ${row('UC 프리셋', '', select('gen.ucPreset', ucChoices, Nai.ucPick(p.model, g.ucPreset), ' data-num'))}
          </div>
          <div class="caption">샘플링</div>
          <div class="card">
            ${num('steps', '스텝', 1, '28 이하는 Opus 무료')}
            ${isV5 ? num('scaleV5', 'Guidance', 0.1, 'V5 기본 5') : num('scaleV45', 'Guidance', 0.1, 'V4.5 기본 6')}
            ${isV5 ? num('rescaleV5', 'Rescale', 0.01) : num('rescaleV45', 'Rescale', 0.01)}
            ${row('샘플러', '', select('gen.sampler', samplers, g.sampler))}
            ${row('노이즈 스케줄', '', select('gen.noise', noises, g.noise))}
          </div>
          <div class="caption">인물 배치</div>
          <div class="card">${row('좌우 위치 지정', '켜면 AI가 고른 좌·중·우 위치를 NAI에 보내. 2명 이상일 때만 쓰여.', Kit.toggle('useCoords', Boolean(g.useCoords)))}</div>`;
    }

    // ── 저장 공간 ──────────────────────────────────────
    function storagePane() {
        const f = Prefs.get().folder;
        const folder = Disk.supported
            ? row('폴더에도 저장', '생성할 때마다 PNG를 이 폴더에 바로 써. NovelAI 메타데이터(프롬프트·시드)도 그대로 들어 있어.', Kit.toggle('folder-enabled', Boolean(f.enabled)))
              + '<div class="cell"><span class="cell-label"><b>저장 폴더</b><small data-folder>확인 중…</small></span><button class="button" data-do="folder-pick">폴더 선택…</button><button class="button hide" data-do="folder-grant">다시 허용</button></div>'
              + row('채팅방마다 하위 폴더', '폴더/채팅방 이름/날짜_제목_시드.png', Kit.toggle('folder-perRoom', f.perRoom !== false))
            : row('이 브라우저는 폴더 지정을 지원하지 않아', 'Chrome · Edge · Whale 에서 쓸 수 있어. 대신 생성할 때마다 다운로드 폴더로 받을 수 있어.', '');
        return `
          <div class="caption">내 컴퓨터 폴더</div>
          <div class="card">
            ${folder}
            ${row('생성할 때마다 다운로드', `${Disk.supported ? '폴더 저장을 끈 경우에만 · ' : ''}브라우저 다운로드 폴더로 받아`, Kit.toggle('folder-download', Boolean(f.download)))}
          </div>
          <p class="aside">채팅 안에 보이는 삽화는 폴더 저장과 상관없이 이 브라우저(IndexedDB)에 따로 보관돼. 브라우저를 다시 열면 폴더 권한을 한 번 더 물어볼 수 있어.</p>
          <div class="caption">이 브라우저</div>
          <div class="card">
            <div class="cell"><span class="cell-label"><b>사용량</b></span><span class="dim" data-usage>계산 중…</span></div>
            <div class="cell"><span class="cell-label"><b>이 채팅방 삽화</b></span><span class="dim" data-room-count>…</span><button class="button" data-do="open-gallery">갤러리</button><button class="button is-danger" data-do="clear-room">모두 지우기</button></div>
          </div>
          <p class="aside">다른 기기와는 공유되지 않아.</p>
          <div class="caption">정보</div>
          <div class="card">${row('Crack Painter', `버전 ${esc(VERSION)}`, '<a class="button" href="https://github.com/w7k4x9/crack-painter" target="_blank" rel="noopener">GitHub</a>')}</div>`;
    }

    async function fillFolder() {
        const label = win?.el.querySelector('[data-folder]');
        if (!label) return;
        const st = await Disk.status();
        const grant = win?.el.querySelector('[data-do="folder-grant"]');
        if (!st.set) { label.textContent = '아직 안 골랐어'; grant?.classList.add('hide'); return; }
        const ok = st.permission === 'granted';
        label.innerHTML = `<b style="font-weight:500;color:var(--text)">${esc(st.name)}</b> · ${ok ? '<span class="ok-text">쓰기 허용됨</span>' : '<span class="warn-text">권한 다시 필요</span>'}`;
        grant?.classList.toggle('hide', ok);
        const pick = win?.el.querySelector('[data-do="folder-pick"]');
        if (pick) pick.textContent = '변경…';
    }

    async function fillStorage() {
        fillFolder();
        const size = b => (b > 1e9 ? `${(b / 1e9).toFixed(1)}GB` : `${Math.round(b / 1e6)}MB`);
        const u = await Vault.usage();
        const usage = win?.el.querySelector('[data-usage]');
        if (usage) usage.textContent = u ? `${size(u.used)} / ${size(u.quota)}` : '알 수 없음';
        const count = win?.el.querySelector('[data-room-count]');
        if (!count) return;
        const roomId = Site.room();
        if (!roomId) { count.textContent = '채팅방 밖'; return; }
        const recs = await Vault.roomList(roomId);
        count.textContent = `${recs.length}개 답변 · ${recs.reduce((n, r) => n + (r.history?.length || 0), 0)}장`;
    }

    // ── 입력 ───────────────────────────────────────────
    function assign(target, path, value) {
        const keys = path.split('.');
        const last = keys.pop();
        const parent = keys.reduce((o, k) => (o[k] = o[k] || {}), target);
        parent[last] = value;
    }

    const editPerson = change => Prefs.edit(d => { const c = d.characters.find(x => x.id === person); if (c) change(c, d); });

    const SEGMENTS = {
        provider: (d, x) => { d.analyzer.provider = x; },
        size: (d, x) => { d.gen.size = x; },
        qualityV5: (d, x) => { d.gen.qualityV5 = x; },
        people: (d, x) => { d.scene.people = x; },
        camera: (d, x) => { d.scene.camera = x; },
        'room-people': (d, x) => { if (Site.room()) Prefs.room(d, Site.room()).people = x; }
    };

    async function act(name, btn) {
        const roomId = Site.room();
        switch (name) {
            case 'folder-pick':
                try {
                    await Disk.choose();
                    Prefs.edit(d => { d.folder.enabled = true; });
                    draw();
                    Kit.toast({ title: '저장 폴더를 정했어', kind: 'ok', body: '다음 생성부터 이 폴더에도 저장돼.' });
                } catch (e) {
                    if (e?.name !== 'AbortError') Engine.report(e, '폴더를 열지 못했어');
                }
                break;
            case 'folder-grant': await Disk.warm(true); fillFolder(); break;
            case 'open-gallery': Gallery.open(); break;
            case 'test-nai': testNai(); break;
            case 'test-llm': testLlm(); break;
            case 'preset-new': {
                const name_ = await Kit.ask(btn, { title: '새 스타일 프리셋', placeholder: '이름 · 예: 수채화 kawacy' });
                if (!name_) return;
                Prefs.edit(d => { d.presets.push({ id: Prefs.newId('ps'), name: name_.trim().slice(0, 40), pos: d.style.pos, neg: d.style.neg }); });
                draw();
                break;
            }
            case 'preset-apply':
                Prefs.edit(d => { const x = d.presets.find(p => p.id === btn.dataset.id); if (x) d.style = { pos: x.pos, neg: x.neg ?? d.style.neg }; });
                draw();
                Kit.toast({ title: '스타일을 바꿨어', kind: 'ok' });
                break;
            case 'preset-del':
                Prefs.edit(d => { d.presets = d.presets.filter(x => x.id !== btn.dataset.id); });
                draw();
                break;
            case 'person-new': {
                const id = Prefs.newId('ch');
                Prefs.edit(d => {
                    d.characters.push({ id, name: '', aliases: [], look: '', outfit: '', uc: '' });
                    if (roomId) { const r = Prefs.room(d, roomId); r.chars = [...(r.chars || []), id]; }
                });
                person = id;
                draw();
                win.el.querySelector('[data-c="name"]')?.focus();
                break;
            }
            case 'person-back': person = null; draw(); break;
            case 'person-del': {
                if (!Kit.confirmTap(btn, '모든 방에서 삭제')) return;
                const id = person;
                Prefs.edit(d => {
                    d.characters = d.characters.filter(x => x.id !== id);
                    for (const r of Object.values(d.rooms)) if (r.chars) r.chars = r.chars.filter(x => x !== id);
                });
                person = null;
                draw();
                break;
            }
            case 'person-lift':
                editPerson((c, d) => {
                    const lifted = [];
                    const keep = text => Tags.join(Tags.split(text).filter(t => (Tags.isFrame(t) ? (lifted.push(t), false) : true)));
                    c.look = keep(c.look);
                    c.outfit = keep(c.outfit);
                    d.style.pos = Tags.join(Tags.unique([...Tags.split(d.style.pos), ...lifted]));
                });
                draw();
                Kit.toast({ title: '스타일로 옮겼어', kind: 'ok', body: '설정 → 스타일에서 확인할 수 있어.' });
                break;
            case 'goto-chars': pane = 'chars'; draw(); break;
            case 'clear-room': {
                if (!roomId || !Kit.confirmTap(btn, '정말 모두 삭제')) return;
                for (const r of await Vault.roomList(roomId)) await Vault.dropRecord(roomId, r.messageKey);
                document.querySelectorAll('.kp-figure').forEach(f => f.remove());
                fillStorage();
                break;
            }
            default:
        }
    }

    let keyTimer = 0;
    function wire(el) {
        // 키는 치는 대로 저장 (Esc로 창을 닫아도 남게)
        el.addEventListener('input', ev => {
            const field = ev.target.dataset.secret;
            if (!field) return;
            clearTimeout(keyTimer);
            keyTimer = setTimeout(() => saveKey(field, ev.target.value), 400);
        });
        el.addEventListener('click', ev => {
            const nav = ev.target.closest('[data-pane]');
            if (nav) { pane = nav.dataset.pane; person = null; draw(); return; }
            const who = ev.target.closest('[data-person]');
            if (who) { person = who.dataset.person; draw(); return; }
            const seg = ev.target.closest('.segmented button');
            if (seg) {
                const set = SEGMENTS[seg.parentElement.dataset.seg];
                if (set) Prefs.edit(d => set(d, seg.dataset.v));
                draw();
                return;
            }
            const btn = ev.target.closest('[data-do]');
            if (btn && !btn.closest('.traffic')) act(btn.dataset.do, btn);
        });
        el.addEventListener('change', ev => {
            const t = ev.target;
            const d = t.dataset;
            const roomId = Site.room();
            if (d.secret) {
                clearTimeout(keyTimer);
                saveKey(d.secret, t.value);
            } else if (d.k) {
                const value = 'num' in d ? Number(t.value) : t.value;
                Prefs.edit(p => assign(p, d.k, value));
                if (d.k === 'model') draw();
            } else if (d.c) {
                editPerson(c => { c[d.c] = d.c === 'aliases' ? t.value.split(',').map(a => a.trim()).filter(Boolean) : t.value; });
                if (d.c === 'look' || d.c === 'outfit') draw();
            } else if (d.room) {
                if (roomId) Prefs.edit(p => { p.rooms[roomId] = { ...(p.rooms[roomId] || {}), [d.room]: t.value }; });
            } else if (d.sw) {
                toggled(d.sw, t.checked, roomId);
            }
        });
    }

    function toggled(name, on, roomId) {
        if (name.startsWith('folder-')) {
            const key = name.slice(7);
            Prefs.edit(p => { p.folder[key] = on; });
            if (key === 'enabled' && on) Disk.status().then(st => { if (!st.set) win?.el.querySelector('[data-do="folder-pick"]')?.click(); });
        } else if (name === 'qualityV45' || name === 'useCoords') {
            Prefs.edit(p => { p.gen[name] = on; });
        } else if (name === 'person-room' || name.startsWith('room-')) {
            if (!roomId) return;
            const id = name === 'person-room' ? person : name.slice(5);
            Prefs.edit(p => {
                const r = Prefs.room(p, roomId);
                const ids = new Set(r.chars || []);
                if (on) ids.add(id); else ids.delete(id);
                r.chars = [...ids];
            });
        }
    }

    async function testNai() {
        const box = win?.el.querySelector('[data-nai-status]');
        if (!box) return;
        const key = Prefs.keys().naiKey;
        if (!key) { box.innerHTML = '<b class="bad-text">토큰이 없어</b>'; return; }
        box.innerHTML = '<small>확인 중…</small>';
        try {
            const sub = await Http.send({ url: 'https://image.novelai.net/user/subscription', headers: { Authorization: `Bearer ${key}` }, timeout: 20000 });
            const tier = ['Paper', 'Tablet', 'Scroll', 'Opus'][sub?.tier] || `Tier ${sub?.tier}`;
            const left = sub?.trainingStepsLeft || {};
            const anlas = (left.fixedTrainingStepsLeft || 0) + (left.purchasedTrainingSteps || 0);
            box.innerHTML = `<b class="ok-text">연결됨</b><small>${esc(tier)} · Anlas ${anlas.toLocaleString()}${sub?.active === false ? ' · 구독 비활성' : ''}</small>`;
        } catch (e) {
            box.innerHTML = `<b class="bad-text">실패</b><small>${esc(e.message)}</small>`;
        }
    }

    async function testLlm() {
        const box = win?.el.querySelector('[data-llm-status]');
        if (!box) return;
        const p = Prefs.get();
        const k = Prefs.keys();
        const deep = p.analyzer.provider === 'deepseek';
        box.innerHTML = '<small>확인 중…</small>';
        try {
            await Analyst.ping(p.analyzer.provider, deep ? k.deepseekKey : k.geminiKey, deep ? p.analyzer.deepseekModel : p.analyzer.geminiModel);
            box.innerHTML = '<b class="ok-text">연결됨</b><small>JSON 응답 확인</small>';
        } catch (e) {
            box.innerHTML = `<b class="bad-text">실패</b><small>${esc(e.message)}</small>`;
        }
    }

    return { open };
})();


// ── boot.js ──
// 시작 — 한 페이지에 한 번만
if (!window.__crackPainter) {
    window.__crackPainter = VERSION;
    const go = () => {
        try { Inline.start(); } catch (e) { console.error('[크랙 페인터] 시작하지 못했어', e); }
    };
    if (document.body) setTimeout(go, 600);
    else addEventListener('DOMContentLoaded', () => setTimeout(go, 600));
}

})();
