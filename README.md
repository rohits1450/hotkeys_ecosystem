# Hotkey Ecosystem

A cross-browser hotkey extension for clipboard tools, quick-launch workspaces, tab/window management, and dev utilities. See [proj-info.txt](proj-info.txt) for the original concept and [../.claude/plans/effervescent-wiggling-horizon.md](/home/nerzotic_rs/.claude/plans/effervescent-wiggling-horizon.md) for the build plan and rationale (which spec items were reconciled/dropped and why).

## Develop

```sh
npm install
npm run build          # builds dist/chrome and dist/firefox
npm run build:chrome    # chrome/brave only
npm run build:firefox    # firefox only
npm run dev               # chrome, esbuild watch mode
npm run typecheck
```

## Load locally

**Chrome / Brave**
1. Go to `chrome://extensions` (or `brave://extensions`)
2. Enable Developer mode
3. "Load unpacked" → select `dist/chrome`

**Firefox**
1. Go to `about:debugging#/runtime/this-firefox`
2. "Load Temporary Add-on" → select `dist/firefox/manifest.json`
   (temporary add-ons are removed when Firefox closes; for a persistent local install you need a signed `.xpi`)

After loading, open the extension's popup to see which of the 16 shortcuts are bound. Chrome/Brave only auto-bind the first 4 (`Alt+Shift+F/S/D/G`) — bind the rest at `chrome://extensions/shortcuts`. Firefox has no manifest-level limit but still requires per-user confirmation at `about:addons` → gear icon → **Manage Extension Shortcuts**.

Per-project settings (quick-launch URLs, environment-switch host triples) are configured on the Options page, linked from the popup.

## Before publishing to any store

- **Icons are placeholders** (`icons/icon*.png`, generated with ImageMagick) — replace with real artwork.
- **Firefox `gecko.id`** in [manifest/firefox.json](manifest/firefox.json) is a placeholder (`hotkeys-ecosystem@example.invalid`) — replace with an id tied to a domain/email you control before submitting to addons.mozilla.org.
- Bump `version` in [manifest/base.json](manifest/base.json) for every store submission; store review tooling rejects re-uploads of an already-published version.
- Chrome Web Store and AMO both require privacy-practice disclosures for the permissions used here (`activeTab`, `scripting`, `storage`, `downloads`, `clipboardWrite`, `tabs`, and Chrome-only `offscreen`) — none of these are "broad host permission" grants, which should keep review straightforward, but each store's listing form still asks you to justify each one in plain language.
- Brave ships through the Chrome Web Store listing (same `dist/chrome` build) — no separate Brave-specific packaging step, but double check none of the `Alt+Shift+<letter>` shortcuts collide with a shortcut Brave itself reserves for Rewards/Wallet/Shields (varies by Brave version).

## Known platform gotcha

Windows' built-in "Switch input language" hotkey defaults to `Left Alt+Shift`, which can intercept these shortcuts before they reach the browser. This is an OS setting the extension cannot detect or override — if a user reports shortcuts not firing on Windows, point them to Settings → Time & Language → Language → Advanced keyboard settings → Input language hot keys, to change or disable it.

