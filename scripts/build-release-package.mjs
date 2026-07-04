import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const viteAdminDir = path.join(repoRoot, "vite-admin");
const slug = "npcink-device-inventory";
const releaseDir = path.join(repoRoot, "release");
const submissionDir = path.join(repoRoot, "sj");
const stagingRoot = path.join(repoRoot, ".release-build");
const stagingPlugin = path.join(stagingRoot, slug);
const output = path.join(releaseDir, `${slug}.zip`);
const packageDir = path.join(releaseDir, slug);
const submissionZip = path.join(submissionDir, `${slug}.zip`);

const rootFiles = [
  "index.php",
  "npcink-device-inventory.php",
  "uninstall.php",
  "README.txt",
  "README.md",
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

execFileSync("npm", ["run", "build"], { cwd: viteAdminDir, stdio: "inherit" });

for (const file of rootFiles) {
  await cp(path.join(repoRoot, file), path.join(stagingPlugin, file));
}

for (const dir of runtimeDirs) {
  await cp(path.join(repoRoot, dir), path.join(stagingPlugin, dir), { recursive: true });
}

await assertVersionMatchesReadme();
await removeReleaseJunk(stagingPlugin);

await rm(output, { force: true });
execFileSync("zip", ["-qr", output, slug], { cwd: stagingRoot });
await rm(packageDir, { recursive: true, force: true });
await cp(stagingPlugin, packageDir, { recursive: true });
await mkdir(submissionDir, { recursive: true });
await cp(output, submissionZip);
await rm(stagingRoot, { recursive: true, force: true });
execFileSync("node", ["scripts/check-wordpress-org-review-rules.mjs", "release/npcink-device-inventory.zip"], {
  cwd: repoRoot,
  stdio: "inherit",
});

console.log(`Built ${path.relative(repoRoot, output)}`);

async function assertVersionMatchesReadme() {
  const pluginFile = await readFile(path.join(stagingPlugin, "npcink-device-inventory.php"), "utf8");
  const readmeFile = await readFile(path.join(stagingPlugin, "README.txt"), "utf8");
  const pluginVersion = pluginFile.match(/^[ \t*]*Version:\s*([^\s]+)/m)?.[1] || "";
  const stableTag = readmeFile.match(/^Stable tag:\s*([^\s]+)/m)?.[1] || "";

  if (!pluginVersion || !stableTag || pluginVersion !== stableTag) {
    console.error(
      `Plugin Version and README.txt Stable tag must match. Version=${pluginVersion || "missing"}, Stable tag=${stableTag || "missing"}`
    );
    process.exit(1);
  }
}

async function removeReleaseJunk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.name === ".DS_Store" || entry.name === "__MACOSX") {
      await rm(entryPath, { recursive: true, force: true });
      continue;
    }

    if (entry.isDirectory()) {
      await removeReleaseJunk(entryPath);
    }
  }
}
