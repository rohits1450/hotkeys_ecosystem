import browser from "webextension-polyfill";

export async function getActiveTab(): Promise<browser.Tabs.Tab> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab) throw new Error("No active tab found");
  return tab;
}

export async function toggleMuteActiveTab(): Promise<void> {
  const tab = await getActiveTab();
  if (tab.id === undefined) return;
  await browser.tabs.update(tab.id, { muted: !tab.mutedInfo?.muted });
}

export async function togglePinActiveTab(): Promise<void> {
  const tab = await getActiveTab();
  if (tab.id === undefined) return;
  await browser.tabs.update(tab.id, { pinned: !tab.pinned });
}

export async function closeTabsToRight(): Promise<void> {
  const tab = await getActiveTab();
  if (tab.index === undefined || tab.windowId === undefined) return;
  const tabsInWindow = await browser.tabs.query({ windowId: tab.windowId });
  const toClose = tabsInWindow
    .filter((t) => t.index > tab.index! && t.id !== undefined && !t.pinned)
    .map((t) => t.id!) as number[];
  if (toClose.length) await browser.tabs.remove(toClose);
}

export async function hardRefreshBypassCache(): Promise<void> {
  const tab = await getActiveTab();
  if (tab.id === undefined) return;
  await browser.tabs.reload(tab.id, { bypassCache: true });
}

export async function focusOrOpen(urlPattern: string, fallbackUrl: string): Promise<void> {
  const matches = await browser.tabs.query({ url: urlPattern });
  const existing = matches[0];
  if (existing?.id !== undefined) {
    await browser.tabs.update(existing.id, { active: true });
    if (existing.windowId !== undefined) await browser.windows.update(existing.windowId, { focused: true });
    return;
  }
  await browser.tabs.create({ url: fallbackUrl });
}
