# aiaa5050-ai-chat-exporter

An AI chat exporter Tampermonkey user script for AIAA5050 (taught at HKUST(GZ) in the Fall 2026-2027 semester) coursework.

The script adds an **Export Chat** button to supported AI chat pages. It lists the messages that are currently rendered, lets you choose which questions and answers to include, and downloads the selection as a standalone HTML file with a table of contents, platform badge, export timestamp, and clean typography.

## Supported sites

- <https://chat.deepseek.com/a/chat/s/*>
- <https://chat.deepseek.com/share/*>
- <https://chat.qwen.ai/c/*>
- <https://www.qianwen.com/chat/*>

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Open the Tampermonkey dashboard and create a new user script.
3. Replace the template with the contents of [`ai-chat-exporter.user.js`](./ai-chat-exporter.user.js) and save it.
4. Alternatively, open the raw script URL in a browser with Tampermonkey installed and accept the installation prompt.

## Usage

1. Open a supported conversation.
2. Click **Export Chat** at the bottom right (or press `Alt+Shift+E`).
3. Select messages with the checkboxes, or use **Select All**, **Select None**, **Invert Selection**, **Select Questions**, or **Select Answers**.
4. Optionally edit the title, choose a style (`Default`, `Dark`, or `Compact`), and turn image embedding on or off.
5. Click **Export Selected**. The HTML file is saved to your downloads folder.

If the automatic detection misses a chat layout, click **Pick on page**, then click any message bubble. The script will try to collect the surrounding conversation. Press `Esc` to cancel picking.

## Notes

- The exporter captures the messages that are currently in the page DOM. For virtualized conversations, scroll through the parts you need first, then open the exporter. If a reply is still streaming, wait for it to finish and press **Refresh** in the dialog.
- Image embedding uses `GM_xmlhttpRequest` (hence the broad `@connect *` permission) so images that require your session cookies can be inlined. If an image cannot be fetched, its original URL is kept.
- The exported HTML is self-contained except for the optional KaTeX stylesheet, which is loaded from jsDelivr when mathematical formulas are present.
- Everything runs locally in the browser; no chat content is uploaded anywhere.

## License

GNU Affero General Public License v3.0. See [LICENSE](./LICENSE).
