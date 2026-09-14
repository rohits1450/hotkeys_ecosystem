import browser from "webextension-polyfill";
import { isChrome, MDN_SEARCH_URL, STACKOVERFLOW_SEARCH_URL, GITHUB_CODE_SEARCH_URL } from "./lib/platform";
import { formatJson, minifyCss, tryBase64AutoDetect } from "./lib/clipboard";
import {
  getActiveTab,
  toggleMuteActiveTab,
  togglePinActiveTab,
  closeTabsToRight,
  hardRefreshBypassCache,
  focusOrOpen,
} from "./lib/tabs";
import { getConfig } from "./lib/config";

// ---- Self-contained functions injected into page context via scripting.executeScript.
// These must not reference any module-scope imports/closures: the browser serializes
// them with Function.prototype.toString() and re-runs them inside the target page.

function readSelectionInPage(): string {
  return window.getSelection()?.toString() ?? "";
}

function showOverlayInPage(sections: { label: string; value: string }[]): void {
  const existing = document.getElementById("__hotkeys_ext_overlay__");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "__hotkeys_ext_overlay__";
  Object.assign(overlay.style, {
    position: "fixed",
    top: "16px",
    right: "16px",
    zIndex: "2147483647",
    background: "#1e1e1e",
    color: "#f0f0f0",
    font: "13px/1.4 -apple-system, Segoe UI, sans-serif",
    padding: "12px",
    borderRadius: "8px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    maxWidth: "420px",
    maxHeight: "70vh",
    overflow: "auto",
  } as CSSStyleDeclaration);

  const close = document.createElement("button");
  close.textContent = "✕";
  Object.assign(close.style, {
    float: "right",
    background: "none",
    border: "none",
    color: "#f0f0f0",
    cursor: "pointer",
    fontSize: "14px",
  } as CSSStyleDeclaration);
  close.onclick = () => overlay.remove();
  overlay.appendChild(close);

  for (const section of sections) {
    const heading = document.createElement("div");
    heading.textContent = section.label;
    Object.assign(heading.style, { fontWeight: "600", marginTop: "8px" } as CSSStyleDeclaration);
    overlay.appendChild(heading);

    const pre = document.createElement("pre");
    pre.textContent = section.value;
    Object.assign(pre.style, {
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      background: "#111",
      padding: "6px",
      borderRadius: "4px",
      margin: "4px 0",
    } as CSSStyleDeclaration);
    overlay.appendChild(pre);

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy";
    Object.assign(copyBtn.style, {
      background: "#3a3a3a",
      color: "#f0f0f0",
      border: "1px solid #555",
      borderRadius: "4px",
      padding: "2px 8px",
      cursor: "pointer",
    } as CSSStyleDeclaration);
    copyBtn.onclick = async () => {
      await navigator.clipboard.writeText(section.value);
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
    };
    overlay.appendChild(copyBtn);
  }

  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 20000);
}

function writeClipboardTextInPage(text: string): void {
  void navigator.clipboard.writeText(text);
}

function toggleLocalhostThemeInPage(): void {
  const STYLE_ID = "__hotkeys_ext_dark_style__";
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = "html.__hotkeys_ext_dark__ { filter: invert(1) hue-rotate(180deg); }";
    document.head.appendChild(style);
  }
  document.documentElement.classList.toggle("__hotkeys_ext_dark__");
}

// ---- Command handlers

async function handleFormatSelection(tabId: number) {
  const [{ result: text }] = await browser.scripting.executeScript({
    target: { tabId },
    func: readSelectionInPage,
  });

  const sections: { label: string; value: string }[] = [];
  if (!text) {
    sections.push({ label: "No text selected", value: "Select some text first, then retry." });
  } else {
    try {
      sections.push({ label: "JSON (pretty-printed)", value: formatJson(text) });
    } catch {
      /* not valid JSON, skip */
    }
    if (/[{;:]/.test(text)) {
      sections.push({ label: "CSS (minified)", value: minifyCss(text) });
    }
    const b64 = tryBase64AutoDetect(text);
    sections.push({ label: `Base64 (${b64.direction}d)`, value: b64.result });
    if (sections.length === 1) sections.push({ label: "Raw selection", value: text });
  }

  await browser.scripting.executeScript({ target: { tabId }, func: showOverlayInPage, args: [sections] });
}

async function readSelectionQuery(tabId: number): Promise<string> {
  const [{ result: text }] = await browser.scripting.executeScript({
    target: { tabId },
    func: readSelectionInPage,
  });
  return encodeURIComponent(text || "");
}

async function handleSearchSingle(tabId: number, urlBuilder: (q: string) => string) {
  const query = await readSelectionQuery(tabId);
  await browser.tabs.create({ url: urlBuilder(query) });
}

async function handleSearchStackOverflowGithub(tabId: number) {
  const query = await readSelectionQuery(tabId);
  await browser.tabs.create({ url: `${STACKOVERFLOW_SEARCH_URL}${query}` });
  await browser.tabs.create({ url: `${GITHUB_CODE_SEARCH_URL}${query}` });
}

async function handleCaptureScreenshot(tabId: number) {
  const dataUrl = await browser.tabs.captureVisibleTab();
  if (isChrome && typeof chrome !== "undefined" && chrome.offscreen) {
    const hasDocument = await chrome.offscreen.hasDocument();
    if (!hasDocument) {
      await chrome.offscreen.createDocument({
        url: "offscreen/offscreen.html",
        reasons: [chrome.offscreen.Reason.CLIPBOARD],
        justification: "Write captured screenshot PNG to the system clipboard",
      });
    }
    await browser.runtime.sendMessage({ type: "write-image-clipboard", dataUrl });
  } else {
    await browser.downloads.download({ url: dataUrl, filename: `screenshot-${Date.now()}.png` });
  }
  void tabId;
}

async function handleCopyMarkdownLink(tabId: number) {
  const tab = await getActiveTab();
  const markdown = `[${tab.title ?? tab.url}](${tab.url})`;
  await browser.scripting.executeScript({ target: { tabId }, func: writeClipboardTextInPage, args: [markdown] });
}

async function handleToggleLocalhostTheme(tabId: number) {
  const tab = await getActiveTab();
  const host = tab.url ? new URL(tab.url).hostname : "";
  if (host !== "localhost" && host !== "127.0.0.1") return;
  await browser.scripting.executeScript({ target: { tabId }, func: toggleLocalhostThemeInPage });
}

async function handleSwitchEnvironment() {
  const tab = await getActiveTab();
  if (!tab.url || tab.id === undefined) return;
  const url = new URL(tab.url);
  const config = await getConfig();
  for (const triple of config.envTriples) {
    const stages = [triple.local, triple.staging, triple.production];
    const idx = stages.findIndex((host) => host === url.host);
    if (idx === -1) continue;
    const nextHost = stages[(idx + 1) % stages.length];
    url.host = nextHost;
    await browser.tabs.update(tab.id, { url: url.toString() });
    return;
  }
}

async function handleDockReferenceWindow(tabId: number) {
  const query = await readSelectionQuery(tabId);
  const current = await browser.windows.getCurrent();
  const width = Math.round((current.width ?? 1200) / 2);
  const height = current.height ?? 900;
  const left = (current.left ?? 0) + width;
  const top = current.top ?? 0;
  await browser.windows.create({
    url: query ? `${MDN_SEARCH_URL}${query}` : "https://developer.mozilla.org/",
    type: "popup",
    width,
    height,
    left,
    top,
  });
}

async function dispatchCommand(command: string): Promise<void> {
  const tab = await getActiveTab().catch(() => undefined);
  const tabId = tab?.id;

  switch (command) {
    case "format-selection":
      if (tabId !== undefined) await handleFormatSelection(tabId);
      break;
    case "search-stackoverflow-github":
      if (tabId !== undefined) await handleSearchStackOverflowGithub(tabId);
      break;
    case "search-docs":
      if (tabId !== undefined) await handleSearchSingle(tabId, (q) => `${MDN_SEARCH_URL}${q}`);
      break;
    case "quick-launch-gmail": {
      const config = await getConfig();
      await focusOrOpen("*://mail.google.com/*", config.gmailUrl);
      break;
    }
    case "quick-launch-github-prs": {
      const config = await getConfig();
      await focusOrOpen("*://github.com/pulls*", config.githubPrsUrl);
      break;
    }
    case "quick-launch-media": {
      const config = await getConfig();
      await focusOrOpen(config.mediaMatchPattern, config.mediaUrl);
      break;
    }
    case "quick-launch-workspace": {
      const config = await getConfig();
      await focusOrOpen(config.workspaceMatchPattern, config.workspaceUrl);
      break;
    }
    case "toggle-mute-tab":
      await toggleMuteActiveTab();
      break;
    case "close-tabs-right":
      await closeTabsToRight();
      break;
    case "toggle-pin-tab":
      await togglePinActiveTab();
      break;
    case "dock-reference-window":
      if (tabId !== undefined) await handleDockReferenceWindow(tabId);
      break;
    case "capture-screenshot":
      if (tabId !== undefined) await handleCaptureScreenshot(tabId);
      break;
    case "copy-markdown-link":
      if (tabId !== undefined) await handleCopyMarkdownLink(tabId);
      break;
    case "toggle-localhost-theme":
      if (tabId !== undefined) await handleToggleLocalhostTheme(tabId);
      break;
    case "switch-environment":
      await handleSwitchEnvironment();
      break;
    case "hard-refresh-bypass-cache":
      await hardRefreshBypassCache();
      break;
  }
}

browser.commands.onCommand.addListener(dispatchCommand);
