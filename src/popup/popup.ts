import browser from "webextension-polyfill";
import { isChrome } from "../lib/platform";

const COMMAND_LABELS: Record<string, string> = {
  "format-selection": "Format selection (JSON/CSS/Base64)",
  "search-stackoverflow-github": "Search SO + GitHub code",
  "search-docs": "Search MDN",
  "quick-launch-gmail": "Open/focus Gmail",
  "quick-launch-github-prs": "Open/focus GitHub PRs",
  "quick-launch-media": "Open/focus media (YouTube/Spotify)",
  "quick-launch-workspace": "Open/focus workspace (Calendar/Notion)",
  "toggle-mute-tab": "Mute/unmute tab",
  "close-tabs-right": "Close tabs to the right",
  "toggle-pin-tab": "Pin/unpin tab",
  "dock-reference-window": "Dock reference window",
  "capture-screenshot": "Capture screenshot",
  "copy-markdown-link": "Copy page as Markdown link",
  "toggle-localhost-theme": "Toggle localhost dark mode",
  "switch-environment": "Switch environment",
  "hard-refresh-bypass-cache": "Hard refresh (bypass cache)",
};

async function render() {
  const table = document.getElementById("commands")!;
  const commands = await browser.commands.getAll();
  let unbound = 0;

  for (const cmd of commands) {
    if (!cmd.name) continue;
    const row = document.createElement("tr");
    const keyCell = document.createElement("td");
    keyCell.className = "key";
    keyCell.textContent = cmd.shortcut || "unbound";
    if (!cmd.shortcut) unbound++;
    const labelCell = document.createElement("td");
    labelCell.textContent = COMMAND_LABELS[cmd.name] ?? cmd.name;
    row.append(keyCell, labelCell);
    table.appendChild(row);
  }

  const note = document.getElementById("unbound-note")!;
  note.textContent = unbound
    ? `${unbound} shortcut(s) unbound — Chrome only auto-assigns the first 4. Use "Configure shortcuts" to bind the rest.`
    : "All shortcuts bound.";
}

document.getElementById("open-shortcuts")!.addEventListener("click", async () => {
  if (isChrome) {
    await browser.tabs.create({ url: "chrome://extensions/shortcuts" });
  } else {
    await browser.tabs.create({ url: "about:addons" });
  }
});

document.getElementById("open-options")!.addEventListener("click", () => {
  browser.runtime.openOptionsPage();
});

render();
