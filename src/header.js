// ==UserScript==
// @name         크랙 페인터
// @namespace    https://github.com/w7k4x9/crack-painter
// @version      __VERSION__
// @description  크랙(crack.wrtn.ai) 장면을 NovelAI 삽화로. NAI 자동화 작품 JSON의 인물·감정 블록을 그대로 써서 감정 이미지와 같은 얼굴로 그림.
// @author       w7k4x9
// @match        https://crack.wrtn.ai/*
// @match        https://chatgpt.com/*
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%235b8cff%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%238b5cf6%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20x%3D%226%22%20y%3D%226%22%20width%3D%22116%22%20height%3D%22116%22%20rx%3D%2228%22%20fill%3D%22url%28%23g%29%22%2F%3E%3Cpath%20d%3D%22M24%2092%2050%2062c3-3%207-3%209%200l14%2016%207-7c3-3%206-3%209%200l15%2016v5c0%206-5%2010-10%2010H34c-5%200-9-4-10-10Z%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2284%22%20cy%3D%2244%22%20r%3D%2210%22%20fill%3D%22%23fff%22%2F%3E%3Cpath%20d%3D%22M44%2022c2%2012%207%2017%2019%2019-12%202-17%207-19%2019-2-12-7-17-19-19%2012-2%2017-7%2019-19Z%22%20fill%3D%22%23fff%22%20opacity%3D%22.85%22%2F%3E%3C%2Fsvg%3E
// @homepageURL  https://github.com/w7k4x9/crack-painter
// @downloadURL  https://raw.githubusercontent.com/w7k4x9/crack-painter/main/crack-painter.user.js
// @updateURL    https://raw.githubusercontent.com/w7k4x9/crack-painter/main/crack-painter.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_openInTab
// @grant        GM_registerMenuCommand
// @grant        GM_info
// @connect      image.novelai.net
// @connect      generativelanguage.googleapis.com
// @connect      api.anthropic.com
// @connect      api.openai.com
// @connect      raw.githubusercontent.com
// @require      https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.js
// @run-at       document-idle
// @noframes
// ==/UserScript==
