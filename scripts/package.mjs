import archiver from "archiver";
import { createWriteStream } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "dist-packages");
await mkdir(outDir, { recursive: true });

const base = JSON.parse(await readFile(path.join(root, "manifest/base.json"), "utf8"));
const version = base.version;

async function zipTarget(target) {
  const sourceDir = path.join(root, "dist", target);
  const zipPath = path.join(outDir, `RSHotkeysEcosystem-${target}-v${version}.zip`);

  await new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);
    // manifest.json must sit at the zip root for both the Chrome Web Store and AMO.
    archive.glob("**/*", { cwd: sourceDir, ignore: ["**/*.js.map"] });
    archive.finalize();
  });

  console.log(`Packaged ${target} -> ${path.relative(root, zipPath)} (${(await readFile(zipPath)).length} bytes)`);
}

for (const target of ["chrome", "firefox"]) {
  await zipTarget(target);
}

console.log("\nUpload targets:");
console.log(`  Chrome Web Store / Edge Add-ons -> dist-packages/RSHotkeysEcosystem-chrome-v${version}.zip`);
console.log(`  Firefox Add-ons (AMO)            -> dist-packages/RSHotkeysEcosystem-firefox-v${version}.zip`);
