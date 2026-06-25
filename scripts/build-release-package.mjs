import { execFileSync } from "node:child_process";
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const slug = "npcink-device-inventory";
const releaseDir = path.join(repoRoot, "release");
const stagingRoot = path.join(repoRoot, ".release-build");
const stagingPlugin = path.join(stagingRoot, slug);
const output = path.join(releaseDir, `${slug}.zip`);

const rootFiles = [
  "index.php",
  "npcink-device-inventory.php",
  "uninstall.php",
  "README.txt",
  "README.md",
  "README.en.md",
  "LICENSE",
  "LICENSE.txt",
];

const runtimeDirs = [
  "admin",
  "includes",
  "languages",
  "vite-admin/dist",
];

await rm(stagingRoot, { recursive: true, force: true });
await mkdir(stagingPlugin, { recursive: true });
await mkdir(releaseDir, { recursive: true });

for (const file of rootFiles) {
  await cp(path.join(repoRoot, file), path.join(stagingPlugin, file));
}

for (const dir of runtimeDirs) {
  await cp(path.join(repoRoot, dir), path.join(stagingPlugin, dir), { recursive: true });
}

await rm(output, { force: true });
execFileSync("zip", ["-qr", output, slug], { cwd: stagingRoot });
await rm(stagingRoot, { recursive: true, force: true });

console.log(`Built ${path.relative(repoRoot, output)}`);
