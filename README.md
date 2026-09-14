# RSHotkeysEcosystem

Turn your browser into a hotkey-driven workstation. One extension, one consistent `Alt+Shift+<letter>` scheme, sixteen commands covering clipboard/text tools, quick-launch workspaces, tab and window management, screenshot capture, and dev-focused utilities like environment switching and cache-bypassing reloads.

Built on Manifest V3 from a single TypeScript codebase, shipping to **Chrome**, **Brave**, **Edge**, and **Firefox** from the same source — Brave and Edge both run the same Chromium build as Chrome.

## Features

| Shortcut | Command | What it does |
|---|---|---|
| `Alt+Shift+F` | Format selection | Pretty-prints selected JSON, minifies selected CSS, and Base64 encodes/decodes it — shown side by side with one-click copy |
| `Alt+Shift+S` | Search SO + GitHub | Opens the selected text as a search on Stack Overflow and GitHub Code Search |
| `Alt+Shift+D` | Search docs | Opens the selected text as an MDN search |
| `Alt+Shift+G` | Quick-launch Gmail | Focuses an existing Gmail tab, or opens one |
| *set your own¹* | Quick-launch GitHub PRs | Focuses/opens your GitHub Pull Requests dashboard |
| *set your own¹* | Quick-launch media | Focuses/opens your music/video app of choice (configurable) |
| *set your own¹* | Quick-launch workspace | Focuses/opens your calendar/notes app of choice (configurable) |
| *set your own¹* | Mute/unmute tab | Toggles audio on the active tab |
| *set your own¹* | Close tabs to the right | Declutters everything after the active tab |
| *set your own¹* | Pin/unpin tab | Toggles pin state on the active tab |
| *set your own¹* | Dock reference window | Opens a doc search result in a small window docked beside your current one |
| *set your own¹* | Capture screenshot | Captures the visible tab straight to your clipboard (downloads as a fallback on Firefox) |
| *set your own¹* | Copy page as Markdown link | Copies `[Title](URL)` of the current tab |
| *set your own¹* | Toggle localhost dark mode | Flips a dark-mode filter, scoped to `localhost`/`127.0.0.1` only |
| *set your own¹* | Switch environment | Cycles the current tab's host through your configured local → staging → production triples |
| *set your own¹* | Hard refresh (bypass cache) | Reloads the active tab ignoring cache |

¹ Chrome/Brave/Edge only let an extension auto-bind its **first 4** declared shortcuts (the `suggested_key` mechanism) — that's a store platform limit, not something this extension controls or that publishing changes. All 16 commands are fully implemented and working; the other 12 just need you to pick a key for them once. It's two clicks, not a technical step: open the extension popup → **Configure shortcuts** → assign a key to whichever commands you want. Firefox has no such 4-shortcut cap, but every extension's shortcuts there still need the same one-time manual confirmation at `about:addons` → gear icon → Manage Extension Shortcuts.

Quick-launch URLs and environment triples are all set from the extension's **Options** page — nothing is hardcoded to any one person's tools.

## Install

Not yet published to any extension store — see [Publishing](#publishing-to-the-stores) below for that. Until then, load it from source:

**Chrome / Brave / Edge**
1. `npm install && npm run build:chrome`
2. Go to `chrome://extensions` (`brave://extensions`, `edge://extensions`)
3. Enable Developer mode
4. "Load unpacked" → select `dist/chrome`

**Firefox**
1. `npm install && npm run build:firefox`
2. Go to `about:debugging#/runtime/this-firefox`
3. "Load Temporary Add-on" → select `dist/firefox/manifest.json`
   (temporary add-ons are removed when Firefox restarts — a persistent install needs a signed `.xpi` from addons.mozilla.org)

## Development

```sh
npm install
npm run build          # builds dist/chrome and dist/firefox
npm run build:chrome    # chrome/brave only
npm run build:firefox    # firefox only
npm run dev               # chrome, esbuild watch mode
npm run typecheck
```

Source layout: `src/background.ts` routes every command; `src/lib/` holds the browser-agnostic helpers (clipboard formatting, tab operations, stored config); `src/popup/` and `src/options/` are the two UI surfaces; `src/offscreen/` is the Chrome-only helper that writes screenshots to the clipboard (MV3 requires a dedicated document for clipboard image writes). `manifest/base.json` plus a `chrome.json`/`firefox.json` overlay are merged at build time by `scripts/build.mjs` into each target's `dist/*/manifest.json`.

No content script runs persistently on every page — every DOM-touching command is injected on demand, scoped to the active tab, when its shortcut fires. That keeps the permission list short and the store review straightforward.


## License

[MIT](LICENSE)
