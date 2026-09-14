# Hotkey Ecosystem

Turn your browser into a hotkey-driven workstation. One extension, one consistent `Alt+Shift+<letter>` scheme, sixteen commands covering clipboard/text tools, quick-launch workspaces, tab and window management, screenshot capture, and dev-focused utilities like environment switching and cache-bypassing reloads.

Built on Manifest V3 from a single TypeScript codebase, shipping to **Chrome**, **Brave**, and **Firefox** from the same source.

## Why

Command-line and code-editor workflows have had programmable hotkeys for decades. Browsers mostly haven't — every tab switch, search, or format-this-JSON-blob is a mouse trip. Hotkey Ecosystem brings that same muscle-memory-driven workflow to the browser itself, without needing to install and babysit a separate desktop automation tool for browser-only tasks.

## Features

| Shortcut | Command | What it does |
|---|---|---|
| `Alt+Shift+F` | Format selection | Pretty-prints selected JSON, minifies selected CSS, and Base64 encodes/decodes it — shown side by side with one-click copy |
| `Alt+Shift+S` | Search SO + GitHub | Opens the selected text as a search on Stack Overflow and GitHub Code Search |
| `Alt+Shift+D` | Search docs | Opens the selected text as an MDN search |
| `Alt+Shift+G` | Quick-launch Gmail | Focuses an existing Gmail tab, or opens one |
| — | Quick-launch GitHub PRs | Focuses/opens your GitHub Pull Requests dashboard |
| — | Quick-launch media | Focuses/opens your music/video app of choice (configurable) |
| — | Quick-launch workspace | Focuses/opens your calendar/notes app of choice (configurable) |
| — | Mute/unmute tab | Toggles audio on the active tab |
| — | Close tabs to the right | Declutters everything after the active tab |
| — | Pin/unpin tab | Toggles pin state on the active tab |
| — | Dock reference window | Opens a doc search result in a small window docked beside your current one |
| — | Capture screenshot | Captures the visible tab straight to your clipboard (downloads as a fallback on Firefox) |
| — | Copy page as Markdown link | Copies `[Title](URL)` of the current tab |
| — | Toggle localhost dark mode | Flips a dark-mode filter, scoped to `localhost`/`127.0.0.1` only |
| — | Switch environment | Cycles the current tab's host through your configured local → staging → production triples |
| — | Hard refresh (bypass cache) | Reloads the active tab ignoring cache |

Only the first four shortcuts above ship with a default keybinding — that's a hard limit Chrome/Brave impose on extensions (`suggested_key` bindings). Bind the rest yourself from the extension popup, one click through to `chrome://extensions/shortcuts` (Firefox: `about:addons` → gear icon → Manage Extension Shortcuts).

Quick-launch URLs and environment triples are all set from the extension's **Options** page — nothing is hardcoded to any one person's tools.

## Install

Not yet published to any extension store — for now, load it from source:

**Chrome / Brave**
1. `npm install && npm run build:chrome`
2. Go to `chrome://extensions` (or `brave://extensions`)
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

## Design notes / known limitations

- **No native app launching.** VS Code/terminal/Postman launchers from the original concept aren't here — browser extensions are sandboxed from the OS. That would need a separate native-messaging companion app, which is a possible future addition, not a v1 feature.
- **`Alt+Shift+<letter>` over `Ctrl+Shift+<letter>`.** Most of the obvious `Ctrl+Shift+*` combos are already reserved by Chromium/Firefox themselves (DevTools, hard reload, reopen tab, etc.) and can't be captured by an extension.
- **Windows' language-switch hotkey.** Windows defaults "Switch input language" to `Left Alt+Shift`, which can eat these shortcuts before the browser sees them. That's an OS setting, not something this extension can detect or work around — if shortcuts silently don't fire on Windows, check Settings → Time & Language → Language → Advanced keyboard settings → Input language hot keys.

## Before publishing to a store

- Icons in `icons/` are placeholders — swap in real artwork.
- `manifest/firefox.json`'s `gecko.id` (`hotkeys-ecosystem@example.invalid`) is a placeholder — replace with an id tied to a domain/email you control before submitting to AMO.
- Bump `version` in `manifest/base.json` for every store submission.

## License

[MIT](LICENSE)
