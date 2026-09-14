import browser from "webextension-polyfill";

export interface EnvTriple {
  local: string;
  staging: string;
  production: string;
}

export interface HotkeyConfig {
  gmailUrl: string;
  githubPrsUrl: string;
  mediaUrl: string;
  mediaMatchPattern: string;
  workspaceUrl: string;
  workspaceMatchPattern: string;
  envTriples: EnvTriple[];
}

export const DEFAULT_CONFIG: HotkeyConfig = {
  gmailUrl: "https://mail.google.com/mail/u/0/#inbox",
  githubPrsUrl: "https://github.com/pulls",
  mediaUrl: "https://open.spotify.com",
  mediaMatchPattern: "*://open.spotify.com/*",
  workspaceUrl: "https://calendar.google.com",
  workspaceMatchPattern: "*://calendar.google.com/*",
  envTriples: [{ local: "localhost:3000", staging: "staging.example.com", production: "example.com" }],
};

const STORAGE_KEY = "hotkeyConfig";

export async function getConfig(): Promise<HotkeyConfig> {
  const stored = await browser.storage.sync.get(STORAGE_KEY);
  const value = stored[STORAGE_KEY] as Partial<HotkeyConfig> | undefined;
  return { ...DEFAULT_CONFIG, ...value };
}

export async function setConfig(config: HotkeyConfig): Promise<void> {
  await browser.storage.sync.set({ [STORAGE_KEY]: config });
}
