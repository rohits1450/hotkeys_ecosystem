import browser from "webextension-polyfill";
import { getConfig, setConfig, type EnvTriple, type HotkeyConfig } from "../lib/config";
import { isChrome } from "../lib/platform";

const envContainer = document.getElementById("env-triples")!;

function addTripleRow(triple: EnvTriple = { local: "", staging: "", production: "" }) {
  const row = document.createElement("div");
  row.className = "env-triple";

  const local = document.createElement("input");
  local.placeholder = "localhost:3000";
  local.value = triple.local;

  const staging = document.createElement("input");
  staging.placeholder = "staging.example.com";
  staging.value = triple.staging;

  const production = document.createElement("input");
  production.placeholder = "example.com";
  production.value = triple.production;

  const remove = document.createElement("button");
  remove.textContent = "✕";
  remove.onclick = () => row.remove();

  row.append(local, staging, production, remove);
  envContainer.appendChild(row);
}

function readTriples(): EnvTriple[] {
  return Array.from(envContainer.querySelectorAll(".env-triple")).map((row) => {
    const inputs = row.querySelectorAll("input");
    return { local: inputs[0].value, staging: inputs[1].value, production: inputs[2].value };
  });
}

function field(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}

async function load() {
  const config = await getConfig();
  field("gmailUrl").value = config.gmailUrl;
  field("githubPrsUrl").value = config.githubPrsUrl;
  field("mediaUrl").value = config.mediaUrl;
  field("mediaMatchPattern").value = config.mediaMatchPattern;
  field("workspaceUrl").value = config.workspaceUrl;
  field("workspaceMatchPattern").value = config.workspaceMatchPattern;
  for (const triple of config.envTriples) addTripleRow(triple);
}

document.getElementById("add-triple")!.addEventListener("click", () => addTripleRow());

document.getElementById("save")!.addEventListener("click", async () => {
  const config: HotkeyConfig = {
    gmailUrl: field("gmailUrl").value,
    githubPrsUrl: field("githubPrsUrl").value,
    mediaUrl: field("mediaUrl").value,
    mediaMatchPattern: field("mediaMatchPattern").value,
    workspaceUrl: field("workspaceUrl").value,
    workspaceMatchPattern: field("workspaceMatchPattern").value,
    envTriples: readTriples().filter((t) => t.local && t.staging && t.production),
  };
  await setConfig(config);
  const status = document.getElementById("status")!;
  status.textContent = "Saved.";
  setTimeout(() => (status.textContent = ""), 1500);
});

document.getElementById("open-shortcuts-link")!.addEventListener("click", async (e) => {
  e.preventDefault();
  await browser.tabs.create({ url: isChrome ? "chrome://extensions/shortcuts" : "about:addons" });
});

load();
