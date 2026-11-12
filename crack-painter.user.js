// ==UserScript==
// @name         Crack Painter
// @namespace    https://github.com/w7k4x9/crack-painter
// @version      1.1.1
// @description  크랙(crack.wrtn.ai) 채팅 장면을 NovelAI 삽화로. 작가·화풍은 베이스, 인물은 캐릭터 칸으로 정확히 나눠 보냄.
// @author       w7k4x9
// @match        https://crack.wrtn.ai/*
// @icon         data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23ff6b9a'/%3E%3Cstop offset='.55' stop-color='%23a259ff'/%3E%3Cstop offset='1' stop-color='%233d8bff'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='14' fill='url(%23g)'/%3E%3Cpath d='M38 14l12 12-20 20-12-12z' fill='white'/%3E%3Cpath d='M18 36c-5 0-8 4-8 9s-2 9-2 9 8 1 12-3 6-7 6-9' fill='white' opacity='.85'/%3E%3C/svg%3E
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

(function () {
    'use strict';

const VERSION = "1.1.1";

const UI_CSS = "/* ── Crack Painter · macOS 스타일 (Shadow DOM 안) ───────────── */\n:host { all: initial; }\n.root {\n  --font: -apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Apple SD Gothic Neo\", \"Pretendard Variable\", Pretendard, \"Noto Sans KR\", system-ui, sans-serif;\n  --mono: ui-monospace, \"SF Mono\", Menlo, Consolas, monospace;\n  --accent: #007aff;\n  --accent-press: #0062cc;\n  --accent-soft: rgba(0,122,255,.14);\n  --ring: rgba(0,122,255,.38);\n  --text: #1d1d1f;\n  --text2: #6e6e73;\n  --text3: #a1a1a6;\n  --win: rgba(246,246,248,.92);\n  --win-solid: #f6f6f8;\n  --bar: rgba(236,236,240,.78);\n  --side: rgba(232,232,237,.72);\n  --group: #ffffff;\n  --field: #ffffff;\n  --btn: #ffffff;\n  --btn-hover: #f4f4f6;\n  --sep: rgba(0,0,0,.09);\n  --sep-strong: rgba(0,0,0,.16);\n  --track: rgba(0,0,0,.065);\n  --hover: rgba(0,0,0,.045);\n  --shadow: 0 0 0 .5px rgba(0,0,0,.22), 0 24px 70px rgba(0,0,0,.28), 0 4px 14px rgba(0,0,0,.12);\n  --ctl-shadow: 0 .5px 1.5px rgba(0,0,0,.18), 0 0 0 .5px rgba(0,0,0,.08);\n  --red: #ff3b30; --orange: #ff9500; --green: #28cd41; --yellow: #ffcc00; --purple: #af52de; --teal: #30b0c7; --pink: #ff2d55;\n  --stage: #e9e9ee;\n  font-family: var(--font);\n  font-size: 13px;\n  line-height: 1.38;\n  color: var(--text);\n  -webkit-font-smoothing: antialiased;\n  letter-spacing: -.003em;\n}\n.root.dark {\n  --accent: #0a84ff;\n  --accent-press: #409cff;\n  --accent-soft: rgba(10,132,255,.22);\n  --ring: rgba(10,132,255,.5);\n  --text: #f5f5f7;\n  --text2: #a1a1a6;\n  --text3: #6e6e73;\n  --win: rgba(36,36,40,.9);\n  --win-solid: #242428;\n  --bar: rgba(44,44,48,.82);\n  --side: rgba(40,40,44,.7);\n  --group: rgba(255,255,255,.055);\n  --field: rgba(255,255,255,.07);\n  --btn: rgba(255,255,255,.12);\n  --btn-hover: rgba(255,255,255,.17);\n  --sep: rgba(255,255,255,.08);\n  --sep-strong: rgba(255,255,255,.16);\n  --track: rgba(255,255,255,.09);\n  --hover: rgba(255,255,255,.06);\n  --shadow: 0 0 0 .5px rgba(255,255,255,.12), 0 0 0 1px rgba(0,0,0,.6), 0 24px 70px rgba(0,0,0,.55);\n  --ctl-shadow: 0 0 0 .5px rgba(255,255,255,.06), 0 1px 1px rgba(0,0,0,.3);\n  --red: #ff453a; --orange: #ff9f0a; --green: #32d74b; --yellow: #ffd60a; --purple: #bf5af2; --teal: #40c8e0; --pink: #ff375f;\n  --stage: #1b1b1e;\n}\n*, *::before, *::after { box-sizing: border-box; }\nbutton, input, textarea, select { font: inherit; color: inherit; letter-spacing: inherit; }\nsvg { display: block; }\n.hidden { display: none !important; }\n\n/* ── 창 ─────────────────────────────────────────────── */\n.layer { position: fixed; inset: 0; z-index: 2147483000; pointer-events: none; }\n.scrim { position: fixed; inset: 0; background: rgba(0,0,0,.18); pointer-events: auto; animation: fade .18s ease; }\n.root.dark .scrim { background: rgba(0,0,0,.35); }\n.win {\n  position: fixed; pointer-events: auto;\n  display: flex; flex-direction: column;\n  background: var(--win);\n  -webkit-backdrop-filter: blur(40px) saturate(180%);\n  backdrop-filter: blur(40px) saturate(180%);\n  border-radius: 12px;\n  box-shadow: var(--shadow);\n  overflow: hidden;\n  animation: pop .22s cubic-bezier(.2,.9,.3,1.1);\n  min-width: 320px; min-height: 240px;\n}\n.win.zoomed { inset: 12px !important; width: auto !important; height: auto !important; }\n.win.inactive .lights i { background: var(--track); border-color: transparent; }\n@keyframes pop { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: none; } }\n@keyframes fade { from { opacity: 0; } }\n\n.titlebar {\n  flex: none; height: 52px;\n  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px;\n  padding: 0 14px 0 16px;\n  background: var(--bar);\n  border-bottom: .5px solid var(--sep-strong);\n  user-select: none; cursor: default;\n  touch-action: none;\n}\n.titlebar.sidebar-bar { background: transparent; border-bottom: 0; }\n.titlebar .left, .titlebar .right { display: flex; align-items: center; gap: 8px; min-width: 0; }\n.titlebar .right .select { max-width: 170px; }\n.titlebar .right { justify-content: flex-end; }\n.title { text-align: center; min-width: 0; }\n.title b { display: block; font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.title small { display: block; font-size: 11px; color: var(--text2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }\n.lights { display: flex; gap: 8px; margin-right: 6px; }\n.lights i {\n  width: 12px; height: 12px; border-radius: 50%; display: grid; place-items: center;\n  border: .5px solid rgba(0,0,0,.18); cursor: pointer; position: relative;\n}\n.lights i:nth-child(1) { background: #ff5f57; }\n.lights i:nth-child(2) { background: #febc2e; }\n.lights i:nth-child(3) { background: #28c840; }\n.lights i:hover { filter: brightness(.92); }\n.lights i.off { background: var(--track) !important; cursor: default; }\n\n/* ── 컨트롤 ─────────────────────────────────────────── */\n.btn {\n  display: inline-flex; align-items: center; justify-content: center; gap: 5px;\n  height: 24px; padding: 0 10px; border-radius: 6px; border: 0;\n  background: var(--btn); box-shadow: var(--ctl-shadow);\n  font-size: 13px; font-weight: 500; white-space: nowrap; cursor: default;\n}\n.btn:hover { background: var(--btn-hover); }\na.btn { text-decoration: none; color: inherit; }\n.btn:active { filter: brightness(.94); }\n.btn:disabled { opacity: .45; pointer-events: none; }\n.btn svg { width: 14px; height: 14px; }\n.btn.primary { background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 88%, #fff), var(--accent)); color: #fff; box-shadow: 0 .5px 1px rgba(0,0,0,.25), inset 0 .5px 0 rgba(255,255,255,.25); }\n.btn.primary:hover { background: var(--accent); }\n.btn.danger { color: var(--red); }\n.btn.lg { height: 28px; padding: 0 14px; font-size: 13px; border-radius: 7px; }\n.btn.ghost { background: transparent; box-shadow: none; }\n.btn.ghost:hover { background: var(--hover); }\n.icon-btn {\n  width: 28px; height: 28px; border-radius: 6px; border: 0; background: transparent;\n  display: inline-grid; place-items: center; color: var(--text2); cursor: default;\n}\n.icon-btn:hover { background: var(--hover); color: var(--text); }\n.icon-btn svg { width: 16px; height: 16px; }\n.icon-btn.sm { width: 22px; height: 22px; } .icon-btn.sm svg { width: 13px; height: 13px; }\n.kbd { font-size: 11px; opacity: .75; margin-left: 2px; }\n\n.field, .ta, .select {\n  width: 100%; border: 0; outline: 0;\n  background: var(--field); box-shadow: var(--ctl-shadow);\n  border-radius: 6px; padding: 4px 8px; min-height: 24px;\n  transition: box-shadow .12s;\n}\n.field:focus, .ta:focus, .select:focus { box-shadow: 0 0 0 .5px var(--accent), 0 0 0 3.5px var(--ring); }\n.field::placeholder, .ta::placeholder { color: var(--text3); }\n.ta { display: block; resize: vertical; min-height: 54px; padding: 6px 8px; font-size: 12.5px; line-height: 1.45; font-family: var(--font); }\n.ta.mono, .field.mono { font-family: var(--mono); font-size: 12px; }\n.ta.short { min-height: 38px; }\n.select {\n  appearance: none; -webkit-appearance: none; padding-right: 26px; cursor: default; height: 24px; min-height: 0;\n  background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='12' viewBox='0 0 8 12'%3E%3Cpath d='M1 4.5 4 1.5l3 3M1 7.5l3 3 3-3' fill='none' stroke='%23888' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\");\n  background-repeat: no-repeat; background-position: right 8px center;\n}\n.root.dark .select option { background: #2c2c30; }\n.field.num { width: 72px; text-align: right; font-variant-numeric: tabular-nums; }\n\n.seg { display: inline-flex; background: var(--track); border-radius: 7px; padding: 2px; gap: 2px; }\n.seg button {\n  border: 0; background: transparent; height: 20px; padding: 0 10px; border-radius: 5px;\n  font-size: 12px; font-weight: 500; color: var(--text); cursor: default; white-space: nowrap;\n}\n.seg button.on { background: var(--btn); box-shadow: var(--ctl-shadow); }\n.root.dark .seg button.on { background: rgba(255,255,255,.2); }\n.seg.sm button { padding: 0 7px; font-size: 11px; height: 18px; }\n\n.switch { position: relative; width: 32px; height: 19px; flex: none; }\n.switch input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: default; z-index: 1; }\n.switch span { position: absolute; inset: 0; border-radius: 99px; background: var(--track); box-shadow: inset 0 0 0 .5px var(--sep); transition: background .2s; }\n.switch span::after { content: ''; position: absolute; top: 2px; left: 2px; width: 15px; height: 15px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.3); transition: transform .2s cubic-bezier(.3,.7,.4,1.2); }\n.switch input:checked + span { background: var(--accent); }\n.switch input:checked + span::after { transform: translateX(13px); }\n\n.badge { display: inline-flex; align-items: center; height: 17px; padding: 0 6px; border-radius: 5px; font-size: 10.5px; font-weight: 600; background: var(--track); color: var(--text2); white-space: nowrap; }\n.badge.blue { background: var(--accent-soft); color: var(--accent); }\n.badge.orange { background: color-mix(in srgb, var(--orange) 18%, transparent); color: var(--orange); }\n.badge.green { background: color-mix(in srgb, var(--green) 18%, transparent); color: var(--green); }\n.badge.red { background: color-mix(in srgb, var(--red) 16%, transparent); color: var(--red); }\n.muted { color: var(--text2); }\n.tiny { font-size: 11px; }\n.grow { flex: 1; }\n.row { display: flex; align-items: center; gap: 8px; }\n.stack { display: flex; flex-direction: column; gap: 6px; }\n\n/* 스크롤 */\n.scroll { overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--sep-strong) transparent; }\n.scroll::-webkit-scrollbar { width: 10px; height: 10px; }\n.scroll::-webkit-scrollbar-thumb { background: var(--sep-strong); border-radius: 10px; border: 3px solid transparent; background-clip: content-box; }\n\n/* ── 그룹 리스트 (시스템 설정 스타일) ─────────────────── */\n.section-title { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: none; margin: 18px 4px 6px; display: flex; align-items: center; gap: 6px; }\n.section-title:first-child { margin-top: 0; }\n.section-title .grow + * { font-weight: 500; }\n.group { background: var(--group); border-radius: 10px; box-shadow: 0 0 0 .5px var(--sep); }\n.group > .item { padding: 9px 12px; display: flex; align-items: center; gap: 10px; min-height: 40px; position: relative; }\n.group > .item + .item::before { content: ''; position: absolute; top: 0; left: 12px; right: 0; border-top: .5px solid var(--sep); }\n.group > .item.col { flex-direction: column; align-items: stretch; gap: 6px; }\n.item .label { flex: 1; min-width: 0; }\n.item .label b { font-weight: 500; display: block; }\n.item .label small { display: block; color: var(--text2); font-size: 11.5px; margin-top: 1px; }\n.footnote { color: var(--text2); font-size: 11.5px; margin: 6px 4px 0; line-height: 1.45; }\n.footnote code, .help code { font-family: var(--mono); font-size: 11px; background: var(--track); padding: 0 4px; border-radius: 4px; }\n\n/* ── 스튜디오 ─────────────────────────────────────── */\n.studio { width: min(1180px, calc(100vw - 32px)); height: min(820px, calc(100vh - 32px)); }\n.studio .body { flex: 1; display: grid; grid-template-columns: minmax(300px, 1fr) minmax(380px, 460px); min-height: 0; }\n.stage { position: relative; display: flex; flex-direction: column; min-height: 0; background: var(--stage); border-right: .5px solid var(--sep-strong); }\n.canvas { flex: 1 1 0; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; overflow: hidden; }\n.canvas img { display: block; max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; border-radius: 6px; box-shadow: 0 8px 30px rgba(0,0,0,.18), 0 0 0 .5px var(--sep); cursor: zoom-in; }\n.placeholder { display: flex; flex-direction: column; align-items: center; gap: 10px; color: var(--text3); text-align: center; max-width: 280px; }\n.placeholder svg { width: 44px; height: 44px; opacity: .6; }\n.placeholder b { color: var(--text2); font-weight: 600; font-size: 14px; }\n.busy {\n  position: absolute; inset: 0; display: grid; place-items: center;\n  background: color-mix(in srgb, var(--stage) 55%, transparent);\n  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);\n}\n.busy .card { background: var(--win); border-radius: 14px; box-shadow: var(--shadow); padding: 18px 22px; display: flex; flex-direction: column; align-items: center; gap: 10px; min-width: 220px; }\n.spinner { width: 22px; height: 22px; position: relative; }\n.spinner i { position: absolute; left: 10px; top: 1px; width: 2.2px; height: 6px; border-radius: 2px; background: var(--text2); transform-origin: 1.1px 10px; animation: spin 1s linear infinite; }\n@keyframes spin { 0% { opacity: 1; } 100% { opacity: .15; } }\n.film { flex: none; display: flex; gap: 8px; padding: 10px 14px; overflow-x: auto; border-top: .5px solid var(--sep); align-items: center; background: var(--bar); }\n.film .thumb { flex: none; width: 46px; height: 46px; border-radius: 7px; overflow: hidden; border: 0; padding: 0; background: var(--track); box-shadow: 0 0 0 .5px var(--sep); cursor: default; position: relative; }\n.film .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }\n.film .thumb.on { box-shadow: 0 0 0 2px var(--accent); }\n.film .thumb .pin { position: absolute; right: 2px; bottom: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--accent); color: #fff; display: grid; place-items: center; }\n.film .thumb .pin svg { width: 8px; height: 8px; }\n.film .tools { display: flex; gap: 2px; margin-left: auto; }\n\n.inspector { display: flex; flex-direction: column; min-height: 0; background: var(--win); }\n.inspector .content { flex: 1; padding: 14px 16px 24px; }\n.inspector .footer { flex: none; border-top: .5px solid var(--sep-strong); background: var(--bar); padding: 10px 14px; display: flex; flex-direction: column; gap: 8px; }\n\n.moment { font-size: 12.5px; color: var(--text2); padding: 2px 4px 0; }\n.slot { padding: 10px 12px 12px; display: flex; flex-direction: column; gap: 7px; }\n.slot + .slot { border-top: .5px solid var(--sep); }\n.slot-head { display: flex; align-items: center; gap: 7px; min-height: 22px; }\n.slot-head .name { font-weight: 600; font-size: 13px; }\n.slot-head .dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }\n.slot-head .tok { margin-left: auto; font-variant-numeric: tabular-nums; }\n.slot .sub { font-size: 11px; font-weight: 600; color: var(--text2); display: flex; align-items: center; gap: 6px; }\n.slot.off > :not(.slot-head) { display: none; }\n.slot.off .name { color: var(--text3); }\n.where { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; color: var(--text2); font-weight: 600; letter-spacing: .02em; }\n.where svg { width: 11px; height: 11px; }\n\n.notes { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; }\n.note { display: flex; gap: 8px; align-items: flex-start; font-size: 12px; padding: 8px 10px; border-radius: 8px; background: var(--group); box-shadow: 0 0 0 .5px var(--sep); }\n.note svg { width: 14px; height: 14px; flex: none; margin-top: 1px; color: var(--accent); }\n.note.warn svg { color: var(--orange); }\n.note.error svg { color: var(--red); }\n\ndetails.raw { margin-top: 12px; }\ndetails.raw summary { cursor: default; font-size: 11px; font-weight: 600; color: var(--text2); list-style: none; display: flex; align-items: center; gap: 4px; padding: 4px; }\ndetails.raw summary::-webkit-details-marker { display: none; }\ndetails.raw summary svg { width: 10px; height: 10px; transition: transform .15s; }\ndetails.raw[open] summary svg { transform: rotate(90deg); }\ndetails.raw pre { margin: 4px 0 0; white-space: pre-wrap; word-break: break-word; font-family: var(--mono); font-size: 11px; line-height: 1.5; background: var(--group); box-shadow: 0 0 0 .5px var(--sep); border-radius: 8px; padding: 10px 12px; max-height: 320px; overflow: auto; }\ndetails.raw pre .k { color: var(--purple); }\n\n.meter { display: flex; flex-direction: column; gap: 4px; }\n.meter .bar { height: 6px; border-radius: 99px; background: var(--track); overflow: hidden; display: flex; }\n.meter .bar i { height: 100%; display: block; }\n.meter .bar i + i { box-shadow: -1px 0 0 var(--win-solid); }\n.meter .legend { display: flex; flex-wrap: wrap; gap: 2px 10px; font-size: 11px; color: var(--text2); font-variant-numeric: tabular-nums; }\n.meter .legend span { display: inline-flex; align-items: center; gap: 4px; }\n.meter .legend span::before { content: ''; width: 7px; height: 7px; border-radius: 2px; background: var(--c); }\n.meter .legend .total { margin-left: auto; font-weight: 600; color: var(--text); }\n.meter.over .legend .total { color: var(--red); }\n.c-style { --c: var(--purple); } .c-scene { --c: var(--accent); }\n.c-0 { --c: var(--orange); } .c-1 { --c: var(--green); } .c-2 { --c: var(--pink); } .c-3 { --c: var(--teal); } .c-4 { --c: var(--yellow); } .c-5 { --c: #8e8e93; }\n\n/* 팝오버 메뉴 */\n.menu { position: fixed; pointer-events: auto; min-width: 200px; max-width: 320px; max-height: 60vh; overflow: auto; padding: 5px; border-radius: 9px; background: var(--win); -webkit-backdrop-filter: blur(30px) saturate(180%); backdrop-filter: blur(30px) saturate(180%); box-shadow: var(--shadow); z-index: 5; animation: fade .1s; }\n.menu button { display: flex; width: 100%; align-items: center; gap: 8px; text-align: left; border: 0; background: transparent; padding: 4px 10px; border-radius: 5px; font-size: 13px; cursor: default; min-height: 24px; }\n.menu button:hover { background: var(--accent); color: #fff; }\n.menu button:hover small { color: rgba(255,255,255,.8); }\n.menu button small { color: var(--text2); font-size: 11px; display: block; }\n.menu hr { border: 0; border-top: .5px solid var(--sep-strong); margin: 4px 8px; }\n.menu .hd { font-size: 11px; font-weight: 600; color: var(--text2); padding: 4px 10px 2px; }\n\n/* ── 설정 ─────────────────────────────────────────── */\n.settings { width: min(860px, calc(100vw - 32px)); height: min(640px, calc(100vh - 32px)); }\n.settings .body { flex: 1; display: grid; grid-template-columns: 210px 1fr; min-height: 0; }\n.settings .side { background: var(--side); border-right: .5px solid var(--sep-strong); display: flex; flex-direction: column; min-height: 0; }\n.settings .side .titlebar { background: transparent; border: 0; grid-template-columns: auto 1fr; }\n.settings .nav { padding: 4px 10px 12px; display: flex; flex-direction: column; gap: 1px; }\n.settings .nav button { display: flex; align-items: center; gap: 9px; border: 0; background: transparent; height: 30px; padding: 0 8px; border-radius: 6px; font-size: 13px; text-align: left; cursor: default; }\n.settings .nav button:hover { background: var(--hover); }\n.settings .nav button.on { background: var(--accent); color: #fff; }\n.settings .nav .ic { width: 20px; height: 20px; border-radius: 5px; display: grid; place-items: center; color: #fff; flex: none; }\n.settings .nav .ic svg { width: 12px; height: 12px; }\n.settings .main { display: flex; flex-direction: column; min-height: 0; }\n.settings .main .titlebar { grid-template-columns: auto 1fr auto; }\n.settings .main .titlebar .title { text-align: left; }\n.settings .main .titlebar .title b { font-size: 15px; font-weight: 700; }\n.settings .pane { flex: 1; padding: 6px 24px 28px; }\n.side .search { margin: 0 10px 8px; }\n.char-list { display: flex; flex-direction: column; }\n.char-list button { display: flex; align-items: center; gap: 10px; border: 0; background: transparent; text-align: left; padding: 8px 12px; cursor: default; position: relative; }\n.char-list button + button::before { content: ''; position: absolute; top: 0; left: 46px; right: 0; border-top: .5px solid var(--sep); }\n.char-list button:hover { background: var(--hover); }\n.char-list button:first-child { border-radius: 10px 10px 0 0; } .char-list button:last-child { border-radius: 0 0 10px 10px; }\n.avatar { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-weight: 600; font-size: 12px; flex: none; }\n.char-list .meta { flex: 1; min-width: 0; }\n.char-list .meta b { display: block; font-weight: 500; }\n.char-list .meta small { display: block; color: var(--text2); font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.chev { width: 8px; height: 13px; color: var(--text3); flex: none; }\n.kv { display: grid; grid-template-columns: 140px 1fr; gap: 10px; align-items: center; }\n\n/* ── 알림 (macOS Notification) ───────────────────── */\n.toasts { position: fixed; top: 14px; right: 14px; display: flex; flex-direction: column; gap: 8px; width: min(356px, calc(100vw - 28px)); pointer-events: none; z-index: 10; }\n.toast {\n  pointer-events: auto; display: flex; gap: 10px; align-items: flex-start;\n  padding: 11px 12px; border-radius: 16px;\n  background: var(--win); -webkit-backdrop-filter: blur(30px) saturate(180%); backdrop-filter: blur(30px) saturate(180%);\n  box-shadow: var(--shadow);\n  animation: slide .32s cubic-bezier(.2,.9,.3,1.1);\n}\n.toast.leaving { animation: out .2s ease forwards; }\n@keyframes slide { from { opacity: 0; transform: translateX(30px); } }\n@keyframes out { to { opacity: 0; transform: translateX(30px); } }\n.toast .app { width: 32px; height: 32px; border-radius: 8px; flex: none; display: grid; place-items: center; color: #fff; background: linear-gradient(135deg, #ff6b9a, #a259ff 55%, #3d8bff); }\n.toast .app svg { width: 18px; height: 18px; }\n.toast .app.err { background: linear-gradient(135deg, #ff6a5c, #ff3b30); }\n.toast .app.ok { background: linear-gradient(135deg, #5ee07a, #28c840); }\n.toast .txt { flex: 1; min-width: 0; }\n.toast .txt b { display: block; font-size: 13px; font-weight: 600; }\n.toast .txt p { margin: 1px 0 0; font-size: 12.5px; color: var(--text2); word-break: break-word; }\n.toast .acts { display: flex; gap: 6px; margin-top: 8px; }\n.toast .prog { height: 3px; border-radius: 99px; background: var(--track); overflow: hidden; margin-top: 8px; }\n.toast .prog i { display: block; height: 100%; width: 40%; background: var(--accent); border-radius: 99px; animation: indet 1.2s ease-in-out infinite; }\n@keyframes indet { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }\n.toast .x { opacity: 0; transition: opacity .15s; margin: -4px -4px 0 0; }\n.toast:hover .x { opacity: 1; }\n\n/* 미니 독 (노란 버튼으로 숨긴 창) */\n.dock { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; padding: 6px; border-radius: 16px; background: var(--win); -webkit-backdrop-filter: blur(30px) saturate(180%); backdrop-filter: blur(30px) saturate(180%); box-shadow: var(--shadow); pointer-events: auto; animation: pop .2s; }\n.dock button { border: 0; background: transparent; display: flex; align-items: center; gap: 8px; padding: 6px 12px 6px 6px; border-radius: 11px; cursor: default; font-size: 12.5px; font-weight: 500; }\n.dock button:hover { background: var(--hover); }\n.dock .app { width: 26px; height: 26px; border-radius: 7px; display: grid; place-items: center; color: #fff; background: linear-gradient(135deg, #ff6b9a, #a259ff 55%, #3d8bff); }\n.dock .app svg { width: 15px; height: 15px; }\n\n/* 라이트박스 */\n.lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.82); display: grid; place-items: center; pointer-events: auto; animation: fade .15s; cursor: zoom-out; }\n.lightbox img { max-width: 94vw; max-height: 94vh; border-radius: 6px; }\n\n/* ── 좁은 화면: 시트처럼 꽉 채움 ─────────────────── */\n@media (max-width: 760px) {\n  .win { inset: 0 !important; width: auto !important; height: auto !important; border-radius: 0; }\n  .studio .body { grid-template-columns: 1fr; grid-template-rows: minmax(220px, 42%) 1fr; }\n  .stage { border-right: 0; border-bottom: .5px solid var(--sep-strong); }\n  .settings .body { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }\n  .settings .side { border-right: 0; border-bottom: .5px solid var(--sep-strong); }\n  .settings .side .titlebar { display: none; }\n  .settings .nav { flex-direction: row; overflow-x: auto; padding: 8px; }\n  .settings .nav button { flex: none; }\n  .settings .pane { padding: 6px 14px 24px; }\n  .kv { grid-template-columns: 1fr; gap: 4px; }\n  .titlebar { padding: 0 10px; grid-template-columns: auto minmax(0, 1fr) auto; gap: 8px; }\n  .titlebar .title { text-align: left; }\n  .titlebar .title small { display: none; }\n  .titlebar .right .select { max-width: 116px; }\n  .lights { margin-right: 0; }\n  .slot-head .muted.tiny { display: none; }\n  .kbd { display: none; }\n  .inspector .content { padding: 12px 12px 20px; }\n}\n";

const PAGE_CSS = "/* ── Crack Painter · 채팅 화면에 붙는 요소 ───────────── */\n.cp-figure { position: relative; margin: 14px 0; max-width: 100%; display: flex; flex-direction: column; align-items: center; }\n.cp-figure .cp-img-wrap { position: relative; display: inline-block; max-width: 100%; border-radius: 10px; overflow: hidden; box-shadow: 0 0 0 .5px rgba(0,0,0,.12), 0 6px 22px rgba(0,0,0,.14); line-height: 0; }\n.cp-figure img { display: block; max-width: 100%; max-height: 78vh; height: auto; cursor: zoom-in; }\n.cp-figure .cp-bar {\n  position: absolute; left: 50%; bottom: 10px; transform: translate(-50%, 6px);\n  display: flex; align-items: center; gap: 2px; padding: 3px;\n  border-radius: 10px; line-height: 1;\n  background: rgba(30,30,32,.62); color: #fff;\n  -webkit-backdrop-filter: blur(20px) saturate(180%); backdrop-filter: blur(20px) saturate(180%);\n  box-shadow: 0 0 0 .5px rgba(255,255,255,.14), 0 4px 16px rgba(0,0,0,.25);\n  opacity: 0; transition: opacity .16s, transform .16s; white-space: nowrap;\n  font: 500 12px -apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Apple SD Gothic Neo\", Pretendard, system-ui, sans-serif;\n}\n.cp-figure:hover .cp-bar, .cp-figure:focus-within .cp-bar, .cp-figure.cp-touch .cp-bar { opacity: 1; transform: translate(-50%, 0); }\n.cp-figure .cp-bar button { all: unset; display: inline-flex; align-items: center; justify-content: center; min-width: 28px; height: 26px; padding: 0 4px; border-radius: 7px; cursor: pointer; color: #fff; }\n.cp-figure .cp-bar button:hover { background: rgba(255,255,255,.16); }\n.cp-figure .cp-bar button:disabled { opacity: .35; pointer-events: none; }\n.cp-figure .cp-bar svg { width: 15px; height: 15px; display: block; }\n.cp-figure .cp-bar .cp-count { padding: 0 4px; font-variant-numeric: tabular-nums; opacity: .9; font-size: 11.5px; }\n.cp-figure .cp-bar .cp-sep { width: .5px; height: 16px; background: rgba(255,255,255,.25); margin: 0 3px; }\n.cp-figure .cp-busy { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(0,0,0,.28); color: #fff; font: 600 12px -apple-system, system-ui, sans-serif; line-height: 1.4; }\n.cp-figure .cp-cap { margin-top: 6px; font: 11.5px -apple-system, BlinkMacSystemFont, \"Apple SD Gothic Neo\", Pretendard, system-ui, sans-serif; opacity: .55; text-align: center; }\nbody.cp-hidden .cp-figure, body.cp-hidden .cp-msg-btn { display: none !important; }\n\n.cp-msg-btn { all: unset; display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; color: currentColor; opacity: .62; transition: opacity .15s, background .15s; }\n.cp-msg-btn:hover { opacity: 1; background: rgba(127,127,127,.14); }\n.cp-msg-btn svg { width: 18px; height: 18px; display: block; }\n.cp-msg-btn.cp-running { opacity: 1; color: #0a84ff; animation: cp-pulse 1.2s ease-in-out infinite; }\n@keyframes cp-pulse { 50% { opacity: .45; } }\n";

// ===== core.js =====
// ─────────────────────────────────────────────────────────────
// Core: 프롬프트 레이어 모델 (DOM·네트워크 없음, Node 테스트 가능)
//
// NovelAI V4+ 요청은 두 갈래다.
//   base_caption  : 그림 전체에 적용 → 작가·화풍·퀄리티, 인원수, 구도·배경·조명
//   char_captions : 인물 한 명에게만 적용 → 외형·의상·자세·표정
// 이 모듈은 "어떤 태그가 어느 칸에 들어갈 수 있는가"를 규칙으로 고정한다.
// 사용자가 캐릭터 칸에 작가 태그를 넣어도, AI가 장면 칸에 머리색을 넣어도
// 전송 직전에 맞는 칸으로 옮기거나 빼고, 무엇을 했는지 notes로 알려준다.
// ─────────────────────────────────────────────────────────────
const Core = (() => {
    'use strict';

    const MODELS = Object.freeze({
        'nai-diffusion-5-full': Object.freeze({ id: 'nai-diffusion-5-full', family: 'v5', label: 'V5 Full', maxChars: 22, budget: 1471, shared: false, grid: false }),
        'nai-diffusion-5-curated': Object.freeze({ id: 'nai-diffusion-5-curated', family: 'v5', label: 'V5 Curated', maxChars: 22, budget: 703, shared: false, grid: false }),
        'nai-diffusion-4-5-full': Object.freeze({ id: 'nai-diffusion-4-5-full', family: 'v4.5', label: 'V4.5 Full', maxChars: 6, budget: 512, shared: true, grid: true }),
        'nai-diffusion-4-5-curated': Object.freeze({ id: 'nai-diffusion-4-5-curated', family: 'v4.5', label: 'V4.5 Curated', maxChars: 6, budget: 512, shared: true, grid: true })
    });
    const DEFAULT_MODEL = 'nai-diffusion-5-full';

    function model(id) {
        return MODELS[id] || MODELS[DEFAULT_MODEL];
    }

    // ── 태그 분해 ────────────────────────────────────────────
    // 최상위 쉼표에서만 자른다. `1.2::a, b::` 가중치 묶음과 {} [] () 안의 쉼표는 보존한다.
    function splitTags(input) {
        const s = String(input ?? '');
        const out = [];
        let buf = '';
        let depth = 0;
        let inWeight = false;
        for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            if (ch === ':' && s[i + 1] === ':') {
                // 여는 `N::` 인지 닫는 `::` 인지 판단
                if (!inWeight && /(^|[\s,])-?\d+(?:\.\d+)?$/.test(buf)) inWeight = true;
                else if (inWeight) inWeight = false;
                buf += '::';
                i++;
                continue;
            }
            if (ch === '{' || ch === '[' || ch === '(') depth++;
            else if ((ch === '}' || ch === ']' || ch === ')') && depth > 0) depth--;
            if ((ch === ',' || ch === '\n') && depth === 0 && !inWeight) {
                if (buf.trim()) out.push(buf.trim());
                buf = '';
                continue;
            }
            buf += ch;
        }
        if (buf.trim()) out.push(buf.trim());
        return out;
    }

    function joinTags(parts) {
        return parts.flat().map(p => String(p ?? '').trim()).filter(Boolean).join(', ');
    }

    // 비교용 정규화: 가중치·괄호·밑줄 제거, 소문자
    const PAIRS = { '{': '}', '[': ']', '(': ')' };
    function unwrap(s) {
        let t = s.trim();
        while (t.length >= 2 && PAIRS[t[0]] && t[t.length - 1] === PAIRS[t[0]]) t = t.slice(1, -1).trim();
        return t;
    }

    function tagKey(tag) {
        return unwrap(String(tag || '')
            .trim()
            .replace(/^-?\d+(?:\.\d+)?::\s*/, '')
            .replace(/\s*::$/, ''))
            .replace(/_/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function dedupe(tags) {
        const seen = new Set();
        const out = [];
        for (const t of tags) {
            const k = tagKey(t);
            if (!k || seen.has(k)) continue;
            seen.add(k);
            out.push(t);
        }
        return out;
    }

    // ── 분류 규칙 ────────────────────────────────────────────
    const QUALITY = new Set([
        'masterpiece', 'best quality', 'high quality', 'good quality', 'great quality', 'amazing quality', 'normal quality',
        'very aesthetic', 'aesthetic', 'absurdres', 'highres', 'incredibly absurdres', 'no text', 'very awa',
        'newest', 'recent', 'ultra detailed', 'extremely detailed', '8k', '4k', 'hdr'
    ]);
    const STYLE_EXACT = new Set([
        'traditional media', 'digital media', 'official art', 'game cg', 'anime coloring', 'anime screencap',
        'realistic', 'photorealistic', 'semi-realistic', 'lineart', 'flat color', 'cel shading', 'oekaki',
        'watercolor', 'oil painting', 'impasto', 'pixel art', 'chibi'
    ]);
    const COUNT_RE = /^(?:(?:\d+|6\+)(?:girls?|boys?|others?)|solo|solo focus|multiple girls|multiple boys|multiple others|no humans|\d+people)$/;

    const HAIR_COLOR = '(?:light |dark |pale |bright )?(?:black|brown|blonde|blond|red|white|silver|grey|gray|pink|blue|green|purple|orange|aqua|yellow|multicolored|two-tone|gradient|streaked)';
    const APPEARANCE_RES = [
        new RegExp(`^${HAIR_COLOR} hair$`),
        new RegExp(`^${HAIR_COLOR} eyes$`),
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

    function classify(tag) {
        const k = tagKey(tag);
        if (!k) return 'empty';
        if (/^artist:/.test(k) || /\(artist\)$/.test(k) || /^by [a-z0-9]/.test(k)) return 'style';
        if (/^(?:year )?\d{4}s?$/.test(k) || /^year \d{4}$/.test(k)) return 'style';
        if (/\((?:style|medium)\)$/.test(k) || /(?:^| )style$/.test(k) || STYLE_EXACT.has(k)) return 'style';
        if (QUALITY.has(k)) return 'quality';
        if (COUNT_RE.test(k)) return 'count';
        if (APPEARANCE_RES.some(re => re.test(k))) return 'appearance';
        return 'other';
    }

    // 캐릭터 칸의 인원수 태그는 NAI 권장대로 girl/boy/other 로 바꾼다.
    function countToSubject(tag) {
        const k = tagKey(tag);
        if (/^(?:\d+|6\+)girls?$/.test(k)) return 'girl';
        if (/^(?:\d+|6\+)boys?$/.test(k)) return 'boy';
        if (/^(?:\d+|6\+)others?$/.test(k)) return 'other';
        return '';
    }

    function detectSubject(tags) {
        const keys = splitTags(tags).map(tagKey);
        if (keys.some(k => /^(?:1boy|boy|male|man|bishounen|old man)$/.test(k))) return 'boy';
        if (keys.some(k => /^(?:1girl|girl|female|woman|old woman)$/.test(k))) return 'girl';
        return 'other';
    }

    function countTag(subjects) {
        if (!subjects.length) return '';
        const n = { boy: 0, girl: 0, other: 0 };
        subjects.forEach(s => { n[s] = (n[s] || 0) + 1; });
        const part = (c, one, many) => c === 0 ? '' : c === 1 ? one : c > 5 ? `6+${many}` : `${c}${many}`;
        const parts = [part(n.girl, '1girl', 'girls'), part(n.boy, '1boy', 'boys'), part(n.other, '1other', 'others')].filter(Boolean);
        return parts.join(', ');
    }

    function escapeRe(s) {
        return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // AI가 만든 텍스트에서 저장된 인물 이름을 뺀다 (NAI는 이름을 엉뚱한 인물로 해석함)
    function stripNames(text, names) {
        let out = String(text || '');
        for (const raw of names) {
            const name = String(raw || '').trim();
            if (name.length < 2) continue;
            if (/^[A-Za-z0-9 _-]+$/.test(name)) {
                out = out.replace(new RegExp(`(^|[^A-Za-z0-9_])${escapeRe(name)}(?=$|[^A-Za-z0-9_])`, 'gi'), '$1');
            } else {
                out = out.replace(new RegExp(escapeRe(name), 'g'), '');
            }
        }
        return out.replace(/\s*,\s*(,\s*)+/g, ', ').replace(/^[\s,]+|[\s,]+$/g, '').replace(/ {2,}/g, ' ');
    }

    // ── 토큰 추정 (T5 근사) ──────────────────────────────────
    function estimateTokens(text) {
        const s = String(text || '').trim();
        if (!s) return 0;
        let n = 0;
        for (const part of s.split(',')) {
            const p = part.trim();
            if (!p) continue;
            const words = p.split(/[\s_\-()[\]{}:.|]+/).filter(Boolean).length;
            n += Math.max(1, Math.round(words * 1.3)) + 1;
        }
        return n;
    }

    // ── 상태 → 전송 프롬프트 조립 ─────────────────────────────
    //
    // state = {
    //   style:  { pos, neg }                     사용자 고정 (작가·화풍·퀄리티)
    //   scene:  { tags, caption, count }         AI 장면 (count 비우면 자동)
    //   chars:  [{ id, name, aliases, look, action, caption, uc, position, enabled, source }]
    //   neg:    ''                               장면별 추가 네거티브
    // }
    function assemble(state, modelId) {
        const cap = model(modelId);
        const isV5 = cap.family === 'v5';
        const notes = [];
        const st = state || {};
        const style = st.style || {};
        const scene = st.scene || {};

        const allChars = (st.chars || []).filter(c => c && c.enabled !== false);
        if (allChars.length > cap.maxChars) {
            notes.push({ level: 'warn', text: `${cap.label}는 캐릭터 칸이 최대 ${cap.maxChars}개라서 ${allChars.length - cap.maxChars}명은 빠졌어.` });
        }
        const chars = allChars.slice(0, cap.maxChars);
        const names = (st.chars || []).flatMap(c => [c.name, ...(c.aliases || [])]).filter(Boolean);

        const movedStyle = [];
        const subjects = [];

        const outChars = chars.map((c, index) => {
            const label = c.name || `인물 ${index + 1}`;
            // 사용자 외형 칸: 작가·퀄리티 태그는 베이스로 올리고, 인원수 태그는 girl/boy 로
            const look = [];
            let movedHere = 0;
            for (const t of splitTags(c.look)) {
                const kind = classify(t);
                if (kind === 'style' || kind === 'quality') { movedStyle.push(t); movedHere++; continue; }
                if (kind === 'count') { const subj = countToSubject(t); if (subj) look.push(subj); continue; }
                look.push(t);
            }
            if (movedHere) notes.push({ level: 'info', text: `'${label}' 외형 칸의 작가·화풍 태그 ${movedHere}개를 베이스로 옮겼어.` });

            // AI 행동 칸: 작가·퀄리티·인원수는 버리고 이름은 지운다
            const action = splitTags(stripNames(c.action, names)).filter(t => {
                const kind = classify(t);
                return kind !== 'style' && kind !== 'quality' && kind !== 'count';
            });
            const caption = isV5 ? stripNames(c.caption, names).trim() : '';

            subjects.push(detectSubject(joinTags(look)));
            const prompt = joinTags(dedupe([...look, ...action, ...(caption ? [caption] : [])]));
            return {
                id: c.id || `c${index}`,
                name: label,
                prompt,
                uc: joinTags(dedupe(splitTags(c.uc))),
                center: positionToCenter(c.position, index, chars.length, cap.grid),
                tokens: estimateTokens(prompt)
            };
        }).filter(c => c.prompt);

        // 장면 태그: 작가·퀄리티·인원수 제거, 캐릭터 칸이 있으면 외형 태그도 제거 (다른 인물로 번짐)
        let droppedAppearance = 0;
        const sceneTags = splitTags(stripNames(scene.tags, names)).filter(t => {
            const kind = classify(t);
            if (kind === 'style' || kind === 'quality' || kind === 'count') return false;
            if (kind === 'appearance' && outChars.length) { droppedAppearance++; return false; }
            return true;
        });
        if (droppedAppearance) notes.push({ level: 'info', text: `장면 칸의 머리색·눈색 같은 외형 태그 ${droppedAppearance}개는 캐릭터 칸이 맡으니까 뺐어.` });
        const sceneCaption = isV5 ? stripNames(scene.caption, names).trim() : '';

        const count = String(scene.count || '').trim() || (outChars.length === 1 ? `${countTag(subjects)}, solo` : outChars.length ? countTag(subjects) : '');

        const styleTags = dedupe([...splitTags(style.pos), ...movedStyle]);
        const baseTags = dedupe([...styleTags, ...splitTags(count), ...sceneTags]);
        const base = joinTags([...baseTags, ...(sceneCaption ? [sceneCaption] : [])]);
        const baseNeg = joinTags(dedupe([...splitTags(style.neg), ...splitTags(st.neg)]));

        // 칸별 토큰
        const parts = {
            style: estimateTokens(joinTags(styleTags)),
            scene: estimateTokens(joinTags([count, ...sceneTags, sceneCaption])),
            chars: outChars.map(c => ({ name: c.name, tokens: c.tokens }))
        };
        const baseTokens = estimateTokens(base);
        const charTokens = outChars.reduce((a, c) => a + c.tokens, 0);
        const used = cap.shared ? baseTokens + charTokens : baseTokens;
        const budget = { shared: cap.shared, limit: cap.budget, used, base: baseTokens, chars: charTokens, parts, over: used > cap.budget };
        if (budget.over) {
            notes.push({
                level: 'warn',
                text: cap.shared
                    ? `${cap.label}는 베이스와 캐릭터 칸이 ${cap.budget}토큰을 나눠 써. 지금 약 ${used}토큰이라 뒤쪽 태그가 잘릴 수 있어.`
                    : `베이스가 약 ${used}/${cap.budget}토큰이라 뒤쪽이 잘릴 수 있어.`
            });
        }

        return { model: cap.id, family: cap.family, base, baseNeg, count, chars: outChars, budget, notes };
    }

    // left/center/right 또는 {x,y} → NAI center. V4.5는 0.1 격자(5x5 셀 중심)에 맞춘다.
    function positionToCenter(position, index, total, grid) {
        let x;
        let y = 0.5;
        if (position && typeof position === 'object' && Number.isFinite(+position.x)) {
            x = +position.x;
            y = Number.isFinite(+position.y) ? +position.y : 0.5;
        } else {
            const p = String(position || '').toLowerCase();
            if (p === 'left') x = 0.3;
            else if (p === 'right') x = 0.7;
            else if (p === 'center') x = 0.5;
            else x = total <= 1 ? 0.5 : 0.2 + (0.6 * index) / (total - 1);
        }
        x = Math.min(0.9, Math.max(0.1, x));
        y = Math.min(0.9, Math.max(0.1, y));
        if (grid) {
            const snap = v => Math.round((Math.round((v - 0.1) / 0.2) * 0.2 + 0.1) * 10) / 10;
            x = snap(x);
            y = snap(y);
        }
        return { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 };
    }

    // ── AI 장면 계획 → 상태 ──────────────────────────────────
    // characters: 저장된 캐릭터 목록 [{id,name,aliases,look,outfit,uc}]
    function planToState(plan, characters, style) {
        const p = plan && typeof plan === 'object' ? plan : {};
        const lib = Array.isArray(characters) ? characters : [];
        const keyOf = s => String(s || '').normalize('NFKC').replace(/\s+/g, '').toLowerCase();
        const findChar = item => {
            const id = String(item?.id || '').trim();
            if (id) {
                const byId = lib.find(c => c.id === id);
                if (byId) return byId;
            }
            const k = keyOf(item?.name);
            if (!k) return null;
            return lib.find(c => keyOf(c.name) === k || (c.aliases || []).some(a => keyOf(a) === k)) || null;
        };

        const chars = [];
        const used = new Set();
        for (const item of Array.isArray(p.characters) ? p.characters : []) {
            const saved = findChar(item);
            if (saved) {
                if (used.has(saved.id)) continue;
                used.add(saved.id);
                chars.push({
                    id: saved.id,
                    source: 'saved',
                    name: saved.name,
                    aliases: saved.aliases || [],
                    look: applyOutfit(saved, item?.outfit),
                    action: flat(item?.tags),
                    caption: flat(item?.caption),
                    uc: saved.uc || '',
                    position: item?.position || null,
                    enabled: true
                });
            } else if (flat(item?.look || item?.appearance)) {
                // 저장되지 않은 인물: AI가 준 외형을 그대로 씀
                chars.push({
                    id: `extra${chars.length}`,
                    source: 'extra',
                    name: String(item?.name || '').trim() || `엑스트라 ${chars.length + 1}`,
                    aliases: [],
                    look: flat(item?.look || item?.appearance),
                    action: flat(item?.tags),
                    caption: flat(item?.caption),
                    uc: '',
                    position: item?.position || null,
                    enabled: true
                });
            }
        }

        const para = Number.parseInt(p.insertAfterParagraph, 10);
        return {
            title: String(p.title || p.sceneTitle || '').trim().slice(0, 80),
            moment: String(p.moment || '').trim(),
            paragraph: Number.isFinite(para) && para >= 0 ? para : 0,
            style: { pos: style?.pos || '', neg: style?.neg || '' },
            scene: {
                tags: joinTags([flat(p.scene?.composition), flat(p.scene?.tags)]),
                caption: flat(p.scene?.caption),
                count: ''
            },
            chars,
            neg: ''
        };
    }

    // AI가 채운 칸(장면 태그, 인물 행동)에서 그 칸에 올 수 없는 태그를 미리 뺀다.
    // 그래서 스튜디오 입력칸에 보이는 내용 = 실제로 보내는 내용이 된다.
    function sanitizeAi(state) {
        const names = (state.chars || []).flatMap(c => [c.name, ...(c.aliases || [])]).filter(Boolean);
        const keep = (text, dropAppearance) => joinTags(dedupe(splitTags(stripNames(text, names)).filter(t => {
            const kind = classify(t);
            if (kind === 'style' || kind === 'quality' || kind === 'count') return false;
            return !(dropAppearance && kind === 'appearance');
        })));
        const hasChars = (state.chars || []).length > 0;
        state.scene.tags = keep(state.scene.tags, hasChars);
        state.scene.caption = stripNames(state.scene.caption, names);
        for (const c of state.chars || []) {
            c.action = keep(c.action, false);
            c.caption = stripNames(c.caption, names);
            if (c.source === 'extra') c.look = joinTags(splitTags(c.look).filter(t => !['style', 'quality'].includes(classify(t))));
        }
        return state;
    }

    function applyOutfit(saved, outfit) {
        const look = saved.look || '';
        const base = saved.outfit || '';
        const mode = String(outfit?.mode || 'keep').toLowerCase();
        const add = flat(outfit?.add);
        if (mode === 'replace' && add) return joinTags([look, add]);
        if (mode === 'modify') {
            const remove = new Set(splitTags(outfit?.remove).map(tagKey));
            const kept = splitTags(base).filter(t => !remove.has(tagKey(t)));
            return joinTags([look, ...kept, add]);
        }
        return joinTags([look, base]);
    }

    function flat(v) {
        if (v == null) return '';
        if (Array.isArray(v)) return joinTags(v.map(flat));
        if (typeof v === 'object') return joinTags(Object.values(v).map(flat));
        return String(v).trim();
    }

    // ── 응답 JSON 느슨하게 파싱 ──────────────────────────────
    function parseJsonLoose(text) {
        const raw = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
        try {
            return JSON.parse(raw);
        } catch (_) {
            const a = raw.indexOf('{');
            const b = raw.lastIndexOf('}');
            if (a >= 0 && b > a) return JSON.parse(raw.slice(a, b + 1));
            throw new Error('분석 응답에서 JSON을 찾지 못했어.');
        }
    }

    return {
        MODELS, DEFAULT_MODEL, model,
        splitTags, joinTags, tagKey, dedupe, classify, detectSubject, countTag, stripNames,
        estimateTokens, assemble, positionToCenter, planToState, sanitizeAi, applyOutfit, parseJsonLoose
    };
})();


// ===== nai.js =====
// ─────────────────────────────────────────────────────────────
// NAI: 요청 본문 생성(순수 함수) + 전송 + 응답에서 이미지 꺼내기
// 필드 구성은 NovelAI 웹판 요청(V5 params_version 4 / V4.5 params_version 3)과 같다.
// ─────────────────────────────────────────────────────────────
const NAI = (() => {
    'use strict';

    const UC_PRESETS = Object.freeze({
        v5: {
            0: 'lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page',
            1: 'lowres, bad hands, bad anatomy, artistic error, sepia, white haze, worst quality, very displeasing, jpeg artifacts, 0::ai-generated::',
            3: 'lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, @_@, mismatched pupils, glowing eyes, bad anatomy',
            4: '{worst quality}, distracting watermark, unfinished, bad quality, {widescreen}, upscale, {sequence}, {{grandfathered content}}, blurred foreground, chromatic aberration, sketch, everyone, [sketch background], simple, [flat colors], ych (character), outline, multiple scenes, [[horror (theme)]], comic'
        },
        'v4.5-full': {
            0: 'lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page',
            1: 'lowres, artistic error, scan artifacts, worst quality, bad quality, jpeg artifacts, multiple views, very displeasing, too many watermarks, negative space, blank page',
            3: 'lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, @_@, mismatched pupils, glowing eyes, bad anatomy',
            4: '{worst quality}, distracting watermark, unfinished, bad quality, {widescreen}, upscale, {sequence}, {{grandfathered content}}, blurred foreground, chromatic aberration, sketch, everyone, [sketch background], simple, [flat colors], ych (character), outline, multiple scenes, [[horror (theme)]], comic'
        },
        'v4.5-curated': {
            0: 'blurry, lowres, upscaled, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, negative space, blank page',
            1: 'blurry, lowres, upscaled, artistic error, scan artifacts, jpeg artifacts, logo, too many watermarks, negative space, blank page',
            3: 'blurry, lowres, upscaled, artistic error, film grain, scan artifacts, bad anatomy, bad hands, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, @_@, mismatched pupils, glowing eyes, negative space, blank page'
        }
    });
    const UC_LABELS = Object.freeze({ 0: 'Heavy', 1: 'Light', 3: 'Human Focus', 4: 'Furry Focus', 2: 'None' });
    const V5_UC_ID = Object.freeze({ 0: 'heavy', 1: 'light', 2: 'none', 3: 'human', 4: 'furry' });
    const V5_UC_HINT = Object.freeze({ 2: 0, 1: 1, 0: 2, 3: 3, 4: 4 });
    const V5_QUALITY = Object.freeze({ none: '', light: 'very aesthetic, amazing quality, no text', standard: 'very aesthetic, masterpiece, no text' });

    const SIZES = Object.freeze({
        portrait: { w: 832, h: 1216, label: '세로' },
        landscape: { w: 1216, h: 832, label: '가로' },
        square: { w: 1024, h: 1024, label: '정사각' }
    });

    const DEFAULT_GEN = Object.freeze({
        size: 'portrait',
        steps: 28,
        scaleV5: 5,
        scaleV45: 6,
        rescaleV5: 0,
        rescaleV45: 0,
        sampler: 'k_euler_ancestral',
        noise: 'karras',
        seed: '',
        ucPreset: 0,
        qualityV45: true,
        qualityV5: 'standard',
        useCoords: false
    });

    function ucTable(modelId) {
        const cap = Core.model(modelId);
        if (cap.family === 'v5') return UC_PRESETS.v5;
        return /curated/.test(cap.id) ? UC_PRESETS['v4.5-curated'] : UC_PRESETS['v4.5-full'];
    }

    function ucPresetFor(modelId, preset) {
        const p = Number(preset);
        const table = ucTable(modelId);
        if (p === 2) return 2;
        return table[p] ? p : 0;
    }

    function mergeNegative(neg, modelId, preset) {
        const p = ucPresetFor(modelId, preset);
        const presetTags = p === 2 ? '' : ucTable(modelId)[p] || '';
        return Core.joinTags(Core.dedupe([...Core.splitTags(presetTags), ...Core.splitTags(neg)]));
    }

    // assembled: Core.assemble() 결과
    function buildPayload(assembled, gen, seed) {
        const g = { ...DEFAULT_GEN, ...(gen || {}) };
        const cap = Core.model(assembled.model);
        const size = SIZES[g.size] || SIZES.portrait;
        const chars = assembled.chars || [];
        const useCoords = !!g.useCoords && chars.length >= 2;
        const negative = mergeNegative(assembled.baseNeg, cap.id, g.ucPreset);
        const charCaptions = chars.map(c => ({ char_caption: c.prompt, centers: [c.center] }));
        const charNegCaptions = chars.map(c => ({ char_caption: c.uc || '', centers: [c.center] }));

        if (cap.family === 'v5') {
            const quality = V5_QUALITY[g.qualityV5] ?? V5_QUALITY.standard;
            const base = Core.joinTags([assembled.base, quality]);
            return {
                input: base,
                model: cap.id,
                action: 'generate',
                parameters: {
                    params_version: 4,
                    width: size.w,
                    height: size.h,
                    scale: Number(g.scaleV5),
                    sampler: g.sampler,
                    steps: Number(g.steps),
                    seed,
                    n_samples: 1,
                    ucPresetId: V5_UC_ID[ucPresetFor(cap.id, g.ucPreset)] || 'heavy',
                    qualityPresetId: 'none',
                    autoSmea: false,
                    dynamic_thresholding: false,
                    controlnet_strength: 1,
                    legacy: false,
                    add_original_image: true,
                    cfg_rescale: Number(g.rescaleV5),
                    legacy_v3_extend: false,
                    use_coords: useCoords,
                    legacy_uc: false,
                    normalize_reference_strength_multiple: true,
                    inpaintImg2ImgStrength: 1,
                    characterPrompts: [],
                    straight_alpha: true,
                    tag_hint_qt: quality ? 1 : 0,
                    tag_hint_uc_preset: V5_UC_HINT[ucPresetFor(cap.id, g.ucPreset)] ?? 2,
                    v4_prompt: { caption: { base_caption: base, char_captions: charCaptions }, use_coords: useCoords, use_order: true },
                    v4_negative_prompt: { caption: { base_caption: negative, char_captions: charNegCaptions }, legacy_uc: false },
                    negative_prompt: negative,
                    deliberate_euler_ancestral_bug: false,
                    prefer_brownian: true,
                    noise_schedule: g.noise,
                    image_format: 'png',
                    stream: 'msgpack'
                },
                use_new_shared_trial: true
            };
        }

        return {
            input: assembled.base,
            model: cap.id,
            action: 'generate',
            parameters: {
                params_version: 3,
                width: size.w,
                height: size.h,
                scale: Number(g.scaleV45),
                cfg_rescale: Number(g.rescaleV45),
                sampler: g.sampler,
                steps: Number(g.steps),
                n_samples: 1,
                seed,
                noise_schedule: g.noise,
                negative_prompt: negative,
                uc: negative,
                ucPreset: ucPresetFor(cap.id, g.ucPreset),
                qualityToggle: g.qualityV45 !== false,
                sm: false,
                sm_dyn: false,
                dynamic_thresholding: false,
                controlnet_strength: 1,
                legacy: false,
                legacy_v3_extend: false,
                add_original_image: false,
                uncond_scale: 1,
                deliberate_euler_ancestral_bug: false,
                prefer_brownian: true,
                reference_information_extracted_multiple: [],
                reference_strength_multiple: [],
                v4_prompt: { caption: { base_caption: assembled.base, char_captions: charCaptions }, use_coords: useCoords, use_order: true, legacy_uc: false },
                v4_negative_prompt: { caption: { base_caption: negative, char_captions: charNegCaptions }, use_coords: useCoords, use_order: true, legacy_uc: false }
            }
        };
    }

    function randomSeed() {
        return Math.floor(Math.random() * 4294967295);
    }

    // ── 응답 해석 ────────────────────────────────────────────
    function signature(b) {
        if (!b || !b.length) return 'empty';
        if (b[0] === 0x50 && b[1] === 0x4B && b[2] === 0x03 && b[3] === 0x04) return 'zip';
        if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return 'png';
        if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'jpeg';
        if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) return 'webp';
        const head = new TextDecoder().decode(b.slice(0, 200)).trim();
        if (head.startsWith('{') || head.startsWith('[') || head.startsWith('<')) return 'text';
        return 'unknown';
    }

    function find(b, sig, from) {
        outer: for (let i = from; i <= b.length - sig.length; i++) {
            for (let j = 0; j < sig.length; j++) if (b[i + j] !== sig[j]) continue outer;
            return i;
        }
        return -1;
    }

    function u32be(b, o) {
        return ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
    }

    // V5 msgpack 스트림: 중간 미리보기(JPEG) 뒤에 최종 PNG가 들어 있다. PNG를 먼저 찾는다.
    function carvePng(b) {
        const sig = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        let from = 0;
        let last = null;
        while (from < b.length) {
            const start = find(b, sig, from);
            if (start < 0) break;
            let o = start + 8;
            let end = -1;
            while (o + 12 <= b.length) {
                const len = u32be(b, o);
                if (len > b.length - o - 12) break;
                const isEnd = b[o + 4] === 0x49 && b[o + 5] === 0x45 && b[o + 6] === 0x4E && b[o + 7] === 0x44;
                o += 12 + len;
                if (isEnd) { end = o; break; }
            }
            if (end > 0) last = b.slice(start, end);
            from = start + 1;
        }
        return last;
    }

    function carveJpeg(b) {
        const start = find(b, [0xFF, 0xD8, 0xFF], 0);
        if (start < 0) return null;
        for (let i = b.length - 2; i > start; i--) if (b[i] === 0xFF && b[i + 1] === 0xD9) return b.slice(start, i + 2);
        return null;
    }

    function errorText(b) {
        try {
            const t = new TextDecoder().decode(b.slice(0, 4000)).trim();
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

    function extractImage(arrayBuffer) {
        const b = new Uint8Array(arrayBuffer);
        const kind = signature(b);
        if (kind === 'png') return new Blob([b], { type: 'image/png' });
        if (kind === 'jpeg') return new Blob([b], { type: 'image/jpeg' });
        if (kind === 'webp') return new Blob([b], { type: 'image/webp' });
        if (kind === 'zip') {
            const files = (typeof fflate !== 'undefined' ? fflate : window.fflate).unzipSync(b);
            const entry = Object.entries(files).find(([n]) => /\.(png|jpe?g|webp)$/i.test(n));
            if (!entry) throw new Error(errorText(Object.values(files)[0] || new Uint8Array()) || 'NAI 응답 압축 안에 이미지가 없어.');
            const mime = /\.webp$/i.test(entry[0]) ? 'image/webp' : /\.jpe?g$/i.test(entry[0]) ? 'image/jpeg' : 'image/png';
            return new Blob([entry[1]], { type: mime });
        }
        if (kind === 'unknown') {
            const png = carvePng(b);
            if (png) return new Blob([png], { type: 'image/png' });
            const jpg = carveJpeg(b);
            if (jpg) return new Blob([jpg], { type: 'image/jpeg' });
        }
        throw new Error(errorText(b) || 'NAI 응답에서 이미지를 찾지 못했어.');
    }

    async function generate({ assembled, gen, apiKey, seed, signal }) {
        if (!apiKey) throw Object.assign(new Error('NovelAI 키가 없어. 설정 → 연결에서 넣어줘.'), { code: 'NO_KEY', pane: 'api' });
        const useSeed = seed === '' || seed == null || !Number.isFinite(Number(seed)) ? randomSeed() : Number(seed);
        const payload = buildPayload(assembled, gen, useSeed);
        validate(payload);
        const isV5 = assembled.family === 'v5';
        let data = payload;
        if (isV5) {
            data = new FormData();
            data.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }), 'blob');
        }
        const buffer = await Net.request({
            method: 'POST',
            url: 'https://image.novelai.net/ai/generate-image',
            onError: err => { err.diag = diagnose(payload, assembled); },
            headers: isV5 ? { Authorization: `Bearer ${apiKey}` } : { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            data,
            raw: isV5,
            responseType: 'arraybuffer',
            timeout: 180000,
            signal
        });
        return { blob: extractImage(buffer), seed: useSeed, payload };
    }

    // 서버가 400으로 거부할 값을 미리 잡는다
    function validate(payload) {
        const p = payload.parameters;
        const bad = [];
        if (!Number.isInteger(p.steps) || p.steps < 1 || p.steps > 50) bad.push(`스텝 ${p.steps} (1~50)`);
        if (!Number.isFinite(p.scale) || p.scale < 0 || p.scale > 10) bad.push(`Guidance ${p.scale} (0~10)`);
        if (!Number.isFinite(p.cfg_rescale) || p.cfg_rescale < 0 || p.cfg_rescale > 1) bad.push(`Rescale ${p.cfg_rescale} (0~1)`);
        if (p.width % 64 || p.height % 64) bad.push(`크기 ${p.width}×${p.height}`);
        if (!String(payload.input || '').trim()) bad.push('베이스 프롬프트가 비어 있음');
        if (bad.length) throw Object.assign(new Error(`생성 옵션 값이 잘못됐어: ${bad.join(', ')}. 설정 → 생성 옵션에서 고쳐줘.`), { pane: 'gen' });
    }

    function diagnose(payload, assembled) {
        const p = payload.parameters;
        const caps = p.v4_prompt.caption;
        return [
            `model: ${payload.model} (params_version ${p.params_version})`,
            `size: ${p.width}x${p.height} · steps ${p.steps} · scale ${p.scale} · rescale ${p.cfg_rescale} · ${p.sampler}/${p.noise_schedule}`,
            `uc preset: ${p.ucPresetId ?? p.ucPreset} · coords: ${p.v4_prompt.use_coords} · characters: ${caps.char_captions.length}`,
            `tokens(추정): base ${assembled.budget.base} · chars ${assembled.budget.chars} / ${assembled.budget.limit}`,
            '',
            `[base_caption] ${caps.base_caption}`,
            ...caps.char_captions.map((c, i) => `[char ${i}] (${c.centers[0].x},${c.centers[0].y}) ${c.char_caption}`),
            `[negative] ${p.negative_prompt}`
        ].join('\n');
    }

    return { SIZES, DEFAULT_GEN, UC_LABELS, V5_QUALITY, ucTable, ucPresetFor, mergeNegative, buildPayload, extractImage, generate, randomSeed };
})();


// ===== store.js =====
// ─────────────────────────────────────────────────────────────
// Net: GM_xmlhttpRequest 래퍼
// Store: 설정·키(GM 저장소) + 이미지·기록(IndexedDB)
//
// 키를 "매번 다시 입력하라"던 원래 문제는 탭마다 낡은 캐시를 들고 있다가
// 저장할 때 통째로 덮어써서 생겼다. 여기서는 캐시를 두지 않는다:
//   읽기 = 매번 GM 저장소에서 새로
//   쓰기 = 새로 읽고 → 바꾼 필드만 고치고 → 저장
// ─────────────────────────────────────────────────────────────
const Net = (() => {
    'use strict';

    function serviceOf(url) {
        const h = String(url || '');
        if (/novelai\.net/.test(h)) return 'NovelAI';
        if (/googleapis\.com/.test(h)) return 'Gemini';
        if (/deepseek\.com/.test(h)) return 'DeepSeek';
        return '서버';
    }

    // 서비스별로 흔한 원인을 사람 말로 바꾼다. pane 이 있으면 알림에 "설정 열기" 버튼이 붙는다.
    function explain(service, status, detail) {
        const d = String(detail || '');
        if (service === 'Gemini' && (/API key not valid|API_KEY_INVALID|api key/i.test(d) || status === 403)) {
            return { text: 'Gemini 키가 올바르지 않아. NovelAI 토큰(pst-…)이 아니라 Google AI Studio에서 받은 AIza… 키를 넣어야 해.', pane: 'api' };
        }
        if (service === 'DeepSeek' && status === 401) return { text: 'DeepSeek 키가 올바르지 않아.', pane: 'api' };
        if (service === 'NovelAI' && status === 401) return { text: 'NovelAI 토큰이 틀렸거나 만료됐어. NovelAI 설정에서 새 토큰을 받아 넣어줘.', pane: 'api' };
        if (service === 'NovelAI' && status === 402) return { text: 'NovelAI 구독이 없거나 Anlas가 부족해.', pane: null };
        if (service === 'NovelAI' && status === 400) return { text: `NovelAI가 요청 내용을 거부했어. 토큰 문제는 아니야(토큰이 틀리면 401이 떠).${d ? ` 서버 메시지: ${d}` : ''}`, pane: null };
        return null;
    }

    function httpMessage(status, text) {
        let detail = '';
        try {
            const j = JSON.parse(text);
            detail = j?.error?.message || j?.message || (typeof j?.error === 'string' ? j.error : '');
        } catch (_) {
            detail = String(text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
        }
        const hint = {
            400: '요청 형식 오류',
            401: '키가 틀렸거나 만료됐어',
            402: 'Anlas(결제 잔액)가 부족해',
            403: '권한이 없어',
            404: '주소나 모델을 찾지 못했어',
            409: '이미 다른 생성이 진행 중이야',
            429: '요청이 너무 잦아 · 잠깐 뒤에 다시',
            500: '서버 오류',
            503: '서버가 바빠'
        }[status] || '요청 실패';
        return `${hint} (HTTP ${status})${detail ? ` · ${detail}` : ''}`;
    }

    function extractDetail(text) {
        try {
            const j = JSON.parse(text);
            return j?.error?.message || j?.message || (typeof j?.error === 'string' ? j.error : '') || '';
        } catch (_) {
            return String(text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
        }
    }

    function bytesToText(buf) {
        try { return new TextDecoder().decode(new Uint8Array(buf).slice(0, 4000)); } catch (_) { return ''; }
    }

    function request({ method = 'GET', url, headers = {}, data, raw = false, responseType = 'text', timeout = 120000, signal, onError }) {
        return new Promise((resolve, reject) => {
            if (signal?.aborted) return reject(abortError());
            let done = false;
            const finish = (fn, v) => { if (done) return; done = true; signal?.removeEventListener?.('abort', onAbort); fn(v); };
            const onAbort = () => { try { req?.abort?.(); } catch (_) {} finish(reject, abortError()); };
            signal?.addEventListener?.('abort', onAbort, { once: true });
            const req = GM_xmlhttpRequest({
                method, url, headers, timeout, responseType,
                data: data == null ? undefined : (raw ? data : JSON.stringify(data)),
                onload: res => {
                    if (res.status < 200 || res.status >= 300) {
                        const text = typeof res.responseText === 'string' && res.responseText ? res.responseText
                            : res.response instanceof ArrayBuffer ? bytesToText(res.response) : String(res.response || '');
                        const service = serviceOf(url);
                        const detail = extractDetail(text);
                        const ex = explain(service, res.status, detail);
                        const err = new Error(ex ? ex.text : `${service}: ${httpMessage(res.status, text)}`);
                        err.status = res.status;
                        err.service = service;
                        err.body = text;
                        if (ex?.pane) err.pane = ex.pane;
                        try { onError?.(err); } catch (_) {}
                        return finish(reject, err);
                    }
                    if (responseType === 'arraybuffer') return finish(resolve, res.response);
                    try { finish(resolve, JSON.parse(res.responseText)); } catch (e) { finish(reject, new Error('응답을 JSON으로 읽지 못했어.')); }
                },
                onerror: () => finish(reject, new Error('네트워크 오류 · 연결이나 확장 프로그램의 도메인 허용을 확인해줘.')),
                ontimeout: () => finish(reject, new Error('응답 시간이 초과됐어.')),
                onabort: () => finish(reject, abortError())
            });
        });
    }

    function abortError() {
        const e = new Error('취소했어.');
        e.name = 'AbortError';
        return e;
    }

    return { request, abortError };
})();

const Store = (() => {
    'use strict';

    const SETTINGS_KEY = 'cp_settings_v1';
    const SECRETS_KEY = 'cp_secrets_v1';
    const SECRET_FIELDS = ['naiKey', 'geminiKey', 'deepseekKey'];

    const listeners = new Set();
    function on(fn) { listeners.add(fn); return () => listeners.delete(fn); }
    function emit(kind, remote = false) { listeners.forEach(fn => { try { fn(kind, remote); } catch (e) { console.error(e); } }); }

    function readJson(key) {
        try {
            const raw = GM_getValue(key, null);
            if (raw == null) return {};
            const v = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return v && typeof v === 'object' ? v : {};
        } catch (e) {
            console.warn('[Crack Painter] 저장값 읽기 실패', key, e);
            return {};
        }
    }

    function writeJson(key, value) {
        GM_setValue(key, JSON.stringify(value));
    }

    function defaults() {
        return {
            v: 1,
            analyzer: { provider: 'gemini', geminiModel: 'gemini-3.7-flash', deepseekModel: 'deepseek-v4-flash', thinking: 'auto' },
            model: Core.DEFAULT_MODEL,
            gen: { ...NAI.DEFAULT_GEN },
            style: { pos: '', neg: '' },
            presets: [],
            characters: [],
            rooms: {},
            ui: { contextTurns: 4 },
            scene: { people: 'auto' },
            folder: { enabled: false, perRoom: true, download: false }
        };
    }

    function normalize(s) {
        const d = defaults();
        const out = { ...d, ...s };
        out.analyzer = { ...d.analyzer, ...(s.analyzer || {}) };
        out.gen = { ...d.gen, ...(s.gen || {}) };
        out.style = { ...d.style, ...(s.style || {}) };
        out.presets = Array.isArray(s.presets) ? s.presets : [];
        out.characters = Array.isArray(s.characters) ? s.characters.map(normChar) : [];
        out.rooms = s.rooms && typeof s.rooms === 'object' ? s.rooms : {};
        out.ui = { ...d.ui, ...(s.ui || {}) };
        out.scene = { ...d.scene, ...(s.scene || {}) };
        out.folder = { ...d.folder, ...(s.folder || {}) };
        if (!Core.MODELS[out.model]) out.model = Core.DEFAULT_MODEL;
        return out;
    }

    function normChar(c) {
        return {
            id: String(c?.id || uid('ch')),
            name: String(c?.name || '').trim(),
            aliases: Array.isArray(c?.aliases) ? c.aliases.map(a => String(a).trim()).filter(Boolean) : String(c?.aliases || '').split(',').map(a => a.trim()).filter(Boolean),
            look: String(c?.look || ''),
            outfit: String(c?.outfit || ''),
            uc: String(c?.uc || '')
        };
    }

    function settings() {
        return normalize(readJson(SETTINGS_KEY));
    }

    // fn(draft) 이 draft를 고친다. 저장 직전에 새로 읽으니 다른 탭의 변경을 덮지 않는다.
    function update(fn) {
        const draft = normalize(readJson(SETTINGS_KEY));
        const result = fn(draft);
        writeJson(SETTINGS_KEY, normalize(result || draft));
        emit('settings');
    }

    function secrets() {
        const s = readJson(SECRETS_KEY);
        const out = {};
        SECRET_FIELDS.forEach(f => { out[f] = typeof s[f] === 'string' ? s[f].trim() : ''; });
        return out;
    }

    function setSecret(field, value) {
        if (!SECRET_FIELDS.includes(field)) return;
        const s = readJson(SECRETS_KEY);
        s[field] = String(value || '').trim();
        writeJson(SECRETS_KEY, s);
        emit('secrets');
    }

    try {
        if (typeof GM_addValueChangeListener === 'function') {
            GM_addValueChangeListener(SETTINGS_KEY, (_k, _o, _n, remote) => { if (remote) emit('settings', true); });
            GM_addValueChangeListener(SECRETS_KEY, (_k, _o, _n, remote) => { if (remote) emit('secrets', true); });
        }
    } catch (_) {}

    // 방별 사용 캐릭터
    function roomChars(roomId, s = settings()) {
        const ids = s.rooms?.[roomId]?.chars || [];
        return s.characters.filter(c => ids.includes(c.id));
    }

    function uid(prefix = 'id') {
        const r = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
        return `${prefix}_${Date.now().toString(36)}${r}`;
    }

    // ── IndexedDB ────────────────────────────────────────────
    let dbp = null;
    function db() {
        if (dbp) return dbp;
        dbp = new Promise((resolve, reject) => {
            const req = indexedDB.open('crack-painter', 2);
            req.onupgradeneeded = () => {
                const d = req.result;
                if (!d.objectStoreNames.contains('images')) d.createObjectStore('images');
                if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta');
                if (!d.objectStoreNames.contains('records')) {
                    const s = d.createObjectStore('records', { keyPath: 'key' });
                    s.createIndex('room', 'roomId');
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => { dbp = null; reject(req.error); };
        });
        return dbp;
    }

    async function tx(store, mode, fn) {
        const d = await db();
        return new Promise((resolve, reject) => {
            const t = d.transaction(store, mode);
            const r = fn(t.objectStore(store));
            t.oncomplete = () => resolve(r && 'result' in r ? r.result : undefined);
            t.onerror = () => reject(t.error);
            t.onabort = () => reject(t.error || new Error('저장소 작업이 중단됐어.'));
        });
    }

    function reqP(r) {
        return new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    }

    async function putImage(blob) {
        const id = uid('img');
        await tx('images', 'readwrite', s => s.put(blob, id));
        return id;
    }

    async function getImage(id) {
        const d = await db();
        return reqP(d.transaction('images').objectStore('images').get(id));
    }

    async function deleteImage(id) {
        await tx('images', 'readwrite', s => s.delete(id));
    }

    const bc = typeof BroadcastChannel === 'function' ? new BroadcastChannel('crack-painter') : null;
    if (bc) bc.onmessage = ev => emit(`records:${ev.data?.roomId || ''}`);

    function recKey(roomId, messageKey) { return `${roomId}|${messageKey}`; }

    async function getRecord(roomId, messageKey) {
        const d = await db();
        return (await reqP(d.transaction('records').objectStore('records').get(recKey(roomId, messageKey)))) || null;
    }

    async function roomRecords(roomId) {
        const d = await db();
        return reqP(d.transaction('records').objectStore('records').index('room').getAll(roomId));
    }

    async function putRecord(rec) {
        rec.key = recKey(rec.roomId, rec.messageKey);
        rec.updatedAt = Date.now();
        await tx('records', 'readwrite', s => s.put(rec));
        bc?.postMessage({ roomId: rec.roomId });
        emit(`records:${rec.roomId}`);
        return rec;
    }

    async function deleteRecord(roomId, messageKey) {
        const rec = await getRecord(roomId, messageKey);
        if (!rec) return;
        for (const h of rec.history || []) await deleteImage(h.imageId).catch(() => {});
        await tx('records', 'readwrite', s => s.delete(recKey(roomId, messageKey)));
        bc?.postMessage({ roomId });
        emit(`records:${roomId}`);
    }

    async function getMeta(key) {
        const d = await db();
        return reqP(d.transaction('meta').objectStore('meta').get(key));
    }

    async function setMeta(key, value) {
        await tx('meta', 'readwrite', s => (value == null ? s.delete(key) : s.put(value, key)));
    }

    async function usage() {
        try {
            const est = await navigator.storage?.estimate?.();
            return est ? { used: est.usage || 0, quota: est.quota || 0 } : null;
        } catch (_) {
            return null;
        }
    }

    return { on, emit, settings, update, secrets, setSecret, roomChars, uid, putImage, getImage, deleteImage, getRecord, roomRecords, putRecord, deleteRecord, usage, getMeta, setMeta };
})();


// ===== llm.js =====
// ─────────────────────────────────────────────────────────────
// LLM: 채팅 답변 → 장면 계획(JSON). Gemini(AI Studio) / DeepSeek
// AI에게는 "장면"과 "인물별 행동"만 맡긴다. 작가·화풍·퀄리티는 사용자의 몫이라
// 지시문에서 금지하고, 혹시 넣어도 Core.assemble 이 걸러낸다.
// ─────────────────────────────────────────────────────────────
const LLM = (() => {
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
    const SAFETY = ['HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_DANGEROUS_CONTENT']
        .map(category => ({ category, threshold: 'BLOCK_NONE' }));

    function instruction(family) {
        const v5 = family === 'v5';
        return `너는 롤플레이 채팅의 한 장면을 NovelAI 삽화로 옮기는 장면 연출가다.
대상 답변에서 정지 그림 한 장에 담을 수 있는 "정확한 한순간"을 고르고, 아래 JSON 하나만 출력한다. 설명·코드펜스 금지.

{
  "insertAfterParagraph": 0,
  "title": "한국어 장면 제목(15자 이내)",
  "moment": "고른 순간을 한국어 한 문장으로",
  "scene": {
    "composition": "카메라 거리·각도 Danbooru 태그 (예: cowboy shot, from side)",
    "tags": "장소·배경·시간·날씨·조명·핵심 소품 Danbooru 태그",
    "caption": "${v5 ? '영어 현재형 짧은 문장 1~3개: 공간 배치, 광원 방향, 깊이, 시선 흐름' : '빈 문자열'}"
  },
  "characters": [
    {
      "id": "등록 인물이면 그 id, 아니면 빈 문자열",
      "name": "등록 이름 그대로 (미등록이면 짧은 한국어 호칭)",
      "look": "미등록 인물만: 1girl/1boy 같은 성별 + 외형 + 의상 태그. 등록 인물은 빈 문자열",
      "tags": "이 인물의 자세·표정·시선·행동 Danbooru 태그",
      "caption": "${v5 ? '이 인물만의 영어 문장 0~2개 (방향·거리·복합 행동)' : '빈 문자열'}",
      "position": "left | center | right",
      "outfit": { "mode": "keep | replace | modify", "add": "", "remove": "" }
    }
  ]
}

[칸의 주인 — 절대 섞지 않는다]
- 작가·화풍·퀄리티·연도 태그(artist:, masterpiece, very aesthetic, year 2024, ~style 등)는 쓰지 않는다. 사용자가 따로 고정한다.
- 인원수 태그(1girl, 2boys, solo 등)는 scene과 tags에 쓰지 않는다. 프로그램이 센다. (미등록 인물의 look 에만 1girl/1boy 하나)
- 등록 인물의 머리색·눈색·체형·기본 의상은 쓰지 않는다. 이미 저장돼 있다.
- 의상이 장면에서 바뀌었을 때만 outfit 을 replace/modify 로 쓴다 (예: 재킷을 벗음 → modify, remove "jacket").
- 이름·고유명사는 tags/caption 어디에도 쓰지 않는다. caption 에서는 "the woman on the left"처럼 화면 위치로 부른다.

[사실]
- 대상 답변과 최근 맥락에 근거한 것만 그린다. 원문에 없는 접촉·표정·소품·노출을 만들지 않는다.
- 서로 다른 시점의 행동을 한 프레임에 합치지 않는다. 대사 속 상상·계획은 그리지 않는다.
- characters 에는 그 순간 화면에 실제로 보이는 인물만 넣는다. 1인칭 시점의 화자는 넣지 않는다.
- insertAfterParagraph 는 그 순간이 끝나는 문단 번호.

[태그]
- 영어 Danbooru 태그, 쉼표로 구분. 흔하고 안정적인 태그 위주로 짧게.
- 같은 뜻의 분위기 형용사를 쌓지 않는다.${v5 ? '\n- V5 는 문장을 잘 이해한다. 태그로 손실되는 관계·배치·광원은 caption 에 영어 문장으로 쓴다. 감정 선언이나 줄거리 요약은 쓰지 않는다.' : '\n- V4.5 는 문장보다 태그가 안정적이다. caption 은 모두 빈 문자열.'}`;
    }

    function peopleRule(people, focus) {
        const n = Number(people);
        if (!n) return '';
        const who = focus ? ` 한 명만 그릴 때는 '${focus.name}'(id=${focus.id})를 그린다.` : '';
        return n === 1
            ? `[인원 · 최우선] characters 에는 정확히 1명만 넣는다. 장면의 중심 인물 한 명을 단독(solo) 구도로 그리고, 다른 인물은 화면 밖에 두거나 손·뒷모습 같은 일부도 넣지 않는다.${who}`
            : `[인원 · 최우선] characters 는 최대 ${n}명. 중요한 순서대로 넣는다.${who}`;
    }

    function userPrompt({ characters, note, context, paragraphs, fixedParagraph, request, people, focus }) {
        const chars = characters.length
            ? characters.map(c => `- id=${c.id} | 이름=${c.name}${c.aliases?.length ? ` | 별칭=${c.aliases.join(', ')}` : ''} | 외형(참고용, 다시 쓰지 말 것)=${Core.joinTags([c.look, c.outfit]).slice(0, 200)}`).join('\n')
            : '(등록된 인물 없음 · 보이는 인물은 모두 미등록으로 look 을 채운다)';
        const paras = paragraphs.map(p => `[${p.index}] ${p.text}`).join('\n');
        return [
            `[등록 인물]\n${chars}`,
            note ? `[세계관·장소 메모]\n${note}` : '',
            context ? `[최근 맥락 · 이전 대화]\n${context}` : '',
            `[대상 답변 · 문단 번호]\n${paras}`,
            Number.isInteger(fixedParagraph) ? `[고정] insertAfterParagraph=${fixedParagraph} 인 문단의 순간을 그린다. 다른 장면으로 옮기지 않는다.` : '',
            peopleRule(people, focus),
            request ? `[사용자 수정 요청 · 최우선]\n${request}` : ''
        ].filter(Boolean).join('\n\n');
    }

    function geminiConfig(model, thinking) {
        const cfg = {};
        const m = String(model);
        if (!/^gemini-3\.(?:6|7|8)-flash$/.test(m)) {
            cfg.temperature = 0.3;
            cfg.topP = 0.9;
        }
        if (m === 'gemini-3.8-flash') cfg.responseFormat = { text: { mimeType: 'application/json' } };
        else cfg.responseMimeType = 'application/json';
        const level = { fast: 'low', normal: 'medium', deep: 'high' }[thinking];
        if (/^gemini-3/.test(m)) {
            if (level) cfg.thinkingConfig = { thinkingLevel: level };
            else if (m === 'gemini-3.8-flash') cfg.thinkingConfig = { thinkingLevel: 'medium' };
        }
        return cfg;
    }

    async function callGemini({ key, model, thinking, system, user, signal }) {
        if (!key) throw Object.assign(new Error('Gemini 키가 없어. 설정 → 연결에서 넣어줘.'), { code: 'NO_KEY', pane: 'api' });
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
        const body = {
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: user }] }],
            generationConfig: geminiConfig(model, thinking),
            safetySettings: SAFETY
        };
        let data;
        try {
            data = await Net.request({ method: 'POST', url, headers: { 'Content-Type': 'application/json' }, data: body, signal, timeout: 120000 });
        } catch (e) {
            // JSON 출력 설정을 모델이 거부하면 그 설정만 빼고 한 번 더
            if (e.status === 400 && /mime|responseFormat|response_format|json/i.test(e.message)) {
                delete body.generationConfig.responseFormat;
                delete body.generationConfig.responseMimeType;
                data = await Net.request({ method: 'POST', url, headers: { 'Content-Type': 'application/json' }, data: body, signal, timeout: 120000 });
            } else if (e.status === 503 || e.status === 429) {
                await new Promise(r => setTimeout(r, 2500));
                data = await Net.request({ method: 'POST', url, headers: { 'Content-Type': 'application/json' }, data: body, signal, timeout: 120000 });
            } else {
                throw e;
            }
        }
        const block = data?.promptFeedback?.blockReason;
        if (block) throw new Error(`Gemini가 요청을 막았어 (${block}).`);
        const cand = data?.candidates?.[0];
        const text = (cand?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('').trim();
        if (!text) throw new Error(`Gemini 응답이 비었어${cand?.finishReason ? ` (${cand.finishReason})` : ''}.`);
        return text;
    }

    async function callDeepSeek({ key, model, thinking, system, user, signal }) {
        if (!key) throw Object.assign(new Error('DeepSeek 키가 없어. 설정 → 연결에서 넣어줘.'), { code: 'NO_KEY', pane: 'api' });
        const body = {
            model,
            messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
            stream: false,
            response_format: { type: 'json_object' },
            ...(thinking === 'fast' ? { thinking: { type: 'disabled' } } : { thinking: { type: 'enabled' }, reasoning_effort: thinking === 'deep' ? 'max' : 'high' })
        };
        const send = () => Net.request({
            method: 'POST',
            url: 'https://api.deepseek.com/chat/completions',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
            data: body,
            signal,
            timeout: 180000
        });
        let data;
        try {
            data = await send();
        } catch (e) {
            // 400이면 선택 옵션(생각 모드·JSON 강제)을 빼고 한 번만 다시. 그래도 안 되면 원래 오류를 보여준다.
            if (e.status !== 400) throw e;
            delete body.thinking;
            delete body.reasoning_effort;
            delete body.response_format;
            try { data = await send(); } catch (_) { throw e; }
        }
        const text = String(data?.choices?.[0]?.message?.content || '').trim();
        if (!text) throw new Error('DeepSeek 응답이 비었어.');
        return text;
    }

    async function analyze(input, { settings, secrets, signal }) {
        const family = Core.model(settings.model).family;
        const system = instruction(family);
        const user = userPrompt(input);
        const a = settings.analyzer;
        const text = a.provider === 'deepseek'
            ? await callDeepSeek({ key: secrets.deepseekKey, model: a.deepseekModel, thinking: a.thinking, system, user, signal })
            : await callGemini({ key: secrets.geminiKey, model: a.geminiModel, thinking: a.thinking, system, user, signal });
        return Core.parseJsonLoose(text);
    }

    async function test(provider, key, model) {
        const system = 'Reply with JSON only.';
        const user = 'Return {"ok":true}';
        const text = provider === 'deepseek'
            ? await callDeepSeek({ key, model, thinking: 'fast', system, user })
            : await callGemini({ key, model, thinking: 'fast', system, user });
        return Core.parseJsonLoose(text);
    }

    return { GEMINI_MODELS, DEEPSEEK_MODELS, instruction, userPrompt, analyze, test };
})();


// ===== crack.js =====
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


// ===== folder.js =====
// ─────────────────────────────────────────────────────────────
// Folder: 생성한 삽화를 내 컴퓨터 폴더에도 PNG로 저장
// Chrome·Edge·Whale 등 Chromium 브라우저의 File System Access API 사용.
// 지원하지 않는 브라우저(Firefox·Safari)는 "생성할 때마다 다운로드"로 대신한다.
//
// 폴더 권한은 브라우저를 다시 열면 "다시 허용"이 필요할 수 있다. 권한 요청은
// 클릭 직후에만 가능해서, 생성 버튼을 누른 순간 prime()으로 미리 요청한다.
// ─────────────────────────────────────────────────────────────
const Folder = (() => {
    'use strict';
    const supported = typeof window.showDirectoryPicker === 'function';
    let handle = null;
    let loaded = null;

    function load() {
        if (!loaded) loaded = Store.getMeta('folder').then(h => { handle = h || null; return handle; }).catch(() => null);
        return loaded;
    }

    async function pick() {
        if (!supported) throw new Error('이 브라우저는 폴더 지정을 지원하지 않아. Chrome·Edge·Whale에서 쓸 수 있어.');
        const h = await window.showDirectoryPicker({ id: 'crack-painter', mode: 'readwrite', startIn: 'pictures' });
        handle = h;
        loaded = Promise.resolve(h);
        await Store.setMeta('folder', h);
        return h;
    }

    async function clear() {
        handle = null;
        loaded = Promise.resolve(null);
        await Store.setMeta('folder', null);
    }

    async function status() {
        await load();
        if (!handle) return { set: false };
        let permission = 'prompt';
        try { permission = await handle.queryPermission({ mode: 'readwrite' }); } catch (_) {}
        return { set: true, name: handle.name, permission };
    }

    // 클릭 핸들러 안에서 바로 부른다. 권한이 'prompt'면 이때 허용 창이 뜬다.
    function prime(force = false) {
        if (!handle || (!force && !Store.settings().folder?.enabled)) return Promise.resolve(false);
        try {
            return handle.queryPermission({ mode: 'readwrite' }).then(p => p === 'granted' ? true : handle.requestPermission({ mode: 'readwrite' }).then(r => r === 'granted')).catch(() => false);
        } catch (_) {
            return Promise.resolve(false);
        }
    }

    const clean = s => String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'untitled';

    function roomName() {
        const t = document.title.replace(/\s*[|·-]\s*(크랙|crack|wrtn).*$/i, '').trim();
        return clean(t && !/^(크랙|crack)$/i.test(t) ? t : Crack.roomId());
    }

    function fileName({ title, seed }) {
        const d = new Date();
        const p = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}_${clean(title || 'scene')}_${seed}.png`;
    }

    let warned = false;
    async function save(blob, info) {
        const s = Store.settings().folder || {};
        const name = fileName(info);
        if (s.enabled && handle) {
            try {
                if ((await handle.queryPermission({ mode: 'readwrite' })) !== 'granted') throw new Error('폴더 권한이 없어. 설정 → 저장 공간에서 "다시 허용"을 눌러줘.');
                let dir = handle;
                if (s.perRoom !== false) dir = await handle.getDirectoryHandle(roomName(), { create: true });
                const fh = await dir.getFileHandle(name, { create: true });
                const w = await fh.createWritable();
                await w.write(blob);
                await w.close();
                return { ok: true, where: `${handle.name}${s.perRoom !== false ? `/${roomName()}` : ''}/${name}` };
            } catch (e) {
                if (!warned) {
                    warned = true;
                    UI.toast({ title: '폴더에 저장하지 못했어', body: `${e.message} (브라우저 안에는 저장됐어)`, kind: 'err', actions: [{ label: '설정 열기', onClick: () => Settings.open('storage') }] });
                }
                return { ok: false };
            }
        }
        if (s.download) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = name;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 5000);
            return { ok: true, where: `다운로드/${name}` };
        }
        return { ok: false };
    }

    return { supported, load, pick, clear, status, prime, save, roomName };
})();


// ===== ui.js =====
// ─────────────────────────────────────────────────────────────
// UI 기반: Shadow DOM 호스트, 테마, 아이콘, 창, 메뉴, 알림
// ─────────────────────────────────────────────────────────────
const UI = (() => {
    'use strict';

    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const P = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
    const icons = {
        brush: P('<path d="M14.5 4.5 19.5 9.5 11 18l-5-5z"/><path d="M6 13c-2 0-3 1.5-3 3.5S2 20 2 20s3 .5 4.5-1S8 16 8 15"/><path d="m16 3 5 5"/>'),
        bolt: P('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
        refresh: P('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>'),
        left: P('<path d="m15 18-6-6 6-6"/>'),
        right: P('<path d="m9 18 6-6-6-6"/>'),
        download: P('<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>'),
        trash: P('<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>'),
        edit: P('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
        gear: P('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
        x: P('<path d="M6 6l12 12M18 6 6 18"/>', 'stroke-width="3"'),
        minus: P('<path d="M5 12h14"/>', 'stroke-width="3"'),
        plus: P('<path d="M12 5v14M5 12h14"/>'),
        zoom: P('<path d="M7 17 17 7"/><path d="M9 7h8v8"/>', 'stroke-width="3"'),
        sparkles: P('<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
        info: P('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5v.5"/>'),
        warn: P('<path d="M12 3 2 20h20z"/><path d="M12 10v4"/><path d="M12 17v.5"/>'),
        photo: P('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 8"/>'),
        key: P('<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9"/><path d="m17 6 3 3"/><path d="m15 8 2 2"/>'),
        person: P('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'),
        palette: P('<path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>'),
        slider: P('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'),
        room: P('<path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/>'),
        disk: P('<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'),
        check: P('<path d="m5 12 5 5 9-10"/>', 'stroke-width="2.4"'),
        disclose: P('<path d="m9 6 6 6-6 6"/>', 'stroke-width="2.6"'),
        pin: P('<path d="m5 12 5 5 9-10"/>', 'stroke-width="3.4"'),
        layers: P('<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>'),
        cpu: P('<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>')
    };

    let host = null;
    let root = null;
    let layer = null;
    let toasts = null;
    let dock = null;

    function mount() {
        if (root?.isConnected) return root;
        host = document.createElement('div');
        host.id = 'cp-host';
        const shadow = host.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = UI_CSS;
        root = document.createElement('div');
        root.className = 'root';
        layer = document.createElement('div');
        layer.className = 'layer';
        toasts = document.createElement('div');
        toasts.className = 'toasts';
        root.append(layer, toasts);
        shadow.append(style, root);
        document.body.appendChild(host);
        syncTheme();
        new MutationObserver(syncTheme).observe(document.body, { attributes: true, attributeFilter: ['data-theme', 'class'] });
        new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
        matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', syncTheme);
        return root;
    }

    function syncTheme() {
        if (!root) return;
        root.classList.toggle('dark', Crack.siteTheme() === 'dark');
    }

    function injectPageStyle() {
        if (document.getElementById('cp-page-style')) return;
        const st = document.createElement('style');
        st.id = 'cp-page-style';
        st.textContent = PAGE_CSS;
        document.head.appendChild(st);
    }

    // ── 창 ──────────────────────────────────────────────
    const windows = new Map();

    function openWindow({ id, className = '', title = '', subtitle = '', right = '', modal = true, onClose, sidebarTitle = false }) {
        mount();
        if (windows.has(id)) {
            const w = windows.get(id);
            w.restore();
            w.focus();
            return w;
        }
        const scrim = modal ? Object.assign(document.createElement('div'), { className: 'scrim' }) : null;
        const el = document.createElement('div');
        el.className = `win ${className}`;
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-label', title);
        el.innerHTML = `
            <div class="titlebar" data-drag>
              <div class="left"><div class="lights"><i data-act="close" aria-label="닫기"></i><i data-act="min" aria-label="내리기"></i><i data-act="zoom" aria-label="크게"></i></div><span class="tb-left"></span></div>
              <div class="title"><b></b><small></small></div>
              <div class="right"></div>
            </div>
            <div class="body"></div>`;
        if (sidebarTitle) el.querySelector('.titlebar').remove();
        if (scrim) layer.appendChild(scrim);
        layer.appendChild(el);

        const api = {
            id, el,
            body: el.querySelector('.body'),
            setTitle(t, sub = '') {
                const b = el.querySelector('.title b');
                const s = el.querySelector('.title small');
                if (b) b.textContent = t;
                if (s) { s.textContent = sub; s.classList.toggle('hidden', !sub); }
            },
            setRight(html) { const r = el.querySelector('.titlebar .right'); if (r) r.innerHTML = html; },
            close() {
                if (!windows.has(id)) return;
                windows.delete(id);
                el.remove();
                scrim?.remove();
                renderDock();
                document.removeEventListener('keydown', onKey, true);
                onClose?.();
            },
            minimize() {
                el.classList.add('hidden');
                scrim?.classList.add('hidden');
                api.minimized = true;
                renderDock();
            },
            restore() {
                el.classList.remove('hidden');
                scrim?.classList.remove('hidden');
                api.minimized = false;
                renderDock();
            },
            focus() { layer.appendChild(scrim || el); if (scrim) layer.appendChild(el); },
            dockLabel: title,
            minimized: false
        };
        api.setTitle(title, subtitle);
        if (right) api.setRight(right);

        // 신호등
        el.addEventListener('click', ev => {
            const act = ev.target.closest('.lights i')?.dataset.act;
            if (!act || ev.target.closest('.lights i').classList.contains('off')) return;
            if (act === 'close') api.close();
            else if (act === 'min') api.minimize();
            else if (act === 'zoom') el.classList.toggle('zoomed');
        });
        scrim?.addEventListener('click', () => api.minimize());

        const onKey = ev => {
            if (api.minimized || windows.get(id) !== api) return;
            const top = Array.from(windows.values()).filter(w => !w.minimized).pop();
            if (top !== api) return;
            if (ev.key === 'Escape' && !ev.target.closest?.('.menu')) {
                if (closeMenu()) { ev.stopPropagation(); return; }
                ev.stopPropagation();
                api.close();
            }
        };
        document.addEventListener('keydown', onKey, true);

        center(el);
        enableDrag(el);
        windows.set(id, api);
        renderDock();
        return api;
    }

    function center(el) {
        requestAnimationFrame(() => {
            const r = el.getBoundingClientRect();
            el.style.left = `${Math.max(8, (innerWidth - r.width) / 2)}px`;
            el.style.top = `${Math.max(8, (innerHeight - r.height) / 2 - 10)}px`;
        });
    }

    function enableDrag(el) {
        el.addEventListener('pointerdown', ev => {
            const bar = ev.target.closest('[data-drag]');
            if (!bar || ev.target.closest('button, input, select, textarea, .lights, a, .seg') || el.classList.contains('zoomed') || innerWidth <= 760) return;
            const r = el.getBoundingClientRect();
            const dx = ev.clientX - r.left;
            const dy = ev.clientY - r.top;
            const move = e => {
                el.style.left = `${Math.min(innerWidth - 80, Math.max(-r.width + 120, e.clientX - dx))}px`;
                el.style.top = `${Math.min(innerHeight - 40, Math.max(0, e.clientY - dy))}px`;
            };
            const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
            addEventListener('pointermove', move);
            addEventListener('pointerup', up);
        });
        el.addEventListener('dblclick', ev => {
            if (ev.target.closest('[data-drag]') && !ev.target.closest('button, input, select, textarea, .lights')) el.classList.toggle('zoomed');
        });
    }

    function renderDock() {
        const mins = Array.from(windows.values()).filter(w => w.minimized);
        if (!mins.length) { dock?.remove(); dock = null; return; }
        if (!dock) { dock = document.createElement('div'); dock.className = 'dock'; layer.appendChild(dock); }
        dock.innerHTML = mins.map(w => `<button data-id="${esc(w.id)}"><span class="app">${icons.brush}</span>${esc(w.dockLabel)}</button>`).join('');
        dock.onclick = ev => {
            const id = ev.target.closest('button')?.dataset.id;
            const w = windows.get(id);
            if (w) { w.restore(); w.focus(); }
        };
    }

    function setDockLabel(id, label) {
        const w = windows.get(id);
        if (!w) return;
        w.dockLabel = label;
        if (w.minimized) renderDock();
    }

    // ── 팝오버 메뉴 ─────────────────────────────────────
    let menuEl = null;
    function closeMenu() {
        if (!menuEl) return false;
        menuEl.remove();
        menuEl = null;
        return true;
    }
    // items: [{label, sub, value, header, sep}]
    function menu(anchor, items, onPick) {
        closeMenu();
        mount();
        menuEl = document.createElement('div');
        menuEl.className = 'menu';
        menuEl.innerHTML = items.map((it, i) => it.sep ? '<hr>' : it.header ? `<div class="hd">${esc(it.header)}</div>`
            : `<button data-i="${i}"><span class="grow">${esc(it.label)}${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</span></button>`).join('');
        layer.appendChild(menuEl);
        const r = anchor.getBoundingClientRect();
        const m = menuEl.getBoundingClientRect();
        menuEl.style.left = `${Math.max(8, Math.min(innerWidth - m.width - 8, r.left))}px`;
        menuEl.style.top = `${r.bottom + 4 + m.height > innerHeight ? Math.max(8, r.top - m.height - 4) : r.bottom + 4}px`;
        menuEl.addEventListener('click', ev => {
            const i = ev.target.closest('button')?.dataset.i;
            if (i == null) return;
            closeMenu();
            onPick(items[Number(i)]);
        });
        setTimeout(() => {
            const off = ev => {
                if (menuEl && !ev.composedPath().includes(menuEl)) { closeMenu(); document.removeEventListener('pointerdown', off, true); }
                if (!menuEl) document.removeEventListener('pointerdown', off, true);
            };
            document.addEventListener('pointerdown', off, true);
        });
    }

    // ── 알림 ─────────────────────────────────────────────
    // toast({title, body, kind:'info'|'ok'|'err', progress, actions:[{label, primary, onClick}], timeout})
    function toast(opts) {
        mount();
        const el = document.createElement('div');
        el.className = 'toast';
        const t = { el, update, close };
        function update(o = {}) {
            Object.assign(opts, o);
            const kind = opts.kind || 'info';
            el.innerHTML = `
              <div class="app ${kind === 'err' ? 'err' : kind === 'ok' ? 'ok' : ''}">${kind === 'err' ? icons.warn : kind === 'ok' ? icons.check : icons.brush}</div>
              <div class="txt"><b>${esc(opts.title || 'Crack Painter')}</b>${opts.body ? `<p>${esc(opts.body)}</p>` : ''}
                ${opts.progress ? '<div class="prog"><i></i></div>' : ''}
                ${opts.actions?.length ? `<div class="acts">${opts.actions.map((a, i) => `<button class="btn ${a.primary ? 'primary' : ''}" data-i="${i}">${esc(a.label)}</button>`).join('')}</div>` : ''}
              </div>
              <button class="icon-btn sm x" data-x title="닫기">${icons.x}</button>`;
            clearTimeout(t.timer);
            const ms = opts.timeout ?? (opts.progress || opts.actions?.length ? 0 : kind === 'err' ? 7000 : 3200);
            if (ms) t.timer = setTimeout(close, ms);
        }
        function close() {
            clearTimeout(t.timer);
            el.classList.add('leaving');
            setTimeout(() => el.remove(), 200);
        }
        el.addEventListener('click', ev => {
            if (ev.target.closest('[data-x]')) { opts.onDismiss?.(); return close(); }
            const i = ev.target.closest('[data-i]')?.dataset.i;
            if (i != null) { const a = opts.actions[Number(i)]; if (a.keepOpen !== true) close(); a.onClick?.(); }
        });
        update();
        toasts.prepend(el);
        return t;
    }

    function lightbox(src) {
        mount();
        const el = document.createElement('div');
        el.className = 'lightbox';
        el.innerHTML = `<img alt="">`;
        el.querySelector('img').src = src;
        el.addEventListener('click', () => el.remove());
        layer.appendChild(el);
        const key = ev => { if (ev.key === 'Escape') { el.remove(); document.removeEventListener('keydown', key, true); ev.stopPropagation(); } };
        document.addEventListener('keydown', key, true);
    }

    function spinner() {
        return `<div class="spinner">${Array.from({ length: 8 }, (_, i) => `<i style="transform:rotate(${i * 45}deg);animation-delay:${(i - 8) * 0.125}s"></i>`).join('')}</div>`;
    }

    function seg(name, options, value, cls = '') {
        return `<div class="seg ${cls}" data-seg="${esc(name)}">${options.map(([v, l]) => `<button type="button" data-v="${esc(v)}" class="${String(v) === String(value) ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>`;
    }

    function options(list, value) {
        return list.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`).join('');
    }

    function switchHtml(name, checked) {
        return `<label class="switch"><input type="checkbox" data-sw="${esc(name)}" ${checked ? 'checked' : ''}><span></span></label>`;
    }

    return { esc, icons, mount, injectPageStyle, openWindow, setDockLabel, menu, closeMenu, toast, lightbox, spinner, seg, options, switchHtml, windows };
})();


// ===== app.js =====
// ─────────────────────────────────────────────────────────────
// App: 생성 흐름, 기록, 채팅 안 삽화·버튼
// ─────────────────────────────────────────────────────────────
const App = (() => {
    'use strict';
    const { esc, icons } = UI;
    const MAX_HISTORY = 20;
    const running = new Map(); // messageKey -> { controller }

    // ── 이미지 URL 캐시 ───────────────────────────────────
    const urls = new Map();
    async function imageUrl(id) {
        if (!id) return '';
        if (urls.has(id)) return urls.get(id);
        const blob = await Store.getImage(id);
        if (!blob) return '';
        const u = URL.createObjectURL(blob);
        urls.set(id, u);
        return u;
    }
    function forgetImage(id) {
        const u = urls.get(id);
        if (u) URL.revokeObjectURL(u);
        urls.delete(id);
    }

    // ── 방 기록 캐시 (IndexedDB 는 탭끼리 공유, 변경은 BroadcastChannel 로 알림) ──
    let cache = { roomId: null, map: new Map(), ready: null };
    function records(roomId = Crack.roomId()) {
        if (cache.roomId !== roomId || !cache.ready) {
            cache = { roomId, map: new Map(), ready: null };
            const c = cache;
            c.ready = Store.roomRecords(roomId).then(list => { list.forEach(r => c.map.set(r.messageKey, r)); return c.map; }).catch(() => c.map);
        }
        return cache.ready;
    }
    Store.on(kind => {
        if (kind === `records:${cache.roomId}`) {
            cache.ready = null;
            records().then(() => scan());
        }
        if (kind === 'settings') Studio.onSettingsChanged?.();
    });

    const clone = v => JSON.parse(JSON.stringify(v ?? null));

    // ── 오류 처리 ─────────────────────────────────────────
    function reportError(err, title = '실패했어') {
        if (err?.name === 'AbortError') {
            UI.toast({ title: '취소했어', kind: 'info' });
            return;
        }
        console.error('[Crack Painter]', err, err?.diag || '');
        const actions = [];
        if (err?.pane) actions.push({ label: '설정 열기', primary: true, onClick: () => Settings.open(err.pane) });
        if (err?.diag || err?.body) actions.push({ label: '자세히', onClick: () => showDetail(title, err) });
        UI.toast({ title, body: err?.message || String(err), kind: 'err', actions, timeout: actions.length ? 0 : 8000 });
    }

    // 오류 자세히: 서버 원문 + 보낸 요청 요약 (키는 넣지 않음)
    function showDetail(title, err) {
        const text = [
            `[${err.service || '오류'}] HTTP ${err.status || '-'}`,
            err.message,
            '',
            '── 서버 응답 원문 ──',
            String(err.body || '(없음)').slice(0, 3000),
            ...(err.diag ? ['', '── 보낸 요청 요약 ──', err.diag] : [])
        ].join('\n');
        const w = UI.openWindow({ id: 'error-detail', className: 'detail', title: '오류 자세히', subtitle: title });
        w.body.innerHTML = `<div class="scroll" style="flex:1;padding:14px 16px;min-height:0"><pre style="margin:0;white-space:pre-wrap;word-break:break-word;font:11.5px/1.55 var(--mono)">${UI.esc(text)}</pre></div>
          <div class="row" style="padding:10px 14px;border-top:.5px solid var(--sep-strong);background:var(--bar)"><span class="muted tiny grow">API 키는 들어 있지 않아.</span><button class="btn primary" data-copy>복사</button></div>`;
        w.body.style.display = 'flex';
        w.body.style.flexDirection = 'column';
        w.body.querySelector('[data-copy]').onclick = async ev => {
            try { await navigator.clipboard.writeText(text); ev.target.textContent = '복사했어'; } catch (_) { ev.target.textContent = '복사 실패'; }
        };
    }

    function confirmToast(title, body, okLabel = '확인', danger = false) {
        return new Promise(resolve => {
            let decided = false;
            const t = UI.toast({
                title, body, kind: danger ? 'err' : 'info',
                actions: [{ label: '취소', onClick: () => { decided = true; resolve(false); } }, { label: okLabel, primary: true, onClick: () => { decided = true; resolve(true); } }],
                onDismiss: () => { if (!decided) resolve(false); }
            });
            return t;
        });
    }

    // ── 분석 ─────────────────────────────────────────────
    // 그릴 인원: 방 설정 > 전역 설정. 1명일 때 그릴 인물(focus)은 방 설정에서 고른다.
    function peopleFor(roomId, s = Store.settings()) {
        const room = s.rooms?.[roomId] || {};
        const people = room.people && room.people !== 'default' ? room.people : s.scene.people;
        const chars = Store.roomChars(roomId, s);
        const focus = chars.find(c => c.id === room.focus) || null;
        return { people: people === 'auto' ? 0 : Number(people) || 0, focus, chars };
    }

    function limitPeople(state, people, focus) {
        if (!people) return state;
        if (focus) {
            const i = state.chars.findIndex(c => c.id === focus.id);
            if (i > 0) state.chars.unshift(...state.chars.splice(i, 1));
        }
        state.chars.forEach((c, i) => { if (i >= people) c.enabled = false; });
        return state;
    }

    function analysisInput(markdown, { fixedParagraph, request } = {}) {
        const s = Store.settings();
        const roomId = Crack.roomId();
        const { people, focus } = peopleFor(roomId, s);
        return {
            people, focus,
            characters: Store.roomChars(roomId, s),
            note: s.rooms?.[roomId]?.note || '',
            context: Crack.contextBefore(markdown, Number(s.ui.contextTurns) || 4),
            paragraphs: Crack.paragraphs(markdown),
            fixedParagraph,
            request
        };
    }

    async function analyze(markdown, opts = {}, signal) {
        const s = Store.settings();
        const input = analysisInput(markdown, opts);
        if (!input.paragraphs.length) throw new Error('이 답변에서 문단을 찾지 못했어.');
        // 분석 AI 없이: 등록 인물만 넣은 빈 장면. 장면 태그는 스튜디오에서 직접 쓴다.
        if (s.analyzer.provider === 'none') {
            const picks = input.focus ? [input.focus] : input.characters;
            const plan = { insertAfterParagraph: input.paragraphs.length - 1, characters: picks.map(c => ({ id: c.id, name: c.name })) };
            return limitPeople(Core.planToState(plan, input.characters, s.style), input.people || 1, input.focus);
        }
        const plan = await LLM.analyze(input, { settings: s, secrets: Store.secrets(), signal });
        const state = limitPeople(Core.sanitizeAi(Core.planToState(plan, input.characters, s.style)), input.people, input.focus);
        state.paragraph = Math.min(state.paragraph, input.paragraphs.length - 1);
        if (Number.isInteger(opts.fixedParagraph)) state.paragraph = opts.fixedParagraph;
        return state;
    }

    // ── 생성 → 저장 → 채팅에 표시 ─────────────────────────
    async function generate({ roomId, messageKey, markdown, state, model, gen, signal }) {
        const sec = Store.secrets();
        const assembled = Core.assemble(state, model);
        if (!assembled.base && !assembled.chars.length) throw new Error('프롬프트가 비어 있어.');
        const { blob, seed } = await NAI.generate({ assembled, gen, apiKey: sec.naiKey, seed: gen.seed, signal });
        const imageId = await Store.putImage(blob);
        Folder.save(blob, { title: state.title, seed }).catch(() => {});
        const rec = (await Store.getRecord(roomId, messageKey)) || { roomId, messageKey, history: [], index: 0 };
        rec.paragraph = state.paragraph ?? rec.paragraph ?? 0;
        rec.title = state.title || rec.title || '';
        rec.history.push({
            imageId, seed, model, gen: clone(gen), state: clone(state),
            sent: { base: assembled.base, negative: NAI.mergeNegative(assembled.baseNeg, model, gen.ucPreset), chars: assembled.chars.map(c => ({ name: c.name, prompt: c.prompt, uc: c.uc })) },
            createdAt: Date.now()
        });
        while (rec.history.length > MAX_HISTORY) {
            const old = rec.history.shift();
            await Store.deleteImage(old.imageId).catch(() => {});
            forgetImage(old.imageId);
        }
        rec.index = rec.history.length - 1;
        await Store.putRecord(rec);
        (await records(roomId)).set(messageKey, rec);
        if (roomId === Crack.roomId()) {
            const md = markdown?.isConnected ? markdown : Crack.findMarkdownByKey(messageKey);
            if (md) await renderFigure(md, rec);
        }
        return { rec, blob, seed, assembled };
    }

    function settingsForGen() {
        const s = Store.settings();
        return { model: s.model, gen: { ...s.gen } };
    }

    // ⚡ 바로 생성: 분석 + 생성을 알림 하나로
    async function quick(markdown) {
        const roomId = Crack.roomId();
        const messageKey = Crack.messageKey(markdown);
        if (running.has(messageKey)) return UI.toast({ title: '이미 만들고 있어', body: '이 답변의 삽화를 생성 중이야.' });
        Folder.prime();
        const controller = new AbortController();
        running.set(messageKey, { controller });
        markButtons(messageKey, true);
        const t = UI.toast({ title: '장면 분석 중', body: '어떤 순간을 그릴지 고르고 있어.', progress: true, actions: [{ label: '취소', onClick: () => controller.abort() }] });
        try {
            const state = await analyze(markdown, {}, controller.signal);
            t.update({ title: '그리는 중', body: state.title || state.moment || 'NovelAI에 요청했어.' });
            const { model, gen } = settingsForGen();
            await generate({ roomId, messageKey, markdown, state, model, gen, signal: controller.signal });
            t.close();
            UI.toast({ title: '삽화 완성', body: state.title || '', kind: 'ok' });
        } catch (err) {
            t.close();
            reportError(err, '삽화를 만들지 못했어');
        } finally {
            running.delete(messageKey);
            markButtons(messageKey, false);
        }
    }

    // ↻ 리롤: 지금 보이는 기록의 프롬프트 그대로, 시드만 새로
    async function reroll(messageKey) {
        const roomId = Crack.roomId();
        if (running.has(messageKey)) return;
        const rec = (await records(roomId)).get(messageKey);
        const h = rec?.history?.[rec.index];
        if (!h) return;
        Folder.prime();
        const controller = new AbortController();
        running.set(messageKey, { controller });
        setFigureBusy(messageKey, true);
        try {
            const gen = { ...h.gen, seed: '' };
            await generate({ roomId, messageKey, markdown: Crack.findMarkdownByKey(messageKey), state: h.state, model: h.model, gen, signal: controller.signal });
        } catch (err) {
            reportError(err, '리롤 실패');
        } finally {
            running.delete(messageKey);
            setFigureBusy(messageKey, false);
        }
    }

    // ── 채팅 안 삽화 ──────────────────────────────────────
    function figureBar(rec) {
        const n = rec.history.length;
        const i = rec.index;
        return `
          <button data-cp="prev" title="이전" ${i <= 0 ? 'disabled' : ''}>${icons.left}</button>
          <span class="cp-count">${i + 1} / ${n}</span>
          <button data-cp="next" title="다음" ${i >= n - 1 ? 'disabled' : ''}>${icons.right}</button>
          <span class="cp-sep"></span>
          <button data-cp="reroll" title="같은 프롬프트로 다시">${icons.refresh}</button>
          <button data-cp="studio" title="스튜디오에서 편집">${icons.edit}</button>
          <button data-cp="save" title="저장">${icons.download}</button>
          <button data-cp="delete" title="이 장 삭제">${icons.trash}</button>`;
    }

    async function renderFigure(markdown, rec) {
        const h = rec.history[rec.index];
        if (!h) { markdown.querySelectorAll(':scope > .cp-figure').forEach(f => f.remove()); return; }
        let fig = markdown.querySelector(':scope > .cp-figure');
        if (!fig) {
            fig = document.createElement('div');
            fig.className = 'cp-figure';
            fig.setAttribute('contenteditable', 'false');
            fig.innerHTML = '<div class="cp-img-wrap"><img alt="" loading="lazy" decoding="async"><div class="cp-bar"></div></div>';
        }
        fig.dataset.key = rec.messageKey;
        const url = await imageUrl(h.imageId);
        const img = fig.querySelector('img');
        if (img.getAttribute('src') !== url) img.src = url;
        img.alt = rec.title || '장면 삽화';
        fig.querySelector('.cp-bar').innerHTML = figureBar(rec);
        Crack.placeFigure(markdown, fig, rec.paragraph);
    }

    function figureOf(messageKey) {
        return Array.from(document.querySelectorAll('.cp-figure')).find(f => f.dataset.key === messageKey) || null;
    }

    function setFigureBusy(messageKey, on) {
        const fig = figureOf(messageKey);
        if (!fig) return;
        fig.querySelector('.cp-busy')?.remove();
        if (on) {
            const b = document.createElement('div');
            b.className = 'cp-busy';
            b.textContent = '다시 그리는 중…';
            fig.querySelector('.cp-img-wrap').appendChild(b);
        }
    }

    async function figureAction(fig, act) {
        const key = fig.dataset.key;
        const roomId = Crack.roomId();
        const map = await records(roomId);
        const rec = map.get(key);
        if (!rec) return;
        const md = fig.closest('.wrtn-markdown');
        if (act === 'prev' || act === 'next') {
            rec.index = Math.max(0, Math.min(rec.history.length - 1, rec.index + (act === 'next' ? 1 : -1)));
            await Store.putRecord(rec);
            if (md) renderFigure(md, rec);
        } else if (act === 'reroll') {
            reroll(key);
        } else if (act === 'studio') {
            if (md) Studio.open(md);
        } else if (act === 'save') {
            const h = rec.history[rec.index];
            const blob = await Store.getImage(h.imageId);
            if (!blob) return;
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `crack-painter_${(rec.title || 'scene').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40)}_${h.seed}.png`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        } else if (act === 'delete') {
            await removeHistoryItem(roomId, key, rec.index);
        }
    }

    async function removeHistoryItem(roomId, key, index) {
        const map = await records(roomId);
        const rec = map.get(key);
        if (!rec) return;
        const ok = await confirmToast('이 삽화를 지울까?', rec.history.length > 1 ? `${rec.history.length}장 중 ${index + 1}번째 장만 지워.` : '이 답변의 마지막 삽화야.', '삭제', true);
        if (!ok) return;
        const [gone] = rec.history.splice(index, 1);
        if (gone) { await Store.deleteImage(gone.imageId).catch(() => {}); forgetImage(gone.imageId); }
        if (!rec.history.length) {
            await Store.deleteRecord(roomId, key);
            map.delete(key);
            figureOf(key)?.remove();
        } else {
            rec.index = Math.min(rec.index, rec.history.length - 1);
            await Store.putRecord(rec);
            const md = Crack.findMarkdownByKey(key);
            if (md) renderFigure(md, rec);
        }
        Studio.onRecordChanged?.(key);
    }

    document.addEventListener('click', ev => {
        const fig = ev.target.closest?.('.cp-figure');
        if (!fig) return;
        const btn = ev.target.closest('[data-cp]');
        if (btn) {
            ev.preventDefault();
            ev.stopPropagation();
            figureAction(fig, btn.dataset.cp).catch(reportError);
            return;
        }
        if (ev.target.tagName === 'IMG') {
            ev.preventDefault();
            ev.stopPropagation();
            if (matchMedia('(hover: none)').matches && !fig.classList.contains('cp-touch')) { fig.classList.add('cp-touch'); return; }
            UI.lightbox(ev.target.src);
        }
    }, true);

    // ── 메시지 버튼 ───────────────────────────────────────
    function makeBtn(kind, title, icon) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `cp-msg-btn cp-${kind}`;
        b.title = title;
        b.setAttribute('aria-label', title);
        b.innerHTML = icon;
        return b;
    }

    function markButtons(messageKey, on) {
        document.querySelectorAll('.cp-msg-btn.cp-quick').forEach(b => {
            if (b.dataset.key === messageKey) b.classList.toggle('cp-running', on);
        });
    }

    document.addEventListener('click', ev => {
        const btn = ev.target.closest?.('.cp-msg-btn');
        if (!btn) return;
        ev.preventDefault();
        ev.stopPropagation();
        const group = btn.closest('[data-message-group-id]');
        const msg = Crack.assistantMessages(group || document).find(m => m.footer.contains(btn));
        if (!msg) return;
        if (btn.classList.contains('cp-quick')) quick(msg.markdown);
        else Studio.open(msg.markdown);
    }, true);

    function enabled() {
        try { return localStorage.getItem('cp_enabled') !== 'off'; } catch (_) { return true; }
    }
    function setEnabled(on) {
        try { localStorage.setItem('cp_enabled', on ? 'on' : 'off'); } catch (_) {}
        document.body.classList.toggle('cp-hidden', !on);
        scan();
    }

    let scanning = false;
    async function scan() {
        if (scanning) return;
        scanning = true;
        try {
            UI.injectPageStyle();
            document.body.classList.toggle('cp-hidden', !enabled());
            injectMenuRow();
            const roomId = Crack.roomId();
            if (!roomId) return;
            const map = await records(roomId);
            for (const { markdown, footer } of Crack.assistantMessages()) {
                const key = Crack.messageKey(markdown);
                if (enabled()) {
                    let slot = footer.children[0];
                    if (!slot) { slot = document.createElement('div'); slot.className = 'flex items-center space-x-3'; footer.prepend(slot); }
                    let studioBtn = slot.querySelector('.cp-studio');
                    if (!studioBtn) {
                        studioBtn = makeBtn('studio', '삽화 스튜디오', icons.brush);
                        const quickBtn = makeBtn('quick', '바로 삽화 생성', icons.bolt);
                        slot.prepend(studioBtn, quickBtn);
                    }
                    slot.querySelectorAll('.cp-msg-btn').forEach(b => { b.dataset.key = key; });
                    slot.querySelector('.cp-quick')?.classList.toggle('cp-running', running.has(key));
                }
                const rec = map.get(key);
                const fig = markdown.querySelector(':scope > .cp-figure');
                if (rec?.history?.length && (!fig || fig.dataset.key !== key)) await renderFigure(markdown, rec);
                else if (!rec && fig) fig.remove();
            }
        } catch (e) {
            console.warn('[Crack Painter] scan', e);
        } finally {
            scanning = false;
        }
    }

    // 오른쪽 메뉴 "상황 이미지 보기" 아래에 "AI 삽화" 행을 복제해 붙인다
    function injectMenuRow() {
        const origin = Crack.situationRow();
        if (!origin || origin.nextElementSibling?.classList?.contains('cp-menu-row')) return;
        document.querySelectorAll('.cp-menu-row').forEach(r => r.remove());
        const row = origin.cloneNode(true);
        row.classList.add('cp-menu-row');
        const label = Array.from(row.querySelectorAll('span')).find(s => s.textContent.trim() === '상황 이미지 보기');
        if (label) label.textContent = 'AI 삽화 (Crack Painter)';
        const svg = row.querySelector('svg');
        if (svg) { const span = document.createElement('span'); span.style.cssText = 'width:24px;height:24px;display:inline-grid;place-items:center'; span.innerHTML = icons.brush; svg.replaceWith(span); }
        const sw = row.querySelector('button[role="switch"]');
        const paint = () => {
            if (!sw) return;
            const on = enabled();
            sw.setAttribute('aria-checked', String(on));
            sw.setAttribute('data-state', on ? 'checked' : 'unchecked');
            const thumb = sw.querySelector('span');
            thumb?.setAttribute('data-state', on ? 'checked' : 'unchecked');
        };
        paint();
        row.addEventListener('click', ev => {
            ev.preventDefault();
            ev.stopPropagation();
            if (ev.target.closest('button[role="switch"]')) { setEnabled(!enabled()); paint(); }
            else Settings.open();
        }, true);
        origin.insertAdjacentElement('afterend', row);
    }

    // ── 시작 ─────────────────────────────────────────────
    let timer = 0;
    function schedule() {
        clearTimeout(timer);
        timer = setTimeout(scan, 180);
    }

    let lastPath = location.pathname;
    function start() {
        UI.injectPageStyle();
        Folder.load();
        new MutationObserver(muts => {
            for (const m of muts) {
                const t = m.target;
                if (t.closest?.(Crack.OWN)) continue;
                if (t.id === 'cp-host') continue;
                schedule();
                break;
            }
            if (location.pathname !== lastPath) {
                lastPath = location.pathname;
                urls.forEach(u => URL.revokeObjectURL(u));
                urls.clear();
                schedule();
            }
        }).observe(document.body, { childList: true, subtree: true });
        schedule();
        setInterval(scan, 4000);

        try {
            GM_registerMenuCommand?.('설정 열기', () => Settings.open());
            GM_registerMenuCommand?.('삽화 보이기/숨기기', () => setEnabled(!enabled()));
        } catch (_) {}
    }

    return { start, scan, analyze, generate, quick, reroll, records, imageUrl, renderFigure, removeHistoryItem, reportError, confirmToast, running, settingsForGen, clone, enabled, setEnabled };
})();


// ===== studio.js =====
// ─────────────────────────────────────────────────────────────
// Studio: 장면 하나를 분석 → 칸별로 확인·수정 → 생성
// 화면 구성 자체가 NAI 요청 구조를 따른다:
//   베이스 프롬프트 = 스타일(고정) + 장면(AI)   →  base_caption
//   캐릭터 프롬프트 = 인물마다 한 칸            →  char_captions[]
// ─────────────────────────────────────────────────────────────
const Studio = (() => {
    'use strict';
    const { esc, icons } = UI;
    let S = null; // 현재 세션

    function open(markdown) {
        const roomId = Crack.roomId();
        const messageKey = Crack.messageKey(markdown);
        if (S && S.messageKey === messageKey && UI.windows.has('studio')) {
            const w = UI.windows.get('studio');
            w.restore();
            return;
        }
        if (S) close();
        const s = Store.settings();
        S = {
            roomId, messageKey, markdown,
            paragraphs: Crack.paragraphs(markdown),
            state: null,
            model: s.model,
            gen: { ...s.gen, seed: '' },
            styleTouched: false,
            status: 'idle', statusText: '', error: '',
            controller: null,
            rec: null,
            view: -1,
            request: ''
        };
        S.win = UI.openWindow({ id: 'studio', className: 'studio', title: '삽화 스튜디오', subtitle: '', onClose: () => { S?.controller?.abort(); S = null; } });
        S.win.setRight(`
            <select class="select" data-model style="width:auto">${UI.options(Object.values(Core.MODELS).map(m => [m.id, `NAI ${m.label}`]), S.model)}</select>
            <button class="icon-btn" data-act="settings" title="설정">${icons.gear}</button>`);
        bindChrome();
        load();
    }

    function close() {
        UI.windows.get('studio')?.close();
    }

    async function load() {
        const map = await App.records(S.roomId);
        const sess = S;
        sess.rec = map.get(sess.messageKey) || null;
        if (sess.rec?.history?.length) {
            const h = sess.rec.history[sess.rec.index];
            sess.view = sess.rec.index;
            sess.state = App.clone(h.state);
            sess.gen.size = h.gen?.size || sess.gen.size;
            render();
        } else {
            render();
            analyze();
        }
    }

    // ── 동작 ─────────────────────────────────────────────
    async function analyze(opts = {}) {
        const sess = S;
        if (!sess || busy()) return;
        sess.controller = new AbortController();
        sess.status = 'analyzing';
        sess.statusText = opts.request ? '요청을 반영해 다시 고르는 중' : '어떤 순간을 그릴지 고르는 중';
        sess.error = '';
        render();
        try {
            const prev = sess.state;
            const state = await App.analyze(sess.markdown, opts, sess.controller.signal);
            if (S !== sess) return;
            // 스튜디오에서 손본 스타일은 재분석해도 유지
            if (prev && sess.styleTouched) state.style = prev.style;
            sess.state = state;
            sess.request = '';
        } catch (err) {
            if (S !== sess) return;
            if (err?.name !== 'AbortError') { sess.error = err.message; App.reportError(err, '장면 분석 실패'); }
            if (!sess.state) sess.state = Core.planToState({ insertAfterParagraph: 0 }, Store.roomChars(sess.roomId), Store.settings().style);
        } finally {
            if (S === sess) { sess.status = 'idle'; sess.controller = null; render(); }
        }
    }

    async function generate() {
        const sess = S;
        if (!sess || busy() || !sess.state) return;
        const assembled = Core.assemble(sess.state, sess.model);
        if (!assembled.base && !assembled.chars.length) return App.reportError(new Error('프롬프트가 비어 있어.'));
        if (App.running.has(sess.messageKey)) return UI.toast({ title: '이 답변은 이미 생성 중이야' });
        Folder.prime();
        sess.controller = new AbortController();
        App.running.set(sess.messageKey, { controller: sess.controller });
        sess.status = 'generating';
        sess.statusText = 'NovelAI가 그리는 중';
        sess.error = '';
        render();
        UI.setDockLabel('studio', '그리는 중…');
        try {
            const { rec, seed } = await App.generate({
                roomId: sess.roomId, messageKey: sess.messageKey, markdown: sess.markdown,
                state: sess.state, model: sess.model, gen: { ...sess.gen }, signal: sess.controller.signal
            });
            if (S !== sess) { UI.toast({ title: '삽화 완성', kind: 'ok', body: '채팅에 넣었어.' }); return; }
            sess.rec = rec;
            sess.view = rec.index;
            sess.lastSeed = seed;
            if (sess.win.minimized) UI.toast({ title: '삽화 완성', kind: 'ok', body: sess.state.title || '채팅에 넣었어.' });
        } catch (err) {
            if (S === sess && err?.name !== 'AbortError') sess.error = err.message;
            App.reportError(err, '생성 실패');
        } finally {
            App.running.delete(sess.messageKey);
            if (S === sess) { sess.status = 'idle'; sess.controller = null; render(); UI.setDockLabel('studio', '삽화 스튜디오'); }
        }
    }

    function busy() { return S && S.status !== 'idle'; }

    // ── 렌더 ─────────────────────────────────────────────
    function render() {
        if (!S) return;
        const st = S.state;
        S.win.setTitle(st?.title || '삽화 스튜디오', S.paragraphs.length ? `문단 ${(st?.paragraph ?? 0) + 1} 뒤에 넣음 · ${Core.model(S.model).label}` : '');
        const scroll = S.win.body.querySelector('.inspector .content')?.scrollTop || 0;
        S.win.body.innerHTML = `${stageHtml()}<div class="inspector">${st ? `<div class="content scroll">${inspectorHtml()}</div>${footerHtml()}` : `<div class="content"></div>`}</div>`;
        const c = S.win.body.querySelector('.inspector .content');
        if (c) c.scrollTop = scroll;
        hydrateImages();
        S.win.body.querySelectorAll('textarea').forEach(autosize);
        refresh();
    }

    function autosize(ta) {
        ta.style.height = 'auto';
        ta.style.height = `${Math.min(260, ta.scrollHeight + 2)}px`;
    }

    function stageHtml() {
        const h = S.rec?.history?.[S.view];
        const busyHtml = busy() ? `<div class="busy"><div class="card">${UI.spinner()}<b>${esc(S.statusText)}</b><button class="btn" data-act="cancel">취소</button></div></div>` : '';
        const canvas = h
            ? `<img data-img="${esc(h.imageId)}" alt="">`
            : `<div class="placeholder">${icons.photo}<b>${S.state ? '아직 그림이 없어' : '장면을 읽는 중'}</b><span>${S.state ? '칸별 프롬프트를 확인하고 생성을 눌러줘.' : ''}</span></div>`;
        const film = S.rec?.history?.length ? `
          <div class="film scroll">
            ${S.rec.history.map((x, i) => `<button class="thumb ${i === S.view ? 'on' : ''}" data-thumb="${i}" title="${i + 1}번째 · seed ${x.seed}"><img data-img="${esc(x.imageId)}" alt="">${i === S.rec.index ? `<span class="pin" title="채팅에 보이는 그림">${icons.pin}</span>` : ''}</button>`).join('')}
            <div class="tools">
              <button class="icon-btn" data-act="show-in-chat" title="이 그림을 채팅에 표시" ${S.view === S.rec.index ? 'disabled' : ''}>${icons.check}</button>
              <button class="icon-btn" data-act="load-prompt" title="이 그림의 프롬프트 불러오기">${icons.layers}</button>
              <button class="icon-btn" data-act="reuse-seed" title="이 그림의 시드 쓰기">${icons.refresh}</button>
              <button class="icon-btn" data-act="delete-view" title="이 그림 삭제">${icons.trash}</button>
            </div>
          </div>` : '';
        return `<div class="stage"><div class="canvas">${canvas}${busyHtml}</div>${film}</div>`;
    }

    const slotColor = i => `c-${i % 6}`;

    function inspectorHtml() {
        const st = S.state;
        const v5 = Core.model(S.model).family === 'v5';
        const paraOpts = S.paragraphs.map(p => [p.index, `문단 ${p.index + 1} · ${p.text.slice(0, 34)}${p.text.length > 34 ? '…' : ''}`]);
        const s = Store.settings();
        const autoCount = Core.assemble({ ...st, scene: { ...st.scene, count: '' } }, S.model).count;

        return `
        <div class="section-title">장면</div>
        <div class="group">
          <div class="item"><span class="label"><b>넣을 위치</b></span><select class="select" data-para style="max-width:240px">${UI.options(paraOpts, st.paragraph)}</select></div>
          ${st.moment ? `<div class="item"><span class="label muted">${esc(st.moment)}</span></div>` : ''}
          <div class="item">
            <input class="field" data-request placeholder="고쳐 달라고 하기 · 예: 더 멀리서, 창가 쪽 순간으로" value="${esc(S.request)}">
            <button class="btn" data-act="reanalyze">${icons.sparkles}다시 분석</button>
          </div>
        </div>

        <div class="section-title"><span>베이스 프롬프트</span><span class="where">${icons.layers}base_caption · 그림 전체</span><span class="grow"></span><span class="badge" data-tok="base"></span></div>
        <div class="group">
          <div class="slot">
            <div class="slot-head"><span class="dot c-style" style="background:var(--c)"></span><span class="name">스타일</span><span class="muted tiny">작가 · 화풍 · 퀄리티 — 직접 고정</span>
              <span class="grow"></span>
              <button class="btn ghost" data-act="preset">프리셋</button>
              <button class="btn ghost" data-act="save-style" title="설정의 기본 스타일로 저장">기본으로</button>
            </div>
            <textarea class="ta mono" data-bind="style.pos" spellcheck="false" placeholder="artist:이름, 화풍 태그…  (캐릭터 칸에 넣은 작가 태그도 여기로 올라와)">${esc(st.style.pos)}</textarea>
          </div>
          <div class="slot">
            <div class="slot-head"><span class="dot c-scene" style="background:var(--c)"></span><span class="name">장면</span><span class="muted tiny">인원수 · 구도 · 배경 · 조명 — AI</span></div>
            <div class="row"><span class="sub" style="width:44px">인원수</span><input class="field mono" data-bind="scene.count" placeholder="자동: ${esc(autoCount || '없음')}" value="${esc(st.scene.count)}"></div>
            <textarea class="ta mono" data-bind="scene.tags" spellcheck="false" placeholder="cowboy shot, indoors, bedroom, night, lamplight…">${esc(st.scene.tags)}</textarea>
            ${v5 ? `<span class="sub">장면 문장 <span class="muted" style="font-weight:400">V5 자연어</span></span><textarea class="ta short" data-bind="scene.caption" spellcheck="false" placeholder="Soft light falls from the window on the left…">${esc(st.scene.caption)}</textarea>` : ''}
          </div>
        </div>

        <div class="section-title"><span>캐릭터 프롬프트</span><span class="where">${icons.person}char_captions · 인물마다</span><span class="grow"></span><span class="badge" data-tok="chars"></span></div>
        <div class="group">
          ${st.chars.length ? st.chars.map((c, i) => charSlotHtml(c, i, v5)).join('') : `<div class="item"><span class="label muted">이 장면에 인물 칸이 없어. 배경만 그리거나 아래에서 추가해.</span></div>`}
          <div class="item"><button class="btn ghost" data-act="add-char">${icons.plus}인물 추가</button><span class="grow"></span><span class="muted tiny">${Core.model(S.model).label} 최대 ${Core.model(S.model).maxChars}명</span></div>
        </div>

        <div class="section-title">네거티브</div>
        <div class="group">
          <div class="slot">
            <div class="row"><span class="sub grow">기본 네거티브 <span class="muted" style="font-weight:400">스타일과 같이 저장</span></span>
              <select class="select" data-uc style="width:auto">${UI.options(ucOptions(), NAI.ucPresetFor(S.model, S.gen.ucPreset))}</select></div>
            <textarea class="ta mono short" data-bind="style.neg" spellcheck="false" placeholder="lowres, bad anatomy…">${esc(st.style.neg)}</textarea>
            <span class="sub">이 장면만</span>
            <textarea class="ta mono short" data-bind="neg" spellcheck="false" placeholder="">${esc(st.neg)}</textarea>
          </div>
        </div>

        <div class="notes" data-notes></div>
        <details class="raw"><summary>${icons.disclose}실제로 보내는 내용</summary><pre data-raw></pre></details>`;
    }

    function ucOptions() {
        const table = NAI.ucTable(S.model);
        return [[2, 'UC 프리셋 없음'], ...Object.keys(table).map(k => [k, `${NAI.UC_LABELS[k]} UC`])];
    }

    function charSlotHtml(c, i, v5) {
        const off = c.enabled === false;
        const coords = !!S.gen.useCoords;
        return `
          <div class="slot ${off ? 'off' : ''}" data-slot="${i}">
            <div class="slot-head">
              <span class="dot ${slotColor(i)}" style="background:var(--c)"></span>
              <span class="name">${esc(c.name || `인물 ${i + 1}`)}</span>
              <span class="badge ${c.source === 'saved' ? 'blue' : 'orange'}">${c.source === 'saved' ? '등록' : '엑스트라'}</span>
              <span class="badge tok" data-tok="char${i}"></span>
              <span class="grow"></span>
              ${coords ? UI.seg(`pos${i}`, [['left', '좌'], ['center', '중'], ['right', '우']], c.position || '', 'sm') : ''}
              ${c.source === 'saved' ? `<button class="icon-btn sm" data-act="reload-look" data-i="${i}" title="저장된 외형으로 되돌리기">${icons.refresh}</button>` : ''}
              <button class="icon-btn sm" data-act="remove-char" data-i="${i}" title="이 칸 빼기">${icons.x}</button>
              ${UI.switchHtml(`char${i}`, !off)}
            </div>
            <span class="sub">외형 · 의상</span>
            <textarea class="ta mono short" data-bind="chars.${i}.look" spellcheck="false" placeholder="girl, black hair, school uniform…">${esc(c.look)}</textarea>
            <span class="sub">행동 · 표정 · 자세 <span class="muted" style="font-weight:400">AI</span></span>
            <textarea class="ta mono short" data-bind="chars.${i}.action" spellcheck="false" placeholder="sitting, looking at viewer…">${esc(c.action)}</textarea>
            ${v5 ? `<span class="sub">인물 문장 <span class="muted" style="font-weight:400">V5</span></span><textarea class="ta short" data-bind="chars.${i}.caption" spellcheck="false">${esc(c.caption)}</textarea>` : ''}
            <span class="sub">UC</span>
            <input class="field mono" data-bind="chars.${i}.uc" spellcheck="false" value="${esc(c.uc)}">
          </div>`;
    }

    function footerHtml() {
        const sizes = Object.entries(NAI.SIZES).map(([k, v]) => [k, v.label]);
        return `
          <div class="footer">
            <div class="meter" data-meter></div>
            <div class="row">
              ${UI.seg('size', sizes, S.gen.size)}
              <input class="field num mono" data-seed placeholder="랜덤" title="시드 (비우면 랜덤)" value="${esc(S.gen.seed)}">
              <span class="grow"></span>
              ${busy() ? `<button class="btn lg" data-act="cancel">취소</button>` : `<button class="btn primary lg" data-act="generate">${icons.brush}생성<span class="kbd">${/Mac/.test(navigator.platform) ? "⌘↵" : "Ctrl+↵"}</span></button>`}
            </div>
          </div>`;
    }

    async function hydrateImages() {
        for (const img of S.win.body.querySelectorAll('img[data-img]')) {
            const url = await App.imageUrl(img.dataset.img);
            if (url) img.src = url;
        }
    }

    // 텍스트 입력 중에는 전체를 다시 그리지 않고 파생 정보만 갱신
    function refresh() {
        if (!S?.state) return;
        const a = Core.assemble(S.state, S.model);
        const body = S.win.body;
        const b = a.budget;
        const tok = body.querySelector('[data-tok="base"]');
        if (tok) tok.textContent = `약 ${b.base} 토큰`;
        const tc = body.querySelector('[data-tok="chars"]');
        if (tc) tc.textContent = `약 ${b.chars} 토큰`;
        S.state.chars.forEach((c, i) => {
            const el = body.querySelector(`[data-tok="char${i}"]`);
            if (!el) return;
            const out = a.chars.find(x => x.id === (c.id || `c${i}`));
            el.textContent = out ? `${out.tokens}` : '—';
        });
        const autoCount = body.querySelector('[data-bind="scene.count"]');
        if (autoCount && !S.state.scene.count) autoCount.placeholder = `자동: ${Core.assemble({ ...S.state, scene: { ...S.state.scene, count: '' } }, S.model).count || '없음'}`;

        // 미터
        const meter = body.querySelector('[data-meter]');
        if (meter) {
            const limit = b.limit;
            const segs = [['c-style', '스타일', b.parts.style], ['c-scene', '장면', b.parts.scene]];
            const charSegs = a.chars.map((c, i) => {
                const idx = S.state.chars.findIndex((x, j) => (x.id || `c${j}`) === c.id);
                return [slotColor(idx >= 0 ? idx : i), c.name, c.tokens];
            });
            const shown = b.shared ? [...segs, ...charSegs] : segs;
            const total = b.shared ? b.used : b.base;
            meter.className = `meter ${b.over ? 'over' : ''}`;
            meter.innerHTML = `
              <div class="bar">${shown.map(([cls, , n]) => `<i class="${cls}" style="background:var(--c);width:${Math.min(100, (n / limit) * 100)}%"></i>`).join('')}</div>
              <div class="legend">${shown.map(([cls, name, n]) => `<span class="${cls}">${esc(name)} ${n}</span>`).join('')}
                <span class="total">${b.shared ? '합산' : '베이스'} 약 ${total} / ${limit}</span></div>
              ${!b.shared && b.chars ? `<div class="legend"><span class="muted">V5는 캐릭터 칸(약 ${b.chars})이 베이스 예산과 따로야.</span></div>` : ''}`;
        }

        // 알림
        const notes = body.querySelector('[data-notes]');
        if (notes) {
            const list = [...a.notes];
            if (S.error) list.unshift({ level: 'error', text: S.error });
            notes.innerHTML = list.map(n => `<div class="note ${n.level}">${n.level === 'info' ? icons.info : icons.warn}<span>${esc(n.text)}</span></div>`).join('');
        }

        // 전송 미리보기
        const raw = body.querySelector('[data-raw]');
        if (raw) {
            const g = { ...S.gen };
            const quality = Core.model(S.model).family === 'v5' ? NAI.V5_QUALITY[g.qualityV5] : (g.qualityV45 !== false ? '(서버가 퀄리티 태그 추가)' : '');
            raw.innerHTML = [
                `<span class="k">base_caption</span>\n${esc(a.base)}${quality ? `\n<span class="muted">+ ${esc(quality)}</span>` : ''}`,
                ...a.chars.map((c, i) => `<span class="k">char_captions[${i}] · ${esc(c.name)}</span> <span class="muted">(${c.center.x}, ${c.center.y})</span>\n${esc(c.prompt)}${c.uc ? `\n<span class="muted">UC: ${esc(c.uc)}</span>` : ''}`),
                `<span class="k">negative</span>\n${esc(NAI.mergeNegative(a.baseNeg, S.model, g.ucPreset))}`
            ].join('\n\n');
        }
    }

    // ── 이벤트 ───────────────────────────────────────────
    function setPath(obj, path, value) {
        const keys = path.split('.');
        let o = obj;
        for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
        o[keys[keys.length - 1]] = value;
    }

    function bindChrome() {
        const el = S.win.el;
        el.addEventListener('input', ev => {
            if (!S) return;
            const t = ev.target;
            if (t.dataset.bind) {
                setPath(S.state, t.dataset.bind, t.value);
                if (t.tagName === 'TEXTAREA') autosize(t);
                if (t.dataset.bind.startsWith('style.')) S.styleTouched = true;
                refresh();
            } else if (t.dataset.request !== undefined) {
                S.request = t.value;
            } else if (t.dataset.seed !== undefined) {
                S.gen.seed = t.value.replace(/[^\d]/g, '');
            }
        });
        el.addEventListener('change', ev => {
            if (!S) return;
            const t = ev.target;
            if (t.dataset.model !== undefined) {
                S.model = t.value;
                Store.update(d => { d.model = t.value; });
                render();
            } else if (t.dataset.para !== undefined) {
                S.state.paragraph = Number(t.value);
                render();
            } else if (t.dataset.uc !== undefined) {
                S.gen.ucPreset = Number(t.value);
                Store.update(d => { d.gen.ucPreset = Number(t.value); });
                refresh();
            } else if (t.dataset.sw?.startsWith('char')) {
                const i = Number(t.dataset.sw.slice(4));
                S.state.chars[i].enabled = t.checked;
                render();
            }
        });
        el.addEventListener('keydown', ev => {
            if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') { ev.preventDefault(); generate(); }
            if (ev.key === 'Enter' && ev.target.dataset?.request !== undefined) { ev.preventDefault(); reanalyze(); }
        });
        el.addEventListener('click', ev => {
            if (!S) return;
            const segBtn = ev.target.closest('.seg button');
            if (segBtn) {
                const name = segBtn.parentElement.dataset.seg;
                const v = segBtn.dataset.v;
                if (name === 'size') { S.gen.size = v; Store.update(d => { d.gen.size = v; }); }
                else if (name.startsWith('pos')) { const i = Number(name.slice(3)); S.state.chars[i].position = S.state.chars[i].position === v ? null : v; }
                render();
                return;
            }
            const thumb = ev.target.closest('[data-thumb]');
            if (thumb) { S.view = Number(thumb.dataset.thumb); render(); return; }
            if (ev.target.closest('.canvas img')) { UI.lightbox(ev.target.closest('.canvas img').src); return; }
            const act = ev.target.closest('[data-act]')?.dataset.act;
            if (!act) return;
            const btn = ev.target.closest('[data-act]');
            actions[act]?.(btn);
        });
    }

    function reanalyze() {
        analyze({ fixedParagraph: S.request ? S.state?.paragraph : undefined, request: S.request.trim() || undefined });
    }

    const actions = {
        settings: () => Settings.open(),
        cancel: () => S.controller?.abort(),
        generate: () => generate(),
        reanalyze: () => reanalyze(),
        'save-style': async () => {
            const { pos, neg } = S.state.style;
            Store.update(d => { d.style = { pos, neg }; });
            S.styleTouched = false;
            UI.toast({ title: '기본 스타일로 저장했어', kind: 'ok', body: '앞으로 모든 장면의 베이스 맨 앞에 들어가.' });
        },
        preset: btn => {
            const s = Store.settings();
            const items = [
                { header: '스타일 프리셋' },
                ...(s.presets.length ? s.presets.map(p => ({ label: p.name, sub: p.pos.slice(0, 60), value: p })) : [{ label: '저장된 프리셋 없음', sub: '설정 → 스타일에서 만들 수 있어', value: null }]),
                { sep: true },
                { label: '설정의 기본 스타일 불러오기', value: 'default' },
                { label: '지금 스타일을 새 프리셋으로 저장…', value: 'new' }
            ];
            UI.menu(btn, items, it => {
                if (!it.value) return;
                if (it.value === 'default') { S.state.style = { ...Store.settings().style }; S.styleTouched = false; }
                else if (it.value === 'new') {
                    const name = prompt('프리셋 이름', '');
                    if (!name) return;
                    const { pos, neg } = S.state.style;
                    Store.update(d => { d.presets.push({ id: Store.uid('ps'), name: name.trim().slice(0, 40), pos, neg }); });
                    UI.toast({ title: '프리셋 저장', kind: 'ok', body: name });
                    return;
                } else { S.state.style = { pos: it.value.pos, neg: it.value.neg ?? S.state.style.neg }; S.styleTouched = true; }
                render();
            });
        },
        'add-char': btn => {
            const s = Store.settings();
            const present = new Set(S.state.chars.map(c => c.id));
            const roomIds = new Set(s.rooms?.[S.roomId]?.chars || []);
            const avail = s.characters.filter(c => !present.has(c.id));
            const items = [
                ...(avail.length ? [{ header: '등록 인물' }, ...avail.map(c => ({ label: c.name, sub: roomIds.has(c.id) ? '이 방에서 사용 중' : '다른 방 인물', value: c }))] : []),
                { sep: true },
                { label: '빈 엑스트라 칸', value: 'extra' }
            ];
            UI.menu(btn, items, it => {
                if (it.value === 'extra') S.state.chars.push({ id: `extra${Date.now()}`, source: 'extra', name: `엑스트라 ${S.state.chars.length + 1}`, aliases: [], look: '', action: '', caption: '', uc: '', position: null, enabled: true });
                else if (it.value?.id) { const c = it.value; S.state.chars.push({ id: c.id, source: 'saved', name: c.name, aliases: c.aliases, look: Core.joinTags([c.look, c.outfit]), action: '', caption: '', uc: c.uc, position: null, enabled: true }); }
                render();
            });
        },
        'remove-char': btn => { S.state.chars.splice(Number(btn.dataset.i), 1); render(); },
        'reload-look': btn => {
            const c = S.state.chars[Number(btn.dataset.i)];
            const saved = Store.settings().characters.find(x => x.id === c.id);
            if (!saved) return UI.toast({ title: '저장된 인물을 찾지 못했어', kind: 'err' });
            c.look = Core.joinTags([saved.look, saved.outfit]);
            c.uc = saved.uc;
            c.name = saved.name;
            render();
        },
        'show-in-chat': async () => {
            S.rec.index = S.view;
            await Store.putRecord(S.rec);
            const md = S.markdown?.isConnected ? S.markdown : Crack.findMarkdownByKey(S.messageKey);
            if (md) App.renderFigure(md, S.rec);
            render();
        },
        'load-prompt': () => {
            const h = S.rec?.history?.[S.view];
            if (!h) return;
            S.state = App.clone(h.state);
            S.styleTouched = true;
            render();
            UI.toast({ title: '그 그림의 프롬프트를 불러왔어' });
        },
        'reuse-seed': () => {
            const h = S.rec?.history?.[S.view];
            if (!h) return;
            S.gen.seed = String(h.seed);
            render();
        },
        'delete-view': async () => {
            await App.removeHistoryItem(S.roomId, S.messageKey, S.view);
        }
    };

    async function onRecordChanged(key) {
        if (!S || S.messageKey !== key) return;
        S.rec = (await App.records(S.roomId)).get(key) || null;
        S.view = S.rec ? Math.min(S.view, S.rec.history.length - 1) : -1;
        render();
    }

    function onSettingsChanged() {
        if (!S || busy()) return;
        const s = Store.settings();
        let changed = false;
        if (s.model !== S.model) { S.model = s.model; changed = true; }
        if (S.state && !S.styleTouched && (s.style.pos !== S.state.style.pos || s.style.neg !== S.state.style.neg)) { S.state.style = { ...s.style }; changed = true; }
        if (s.gen.useCoords !== S.gen.useCoords) { S.gen.useCoords = s.gen.useCoords; changed = true; }
        ['steps', 'scaleV5', 'scaleV45', 'rescaleV5', 'rescaleV45', 'sampler', 'noise', 'qualityV45', 'qualityV5', 'ucPreset'].forEach(k => { S.gen[k] = s.gen[k]; });
        if (changed) {
            const sel = S.win.el.querySelector('[data-model]');
            if (sel) sel.value = S.model;
            const active = S.win.el.getRootNode().activeElement;
            // 입력 중이면 다시 그리지 않음
            if (!active || !S.win.el.contains(active)) render();
            else refresh();
        }
    }

    return { open, close, onRecordChanged, onSettingsChanged, get session() { return S; } };
})();


// ===== settings.js =====
// ─────────────────────────────────────────────────────────────
// Settings: 시스템 설정 스타일 창
// 입력은 change 시점에 그 필드 하나만 저장한다(Store.update / setSecret).
// ─────────────────────────────────────────────────────────────
const Settings = (() => {
    'use strict';
    const { esc, icons } = UI;

    const PANES = [
        ['api', '연결', icons.key, '#0a84ff'],
        ['style', '스타일', icons.palette, '#bf5af2'],
        ['chars', '캐릭터', icons.person, '#ff9f0a'],
        ['room', '이 채팅방', icons.room, '#30b0c7'],
        ['gen', '생성 옵션', icons.slider, '#8e8e93'],
        ['storage', '저장 공간', icons.disk, '#34c759']
    ];
    let win = null;
    let pane = 'api';
    let selChar = null;
    let unsub = null;

    function open(which) {
        if (which) pane = which;
        if (win && UI.windows.has('settings')) {
            win.restore();
            render();
            return;
        }
        win = UI.openWindow({
            id: 'settings', className: 'settings', title: 'Crack Painter 설정', sidebarTitle: true,
            onClose: () => { win = null; unsub?.(); unsub = null; }
        });
        win.body.innerHTML = `
          <div class="side">
            <div class="titlebar" data-drag><div class="left"><div class="lights"><i data-act="close" aria-label="닫기"></i><i data-act="min" aria-label="내리기"></i><i class="off"></i></div></div></div>
            <nav class="nav scroll">${PANES.map(([id, label, ic, color]) => `<button data-pane="${id}"><span class="ic" style="background:${color}">${ic}</span>${label}</button>`).join('')}</nav>
          </div>
          <div class="main">
            <div class="titlebar" data-drag><div class="left"></div><div class="title"><b></b></div><div class="right"></div></div>
            <div class="pane scroll"></div>
          </div>`;
        bind();
        unsub = Store.on((kind, remote) => { if (remote && (kind === 'settings' || kind === 'secrets')) softRefresh(); });
        render();
    }

    function softRefresh() {
        if (!win) return;
        const active = win.el.getRootNode().activeElement;
        if (active && win.el.contains(active) && /INPUT|TEXTAREA|SELECT/.test(active.tagName)) return;
        render();
    }

    function render() {
        if (!win) return;
        win.el.querySelectorAll('.nav button').forEach(b => b.classList.toggle('on', b.dataset.pane === pane));
        const meta = PANES.find(p => p[0] === pane);
        win.el.querySelector('.main .title b').textContent = meta[1];
        const box = win.el.querySelector('.pane');
        const top = box.scrollTop;
        box.innerHTML = ({ api: apiPane, style: stylePane, chars: charsPane, room: roomPane, gen: genPane, storage: storagePane })[pane]();
        box.scrollTop = top;
        if (pane === 'storage') fillStorage();
    }

    const val = v => esc(v ?? '');

    // ── 연결 ─────────────────────────────────────────────
    function apiPane() {
        const s = Store.settings();
        const k = Store.secrets();
        const a = s.analyzer;
        const keyRow = (field, label, ph) => `
          <div class="item"><span class="label"><b>${label}</b><small data-key-hint="${field}">${keyHint(field, k[field])}</small></span>
            <input class="field mono" type="password" autocomplete="off" data-secret="${field}" placeholder="${ph}" value="${val(k[field])}" style="max-width:260px">
          </div>`;
        return `
          <div class="section-title">NovelAI (그림)</div>
          <div class="group">
            ${keyRow('naiKey', 'API 토큰', 'pst-…')}
            <div class="item"><span class="label" data-nai-status><small>NovelAI 계정 설정 → Get Persistent API Token</small></span><button class="btn" data-act="test-nai">확인</button></div>
          </div>

          <div class="section-title">장면 분석 AI</div>
          <div class="group">
            <div class="item"><span class="label"><b>사용할 AI</b><small>채팅을 읽고 어떤 장면을 그릴지 고르는 역할 · NovelAI 토큰과는 별개야</small></span>${UI.seg('provider', [['gemini', 'Gemini'], ['deepseek', 'DeepSeek'], ['none', '안 씀']], a.provider)}</div>
            ${a.provider === 'none'
                ? `<div class="item"><span class="label muted">분석 AI 없이 NovelAI 토큰만으로 써. 스튜디오를 열면 등록 인물만 채워진 빈 장면이 나오고, 장면 태그와 자세는 직접 쓰면 돼. ⚡ 바로 생성은 외형·스타일만으로 그려.</span></div>`
                : a.provider === 'deepseek'
                ? `${keyRow('deepseekKey', 'DeepSeek 키', 'sk-…')}
                   <div class="item"><span class="label"><b>모델</b></span><select class="select" data-k="analyzer.deepseekModel" style="width:auto">${UI.options(LLM.DEEPSEEK_MODELS, a.deepseekModel)}</select></div>`
                : `${keyRow('geminiKey', 'Gemini 키', 'AIza…')}
                   <div class="item"><span class="label"><b>모델</b><small><a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color:var(--accent)">Google AI Studio</a>에서 무료로 키를 받을 수 있어</small></span><select class="select" data-k="analyzer.geminiModel" style="width:auto">${UI.options(LLM.GEMINI_MODELS, a.geminiModel)}</select></div>`}
            ${a.provider === 'none' ? '' : `<div class="item"><span class="label"><b>생각 깊이</b><small>깊을수록 장면 선택이 정확하지만 느려</small></span>
              <select class="select" data-k="analyzer.thinking" style="width:auto">${UI.options([['auto', '자동'], ['fast', '빠르게'], ['normal', '보통'], ['deep', '깊게']], a.thinking)}</select></div>
            <div class="item"><span class="label" data-llm-status><small>키와 모델이 맞는지 짧은 요청으로 확인해</small></span><button class="btn" data-act="test-llm">확인</button></div>`}
          </div>
          <p class="footnote">키는 Tampermonkey/Violentmonkey 저장소에 저장돼. 탭을 여러 개 열어도 다른 탭이 지우지 않아. 스크립트를 지우고 새로 설치하면 저장소도 같이 지워지니까, 업데이트는 설치된 스크립트를 덮어쓰는 방식으로 해줘.</p>`;
    }

    const KEY_SHAPE = { naiKey: /^pst-/, geminiKey: /^AIza/, deepseekKey: /^sk-/ };
    const KEY_NAME = { naiKey: 'NovelAI 토큰(pst-…)', geminiKey: 'Gemini 키(AIza…)', deepseekKey: 'DeepSeek 키(sk-…)' };
    function keyOwner(v) { return Object.keys(KEY_SHAPE).find(f => KEY_SHAPE[f].test(v)) || null; }
    function keyHint(field, v) {
        if (!v) return '아직 없음';
        const owner = keyOwner(v);
        if (owner && owner !== field) return `<span style="color:var(--red)">이건 ${KEY_NAME[owner]}야. 여기엔 ${KEY_NAME[field]}를 넣어야 해.</span>`;
        if (!owner) return `<span style="color:var(--orange)">저장됨 · 보통 ${KEY_NAME[field].replace(/.*\((.*)\)/, '$1')} 로 시작하는데 형식이 달라</span>`;
        return '저장됨 · 이 브라우저의 확장 프로그램 저장소에만 있어';
    }

    // 붙여넣은 키를 저장. 다른 칸의 키 모양이면 맞는 칸으로 옮긴다.
    const lastKey = {};
    function saveKey(field, raw) {
        const v = String(raw || '').replace(/^Bearer\s+/i, '').replace(/\s+/g, '');
        if (lastKey[field] === v) return;
        lastKey[field] = v;
        const owner = keyOwner(v);
        if (owner && owner !== field) {
            Store.setSecret(owner, v);
            // 이 칸에 원래 있던 값도 다른 서비스 키였다면 지운다
            const cur = Store.secrets()[field];
            if (cur && keyOwner(cur) && keyOwner(cur) !== field) Store.setSecret(field, '');
            UI.toast({ title: `${KEY_NAME[owner]}이라 그 칸에 넣었어`, body: `${KEY_NAME[field]} 칸에는 그 서비스의 키를 따로 넣어줘.`, kind: 'ok' });
            render();
            return;
        }
        Store.setSecret(field, v);
        const hint = win?.el.querySelector(`[data-key-hint="${field}"]`);
        if (hint) hint.innerHTML = keyHint(field, v);
    }

    // ── 스타일 ───────────────────────────────────────────
    function stylePane() {
        const s = Store.settings();
        return `
          <p class="footnote" style="margin:0 4px 14px">여기 쓴 태그는 <b>모든 장면의 베이스 프롬프트 맨 앞</b>에 들어가. 작가·화풍·퀄리티 태그는 여기에만 넣어줘. 캐릭터 외형 칸에 넣어도 생성할 때 자동으로 이쪽으로 올라와.</p>
          <div class="section-title">기본 스타일</div>
          <div class="group">
            <div class="item col"><span class="sub">포지티브 · 작가 · 화풍 · 퀄리티</span><textarea class="ta mono" data-k="style.pos" spellcheck="false" placeholder="artist:이름, 0.8::artist:다른작가::, painterly, …">${val(s.style.pos)}</textarea></div>
            <div class="item col"><span class="sub">네거티브</span><textarea class="ta mono short" data-k="style.neg" spellcheck="false" placeholder="lowres, bad anatomy, …">${val(s.style.neg)}</textarea></div>
          </div>
          <div class="section-title"><span>프리셋</span><span class="grow"></span><button class="btn" data-act="preset-new">${icons.plus}지금 스타일로 추가</button></div>
          <div class="group">
            ${s.presets.length ? s.presets.map(p => `
              <div class="item"><span class="label"><b>${esc(p.name)}</b><small class="mono">${esc(p.pos.slice(0, 90) || '(포지티브 없음)')}</small></span>
                <button class="btn" data-act="preset-apply" data-id="${esc(p.id)}">적용</button>
                <button class="icon-btn sm" data-act="preset-del" data-id="${esc(p.id)}" title="삭제">${icons.trash}</button></div>`).join('')
              : `<div class="item"><span class="label muted">저장된 프리셋이 없어. 작가 조합을 바꿔 가며 쓸 때 편해.</span></div>`}
          </div>`;
    }

    // ── 캐릭터 ───────────────────────────────────────────
    function charsPane() {
        const s = Store.settings();
        const roomId = Crack.roomId();
        const inRoom = new Set(s.rooms?.[roomId]?.chars || []);
        const c = s.characters.find(x => x.id === selChar);
        if (c) return charDetail(c, roomId, inRoom.has(c.id));
        const colors = ['#ff9f0a', '#34c759', '#ff375f', '#30b0c7', '#bf5af2', '#0a84ff'];
        return `
          <p class="footnote" style="margin:0 4px 14px">인물마다 <b>외형과 기본 의상</b>만 저장해. 자세·표정은 장면마다 AI가 채워. 등록한 인물은 채팅방별로 켜고 끌 수 있어.</p>
          <div class="section-title"><span>등록 인물 ${s.characters.length}명</span><span class="grow"></span><button class="btn" data-act="char-new">${icons.plus}새 인물</button></div>
          ${s.characters.length ? `<div class="group char-list">${s.characters.map((x, i) => `
            <button data-char="${esc(x.id)}"><span class="avatar" style="background:${colors[i % colors.length]}">${esc((x.name || '?').slice(0, 1))}</span>
              <span class="meta"><b>${esc(x.name || '(이름 없음)')}</b><small class="mono">${esc(Core.joinTags([x.look, x.outfit]).slice(0, 80) || '외형 없음')}</small></span>
              ${roomId && inRoom.has(x.id) ? '<span class="badge blue">이 방</span>' : ''}<span class="chev">${icons.disclose}</span></button>`).join('')}</div>`
            : `<div class="group"><div class="item"><span class="label muted">아직 없어. 등록 안 해도 AI가 엑스트라로 외형을 지어서 그리지만, 매번 달라져.</span></div></div>`}`;
    }

    function charDetail(c, roomId, inRoom) {
        const styleTags = Core.splitTags(Core.joinTags([c.look, c.outfit])).filter(t => ['style', 'quality'].includes(Core.classify(t)));
        return `
          <div class="row" style="margin-bottom:12px"><button class="btn ghost" data-act="char-back">${icons.left}모든 인물</button><span class="grow"></span><button class="btn danger" data-act="char-del">삭제</button></div>
          <div class="group">
            <div class="item"><span class="label"><b>이름</b><small>채팅에 나오는 이름 그대로</small></span><input class="field" data-c="name" value="${val(c.name)}" style="max-width:260px"></div>
            <div class="item"><span class="label"><b>별칭</b><small>쉼표로 구분 · 성만, 애칭 등</small></span><input class="field" data-c="aliases" value="${val(c.aliases.join(', '))}" style="max-width:260px"></div>
            ${roomId ? `<div class="item"><span class="label"><b>이 채팅방에서 사용</b></span>${UI.switchHtml('char-room', inRoom)}</div>` : ''}
          </div>
          <div class="section-title"><span>캐릭터 프롬프트</span><span class="where">${icons.person}char_captions</span></div>
          <div class="group">
            <div class="item col"><span class="sub">외형 · 성별, 머리, 눈, 체형</span><textarea class="ta mono" data-c="look" spellcheck="false" placeholder="girl, long black hair, red eyes, slender">${val(c.look)}</textarea></div>
            <div class="item col"><span class="sub">기본 의상 · 장면에서 갈아입으면 AI가 바꿔</span><textarea class="ta mono short" data-c="outfit" spellcheck="false" placeholder="white shirt, black skirt">${val(c.outfit)}</textarea></div>
            <div class="item col"><span class="sub">이 인물만의 UC</span><input class="field mono" data-c="uc" spellcheck="false" value="${val(c.uc)}"></div>
          </div>
          ${styleTags.length ? `<div class="notes"><div class="note warn">${icons.warn}<span class="grow">작가·화풍 태그가 섞여 있어: <code>${esc(styleTags.join(', '))}</code><br>이건 그림 전체에 걸리는 태그라 캐릭터 칸이 아니라 베이스에 있어야 해.</span><button class="btn" data-act="char-move-style">스타일로 옮기기</button></div></div>` : ''}`;
    }

    // ── 이 채팅방 ────────────────────────────────────────
    function roomPane() {
        const roomId = Crack.roomId();
        if (!roomId) return `<div class="group"><div class="item"><span class="label muted">채팅방을 열면 방별 설정이 보여.</span></div></div>`;
        const s = Store.settings();
        const room = s.rooms[roomId] || {};
        const inRoom = new Set(room.chars || []);
        return `
          <div class="section-title">이 방에 나오는 인물</div>
          <div class="group">
            ${s.characters.length ? s.characters.map(c => `<div class="item"><span class="label"><b>${esc(c.name)}</b><small class="mono">${esc(Core.joinTags([c.look, c.outfit]).slice(0, 70))}</small></span>${UI.switchHtml(`room-${c.id}`, inRoom.has(c.id))}</div>`).join('')
              : `<div class="item"><span class="label muted">등록한 인물이 없어.</span><button class="btn" data-act="goto-chars">캐릭터 등록</button></div>`}
          </div>
          <div class="section-title">인원</div>
          <div class="group">
            <div class="item"><span class="label"><b>그릴 인원</b><small>기본값: ${esc({ auto: '자동', 1: '1명', 2: '최대 2명', 3: '최대 3명' }[s.scene.people] || '자동')}</small></span>${UI.seg('room-people', [['default', '기본값'], ['auto', '자동'], ['1', '1명'], ['2', '최대 2명']], String(room.people || 'default'))}</div>
            <div class="item"><span class="label"><b>꼭 그릴 인물</b><small>인원을 1명으로 하면 이 인물을 그려 · 자동이면 AI가 장면의 중심 인물을 골라</small></span>
              <select class="select" data-room="focus" style="width:auto">${UI.options([['', '자동'], ...s.characters.filter(c => inRoom.has(c.id)).map(c => [c.id, c.name])], room.focus || '')}</select></div>
          </div>
          <div class="section-title">세계관 · 장소 메모</div>
          <div class="group"><div class="item col"><textarea class="ta" data-room="note" placeholder="예: 1920년대 경성. 주인공 집은 한옥, 카페는 서양식 인테리어.">${val(room.note)}</textarea></div></div>
          <p class="footnote">장면 분석 AI에게 참고로 줘. 프롬프트에 그대로 들어가지는 않아.</p>
          <div class="section-title">맥락</div>
          <div class="group"><div class="item"><span class="label"><b>앞 대화 몇 턴까지 읽을지</b><small>화면에 그려진 메시지 기준</small></span>
            <select class="select" data-k="ui.contextTurns" data-num style="width:auto">${UI.options([[0, '안 읽음'], [2, '2턴'], [4, '4턴'], [6, '6턴'], [10, '10턴']], s.ui.contextTurns)}</select></div></div>`;
    }

    // ── 생성 옵션 ────────────────────────────────────────
    function genPane() {
        const s = Store.settings();
        const g = s.gen;
        const v5 = Core.model(s.model).family === 'v5';
        const ucOpts = [[2, '없음'], ...Object.keys(NAI.ucTable(s.model)).map(k => [k, NAI.UC_LABELS[k]])];
        const num = (k, label, step, sub = '') => `<div class="item"><span class="label"><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</span><input class="field num mono" type="number" step="${step}" data-k="gen.${k}" data-num value="${val(g[k])}"></div>`;
        return `
          <div class="section-title">인원</div>
          <div class="group">
            <div class="item"><span class="label"><b>그릴 인원</b><small>1명이면 장면의 중심 인물 한 명만 solo로 그려. 채팅방마다 따로 정할 수도 있어.</small></span>${UI.seg('people', [['auto', '자동'], ['1', '1명'], ['2', '최대 2명'], ['3', '최대 3명']], String(s.scene.people))}</div>
          </div>
          <div class="section-title">모델</div>
          <div class="group">
            <div class="item"><span class="label"><b>NovelAI 모델</b><small>${v5 ? 'V5: 캐릭터 칸이 베이스 예산과 따로 · 최대 22명' : 'V4.5: 베이스+캐릭터 합산 512토큰 · 최대 6명'}</small></span>
              <select class="select" data-k="model" style="width:auto">${UI.options(Object.values(Core.MODELS).map(m => [m.id, m.label]), s.model)}</select></div>
            <div class="item"><span class="label"><b>크기</b></span>${UI.seg('size', Object.entries(NAI.SIZES).map(([k, v]) => [k, `${v.label} ${v.w}×${v.h}`]), g.size)}</div>
          </div>
          <div class="section-title">품질</div>
          <div class="group">
            ${v5 ? `<div class="item"><span class="label"><b>퀄리티 태그</b><small>베이스 끝에 붙어 · ${esc(NAI.V5_QUALITY[g.qualityV5] || '없음')}</small></span>${UI.seg('qualityV5', [['none', '없음'], ['light', 'Light'], ['standard', 'Standard']], g.qualityV5)}</div>`
                 : `<div class="item"><span class="label"><b>퀄리티 태그 추가</b><small>NovelAI 서버가 붙여</small></span>${UI.switchHtml('qualityV45', g.qualityV45 !== false)}</div>`}
            <div class="item"><span class="label"><b>UC 프리셋</b></span><select class="select" data-k="gen.ucPreset" data-num style="width:auto">${UI.options(ucOpts, NAI.ucPresetFor(s.model, g.ucPreset))}</select></div>
          </div>
          <div class="section-title">샘플링</div>
          <div class="group">
            ${num('steps', '스텝', 1, '28 이하는 Opus 무료')}
            ${v5 ? num('scaleV5', 'Guidance', 0.1, 'V5 기본 5') : num('scaleV45', 'Guidance', 0.1, 'V4.5 기본 6')}
            ${v5 ? num('rescaleV5', 'Rescale', 0.01) : num('rescaleV45', 'Rescale', 0.01)}
            <div class="item"><span class="label"><b>샘플러</b></span><select class="select" data-k="gen.sampler" style="width:auto">${UI.options([['k_euler_ancestral', 'Euler Ancestral'], ['k_euler', 'Euler'], ['k_dpmpp_2s_ancestral', 'DPM++ 2S Ancestral'], ['k_dpmpp_2m_sde', 'DPM++ 2M SDE'], ['k_dpmpp_2m', 'DPM++ 2M'], ['k_dpmpp_sde', 'DPM++ SDE']], g.sampler)}</select></div>
            <div class="item"><span class="label"><b>노이즈 스케줄</b></span><select class="select" data-k="gen.noise" style="width:auto">${UI.options([['karras', 'Karras'], ['exponential', 'Exponential'], ['polyexponential', 'Polyexponential']], g.noise)}</select></div>
          </div>
          <div class="section-title">인물 배치</div>
          <div class="group">
            <div class="item"><span class="label"><b>좌우 위치 지정</b><small>켜면 AI가 고른 좌·중·우 위치를 NAI에 보내. 2명 이상일 때만 쓰여.</small></span>${UI.switchHtml('useCoords', !!g.useCoords)}</div>
          </div>`;
    }

    // ── 저장 공간 ────────────────────────────────────────
    function storagePane() {
        const f = Store.settings().folder;
        return `
          <div class="section-title">내 컴퓨터 폴더</div>
          <div class="group">
            ${Folder.supported ? `
            <div class="item"><span class="label"><b>폴더에도 저장</b><small>생성할 때마다 PNG를 이 폴더에 바로 써. NovelAI 메타데이터(프롬프트·시드)도 그대로 들어 있어.</small></span>${UI.switchHtml('folder-enabled', !!f.enabled)}</div>
            <div class="item"><span class="label"><b>저장 폴더</b><small data-folder-status>확인 중…</small></span><button class="btn" data-act="folder-pick">폴더 선택…</button><button class="btn hidden" data-act="folder-grant">다시 허용</button></div>
            <div class="item"><span class="label"><b>채팅방마다 하위 폴더</b><small>폴더/채팅방 이름/날짜_제목_시드.png</small></span>${UI.switchHtml('folder-perRoom', f.perRoom !== false)}</div>`
            : `<div class="item"><span class="label"><b>이 브라우저는 폴더 지정을 지원하지 않아</b><small>Chrome · Edge · Whale 에서 쓸 수 있어. 대신 생성할 때마다 다운로드 폴더로 받을 수 있어.</small></span></div>`}
            <div class="item"><span class="label"><b>생성할 때마다 다운로드</b><small>${Folder.supported ? '폴더 저장을 끈 경우에만 · ' : ''}브라우저 다운로드 폴더로 받아</small></span>${UI.switchHtml('folder-download', !!f.download)}</div>
          </div>
          <p class="footnote">채팅 안에 보이는 삽화는 폴더 저장과 상관없이 이 브라우저(IndexedDB)에 따로 보관돼. 브라우저를 다시 열면 폴더 권한을 한 번 더 물어볼 수 있어.</p>

          <div class="section-title">이 브라우저</div>
          <div class="group">
            <div class="item"><span class="label"><b>사용량</b></span><span class="muted" data-usage>계산 중…</span></div>
            <div class="item"><span class="label"><b>이 채팅방 삽화</b></span><span class="muted" data-room-count>…</span><button class="btn danger" data-act="clear-room">모두 지우기</button></div>
          </div>
          <p class="footnote">다른 기기와는 공유되지 않아.</p>
          <div class="section-title">정보</div>
          <div class="group">
            <div class="item"><span class="label"><b>Crack Painter</b><small>버전 ${esc(VERSION)}</small></span><a class="btn" href="https://github.com/w7k4x9/crack-painter" target="_blank" rel="noopener">GitHub</a></div>
          </div>`;
    }

    async function fillFolder() {
        const el = win?.el.querySelector('[data-folder-status]');
        if (!el) return;
        const st = await Folder.status();
        const grant = win.el.querySelector('[data-act="folder-grant"]');
        if (!st.set) { el.textContent = '아직 안 골랐어'; grant?.classList.add('hidden'); return; }
        el.innerHTML = `<b style="font-weight:500;color:var(--text)">${esc(st.name)}</b> · ${st.permission === 'granted' ? '<span style="color:var(--green)">쓰기 허용됨</span>' : '<span style="color:var(--orange)">권한 다시 필요</span>'}`;
        grant?.classList.toggle('hidden', st.permission === 'granted');
        win.el.querySelector('[data-act="folder-pick"]').textContent = '변경…';
    }

    async function fillStorage() {
        fillFolder();
        const u = await Store.usage();
        const el = win?.el.querySelector('[data-usage]');
        const fmt = b => b > 1e9 ? `${(b / 1e9).toFixed(1)}GB` : `${Math.round(b / 1e6)}MB`;
        if (el) el.textContent = u ? `${fmt(u.used)} / ${fmt(u.quota)}` : '알 수 없음';
        const roomId = Crack.roomId();
        const rc = win?.el.querySelector('[data-room-count]');
        if (rc) {
            if (!roomId) rc.textContent = '채팅방 밖';
            else {
                const list = await Store.roomRecords(roomId);
                rc.textContent = `${list.length}개 답변 · ${list.reduce((a, r) => a + (r.history?.length || 0), 0)}장`;
            }
        }
    }

    // ── 이벤트 ───────────────────────────────────────────
    function setPath(obj, path, value) {
        const keys = path.split('.');
        let o = obj;
        for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]] = o[keys[i]] || {};
        o[keys[keys.length - 1]] = value;
    }

    function updateChar(fn) {
        Store.update(d => {
            const c = d.characters.find(x => x.id === selChar);
            if (c) fn(c, d);
        });
    }

    let keyTimer = 0;
    function bind() {
        const el = win.el;
        // 키는 입력하는 즉시 저장 (Esc로 창을 닫아도 남게)
        el.addEventListener('input', ev => {
            const t = ev.target;
            if (!t.dataset.secret) return;
            clearTimeout(keyTimer);
            keyTimer = setTimeout(() => saveKey(t.dataset.secret, t.value), 400);
        });
        el.addEventListener('click', async ev => {
            const navBtn = ev.target.closest('[data-pane]');
            if (navBtn) { pane = navBtn.dataset.pane; selChar = null; render(); return; }
            const charBtn = ev.target.closest('[data-char]');
            if (charBtn) { selChar = charBtn.dataset.char; render(); return; }
            const segBtn = ev.target.closest('.seg button');
            if (segBtn) {
                const name = segBtn.parentElement.dataset.seg;
                const v = segBtn.dataset.v;
                Store.update(d => {
                    if (name === 'provider') d.analyzer.provider = v;
                    else if (name === 'size') d.gen.size = v;
                    else if (name === 'qualityV5') d.gen.qualityV5 = v;
                    else if (name === 'people') d.scene.people = v;
                    else if (name === 'room-people' && Crack.roomId()) { const r = d.rooms[Crack.roomId()] = d.rooms[Crack.roomId()] || {}; r.people = v; }
                });
                render();
                return;
            }
            const btn = ev.target.closest('[data-act]');
            if (!btn || btn.closest('.lights')) return;
            const act = btn.dataset.act;
            const roomId = Crack.roomId();
            if (act === 'folder-pick') {
                try {
                    await Folder.pick();
                    Store.update(d => { d.folder.enabled = true; });
                    render();
                    UI.toast({ title: '저장 폴더를 정했어', kind: 'ok', body: '다음 생성부터 이 폴더에도 저장돼.' });
                } catch (e) {
                    if (e?.name !== 'AbortError') App.reportError(e, '폴더를 열지 못했어');
                }
                return;
            }
            if (act === 'folder-grant') { await Folder.prime(true); fillFolder(); return; }
            if (act === 'test-nai') testNai();
            else if (act === 'test-llm') testLlm();
            else if (act === 'preset-new') {
                const name = prompt('프리셋 이름', '');
                if (!name) return;
                Store.update(d => { d.presets.push({ id: Store.uid('ps'), name: name.trim().slice(0, 40), pos: d.style.pos, neg: d.style.neg }); });
                render();
            } else if (act === 'preset-apply') {
                Store.update(d => { const p = d.presets.find(x => x.id === btn.dataset.id); if (p) d.style = { pos: p.pos, neg: p.neg ?? d.style.neg }; });
render();
                                UI.toast({ title: '스타일을 바꿨어', kind: 'ok' });
            } else if (act === 'preset-del') {
                Store.update(d => { d.presets = d.presets.filter(x => x.id !== btn.dataset.id); });
                render();
            } else if (act === 'char-new') {
                const id = Store.uid('ch');
                Store.update(d => {
                    d.characters.push({ id, name: '', aliases: [], look: '', outfit: '', uc: '' });
                    if (roomId) { d.rooms[roomId] = d.rooms[roomId] || {}; d.rooms[roomId].chars = [...(d.rooms[roomId].chars || []), id]; }
                });
                selChar = id;
                render();
                win.el.querySelector('[data-c="name"]')?.focus();
            } else if (act === 'char-back') { selChar = null; render(); }
            else if (act === 'char-del') {
                const ok = await App.confirmToast('이 인물을 지울까?', '모든 채팅방에서 빠져.', '삭제', true);
                if (!ok) return;
                const id = selChar;
                Store.update(d => {
                    d.characters = d.characters.filter(x => x.id !== id);
                    Object.values(d.rooms).forEach(r => { if (r.chars) r.chars = r.chars.filter(x => x !== id); });
                });
                selChar = null;
                render();
            } else if (act === 'char-move-style') {
                updateChar((c, d) => {
                    const moved = [];
                    const strip = text => Core.joinTags(Core.splitTags(text).filter(t => {
                        const k = Core.classify(t);
                        if (k === 'style' || k === 'quality') { moved.push(t); return false; }
                        return true;
                    }));
                    c.look = strip(c.look);
                    c.outfit = strip(c.outfit);
                    d.style.pos = Core.joinTags(Core.dedupe([...Core.splitTags(d.style.pos), ...moved]));
                });
                render();
                UI.toast({ title: '스타일로 옮겼어', kind: 'ok', body: '설정 → 스타일에서 확인할 수 있어.' });
            } else if (act === 'goto-chars') { pane = 'chars'; render(); }
            else if (act === 'clear-room') {
                if (!roomId) return;
                const ok = await App.confirmToast('이 채팅방 삽화를 모두 지울까?', '되돌릴 수 없어.', '모두 삭제', true);
                if (!ok) return;
                for (const r of await Store.roomRecords(roomId)) await Store.deleteRecord(roomId, r.messageKey);
                document.querySelectorAll('.cp-figure').forEach(f => f.remove());
                fillStorage();
            }
        });

        el.addEventListener('change', ev => {
            const t = ev.target;
            const roomId = Crack.roomId();
            if (t.dataset.secret) {
                clearTimeout(keyTimer);
                saveKey(t.dataset.secret, t.value);
            } else if (t.dataset.k) {
                const v = t.dataset.num !== undefined ? Number(t.value) : t.value;
                Store.update(d => setPath(d, t.dataset.k, v));
                if (t.dataset.k === 'model') render();
            } else if (t.dataset.c) {
                const field = t.dataset.c;
                updateChar(c => { c[field] = field === 'aliases' ? t.value.split(',').map(a => a.trim()).filter(Boolean) : t.value; });
                if (field === 'look' || field === 'outfit') render();
            } else if (t.dataset.room) {
                if (!roomId) return;
                Store.update(d => { d.rooms[roomId] = { ...(d.rooms[roomId] || {}), [t.dataset.room]: t.value }; });
            } else if (t.dataset.sw) {
                const sw = t.dataset.sw;
                if (sw.startsWith('folder-')) {
                    const key = sw.slice(7);
                    Store.update(d => { d.folder[key] = t.checked; });
                    if (key === 'enabled' && t.checked) Folder.status().then(st => { if (!st.set) win?.el.querySelector('[data-act="folder-pick"]')?.click(); });
                } else if (sw === 'qualityV45') Store.update(d => { d.gen.qualityV45 = t.checked; });
                else if (sw === 'useCoords') Store.update(d => { d.gen.useCoords = t.checked; });
                else if (sw === 'char-room' || sw.startsWith('room-')) {
                    const id = sw === 'char-room' ? selChar : sw.slice(5);
                    if (!roomId) return;
                    Store.update(d => {
                        const r = d.rooms[roomId] = d.rooms[roomId] || {};
                        const set = new Set(r.chars || []);
                        if (t.checked) set.add(id); else set.delete(id);
                        r.chars = Array.from(set);
                    });
                }
            }
        });
    }

    async function testNai() {
        const box = win?.el.querySelector('[data-nai-status]');
        const key = Store.secrets().naiKey;
        if (!box) return;
        if (!key) { box.innerHTML = '<b style="color:var(--red)">토큰이 없어</b>'; return; }
        box.innerHTML = '<small>확인 중…</small>';
        try {
            const d = await Net.request({ url: 'https://api.novelai.net/user/subscription', headers: { Authorization: `Bearer ${key}` }, timeout: 20000 });
            const tier = ['Paper', 'Tablet', 'Scroll', 'Opus'][d?.tier] || `Tier ${d?.tier}`;
            const anlas = (d?.trainingStepsLeft?.fixedTrainingStepsLeft || 0) + (d?.trainingStepsLeft?.purchasedTrainingSteps || 0);
            box.innerHTML = `<b style="color:var(--green)">연결됨</b><small>${esc(tier)} · Anlas ${anlas.toLocaleString()}${d?.active === false ? ' · 구독 비활성' : ''}</small>`;
        } catch (e) {
            box.innerHTML = `<b style="color:var(--red)">실패</b><small>${esc(e.message)}</small>`;
        }
    }

    async function testLlm() {
        const box = win?.el.querySelector('[data-llm-status]');
        if (!box) return;
        const s = Store.settings();
        const k = Store.secrets();
        const p = s.analyzer.provider;
        box.innerHTML = '<small>확인 중…</small>';
        try {
            await LLM.test(p, p === 'deepseek' ? k.deepseekKey : k.geminiKey, p === 'deepseek' ? s.analyzer.deepseekModel : s.analyzer.geminiModel);
            box.innerHTML = '<b style="color:var(--green)">연결됨</b><small>JSON 응답 확인</small>';
        } catch (e) {
            box.innerHTML = `<b style="color:var(--red)">실패</b><small>${esc(e.message)}</small>`;
        }
    }

    return { open };
})();


// ===== main.js =====
// ── 시작 ───────────────────────────────────────────────────
if (!window.__crackPainter) {
    window.__crackPainter = VERSION;
    const boot = () => { try { App.start(); } catch (e) { console.error('[Crack Painter] 시작 실패', e); } };
    if (document.body) setTimeout(boot, 600);
    else addEventListener('DOMContentLoaded', () => setTimeout(boot, 600));
}

})();
