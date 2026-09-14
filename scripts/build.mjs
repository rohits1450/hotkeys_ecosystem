import { build, context } from "esbuild";
import { mkdir, rm, cp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const watch = args.includes("--watch");
const prod = args.includes("--prod");
const targets = args.filter((a) => a === "chrome" || a === "firefox");
const buildTargets = targets.length ? targets : ["chrome", "firefox"];

const entryPoints = {
  background: "src/background.ts",
  "popup/popup": "src/popup/popup.ts",
  "options/options": "src/options/options.ts",
  "offscreen/offscreen": "src/offscreen/offscreen.ts",
};

async function mergeManifest(target) {
  const base = JSON.parse(await readFile(path.join(root, "manifest/base.json"), "utf8"));
  const overlay = JSON.parse(await readFile(path.join(root, `manifest/${target}.json`), "utf8"));
  const merged = { ...base, ...overlay };
  if (base.permissions || overlay.permissions) {
    merged.permissions = Array.from(new Set([...(base.permissions ?? []), ...(overlay.permissions ?? [])]));
  }
  return merged;
}

async function buildTarget(target) {
  const outdir = path.join(root, "dist", target);
  await rm(outdir, { recursive: true, force: true });
  await mkdir(outdir, { recursive: true });

  const buildOptions = {
    entryPoints,
    entryNames: "[dir]/[name]",
    outdir,
    bundle: true,
    format: "iife",
    target: "es2022",
    sourcemap: !prod,
    minify: prod,
    logLevel: "info",
    define: {
      __TARGET__: JSON.stringify(target),
    },
  };

  if (watch) {
    const ctx = await context(buildOptions);
    await ctx.watch();
    console.log(`[${target}] watching for changes...`);
  } else {
    await build(buildOptions);
  }

  const manifest = await mergeManifest(target);
  await writeFile(path.join(outdir, "manifest.json"), JSON.stringify(manifest, null, 2));

  await cp(path.join(root, "src/popup/popup.html"), path.join(outdir, "popup/popup.html"));
  await cp(path.join(root, "src/options/options.html"), path.join(outdir, "options/options.html"));
  await cp(path.join(root, "src/offscreen/offscreen.html"), path.join(outdir, "offscreen/offscreen.html"));
  await cp(path.join(root, "icons"), path.join(outdir, "icons"), { recursive: true });

  console.log(`Built ${target} -> ${path.relative(root, outdir)}`);
}

for (const target of buildTargets) {
  await buildTarget(target);
}
