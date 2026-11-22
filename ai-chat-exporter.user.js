// ==UserScript==
// @name         AIAA5050 AI Chat Exporter
// @namespace    lycs-aiaa5050-ai-chat-exporter
// @version      1.1.0
// @description  Export selected AI chat messages to a standalone HTML file.
// @author       Yucheng LIU
// @license      AGPL-3.0-or-later
// @match        https://chat.deepseek.com/a/chat/s/*
// @match        https://chat.deepseek.com/share/*
// @match        https://chat.qwen.ai/c/*
// @match        https://www.qianwen.com/chat/
// @match        https://www.qianwen.com/chat/*
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @connect      *
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  const UI_ID = 'aice-root';
  const MAX_PICK_DEPTH = 14;

  const EXPORT_CSS = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: #f7f8fa;
  color: #1f2328;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 15px;
  line-height: 1.65;
}
a { color: #2563eb; text-decoration: underline; text-underline-offset: 2px; }
.toc-panel {
  position: fixed;
  inset: 0 auto 0 0;
  width: 280px;
  height: 100vh;
  overflow: auto;
  padding: 30px 20px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
}
.toc-panel h2 {
  margin: 0 0 12px;
  color: #6b7280;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.toc-panel ul { list-style: none; margin: 0; padding: 0; }
.toc-item { margin: 0 0 4px; font-size: 13px; line-height: 1.45; }
.toc-item a {
  display: block;
  padding: 6px 8px;
  border-radius: 7px;
  color: #4b5563;
  text-decoration: none;
  overflow-wrap: anywhere;
}
.toc-item a:hover { background: #f3f4f6; color: #111827; }
.header-bar { margin-left: 280px; padding: 34px 40px 18px; }
.header-content { max-width: 900px; margin: 0 auto; }
.header-top { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.header-text h1 { margin: 0; font-size: 25px; line-height: 1.25; letter-spacing: -.02em; }
.header-meta { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 10px; color: #6b7280; font-size: 13px; }
.platform-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px 5px 6px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #fff;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
.platform-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}
.chat-container { margin-left: 280px; padding: 8px 40px 60px; }
.message { max-width: 900px; margin: 0 auto 22px; }
.message .toc-heading {
  margin: 0 0 8px;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .01em;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.message-body {
  padding: 18px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, .04);
}
.message.user .message-body { border-color: #dbe7ff; background: #eef4ff; }
.message-content {
  font-size: 15px;
  line-height: 1.7;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.message-content.plain-text { white-space: pre-wrap; }
.message-content > :first-child { margin-top: 0; }
.message-content > :last-child { margin-bottom: 0; }
.message-content p { margin: 0 0 .9em; }
.message-content .ds-markdown-paragraph,
.message-content .qwen-markdown-paragraph,
.message-content .qk-md-paragraph { margin: 0 0 .9em; }
.message-content .qwen-markdown-code,
.message-content .qwen-markdown-code-body,
.message-content .qk-md-code { white-space: pre; overflow: auto; }
.message-content .qwen-markdown-code-body,
.message-content .qk-md-code {
  padding: 14px 16px;
  border-radius: 10px;
  background: #0f172a;
  color: #e2e8f0;
  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
  font-size: .86em;
}
.message-content h1, .message-content h2, .message-content h3,
.message-content h4, .message-content h5, .message-content h6 {
  margin: 1.35em 0 .55em;
  line-height: 1.3;
}
.message-content h1 { font-size: 1.5em; }
.message-content h2 { font-size: 1.3em; }
.message-content h3 { font-size: 1.14em; }
.message-content h4, .message-content h5, .message-content h6 { font-size: 1em; }
.message-content ul, .message-content ol { margin: .7em 0; padding-left: 1.7em; }
.message-content li { margin: .25em 0; }
.message-content pre {
  margin: .9em 0;
  padding: 14px 16px;
  border-radius: 10px;
  background: #0f172a;
  color: #e2e8f0;
  overflow: auto;
  white-space: pre;
}
.message-content code {
  padding: .12em .35em;
  border-radius: 4px;
  background: #f1f5f9;
  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
  font-size: .88em;
}
.message-content pre code { padding: 0; background: none; color: inherit; font-size: .86em; }
.message-content table {
  display: block;
  width: 100%;
  margin: 1em 0;
  border-collapse: collapse;
  overflow-x: auto;
}
.message-content th, .message-content td {
  padding: .5em .7em;
  border: 1px solid #e2e8f0;
  text-align: left;
  vertical-align: top;
}
.message-content th { background: #f8fafc; font-weight: 600; }
.message-content blockquote {
  margin: 1em 0;
  padding: .1em 0 .1em 1em;
  border-left: 3px solid #cbd5e1;
  color: #475569;
}
.message-content hr { margin: 1.4em 0; border: 0; border-top: 1px solid #e2e8f0; }
.message-content img, .message-content video {
  max-width: 100%;
  height: auto;
  border-radius: 9px;
}
.message-content img.video-preview { max-height: 360px; width: auto; }
.message-content audio { max-width: 100%; }
.message-content .task-checkbox { margin-right: .3em; }
.message-content .attachment-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.message-content .attachment-gallery img { max-height: 360px; width: auto; }
.footer-bar {
  margin-left: 280px;
  padding: 0 40px 36px;
  color: #9ca3af;
  font-size: 12px;
  text-align: center;
}
.footer-bar a { color: #6b7280; }
body.theme-dark { color-scheme: dark; background: #0f1115; color: #e5e7eb; }
body.theme-dark .toc-panel { background: #12141a; border-color: #252836; }
body.theme-dark .toc-panel h2 { color: #8b8b9e; }
body.theme-dark .toc-item a { color: #a1a1b5; }
body.theme-dark .toc-item a:hover { background: #1c1f2a; color: #fff; }
body.theme-dark .header-meta { color: #9ca3af; }
body.theme-dark .platform-badge { background: #171a21; border-color: #2a2e3a; color: #d1d5db; }
body.theme-dark .message .toc-heading { color: #8b8b9e; }
body.theme-dark .message-body { background: #171a21; border-color: #252836; box-shadow: none; }
body.theme-dark .message.user .message-body { background: #172033; border-color: #243452; }
body.theme-dark .message-content a { color: #93c5fd; }
body.theme-dark .message-content code { background: #262b36; }
body.theme-dark .message-content th, body.theme-dark .message-content td { border-color: #334155; }
body.theme-dark .message-content th { background: #1f2937; }
body.theme-dark .message-content blockquote { border-color: #475569; color: #cbd5e1; }
body.theme-dark .message-content hr { border-color: #334155; }
body.theme-dark .footer-bar { color: #6b7280; }
body.theme-compact .toc-panel { display: none; }
body.theme-compact .header-bar, body.theme-compact .chat-container, body.theme-compact .footer-bar { margin-left: 0; }
body.theme-compact .header-bar { padding-top: 24px; }
body.theme-compact .message { max-width: 780px; margin-bottom: 12px; }
body.theme-compact .message-body { padding: 12px 14px; border-radius: 10px; }
body.theme-compact .message-content { font-size: 14px; line-height: 1.6; }
@media (max-width: 1100px) {
  .toc-panel { position: static; width: auto; height: auto; max-height: 40vh; border-right: 0; border-bottom: 1px solid #e5e7eb; }
  body.theme-dark .toc-panel { border-bottom-color: #252836; }
  .header-bar, .chat-container, .footer-bar { margin-left: 0; }
  .header-bar { padding: 22px 20px 14px; }
  .chat-container { padding: 8px 20px 40px; }
  .footer-bar { padding: 0 20px 28px; }
}
@media print {
  .toc-panel, .footer-bar { display: none !important; }
  .header-bar, .chat-container { margin-left: 0 !important; padding-left: 0 !important; padding-right: 0 !important; }
  body { background: #fff !important; color: #000 !important; }
  .message { break-inside: avoid; page-break-inside: avoid; }
  .message-body { box-shadow: none !important; }
}
`;

  const MODAL_CSS = `
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; }
.hidden { display: none !important; }
.msg-list.hidden { display: none; }
.fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2147483647;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 17px;
  border: 1px solid rgba(255, 255, 255, .14);
  border-radius: 999px;
  background: #1f2937;
  color: #fff;
  font: 600 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", sans-serif;
  box-shadow: 0 10px 30px rgba(0, 0, 0, .28);
  cursor: pointer;
}
.fab:hover { background: #111827; }
.fab:focus-visible { outline: 2px solid #34d399; outline-offset: 3px; }
.fab svg { width: 16px; height: 16px; flex: 0 0 auto; }
.overlay {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(3, 7, 18, .58);
  backdrop-filter: blur(2px);
  font: 400 13px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", sans-serif;
  color: #e5e7eb;
}
.overlay.hidden { display: none; }
.modal {
  display: flex;
  flex-direction: column;
  width: min(980px, 100%);
  max-height: min(88vh, 920px);
  overflow: hidden;
  border: 1px solid #2c2c3c;
  border-radius: 16px;
  background: #171722;
  box-shadow: 0 28px 90px rgba(0, 0, 0, .48);
}
.modal-header, .toolbar, .settings, .modal-footer { flex: 0 0 auto; }
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px 16px;
}
.header-main { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; min-width: 0; }
.modal-header h2 { margin: 0; color: #f8fafc; font-size: 19px; line-height: 1.3; font-weight: 700; }
.count { color: #9ca3af; font-size: 13px; white-space: nowrap; }
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid #343446;
  border-radius: 9px;
  background: #1d1d29;
  color: #cbd5e1;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}
.icon-btn:hover { background: #262635; color: #fff; }
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 0 20px 14px;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 6px 11px;
  border: 1px solid #343446;
  border-radius: 8px;
  background: #1d1d29;
  color: #dbe3ef;
  font: 500 12.5px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", sans-serif;
  white-space: nowrap;
  cursor: pointer;
}
.btn:hover { background: #262635; border-color: #44445a; color: #fff; }
.btn:disabled { opacity: .45; cursor: not-allowed; }
.btn.primary { border-color: #10b981; background: #10b981; color: #fff; font-weight: 700; }
.btn.primary:hover { border-color: #34d399; background: #34d399; }
.btn.ghost { border-color: transparent; background: transparent; color: #a5b4fc; }
.settings {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  padding: 0 20px 16px;
  border-bottom: 1px solid #2a2a3a;
}
.settings label { display: inline-flex; align-items: center; gap: 7px; color: #aeb4c2; font-size: 12.5px; }
.settings select, .settings input[type="text"] {
  height: 32px;
  padding: 0 9px;
  border: 1px solid #343446;
  border-radius: 8px;
  background: #11111a;
  color: #e5e7eb;
  font: 400 12.5px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", sans-serif;
}
.settings input[type="text"] { min-width: 230px; flex: 1 1 260px; }
.settings input[type="checkbox"] { width: 15px; height: 15px; accent-color: #10b981; }
.settings .title-label { flex: 1 1 280px; min-width: 220px; }
.settings .title-label input { width: 100%; }
.list-wrap { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; }
.table-head, .msg-row {
  display: grid;
  grid-template-columns: 40px 52px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
}
.table-head {
  border-bottom: 1px solid #2a2a3a;
  color: #8b8b9e;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.msg-list { flex: 1 1 auto; min-height: 0; overflow: auto; }
.msg-row { border-bottom: 1px solid #232332; cursor: pointer; }
.msg-row:hover { background: #1e1e2b; }
.msg-row.selected { background: #1a1d24; }
.msg-row.selected:hover { background: #20242d; }
.checkbox { width: 16px; height: 16px; margin: 0; accent-color: #10b981; cursor: pointer; }
.role-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 24px;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 800;
}
.role-badge.user { background: #0f3d33; color: #34d399; }
.role-badge.assistant { background: #252352; color: #a5b4fc; }
.preview {
  min-width: 0;
  overflow: hidden;
  color: #cbd5e1;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.empty {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 46px 20px;
  color: #9ca3af;
  text-align: center;
}
.empty.hidden { display: none; }
.empty strong { color: #e5e7eb; font-size: 14px; }
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 20px;
  border-top: 1px solid #2a2a3a;
  background: #14141d;
}
.selected-count { color: #9ca3af; font-size: 13px; }
.export { min-width: 190px; }
.pick-banner {
  position: fixed;
  top: 18px;
  left: 50%;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  gap: 14px;
  max-width: min(760px, calc(100vw - 32px));
  padding: 11px 13px 11px 16px;
  border: 1px solid #2c6e57;
  border-radius: 12px;
  background: #10231d;
  color: #d1fae5;
  font: 500 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", sans-serif;
  box-shadow: 0 14px 48px rgba(0, 0, 0, .34);
  transform: translateX(-50%);
}
.pick-banner.hidden { display: none; }
.pick-banner .btn { flex: 0 0 auto; }
.pick-banner:not(.hidden) ~ .toast { top: 78px; }
.toast {
  position: fixed;
  top: 18px;
  left: 50%;
  z-index: 2147483647;
  max-width: min(620px, calc(100vw - 32px));
  padding: 10px 15px;
  border: 1px solid #343446;
  border-radius: 10px;
  background: #111827;
  color: #f8fafc;
  font: 500 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", sans-serif;
  box-shadow: 0 12px 36px rgba(0, 0, 0, .3);
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, -8px);
  transition: opacity .18s ease, transform .18s ease;
}
.toast.show { opacity: 1; transform: translate(-50%, 0); }
@media (max-width: 720px) {
  .overlay { padding: 0; }
  .modal { width: 100%; max-height: 100vh; height: 100vh; border: 0; border-radius: 0; }
  .table-head, .msg-row { grid-template-columns: 34px 44px minmax(0, 1fr); padding-left: 14px; padding-right: 14px; }
  .modal-header, .toolbar, .settings, .modal-footer { padding-left: 14px; padding-right: 14px; }
  .modal-footer { flex-wrap: wrap; }
  .export { width: 100%; }
}
`;

  const UI_HTML = `
<style>${MODAL_CSS}</style>
<button class="fab" type="button" title="Export chat (Alt+Shift+E)">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
  <span>Export Chat</span>
</button>
<div class="overlay hidden" role="dialog" aria-modal="true" aria-labelledby="aice-title">
  <div class="modal">
    <div class="modal-header">
      <div class="header-main">
        <h2 id="aice-title">Select messages to export</h2>
        <span class="count">0 messages in total</span>
      </div>
      <button class="icon-btn close" type="button" aria-label="Close">&times;</button>
    </div>
    <div class="toolbar">
      <button class="btn" type="button" data-action="all">Select All</button>
      <button class="btn" type="button" data-action="none">Select None</button>
      <button class="btn" type="button" data-action="invert">Invert Selection</button>
      <button class="btn" type="button" data-action="questions">Select Questions</button>
      <button class="btn" type="button" data-action="answers">Select Answers</button>
      <button class="btn ghost" type="button" data-action="pick">Pick on page</button>
      <button class="btn" type="button" data-action="refresh">Refresh</button>
    </div>
    <div class="settings">
      <label>Export Format
        <select class="format">
          <option value="html">HTML</option>
        </select>
      </label>
      <label>Style
        <select class="style">
          <option value="default">Default</option>
          <option value="dark">Dark</option>
          <option value="compact">Compact</option>
        </select>
      </label>
      <label class="embed">
        <input type="checkbox" class="embed-check" checked>
        Embed images
      </label>
      <label class="title-label">Title
        <input type="text" class="title-input" maxlength="120" placeholder="Conversation title">
      </label>
    </div>
    <div class="table-head"><span></span><span>Role</span><span>Preview</span></div>
    <div class="list-wrap">
      <div class="msg-list" role="listbox" aria-multiselectable="true"></div>
      <div class="empty hidden">
        <strong>No messages detected</strong>
        <span>Try opening a conversation first, then press Refresh, or use Pick on page.</span>
        <button class="btn" type="button" data-action="pick">Pick on page</button>
      </div>
    </div>
    <div class="modal-footer">
      <span class="selected-count">Selected 0 / 0 messages</span>
      <button class="btn primary export" type="button" disabled>Export Selected (0 messages)</button>
    </div>
  </div>
</div>
<div class="pick-banner hidden">
  <span>Click a message bubble to select the conversation. Press Esc to cancel.</span>
  <button class="btn" type="button" data-action="cancel-pick">Cancel</button>
</div>
<div class="toast" role="status" aria-live="polite"></div>
`;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function normalizeText(value) {
    return String(value || '')
      .replace(/\uFEFF/g, '')
      .replace(/\u200B/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function truncate(value, max) {
    const text = String(value || '');
    const chars = Array.from(text);
    if (chars.length <= max) return text;
    return `${chars.slice(0, Math.max(0, max - 1)).join('').trimEnd()}…`;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function sanitizeFilename(value) {
    const cleaned = String(value || '')
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^\.+|\.+$/g, '');
    return Array.from(cleaned).slice(0, 100).join('') || 'AI Chat Export';
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function formatClock(date) {
    return `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
  }

  function formatFileStamp(date) {
    return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}_${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`;
  }

  function toAbsoluteUrl(value, base) {
    if (!value) return value;
    const text = String(value).trim();
    if (!text) return text;
    if (/^(javascript:|vbscript:)/i.test(text)) return '';
    if (/^(data:|blob:|mailto:|tel:)/i.test(text)) return text;
    try {
      return new URL(text, base || location.href).href;
    } catch {
      return text;
    }
  }

  function classText(el) {
    if (!el) return '';
    const cls = typeof el.className === 'string' ? el.className : '';
    return `${cls} ${el.id || ''}`;
  }

  function isInChrome(el) {
    return !!el.closest('aside, nav, header, [id*="sidebar" i], [data-testid*="sidebar" i], [class~="sidebar"], [class^="sidebar-"], [class*=" sidebar-"]');
  }

  function elementBackgroundSource(el) {
    if (!el || el.nodeType !== 1) return '';
    if (/^(IMG|VIDEO|AUDIO|CANVAS|SOURCE|PICTURE)$/.test(el.tagName)) return '';
    const inline = el.style && el.style.backgroundImage ? el.style.backgroundImage : '';
    const label = `${el.getAttribute('role') || ''} ${el.getAttribute('aria-label') || ''}`;
    const classHint = /image|img|photo|picture|thumb|preview|media|poster|cover/i.test(classText(el))
      || /img|image|photo|picture/i.test(label);
    let value = inline;
    if (!value && classHint && typeof getComputedStyle === 'function') {
      try {
        value = getComputedStyle(el).backgroundImage || '';
      } catch {
        value = '';
      }
    }
    if (!value || /^(none|initial|inherit)$/i.test(value.trim()) || /gradient/i.test(value)) return '';
    const match = /url\((['"]?)([^'")]+)\1\)/i.exec(value);
    return match ? match[2].trim() : '';
  }

  function hasMedia(el) {
    if (!el || !el.querySelector) return false;
    if (el.querySelector('img, video, audio, canvas, picture, [style*="background-image"]')) return true;
    const candidates = el.querySelectorAll('[class*="image"], [class*="img"], [class*="thumb"], [class*="preview"]');
    for (const candidate of candidates) {
      if (elementBackgroundSource(candidate)) return true;
    }
    return false;
  }

  function markerRolesIn(el, adapter) {
    const roles = new Set();
    for (const rule of adapter.markerRules || []) {
      if (el.matches && el.matches(rule.selector) && !isInChrome(el)) roles.add(rule.role || 'message');
      for (const marker of el.querySelectorAll(rule.selector)) {
        if (!isInChrome(marker)) roles.add(rule.role || 'message');
      }
    }
    return roles;
  }

  function findMessageWrapper(el, adapter) {
    if (!el) return el;
    const selectors = [
      '.ds-message',
      '[data-virtual-list-item-key]',
      '.chat-round',
      '[class*="message-row"]',
      '[class*="message-item"]',
      '[class*="chat-message"]'
    ];
    for (const selector of selectors) {
      let found = null;
      try {
        found = el.closest(selector);
      } catch {
        found = null;
      }
      if (found && !isInChrome(found) && markerRolesIn(found, adapter).size <= 1) return found;
    }
    return el;
  }

  function compareDocumentOrder(a, b) {
    if (a === b) return 0;
    const pos = a.compareDocumentPosition(b);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  }

  function isNoticeText(text) {
    const value = normalizeText(text);
    if (!value) return false;
    return /(this shared conversation is generated by ai|shared conversation.*generated by ai|内容由\s*ai\s*生成|本对话由.*生成|该内容由.*ai.*生成)/i.test(value);
  }

  function isJunkMessage(text) {
    const value = normalizeText(text);
    return /^(copy|edit|share|like|dislike|regenerate|retry|复制|编辑|分享|重新生成|重新回答|点赞|点踩)$/i.test(value);
  }

  function firstSrcFromSrcset(value) {
    if (!value) return '';
    const first = String(value).split(',')[0].trim();
    return first.split(/\s+/)[0] || '';
  }

  function isPlaceholderImageSource(value) {
    const text = String(value || '').trim();
    if (!text) return true;
    if (/^data:image\/gif;base64,R0lGOD/i.test(text)) return true;
    if (/^data:image\/(?:gif|png);base64,[A-Za-z0-9+/=]{0,96}$/i.test(text)) return true;
    return false;
  }

  function imageSource(img) {
    if (!img) return '';
    const current = img.currentSrc || img.src || '';
    const lazy = img.getAttribute('data-src') || img.getAttribute('data-original')
      || img.getAttribute('data-lazy-src') || img.getAttribute('data-actualsrc')
      || firstSrcFromSrcset(img.getAttribute('data-srcset'))
      || firstSrcFromSrcset(img.getAttribute('srcset'));
    const width = img.naturalWidth || 0;
    const height = img.naturalHeight || 0;
    const tiny = width > 0 && width <= 32 && height > 0 && height <= 32;
    if (lazy && (isPlaceholderImageSource(current) || tiny)) return lazy;
    if (current) return current;
    return lazy || '';
  }

  function canvasDataUrl(canvas) {
    try {
      const dataUrl = canvas && canvas.toDataURL ? canvas.toDataURL('image/png') : '';
      if (/^data:image\/[a-z]+;base64,/i.test(dataUrl) && dataUrl.length > 64) return dataUrl;
    } catch {
      return '';
    }
    return '';
  }

  function loadedImageDataUrl(img) {
    try {
      const width = img && (img.naturalWidth || img.width || 0);
      const height = img && (img.naturalHeight || img.height || 0);
      if (!width || !height) return '';
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) return '';
      context.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/png');
      return /^data:image\//i.test(dataUrl) ? dataUrl : '';
    } catch {
      return '';
    }
  }

  function detectAdapter() {
    const host = location.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'chat.deepseek.com') return ADAPTERS.deepseek;
    if (host === 'chat.qwen.ai') return ADAPTERS.qwen;
    if (host === 'qianwen.com') return ADAPTERS.qianwen;
    return ADAPTERS.generic;
  }

  function extractDeepSeekRoot(root) {
    if (!root || !root.isConnected) return [];
    const out = [];
    const user = root.matches('.fbb737a4') ? root : root.querySelector('.fbb737a4');
    if (user) {
      const content = user.querySelector('.ds-collapsible-text') || user;
      const message = makeMessage('user', content, root, ADAPTERS.deepseek);
      if (message) out.push(message);
    }
    const assistant = root.matches('.ds-assistant-message-main-content')
      ? root
      : (root.querySelector('.ds-assistant-message-main-content') || root.querySelector('.ds-markdown'));
    if (assistant && !assistant.closest('.ds-think-content') && (!user || !user.contains(assistant))) {
      const message = makeMessage('assistant', assistant, root, ADAPTERS.deepseek);
      if (message) out.push(message);
    }
    if (!out.length && hasMedia(root)) {
      const content = root.querySelector('.ds-collapsible-text') || root;
      const message = makeMessage('user', content, root, ADAPTERS.deepseek);
      if (message) out.push(message);
    }
    return out;
  }

  function extractQwenRoot(root) {
    if (!root || !root.isConnected) return [];
    const out = [];

    const markerRole = root.matches('.response-message-content')
      ? 'assistant'
      : (root.matches('.chat-user-message') || root.matches('.chat-user-message-container') ? 'user' : null);

    if (markerRole === 'user') {
      const content = root.querySelector('.chat-user-message') || root.querySelector('.chat-user-message-wrapper') || root;
      const message = makeMessage('user', content, root, ADAPTERS.qwen);
      if (message) out.push(message);
      return out;
    }
    if (markerRole === 'assistant') {
      const content = root.querySelector('.qwen-markdown') || root;
      const message = makeMessage('assistant', content, root, ADAPTERS.qwen);
      if (message) out.push(message);
      return out;
    }

    const isUser = /qwen-chat-message-user/.test(classText(root))
      || !!root.querySelector('.chat-user-message, .chat-user-message-wrapper, .chat-user-message-container');
    const isAssistant = /qwen-chat-message-assistant/.test(classText(root)) || !!root.querySelector('.response-message-content');

    if (isUser) {
      const content = root.querySelector('.chat-user-message')
        || root.querySelector('.chat-user-message-wrapper')
        || root.querySelector('.chat-user-message-container');
      if (content) {
        const message = makeMessage('user', content, root, ADAPTERS.qwen);
        if (message) out.push(message);
      }
    }
    if (isAssistant) {
      const content = root.querySelector('.response-message-content')
        || root.querySelector('.qwen-markdown')
        || findFirstContent(root, ['.markdown-body', '[class*="markdown"]']);
      if (content) {
        const message = makeMessage('assistant', content, root, ADAPTERS.qwen);
        if (message) out.push(message);
      }
    }
    if (!out.length) {
      const content = findBestContent(root, ADAPTERS.qwen.contentSelectors);
      if (content) {
        const role = detectRole(root, ADAPTERS.qwen) || (isUser ? 'user' : 'assistant');
        const message = makeMessage(role, content, root, ADAPTERS.qwen);
        if (message) out.push(message);
      }
    }
    return out;
  }

  function extractQianwenRoot(root) {
    if (!root || !root.isConnected) return [];
    const out = [];

    if (root.matches('.chat-question-card-wrap') || root.matches('.chat-question-wrap')) {
      const content = root.querySelector('.question-text-card') || root;
      const message = makeMessage('user', content, root, ADAPTERS.qianwen);
      if (message) out.push(message);
      return out;
    }

    const answerCardSelector = '.answer-common-card, .answerItem, [class*="answer-card"], [class*="answer-item"]';
    if (root.matches(answerCardSelector) || root.matches('.chat-answers-card-wrap')) {
      const content = root.matches(answerCardSelector)
        ? root
        : (root.querySelector(answerCardSelector) || root);
      const message = makeMessage('assistant', content, root, ADAPTERS.qianwen);
      if (message) out.push(message);
      return out;
    }

    const question = root.querySelector('.chat-question-card-wrap, .chat-question-wrap');
    if (question) out.push(...extractQianwenRoot(question));
    for (const answer of Array.from(root.querySelectorAll(answerCardSelector))) {
      out.push(...extractQianwenRoot(answer));
    }
    return out;
  }

  function extractGenericRoot(root, adapter) {
    if (!root || !root.isConnected) return [];
    const content = findBestContent(root, adapter.contentSelectors);
    if (!content) return [];
    const role = detectRole(root, adapter) || (root.querySelector('.fbb737a4, .chat-user-message, .chat-question-card-wrap') ? 'user' : 'assistant');
    const message = makeMessage(role, content, root, adapter);
    return message ? [message] : [];
  }

  function findFirstContent(root, selectors) {
    for (const selector of selectors || []) {
      const el = root.querySelector(selector);
      if (el) return el;
    }
    return null;
  }

  function findBestContent(root, selectors) {
    let best = null;
    let bestLength = -1;
    for (const selector of selectors || []) {
      for (const el of Array.from(root.querySelectorAll(selector))) {
        if (!el.isConnected || isInChrome(el)) continue;
        const length = normalizeText(el.innerText || el.textContent || '').length;
        if (length > bestLength) {
          best = el;
          bestLength = length;
        }
      }
    }
    if (!best) {
      const textLength = normalizeText(root.innerText || root.textContent || '').length;
      if (textLength >= 2 && !hasMedia(root)) return null;
      best = root;
    }
    return best;
  }

  function detectRole(el, adapter) {
    const nodes = [];
    let node = el;
    for (let i = 0; node && i < 10; i += 1) {
      nodes.push(node);
      node = node.parentElement;
    }

    for (const current of nodes) {
      const attrs = [
        current.getAttribute('data-role'),
        current.getAttribute('data-author'),
        current.getAttribute('data-sender'),
        current.getAttribute('data-from'),
        current.getAttribute('data-message-role'),
        current.getAttribute('data-speaker'),
        current.getAttribute('data-type'),
        current.getAttribute('aria-label')
      ].filter(Boolean).join(' ');
      const attrText = attrs.toLowerCase();
      if (/(^|[\s_-])(user|human|question|query|prompt|me|self)([\s_-]|$)/i.test(attrText)) return 'user';
      if (/(^|[\s_-])(assistant|bot|answer|response|reply|model|agent)([\s_-]|$)/i.test(attrText)) return 'assistant';

      const tokens = classText(current).toLowerCase().split(/[\s_]+/).filter(Boolean);
      if (tokens.some((token) => /^(user|human|question|query|prompt|mine|self|me)$/.test(token))) return 'user';
      if (tokens.some((token) => /^(assistant|bot|answer|response|reply|model|agent|ai)$/.test(token))) return 'assistant';
      if (tokens.some((token) => /(^|-)(user|question|query)(-|$)/.test(token))) return 'user';
      if (tokens.some((token) => /(^|-)(assistant|bot|answer|response|reply|model)(-|$)/.test(token))) return 'assistant';

      const avatar = current.querySelector('img[alt], img[title]');
      if (avatar) {
        const label = `${avatar.getAttribute('alt') || ''} ${avatar.getAttribute('title') || ''}`.toLowerCase();
        if (/\b(user|you|human|user avatar)\b/.test(label)) return 'user';
        if (/\b(assistant|bot|ai|qwen|deepseek|tongyi)\b/.test(label)) return 'assistant';
      }

      if (current.querySelector('button[aria-label*="Edit" i], button[title*="Edit" i], [class*="edit-button"], [aria-label*="编辑"]')) return 'user';
      if (current.querySelector('[class*="regenerate"], button[aria-label*="Regenerate" i], button[title*="Regenerate" i], [aria-label*="重新生成"]')) return 'assistant';
    }

    return null;
  }

  function inferRoles(messages) {
    for (let i = 0; i < messages.length; i += 1) {
      if (messages[i].role) continue;
      const prev = messages[i - 1];
      const next = messages[i + 1];
      if (prev && prev.role) {
        messages[i].role = prev.role === 'user' ? 'assistant' : 'user';
      } else if (next && next.role) {
        messages[i].role = next.role === 'assistant' ? 'user' : 'assistant';
      } else {
        messages[i].role = i % 2 === 0 ? 'user' : 'assistant';
      }
    }
  }

  function makeMessage(role, contentNode, rootNode, adapter) {
    if (!contentNode || !contentNode.isConnected) return null;
    if (isInChrome(contentNode)) return null;
    const mediaRoot = findMessageWrapper(rootNode || contentNode, adapter);
    const text = normalizeText(contentNode.innerText || contentNode.textContent || '');
    const media = hasMedia(contentNode) || hasMedia(mediaRoot);
    if (!text && !media) return null;
    if (isNoticeText(text) && !media) return null;
    if (isJunkMessage(text)) return null;
    const preview = text || '[media]';
    return {
      role: role === 'user' ? 'user' : 'assistant',
      contentNode,
      rootNode: mediaRoot,
      preview: truncate(preview, 220),
      selected: true,
      plain: role === 'user',
      key: `${role === 'user' ? 'user' : 'assistant'}|${truncate(preview, 160)}`
    };
  }

  function scoreMessages(messages) {
    if (!messages || !messages.length) return -Infinity;
    const roles = new Set(messages.map((message) => message.role));
    const textLength = messages.reduce((sum, message) => sum + Math.min(message.preview.length, 500), 0);
    return messages.length * 20 + roles.size * 60 + Math.min(textLength, 20000) / 100;
  }

  function dedupeMessages(messages) {
    const seen = new Set();
    const out = [];
    for (const message of messages) {
      if (!message || !message.contentNode || seen.has(message.contentNode)) continue;
      seen.add(message.contentNode);
      out.push(message);
    }
    return out;
  }

  function sortMessages(messages) {
    return messages.slice().sort((a, b) => compareDocumentOrder(a.contentNode, b.contentNode));
  }

  function collectFromRoots(roots, adapter) {
    const unique = Array.from(new Set(roots)).filter((el) => el && el.isConnected && !isInChrome(el));
    const outermost = unique.filter((el) => !unique.some((other) => other !== el && other.contains(el)));
    const messages = [];
    for (const root of outermost) {
      const result = adapter.extractRoot ? adapter.extractRoot(root) : extractGenericRoot(root, adapter);
      for (const message of result) {
        if (message) messages.push(message);
      }
    }
    return dedupeMessages(messages);
  }

  function collectByMarkers(adapter) {
    const messages = [];
    for (const rule of adapter.markerRules || []) {
      for (const el of $$(rule.selector)) {
        if (!el.isConnected || isInChrome(el)) continue;
        const result = adapter.extractRoot ? adapter.extractRoot(el) : extractGenericRoot(el, adapter);
        for (const message of result) {
          if (message) {
            if (!message.role && rule.role) message.role = rule.role;
            messages.push(message);
          }
        }
      }
    }
    return dedupeMessages(messages);
  }

  function isMessageLike(el, adapter) {
    if (!el || !el.isConnected || isInChrome(el)) return false;
    const text = normalizeText(el.innerText || el.textContent || '');
    if (!text && !hasMedia(el)) return false;
    if (adapter.pickRootSelectors.some((selector) => el.matches(selector))) return true;
    if (/(^|[\s_-])(chat-round|message|chat-item|bubble|answer)([\s_-]|$)/i.test(classText(el))) return true;
    if (adapter.markerRules.some((rule) => el.matches(rule.selector) || el.querySelector(rule.selector))) return true;
    return false;
  }

  function collectBySiblingGroups(adapter) {
    let best = [];
    let bestScore = -Infinity;
    let visited = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
      if (visited > 4500) break;
      const parent = walker.currentNode;
      if (!parent || !parent.isConnected || isInChrome(parent)) continue;
      const children = Array.from(parent.children).filter((child) => child.isConnected && !isInChrome(child));
      if (children.length < 2 || children.length > 200) continue;
      visited += 1;
      const qualified = children.filter((child) => {
        const text = normalizeText(child.innerText || child.textContent || '');
        if (!text && !hasMedia(child)) return false;
        if (text.length < 8 && !hasMedia(child)) return false;
        return isMessageLike(child, adapter);
      });
      if (qualified.length < 2) continue;
      const messages = [];
      for (const child of qualified) {
        const result = adapter.extractRoot ? adapter.extractRoot(child) : extractGenericRoot(child, adapter);
        for (const message of result) {
          if (message) messages.push(message);
        }
      }
      const unique = dedupeMessages(messages);
      const score = scoreMessages(unique);
      if (score > bestScore) {
        best = unique;
        bestScore = score;
      }
    }
    return best;
  }

  function collectMessages(adapter) {
    const roots = [];
    for (const selector of adapter.rootSelectors || []) {
      roots.push(...$$(selector));
    }

    let best = collectFromRoots(roots, adapter);

    const markerMessages = collectByMarkers(adapter);
    if (scoreMessages(markerMessages) > scoreMessages(best)) best = markerMessages;

    const groupMessages = collectBySiblingGroups(adapter);
    if (scoreMessages(groupMessages) > scoreMessages(best)) best = groupMessages;

    best = dedupeMessages(best);
    inferRoles(best);
    return sortMessages(best);
  }

  function isPlausibleTitle(text) {
    const value = normalizeText(text);
    if (!value || value.length < 2 || value.length > 120) return false;
    if (/^(deepseek|qwen|千问|通义千问|tongyi|chat|new chat|新对话|新建对话|登录|log in|sign up|untitled|ai chat)$/i.test(value)) return false;
    if (/^(千问|通义千问)\s*[-–—|]/.test(value)) return false;
    if (/^qwen\s*[-–—|]/i.test(value)) return false;
    return true;
  }

  function deriveTitle(messages, adapter) {
    for (const selector of adapter.titleSelectors || []) {
      for (const el of $$(selector)) {
        if (el.closest('.ds-markdown, .qwen-markdown, .qk-markdown, .message-content, .ds-assistant-message-main-content')) continue;
        const value = normalizeText(el.innerText || el.textContent || '');
        if (isPlausibleTitle(value)) return truncate(value, 100);
      }
    }

    const firstUser = messages.find((message) => message.role === 'user');
    if (firstUser && isPlausibleTitle(firstUser.preview)) {
      return truncate(firstUser.preview, 70);
    }

    const docTitle = normalizeText(document.title)
      .replace(/\s*[-–—|]\s*(deepseek|qwen|千问|通义千问|tongyi).*$/i, '');
    if (isPlausibleTitle(docTitle)) return truncate(docTitle, 100);

    return 'AI Chat Export';
  }

  function sanitizeNode(node, baseUrl) {
    if (node && node.tagName === 'CANVAS') {
      const dataUrl = canvasDataUrl(node);
      if (dataUrl) {
        const img = document.createElement('img');
        img.setAttribute('src', dataUrl);
        const alt = node.getAttribute('aria-label') || node.getAttribute('title') || '';
        if (alt) img.setAttribute('alt', alt);
        return sanitizeNode(img, baseUrl);
      }
    }
    const originalImages = Array.from(node.querySelectorAll ? node.querySelectorAll('img') : []);
    const originalImageSources = originalImages.map((img) => imageSource(img));
    const rootImageSource = node.tagName === 'IMG' ? imageSource(node) : '';

    const clone = node.cloneNode(true);

    if (clone.tagName === 'IMG') {
      clone.__aiceSourceImage = node;
      if (rootImageSource) {
        const dataUrl = /^blob:/i.test(rootImageSource) ? loadedImageDataUrl(node) : '';
        clone.setAttribute('src', dataUrl || toAbsoluteUrl(rootImageSource, baseUrl));
      }
    } else {
      const clonedImages = Array.from(clone.querySelectorAll ? clone.querySelectorAll('img') : []);
      clonedImages.forEach((img, index) => {
        const src = originalImageSources[index];
        const original = originalImages[index];
        img.__aiceSourceImage = original;
        if (!src) return;
        const dataUrl = /^blob:/i.test(src) ? loadedImageDataUrl(original) : '';
        img.setAttribute('src', dataUrl || toAbsoluteUrl(src, baseUrl));
      });
    }

    const originalElements = [node, ...(node.querySelectorAll ? Array.from(node.querySelectorAll('*')) : [])];
    const clonedElements = [clone, ...(clone.querySelectorAll ? Array.from(clone.querySelectorAll('*')) : [])];
    for (let index = 0; index < originalElements.length; index += 1) {
      const original = originalElements[index];
      const cloned = clonedElements[index];
      if (original && cloned && original.tagName === 'VIDEO' && cloned.tagName === 'VIDEO') {
        cloned.__aiceSourceVideo = original;
      }
    }
    for (let index = 0; index < originalElements.length; index += 1) {
      const original = originalElements[index];
      const cloned = clonedElements[index];
      if (!original || !cloned || cloned.tagName !== 'CANVAS') continue;
      const dataUrl = canvasDataUrl(original);
      if (!dataUrl) continue;
      const img = document.createElement('img');
      img.setAttribute('src', dataUrl);
      const alt = original.getAttribute('aria-label') || original.getAttribute('title') || '';
      if (alt) img.setAttribute('alt', alt);
      cloned.replaceWith(img);
    }

    const checkboxInputs = Array.from(clone.querySelectorAll ? clone.querySelectorAll('input[type="checkbox"]') : []);
    for (const input of checkboxInputs) {
      const span = document.createElement('span');
      span.className = 'task-checkbox';
      span.textContent = input.checked ? '☑' : '☐';
      input.replaceWith(span);
    }

    const removeSelector = [
      'script', 'style', 'link', 'meta', 'iframe', 'object', 'embed', 'form',
      'input', 'textarea', 'select', 'button', 'noscript', 'canvas', 'template',
      '[hidden]', '[aria-hidden="true"]',
      '[data-execution-section="process"]',
      '[data-answer-feedback-toolbar]',
      '.ds-think-content',
      '[class*="think-content"]',
      '[class*="thinking-content"]',
      '[class*="thinking-and-sources"]',
      '[class*="reasoning-content"]',
      '[class*="feedback"]',
      '[class*="toolbar"]',
      '[class*="Toolbar"]',
      '[class*="code-header-actions"]',
      '[class*="code-header-wrapper"]',
      '[class*="code-collapse"]',
      '[class*="code-copy"]',
      '[class*="copy-button"]',
      '[class*="download-button"]',
      '[class*="qk-md-table-action"]',
      '[class*="qk-md-copy-icon"]',
      '[class*="qk-md-download"]',
      '[class*="regenerate"]',
      '[class*="edit-button"]',
      '[class*="dropdown"]',
      '[class*="popover"]',
      '[class*="tooltip"]',
      '[class*="skeleton"]',
      '[class*="loading"]',
      '[class*="scroll-down"]',
      '[class*="select-mode"]',
      '[class*="message-select"]',
      '[class*="share-selection"]',
      '[class*="bottom-anchor"]',
      '[class*="qs-bottom"]',
      '[class*="chat-user-message-header"]',
      '[class*="media-edit-toolbar"]'
    ].join(',');

    for (const el of Array.from(clone.querySelectorAll ? clone.querySelectorAll(removeSelector) : [])) {
      if (el.closest('.katex, mjx-container, math')) continue;
      el.remove();
    }

    for (const svg of Array.from(clone.querySelectorAll ? clone.querySelectorAll('svg') : [])) {
      if (svg.closest('.katex, mjx-container, math')) continue;
      const cls = classText(svg).toLowerCase();
      const isIcon = /icon|emoji|avatar|logo/.test(cls)
        || !!svg.closest('[class*="icon"], [class*="emoji"], [class*="avatar"], [class*="logo"]');
      if (isIcon) {
        svg.remove();
        continue;
      }
      const viewBox = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
      const viewBoxWidth = viewBox[2] || 0;
      const viewBoxHeight = viewBox[3] || 0;
      const width = Number.parseFloat(svg.getAttribute('width') || '0') || viewBoxWidth;
      const height = Number.parseFloat(svg.getAttribute('height') || '0') || viewBoxHeight;
      const isDiagram = /mermaid|chart|diagram|plot|graph|visual/.test(cls)
        || width > 80 || height > 80 || !!svg.closest('figure');
      if (!isDiagram) svg.remove();
    }

    const elements = [clone, ...(clone.querySelectorAll ? Array.from(clone.querySelectorAll('*')) : [])];
    for (const el of elements) {
      const inMath = !!el.closest('.katex, mjx-container, math');
      const inCode = !!el.closest('pre, code, [class*="code"], [class*="highlight"], [class*="token"]');
      const inSvg = !!el.closest('svg');

      if (!inMath) {
        for (const attr of Array.from(el.attributes || [])) {
          const name = attr.name.toLowerCase();
          if (name.startsWith('on')) {
            el.removeAttribute(attr.name);
          } else if ((name === 'style' && !inCode && !inSvg) || name === 'id' || name === 'contenteditable' || name === 'draggable'
            || name === 'spellcheck' || name === 'tabindex' || name === 'autofocus' || name === 'autoplay'
            || name === 'srcset' || name === 'sizes' || name === 'loading' || name === 'target'
            || name === 'rel' || name === 'download' || name.startsWith('data-') || name.startsWith('aria-')) {
            el.removeAttribute(attr.name);
          }
        }
      }

      if (el.tagName === 'A') {
        const href = el.getAttribute('href');
        if (!href || /^(javascript|vbscript):/i.test(href)) {
          el.removeAttribute('href');
        } else {
          el.setAttribute('href', toAbsoluteUrl(href, baseUrl));
          el.setAttribute('target', '_blank');
          el.setAttribute('rel', 'noopener noreferrer');
        }
      }

      if (el.tagName === 'IMG') {
        let src = '';
        if (el === clone) src = rootImageSource;
        if (!src) {
          src = el.getAttribute('src')
            || el.getAttribute('data-src') || el.getAttribute('data-original')
            || el.getAttribute('data-lazy-src') || firstSrcFromSrcset(el.getAttribute('srcset'));
        }
        if (src) {
          el.setAttribute('src', toAbsoluteUrl(src, baseUrl));
          el.setAttribute('loading', 'lazy');
        }
        el.removeAttribute('srcset');
        el.removeAttribute('sizes');
      }

      if (el.tagName === 'SOURCE') {
        const parent = el.parentElement;
        if (parent && parent.tagName === 'PICTURE') {
          el.remove();
        } else {
          const src = el.getAttribute('src');
          if (src) el.setAttribute('src', toAbsoluteUrl(src, baseUrl));
        }
      }

      if (el.tagName === 'VIDEO' || el.tagName === 'AUDIO') {
        el.setAttribute('controls', '');
        const src = el.getAttribute('src');
        if (src) el.setAttribute('src', toAbsoluteUrl(src, baseUrl));
        const poster = el.getAttribute('poster');
        if (poster) el.setAttribute('poster', toAbsoluteUrl(poster, baseUrl));
      }
    }

    const seenBackgrounds = new Set();
    for (let index = 0; index < originalElements.length; index += 1) {
      const original = originalElements[index];
      const cloned = clonedElements[index];
      if (!original || !cloned) continue;
      if (cloned !== clone && !clone.contains(cloned)) continue;
      if (/^(IMG|VIDEO|AUDIO|CANVAS|SOURCE|PICTURE)$/.test(original.tagName)) continue;
      if (!isLikelyContentMedia(original)) continue;
      const background = elementBackgroundSource(original);
      if (!background) continue;
      const absolute = toAbsoluteUrl(background, baseUrl);
      if (!absolute || seenBackgrounds.has(absolute)) continue;
      seenBackgrounds.add(absolute);
      const img = document.createElement('img');
      img.setAttribute('src', absolute);
      img.setAttribute('loading', 'lazy');
      const alt = original.getAttribute('aria-label') || original.getAttribute('title') || '';
      if (alt) img.setAttribute('alt', alt);
      cloned.insertBefore(img, cloned.firstChild);
    }

    if (clone.tagName === 'IMG') {
      const src = rootImageSource || clone.getAttribute('src') || '';
      if (src) {
        clone.setAttribute('src', toAbsoluteUrl(src, baseUrl));
        clone.setAttribute('loading', 'lazy');
      }
      clone.removeAttribute('srcset');
      clone.removeAttribute('sizes');
    }

    return clone;
  }

  function isLikelyContentMedia(el) {
    if (!el || !el.isConnected) return false;
    if (el.closest('[class*="avatar"], [class*="icon"], [class*="emoji"], [class*="logo"]')) return false;
    const cls = classText(el).toLowerCase();
    if (el.tagName === 'IMG') {
      const width = el.naturalWidth || el.width || 0;
      const height = el.naturalHeight || el.height || 0;
      if (width && height && width <= 32 && height <= 32) return false;
      if (/avatar|icon|emoji|logo/.test(cls)) return false;
    } else if (el.tagName === 'CANVAS') {
      const width = el.width || 0;
      const height = el.height || 0;
      if (width && height && width <= 32 && height <= 32) return false;
    } else {
      const width = el.offsetWidth || 0;
      const height = el.offsetHeight || 0;
      if (width && height && width <= 32 && height <= 32) return false;
      if (/avatar|icon|emoji|logo/.test(cls)) return false;
    }
    return true;
  }

  function collectAdjacentMedia(contentNode, role, adapter) {
    const media = [];
    const seen = new Set();
    const addElement = (el) => {
      if (!el || seen.has(el)) return;
      seen.add(el);
      if (!isLikelyContentMedia(el)) return;
      if (/^(IMG|VIDEO|AUDIO|CANVAS)$/.test(el.tagName)) {
        media.push({ kind: 'element', el });
        return;
      }
      if (elementBackgroundSource(el)) media.push({ kind: 'background', el });
    };
    const addWithin = (container) => {
      for (const el of Array.from(container.querySelectorAll('img, video, audio, canvas'))) addElement(el);
      const backgroundSelector = '[style*="background-image"], [class*="image"], [class*="img"]';
      for (const el of Array.from(container.querySelectorAll(backgroundSelector))) addElement(el);
    };
    let node = contentNode;
    for (let depth = 0; node && node.parentElement && depth < 3; depth += 1) {
      const parent = node.parentElement;
      const children = Array.from(parent.children);
      const index = children.indexOf(node);
      if (index < 0) break;
      const directions = role === 'user' ? [-1, 1] : [1];
      for (const step of directions) {
        for (let i = index + step; i >= 0 && i < children.length; i += step) {
          const sibling = children[i];
          if (sibling.contains(node)) break;
          if (markerRolesIn(sibling, adapter).size > 0) break;
          const isMessageRoot = (adapter.pickRootSelectors || []).some((selector) => {
            try {
              return sibling.matches(selector);
            } catch {
              return false;
            }
          });
          if (isMessageRoot) break;
          if (!hasMedia(sibling)) continue;
          addWithin(sibling);
        }
      }
      node = parent;
    }
    return media;
  }

  function appendExtraMedia(wrapper, rootNode, contentNode, baseUrl, role, adapter) {
    if (!rootNode || !rootNode.querySelectorAll) return;
    const existing = new Set(Array.from(wrapper.querySelectorAll('img, video, audio'))
      .map((el) => el.getAttribute('src'))
      .filter(Boolean));
    const seen = new Set();
    const extras = [];
    for (const el of Array.from(rootNode.querySelectorAll('img, video, audio, canvas'))) {
      if (contentNode.contains(el)) continue;
      if (!isLikelyContentMedia(el)) continue;
      const src = el.currentSrc || el.getAttribute('src') || el.getAttribute('data-src')
        || el.getAttribute('data-original') || el.getAttribute('data-lazy-src') || '';
      const absolute = src ? toAbsoluteUrl(src, baseUrl) : '';
      if (absolute && (existing.has(absolute) || seen.has(absolute))) continue;
      if (absolute) seen.add(absolute);
      extras.push({ kind: 'element', el, src });
    }
    const backgroundSelector = [
      '[style*="background-image"]', '[class*="image"]', '[class*="img"]',
      '[class*="thumb"]', '[class*="preview"]', '[class*="media"]'
    ].join(',');
    for (const el of Array.from(rootNode.querySelectorAll(backgroundSelector))) {
      if (contentNode.contains(el)) continue;
      if (!isLikelyContentMedia(el)) continue;
      const background = elementBackgroundSource(el);
      if (!background) continue;
      const absolute = toAbsoluteUrl(background, baseUrl);
      if (!absolute || existing.has(absolute) || seen.has(absolute)) continue;
      seen.add(absolute);
      extras.push({ kind: 'background', el, src: absolute });
    }
    if (!extras.length) {
      for (const adjacent of collectAdjacentMedia(contentNode, role, adapter)) {
        if (adjacent.kind === 'background') {
          const absolute = toAbsoluteUrl(elementBackgroundSource(adjacent.el), baseUrl);
          if (!absolute || existing.has(absolute) || seen.has(absolute)) continue;
          seen.add(absolute);
          extras.push({ kind: 'background', el: adjacent.el, src: absolute });
          continue;
        }
        const el = adjacent.el;
        const src = el.currentSrc || el.getAttribute('src') || el.getAttribute('data-src')
          || el.getAttribute('data-original') || el.getAttribute('data-lazy-src') || '';
        const absolute = src ? toAbsoluteUrl(src, baseUrl) : '';
        if (absolute && (existing.has(absolute) || seen.has(absolute))) continue;
        if (absolute) seen.add(absolute);
        extras.push({ kind: 'element', el, src });
      }
    }
    if (!extras.length) return;

    const gallery = document.createElement('div');
    gallery.className = 'attachment-gallery';
    for (const extra of extras) {
      if (extra.kind === 'background') {
        const img = document.createElement('img');
        img.setAttribute('src', extra.src);
        img.setAttribute('loading', 'lazy');
        const alt = extra.el.getAttribute('aria-label') || extra.el.getAttribute('title') || '';
        if (alt) img.setAttribute('alt', alt);
        gallery.appendChild(img);
        existing.add(extra.src);
        continue;
      }
      const clone = sanitizeNode(extra.el, baseUrl);
      gallery.appendChild(clone);
      const src = clone.getAttribute('src');
      if (src) existing.add(src);
    }
    if (gallery.children.length) wrapper.appendChild(gallery);
  }

  function renderMessageContent(message, baseUrl, adapter) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-content${message.role === 'user' ? ' plain-text' : ''}`;
    const clone = sanitizeNode(message.contentNode, baseUrl);
    wrapper.appendChild(clone);
    appendExtraMedia(wrapper, message.rootNode, message.contentNode, baseUrl, message.role, adapter);
    return wrapper;
  }

  function readBlobAsDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
      reader.readAsDataURL(blob);
    });
  }

  function gifColorIndex(red, green, blue) {
    return ((red >> 5) << 5) | ((green >> 5) << 2) | (blue >> 6);
  }

  function gifPalette() {
    const palette = new Uint8Array(256 * 3);
    for (let index = 0; index < 256; index += 1) {
      const red = (index >> 5) & 0x07;
      const green = (index >> 2) & 0x07;
      const blue = index & 0x03;
      palette[index * 3] = Math.round((red * 255) / 7);
      palette[index * 3 + 1] = Math.round((green * 255) / 7);
      palette[index * 3 + 2] = Math.round((blue * 255) / 3);
    }
    return palette;
  }

  function gifLzwEncode(indices, minimumCodeSize) {
    const clearCode = 1 << minimumCodeSize;
    const endCode = clearCode + 1;
    let codeSize = minimumCodeSize + 1;
    let nextCode = endCode + 1;
    let dictionary = new Map();
    const bytes = [];
    let bitBuffer = 0;
    let bitCount = 0;

    const writeCode = (code) => {
      bitBuffer |= code << bitCount;
      bitCount += codeSize;
      while (bitCount >= 8) {
        bytes.push(bitBuffer & 0xFF);
        bitBuffer >>= 8;
        bitCount -= 8;
      }
      if (nextCode > (1 << codeSize) - 1 && codeSize < 12) codeSize += 1;
    };

    writeCode(clearCode);
    let prefix = indices[0];
    for (let index = 1; index < indices.length; index += 1) {
      const suffix = indices[index];
      const key = prefix * 256 + suffix;
      if (dictionary.has(key)) {
        prefix = dictionary.get(key);
        continue;
      }
      writeCode(prefix);
      if (nextCode < 4096) {
        dictionary.set(key, nextCode);
        nextCode += 1;
      } else {
        writeCode(clearCode);
        dictionary = new Map();
        nextCode = endCode + 1;
        codeSize = minimumCodeSize + 1;
      }
      prefix = suffix;
    }
    writeCode(prefix);
    writeCode(endCode);
    if (bitCount > 0) bytes.push(bitBuffer & 0xFF);
    return bytes;
  }

  function encodeGif(frames, width, height, delayCentiseconds) {
    const palette = gifPalette();
    const bytes = [];
    const pushText = (text) => {
      for (let index = 0; index < text.length; index += 1) bytes.push(text.charCodeAt(index));
    };
    pushText('GIF89a');
    bytes.push(width & 0xFF, (width >> 8) & 0xFF, height & 0xFF, (height >> 8) & 0xFF, 0xF7, 0, 0);
    for (const value of palette) bytes.push(value);
    bytes.push(0x21, 0xFF, 0x0B);
    pushText('NETSCAPE2.0');
    bytes.push(0x03, 0x01, 0x00, 0x00, 0x00);
    for (const indices of frames) {
      const delay = Math.max(2, Math.min(65535, Math.round(delayCentiseconds)));
      bytes.push(0x21, 0xF9, 0x04, 0x04, delay & 0xFF, (delay >> 8) & 0xFF, 0x00, 0x00);
      bytes.push(
        0x2C, 0, 0, 0, 0,
        width & 0xFF, (width >> 8) & 0xFF,
        height & 0xFF, (height >> 8) & 0xFF,
        0x00
      );
      bytes.push(0x08);
      const data = gifLzwEncode(indices, 8);
      for (let offset = 0; offset < data.length; offset += 255) {
        const chunk = data.slice(offset, offset + 255);
        bytes.push(chunk.length, ...chunk);
      }
      bytes.push(0x00);
    }
    bytes.push(0x3B);
    return new Uint8Array(bytes);
  }

  function videoSourceUrl(video) {
    if (!video) return '';
    const direct = video.currentSrc || video.getAttribute('src') || '';
    if (direct) return toAbsoluteUrl(direct, location.href);
    const source = video.querySelector ? video.querySelector('source[src]') : null;
    return source ? toAbsoluteUrl(source.getAttribute('src') || '', location.href) : '';
  }

  function loadCaptureVideo(url) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      if (!/^(blob:|data:)/i.test(url)) video.crossOrigin = 'anonymous';
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        video.removeEventListener('loadeddata', onReady);
        video.removeEventListener('error', onError);
        clearTimeout(timer);
        if (ok) {
          resolve(video);
          return;
        }
        video.removeAttribute('src');
        try {
          video.load();
        } catch {}
        resolve(null);
      };
      const onReady = () => finish(true);
      const onError = () => finish(false);
      const timer = setTimeout(() => finish(false), 6000);
      video.addEventListener('loadeddata', onReady, { once: true });
      video.addEventListener('error', onError, { once: true });
      video.src = url;
    });
  }

  function seekVideo(video, time) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
        clearTimeout(timer);
        resolve(ok);
      };
      const onSeeked = () => finish(true);
      const onError = () => finish(false);
      const timer = setTimeout(() => finish(video.readyState >= 2), 1800);
      video.addEventListener('seeked', onSeeked);
      video.addEventListener('error', onError);
      if (Math.abs((video.currentTime || 0) - time) < 0.01) {
        finish(video.readyState >= 2);
        return;
      }
      try {
        video.currentTime = time;
      } catch {
        finish(false);
      }
    });
  }

  function readFrameIndices(source, context, width, height) {
    try {
      context.drawImage(source, 0, 0, width, height);
      const data = context.getImageData(0, 0, width, height).data;
      const indices = new Uint8Array(width * height);
      for (let index = 0, offset = 0; index < indices.length; index += 1, offset += 4) {
        indices[index] = gifColorIndex(data[offset], data[offset + 1], data[offset + 2]);
      }
      return indices;
    } catch {
      return null;
    }
  }

  async function captureVideoFrames(video) {
    const width = video.videoWidth || 0;
    const height = video.videoHeight || 0;
    if (!width || !height) return null;
    const scale = Math.min(1, 480 / width, 320 / height);
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
    const previewSeconds = duration > 0 ? Math.min(duration, 6) : 0;
    const frameCount = previewSeconds > 0
      ? Math.min(12, Math.max(3, Math.round(previewSeconds * 2)))
      : 1;
    const times = [];
    if (previewSeconds > 0) {
      for (let index = 0; index < frameCount; index += 1) {
        times.push((previewSeconds * (index + 0.5)) / frameCount);
      }
    } else {
      times.push(0);
    }
    const frames = [];
    for (const time of times) {
      if (!(await seekVideo(video, time))) continue;
      const frame = readFrameIndices(video, context, targetWidth, targetHeight);
      if (frame) frames.push(frame);
    }
    if (!frames.length) {
      const frame = readFrameIndices(video, context, targetWidth, targetHeight);
      if (frame) frames.push(frame);
    }
    if (!frames.length) return null;
    const naturalDelay = previewSeconds > 0 ? (previewSeconds / frames.length) * 100 : 100;
    return {
      frames,
      width: targetWidth,
      height: targetHeight,
      delay: Math.max(2, Math.min(100, Math.round(naturalDelay)))
    };
  }

  function loadImageElement(url) {
    return new Promise((resolve) => {
      const image = new Image();
      if (!/^(blob:|data:)/i.test(url)) image.crossOrigin = 'anonymous';
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(ok ? image : null);
      };
      const timer = setTimeout(() => finish(false), 6000);
      image.onload = () => finish(true);
      image.onerror = () => finish(false);
      image.src = url;
    });
  }

  async function createImageGifPreview(url) {
    const image = await loadImageElement(url);
    if (!image) return '';
    const width = image.naturalWidth || image.width || 0;
    const height = image.naturalHeight || image.height || 0;
    if (!width || !height) return '';
    const scale = Math.min(1, 480 / width, 320 / height);
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return '';
    const frame = readFrameIndices(image, context, targetWidth, targetHeight);
    if (!frame) return '';
    const encoded = encodeGif([frame], targetWidth, targetHeight, 100);
    return readBlobAsDataUrl(new Blob([encoded], { type: 'image/gif' }));
  }

  async function createCurrentVideoGifPreview(video) {
    const width = video.videoWidth || 0;
    const height = video.videoHeight || 0;
    if (!width || !height || video.readyState < 2) return '';
    const scale = Math.min(1, 480 / width, 320 / height);
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return '';
    const frame = readFrameIndices(video, context, targetWidth, targetHeight);
    if (!frame) return '';
    const encoded = encodeGif([frame], targetWidth, targetHeight, 100);
    return readBlobAsDataUrl(new Blob([encoded], { type: 'image/gif' }));
  }

  async function createVideoGifPreview(sourceVideo) {
    if (!sourceVideo || sourceVideo.tagName !== 'VIDEO') return '';
    const source = videoSourceUrl(sourceVideo);
    if (source) {
      const capture = await loadCaptureVideo(source);
      if (capture) {
        try {
          const result = await captureVideoFrames(capture);
          if (result) {
            const encoded = encodeGif(result.frames, result.width, result.height, result.delay);
            return await readBlobAsDataUrl(new Blob([encoded], { type: 'image/gif' }));
          }
        } finally {
          capture.removeAttribute('src');
          try {
            capture.load();
          } catch {}
        }
      }
    }
    const currentFrame = await createCurrentVideoGifPreview(sourceVideo);
    if (currentFrame) return currentFrame;
    const poster = sourceVideo.getAttribute('poster') || '';
    const posterUrl = poster ? toAbsoluteUrl(poster, location.href) : '';
    if (posterUrl) {
      const preview = await createImageGifPreview(posterUrl);
      if (preview) return preview;
    }
    return '';
  }

  async function inlineVideoPreviews(videos) {
    const list = Array.from(new Set(videos)).filter((video) => video && video.tagName === 'VIDEO');
    if (!list.length) return;
    const results = new Map();
    let cursor = 0;
    const deadline = Date.now() + 30000;
    const workerCount = Math.min(3, list.length);
    const workers = Array.from({ length: workerCount }, async () => {
      while (cursor < list.length && Date.now() < deadline) {
        const index = cursor;
        cursor += 1;
        const video = list[index];
        try {
          const dataUrl = await createVideoGifPreview(video.__aiceSourceVideo);
          if (dataUrl) results.set(video, dataUrl);
        } catch (error) {
          console.warn('[AI Chat Exporter] Could not create video preview:', error);
        }
      }
    });
    await Promise.all(workers);
    for (const video of list) {
      const dataUrl = results.get(video);
      if (!dataUrl) continue;
      const image = document.createElement('img');
      image.className = 'video-preview';
      image.setAttribute('src', dataUrl);
      const alt = video.getAttribute('aria-label') || video.getAttribute('title') || 'Video preview';
      image.setAttribute('alt', alt);
      video.replaceWith(image);
    }
  }

  function gmRequestAsDataUrl(url, timeoutMs) {
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest !== 'function') {
        reject(new Error('GM_xmlhttpRequest unavailable'));
        return;
      }
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error('Image request timed out'));
      }, timeoutMs);

      GM_xmlhttpRequest({
        method: 'GET',
        url,
        responseType: 'blob',
        timeout: timeoutMs,
        onload: async (response) => {
          if (settled) return;
          try {
            if (response.status && (response.status < 200 || response.status >= 300)) {
              throw new Error(`HTTP ${response.status}`);
            }
            let blob = response.response;
            if (!(blob instanceof Blob)) {
              const contentType = /content-type:\s*([^\r\n]+)/i.exec(response.responseHeaders || '');
              blob = new Blob([blob], { type: contentType ? contentType[1].trim() : 'application/octet-stream' });
            }
            const dataUrl = await readBlobAsDataUrl(blob);
            settled = true;
            clearTimeout(timer);
            resolve(dataUrl);
          } catch (error) {
            settled = true;
            clearTimeout(timer);
            reject(error);
          }
        },
        onerror: () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(new Error('Image request failed'));
        },
        ontimeout: () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(new Error('Image request timed out'));
        }
      });
    });
  }

  async function fetchAsDataUrl(url, timeoutMs) {
    if (/^data:/i.test(url)) return url;
    if (/^blob:/i.test(url)) {
      const response = await fetch(url);
      const blob = await response.blob();
      return readBlobAsDataUrl(blob);
    }
    try {
      return await gmRequestAsDataUrl(url, timeoutMs);
    } catch {
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
      try {
        const response = await fetch(url, {
          credentials: 'include',
          signal: controller ? controller.signal : undefined
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        return await readBlobAsDataUrl(blob);
      } finally {
        if (timer) clearTimeout(timer);
      }
    }
  }

  async function inlineImages(images, baseUrl, embed) {
    const list = Array.from(new Set(images)).filter((img) => img && img.tagName === 'IMG');
    for (const img of list) {
      const src = img.getAttribute('src') || '';
      if (src) img.setAttribute('src', toAbsoluteUrl(src, baseUrl));
    }
    if (!embed) return;

    const urls = Array.from(new Set(list.map((img) => img.getAttribute('src')).filter((src) => src && !/^data:/i.test(src))));
    if (!urls.length) return;

    const results = new Map();
    let cursor = 0;
    const deadline = Date.now() + 30000;
    const workerCount = Math.min(5, urls.length);
    const workers = Array.from({ length: workerCount }, async () => {
      while (cursor < urls.length && Date.now() < deadline) {
        const index = cursor;
        cursor += 1;
        const url = urls[index];
        try {
          results.set(url, await fetchAsDataUrl(url, 12000));
        } catch (error) {
          console.warn('[AI Chat Exporter] Could not embed image:', url, error);
        }
      }
    });
    await Promise.all(workers);

    for (const img of list) {
      const src = img.getAttribute('src');
      if (src && results.has(src)) {
        img.setAttribute('src', results.get(src));
      } else if (src && !/^data:/i.test(src)) {
        const dataUrl = loadedImageDataUrl(img.__aiceSourceImage);
        if (dataUrl) img.setAttribute('src', dataUrl);
      }
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
    }
  }

  async function buildExportHtml(messages, options) {
    const adapter = options.adapter;
    const baseUrl = location.href;
    const prepared = messages.map((message) => ({
      message,
      wrapper: renderMessageContent(message, baseUrl, adapter)
    }));

    const images = [];
    const videos = [];
    for (const item of prepared) {
      images.push(...Array.from(item.wrapper.querySelectorAll('img')));
      videos.push(...Array.from(item.wrapper.querySelectorAll('video')));
    }
    await inlineImages(images, baseUrl, options.embed);
    await inlineVideoPreviews(videos);

    const needsMath = prepared.some((item) => item.wrapper.querySelector('.katex, mjx-container, math'));
    const exportDate = new Date();
    const style = ['default', 'dark', 'compact'].includes(options.style) ? options.style : 'default';
    const title = options.title || 'AI Chat Export';
    const lang = document.documentElement.lang || 'en';

    const toc = prepared.map((item, index) => {
      const text = `${item.message.role === 'user' ? 'You' : 'AI'}:${truncate(item.message.preview, 52)}`;
      return `<li class="toc-item"><a href="#msg-${index + 1}">${escapeHtml(text)}</a></li>`;
    }).join('');

    const body = prepared.map((item, index) => {
      const message = item.message;
      const heading = `${message.role === 'user' ? 'You' : 'AI'}:${truncate(message.preview, 90)}`;
      const plainClass = message.role === 'user' ? ' plain-text' : '';
      return `<div class="message ${message.role}" id="msg-${index + 1}">
  <h2 class="toc-heading">${escapeHtml(heading)}</h2>
  <div class="message-body">
    <div class="message-content${plainClass}">${item.wrapper.innerHTML || '<p>[Empty message]</p>'}</div>
  </div>
</div>`;
    }).join('\n');

    const katexLink = needsMath
      ? '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">'
      : '';

    return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
${katexLink}
<style>${EXPORT_CSS}</style>
</head>
<body class="theme-${style}">
<nav class="toc-panel">
<h2>Contents</h2>
<ul>${toc}</ul>
</nav>
<div class="header-bar">
<div class="header-content">
<div class="header-text">
<div class="header-top">
<h1>${escapeHtml(title)}</h1>
<div class="platform-badge"><span class="platform-icon" style="background:${escapeHtml(adapter.iconBg)}">${escapeHtml(adapter.iconText)}</span><span class="platform-name">${escapeHtml(adapter.name)}</span></div>
</div>
<div class="header-meta">
<span>Export Time: ${escapeHtml(formatClock(exportDate))}</span>
<span>${prepared.length} messages in total</span>
</div>
</div>
</div>
</div>
<div class="chat-container">
${body}
</div>
<div class="footer-bar">Generated by AI Chat Exporter (Tampermonkey) &middot; <a href="${escapeHtml(location.href)}" target="_blank" rel="noopener noreferrer">Source conversation</a></div>
</body>
</html>`;
  }

  function downloadHtml(html, filename) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  }

  const state = {
    adapter: null,
    host: null,
    shadow: null,
    overlay: null,
    modal: null,
    listEl: null,
    emptyEl: null,
    tableHead: null,
    countEl: null,
    selectedCountEl: null,
    exportBtn: null,
    titleInput: null,
    styleSelect: null,
    embedCheck: null,
    toastEl: null,
    pickBanner: null,
    messages: [],
    autoTitle: 'AI Chat Export',
    titleEdited: false,
    lastUrl: '',
    pickMode: false,
    highlightEl: null,
    savedHighlight: null,
    savedCursor: '',
    savedOverflow: '',
    toastTimer: null,
    busy: false
  };

  function toast(message) {
    if (!state.toastEl) return;
    state.toastEl.textContent = message;
    state.toastEl.classList.add('show');
    if (state.toastTimer) clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => {
      state.toastEl.classList.remove('show');
      state.toastTimer = null;
    }, 3200);
  }

  function setOverlay(open) {
    if (!state.overlay) return;
    if (open) {
      state.overlay.classList.remove('hidden');
      state.savedOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
    } else {
      state.overlay.classList.add('hidden');
      document.documentElement.style.overflow = state.savedOverflow || '';
    }
  }

  function updateSummary() {
    const total = state.messages.length;
    const selected = state.messages.filter((message) => message.selected).length;
    if (state.countEl) state.countEl.textContent = `${total} message${total === 1 ? '' : 's'} in total`;
    if (state.selectedCountEl) state.selectedCountEl.textContent = `Selected ${selected} / ${total} messages`;
    if (state.exportBtn) {
      state.exportBtn.disabled = selected === 0 || state.busy;
      state.exportBtn.textContent = state.busy
        ? 'Exporting…'
        : `Export Selected (${selected} message${selected === 1 ? '' : 's'})`;
    }
  }

  function syncRow(index) {
    const message = state.messages[index];
    const row = state.listEl && state.listEl.children[index];
    if (!message || !row) return;
    row.classList.toggle('selected', !!message.selected);
    row.setAttribute('aria-selected', message.selected ? 'true' : 'false');
    const checkbox = row.querySelector('.checkbox');
    if (checkbox) checkbox.checked = !!message.selected;
  }

  function renderMessageList() {
    if (!state.listEl || !state.emptyEl) return;
    state.listEl.textContent = '';
    const fragment = document.createDocumentFragment();

    state.messages.forEach((message, index) => {
      const row = document.createElement('div');
      row.className = `msg-row${message.selected ? ' selected' : ''}`;
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', message.selected ? 'true' : 'false');
      row.dataset.index = String(index);

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'checkbox';
      checkbox.checked = !!message.selected;
      checkbox.setAttribute('aria-label', `Select ${message.role === 'user' ? 'question' : 'answer'} ${index + 1}`);

      const badge = document.createElement('span');
      badge.className = `role-badge ${message.role}`;
      badge.textContent = message.role === 'user' ? 'Q' : 'A';

      const preview = document.createElement('span');
      preview.className = 'preview';
      preview.textContent = message.preview || '[media]';
      preview.title = message.preview || '';

      checkbox.addEventListener('change', () => {
        state.messages[index].selected = checkbox.checked;
        syncRow(index);
        updateSummary();
      });

      row.addEventListener('click', (event) => {
        if (event.target === checkbox) return;
        state.messages[index].selected = !state.messages[index].selected;
        syncRow(index);
        updateSummary();
      });

      row.append(checkbox, badge, preview);
      fragment.appendChild(row);
    });

    state.listEl.appendChild(fragment);
    const empty = state.messages.length === 0;
    state.emptyEl.classList.toggle('hidden', !empty);
    state.listEl.classList.toggle('hidden', empty);
    if (state.tableHead) state.tableHead.classList.toggle('hidden', empty);
    updateSummary();
  }

  function scanAndRender() {
    const previousSelection = new Map(state.messages.map((message) => [message.key, message.selected]));
    const hadMessages = state.messages.length > 0;
    if (state.lastUrl && state.lastUrl !== location.href) {
      state.titleEdited = false;
    }
    state.lastUrl = location.href;
    const messages = collectMessages(state.adapter);
    if (hadMessages) {
      for (const message of messages) {
        if (previousSelection.has(message.key)) {
          message.selected = previousSelection.get(message.key);
        }
      }
    }
    state.messages = messages;
    state.autoTitle = deriveTitle(messages, state.adapter);
    if (!state.titleEdited || !state.titleInput.value.trim()) {
      state.titleInput.value = state.autoTitle;
    }
    renderMessageList();
  }

  function openModal(fresh) {
    if (!state.overlay) return;
    stopPickMode();
    if (fresh || !state.messages.length) scanAndRender();
    setOverlay(true);
  }

  function closeModal() {
    setOverlay(false);
  }

  function selectAll(selected) {
    for (const message of state.messages) message.selected = selected;
    renderMessageList();
  }

  function invertSelection() {
    for (const message of state.messages) message.selected = !message.selected;
    renderMessageList();
  }

  function selectRole(role) {
    for (const message of state.messages) message.selected = message.role === role;
    renderMessageList();
  }

  async function handleExport() {
    if (state.busy) return;
    const selected = state.messages.filter((message) => message.selected);
    if (!selected.length) return;

    state.busy = true;
    updateSummary();
    try {
      const title = state.titleInput.value.trim() || state.autoTitle || 'AI Chat Export';
      const html = await buildExportHtml(selected, {
        title,
        style: state.styleSelect.value,
        embed: state.embedCheck.checked,
        adapter: state.adapter
      });
      const filename = `${sanitizeFilename(title)}_${formatFileStamp(new Date())}.html`;
      downloadHtml(html, filename);
      toast(`Exported ${selected.length} message${selected.length === 1 ? '' : 's'}.`);
      closeModal();
    } catch (error) {
      console.error('[AI Chat Exporter] Export failed:', error);
      toast(`Export failed: ${error && error.message ? error.message : error}`);
    } finally {
      state.busy = false;
      updateSummary();
    }
  }

  function clearHighlight() {
    if (!state.highlightEl) return;
    const el = state.highlightEl;
    const saved = state.savedHighlight;
    if (saved) {
      for (const [name, value] of Object.entries(saved)) {
        if (value) el.style.setProperty(name, value.value, value.priority);
        else el.style.removeProperty(name);
      }
    }
    state.highlightEl = null;
    state.savedHighlight = null;
  }

  function highlightElement(el) {
    if (!el || el === state.highlightEl) return;
    clearHighlight();
    const names = ['outline', 'outline-offset', 'background-color', 'box-shadow'];
    const saved = {};
    for (const name of names) {
      saved[name] = {
        value: el.style.getPropertyValue(name),
        priority: el.style.getPropertyPriority(name)
      };
    }
    el.style.setProperty('outline', '3px solid #10b981', 'important');
    el.style.setProperty('outline-offset', '2px', 'important');
    el.style.setProperty('background-color', 'rgba(16, 185, 129, .08)', 'important');
    el.style.setProperty('box-shadow', '0 0 0 6px rgba(16, 185, 129, .16)', 'important');
    state.highlightEl = el;
    state.savedHighlight = saved;
  }

  function findPickCandidate(start, adapter) {
    let node = start;
    while (node && node !== document.body) {
      if (adapter.pickRootSelectors.some((selector) => {
        try { return node.matches(selector); } catch { return false; }
      })) {
        return node;
      }
      node = node.parentElement;
    }
    return start;
  }

  function collectGroupFromElement(el, adapter) {
    let node = el;
    for (let depth = 0; node && node !== document.body && depth < MAX_PICK_DEPTH; depth += 1) {
      const parent = node.parentElement;
      if (!parent) break;
      const siblings = Array.from(parent.children).filter((child) => child.isConnected && isMessageLike(child, adapter));
      if (siblings.length >= 2) {
        const messages = [];
        for (const sibling of siblings) {
          const result = adapter.extractRoot ? adapter.extractRoot(sibling) : extractGenericRoot(sibling, adapter);
          for (const message of result) {
            if (message) messages.push(message);
          }
        }
        const unique = dedupeMessages(messages);
        if (unique.length >= 2) return sortMessages(unique);
      }
      node = parent;
    }
    if (adapter.id === 'qianwen') {
      const round = el.closest('.chat-round');
      if (round) {
        const messages = extractQianwenRoot(round);
        if (messages.length) return sortMessages(dedupeMessages(messages));
      }
    }
    const result = adapter.extractRoot ? adapter.extractRoot(el) : extractGenericRoot(el, adapter);
    return sortMessages(dedupeMessages(result.filter(Boolean)));
  }

  function isUiEvent(event) {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    return path.includes(state.host);
  }

  function onPickMove(event) {
    if (!state.pickMode || isUiEvent(event)) return;
    const candidate = findPickCandidate(event.target, state.adapter);
    if (candidate) highlightElement(candidate);
  }

  function onPickClick(event) {
    if (!state.pickMode || isUiEvent(event)) return;
    event.preventDefault();
    event.stopPropagation();
    const candidate = findPickCandidate(event.target, state.adapter);
    const messages = collectGroupFromElement(candidate, state.adapter);
    if (!messages.length) {
      toast('No messages detected there. Try clicking a different message bubble.');
      return;
    }
    stopPickMode();
    state.messages = messages;
    state.autoTitle = deriveTitle(messages, state.adapter);
    if (!state.titleEdited || !state.titleInput.value.trim()) state.titleInput.value = state.autoTitle;
    renderMessageList();
    setOverlay(true);
    toast(`Picked ${messages.length} message${messages.length === 1 ? '' : 's'}.`);
  }

  function onPickKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      stopPickMode();
      if (state.messages.length) setOverlay(true);
      toast('Pick mode cancelled.');
    }
  }

  function startPickMode() {
    if (!state.adapter) return;
    stopPickMode();
    setOverlay(false);
    state.pickMode = true;
    state.savedCursor = document.documentElement.style.cursor;
    document.documentElement.style.cursor = 'crosshair';
    state.pickBanner.classList.remove('hidden');
    window.addEventListener('mousemove', onPickMove, true);
    window.addEventListener('click', onPickClick, true);
    window.addEventListener('keydown', onPickKeyDown, true);
  }

  function stopPickMode() {
    if (!state.pickMode && !state.highlightEl) return;
    state.pickMode = false;
    clearHighlight();
    document.documentElement.style.cursor = state.savedCursor || '';
    if (state.pickBanner) state.pickBanner.classList.add('hidden');
    window.removeEventListener('mousemove', onPickMove, true);
    window.removeEventListener('click', onPickClick, true);
    window.removeEventListener('keydown', onPickKeyDown, true);
  }

  function handleAction(action) {
    switch (action) {
      case 'all': selectAll(true); break;
      case 'none': selectAll(false); break;
      case 'invert': invertSelection(); break;
      case 'questions': selectRole('user'); break;
      case 'answers': selectRole('assistant'); break;
      case 'refresh': scanAndRender(); break;
      case 'pick': startPickMode(); break;
      case 'cancel-pick':
        stopPickMode();
        if (state.messages.length) setOverlay(true);
        break;
      default: break;
    }
  }

  function bindUiEvents() {
    const root = state.shadow;
    root.querySelector('.fab').addEventListener('click', () => openModal(true));
    root.querySelector('.close').addEventListener('click', closeModal);
    root.querySelector('.overlay').addEventListener('click', (event) => {
      if (event.target === state.overlay) closeModal();
    });

    root.querySelector('.toolbar').addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (button) handleAction(button.dataset.action);
    });
    root.querySelector('.empty').addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (button) handleAction(button.dataset.action);
    });
    root.querySelector('.pick-banner').addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (button) handleAction(button.dataset.action);
    });

    state.titleInput.addEventListener('input', () => {
      state.titleEdited = true;
    });
    state.exportBtn.addEventListener('click', handleExport);

    document.addEventListener('keydown', (event) => {
      if (event.altKey && event.shiftKey && event.key.toLowerCase() === 'e') {
        const target = event.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
        event.preventDefault();
        openModal(true);
        return;
      }
      if (event.key === 'Escape' && state.overlay && !state.overlay.classList.contains('hidden')) {
        closeModal();
      }
    });
  }

  function createUi() {
    if (document.getElementById(UI_ID)) return;
    const host = document.createElement('div');
    host.id = UI_ID;
    host.style.all = 'initial';
    document.documentElement.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = UI_HTML;

    state.adapter = detectAdapter();
    state.host = host;
    state.shadow = shadow;
    state.overlay = shadow.querySelector('.overlay');
    state.modal = shadow.querySelector('.modal');
    state.listEl = shadow.querySelector('.msg-list');
    state.emptyEl = shadow.querySelector('.empty');
    state.tableHead = shadow.querySelector('.table-head');
    state.countEl = shadow.querySelector('.count');
    state.selectedCountEl = shadow.querySelector('.selected-count');
    state.exportBtn = shadow.querySelector('.export');
    state.titleInput = shadow.querySelector('.title-input');
    state.styleSelect = shadow.querySelector('.style');
    state.embedCheck = shadow.querySelector('.embed-check');
    state.toastEl = shadow.querySelector('.toast');
    state.pickBanner = shadow.querySelector('.pick-banner');

    bindUiEvents();

    if (typeof GM_registerMenuCommand === 'function') {
      GM_registerMenuCommand('Export AI chat to HTML', () => openModal(true));
    }
  }

  function init() {
    if (document.getElementById(UI_ID)) return;
    createUi();
  }

  const ADAPTERS = {
    deepseek: {
      id: 'deepseek',
      name: 'DeepSeek',
      iconText: 'D',
      iconBg: '#4d6bfe',
      rootSelectors: ['[data-virtual-list-item-key]', '.ds-message'],
      pickRootSelectors: ['[data-virtual-list-item-key]', '.ds-message'],
      contentSelectors: ['.ds-assistant-message-main-content', '.ds-markdown', '.fbb737a4', '.ds-collapsible-text'],
      markerRules: [
        { selector: '.fbb737a4', role: 'user' },
        { selector: '.ds-assistant-message-main-content', role: 'assistant' }
      ],
      titleSelectors: [
        '[class*="chat-item"][class*="active"]',
        '[class*="chat-item"][class*="selected"]',
        '[class*="conversation-title"]',
        '[class*="chat-title"]'
      ],
      extractRoot: extractDeepSeekRoot
    },
    qwen: {
      id: 'qwen',
      name: 'Qwen',
      iconText: 'Q',
      iconBg: '#615ced',
      rootSelectors: ['.qwen-chat-message'],
      pickRootSelectors: ['.qwen-chat-message', '.chat-user-message-container', '.response-message-content'],
      contentSelectors: ['.chat-user-message', '.chat-user-message-container', '.response-message-content', '.qwen-markdown', '[class*="markdown"]'],
      markerRules: [
        { selector: '.chat-user-message', role: 'user' },
        { selector: '.response-message-content', role: 'assistant' }
      ],
      titleSelectors: [
        '[class*="conversation-title"]',
        '[class*="chat-title"]'
      ],
      extractRoot: extractQwenRoot
    },
    qianwen: {
      id: 'qianwen',
      name: 'Qianwen',
      iconText: '千',
      iconBg: '#0e9f6e',
      rootSelectors: ['.chat-question-card-wrap', '.answer-common-card', '.answerItem', '[class*="answer-card"]', '[class*="answer-item"]'],
      pickRootSelectors: ['.chat-question-card-wrap', '.chat-question-wrap', '.answer-common-card', '.answerItem', '[class*="answer-card"]', '[class*="answer-item"]'],
      contentSelectors: ['.question-text-card', '.answer-common-card', '.answerItem', '[class*="answer-card"]', '[class*="answer-item"]', '.qk-markdown', '[class*="markdown"]'],
      markerRules: [
        { selector: '.chat-question-card-wrap', role: 'user' },
        { selector: '.answer-common-card, .answerItem, [class*="answer-card"], [class*="answer-item"]', role: 'assistant' }
      ],
      titleSelectors: [
        '[class*="conversation-title"]',
        '[class*="chat-title"]'
      ],
      extractRoot: extractQianwenRoot
    },
    generic: {
      id: 'generic',
      name: 'AI Chat',
      iconText: 'AI',
      iconBg: '#374151',
      rootSelectors: ['[data-message-id]', '[data-message-role]', '[class*="message-item"]', '[class*="chat-message"]', '[class*="message-row"]'],
      pickRootSelectors: ['[data-message-id]', '[data-message-role]', '[class*="message-item"]', '[class*="chat-message"]', '[class*="message-row"]'],
      contentSelectors: ['[class*="markdown"]', '[class*="message-content"]', '[class*="prose"]', '.message-content'],
      markerRules: [
        { selector: '[data-role="user"], [class*="user-message"], [class*="question-content"]', role: 'user' },
        { selector: '[data-role="assistant"], [class*="assistant-message"], [class*="answer-content"]', role: 'assistant' }
      ],
      titleSelectors: ['header h1', 'main h1', 'h1'],
      extractRoot: null
    }
  };

  if (document.body) {
    init();
  } else {
    window.addEventListener('DOMContentLoaded', init, { once: true });
  }
})();
