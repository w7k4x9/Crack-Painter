// ==UserScript==
// @name         Crack Painter
// @namespace    https://github.com/w7k4x9/crack-painter
// @version      __VERSION__
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
