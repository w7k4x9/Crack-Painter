// ==UserScript==
// @name         크랙 페인터
// @namespace    https://github.com/w7k4x9/crack-painter
// @version      __VERSION__
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
