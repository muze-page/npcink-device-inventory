import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const zipPath = path.resolve(repoRoot, process.argv[2] || "release/npcink-device-inventory.zip");
const slug = "npcink-device-inventory";

if (!existsSync(zipPath)) {
  console.error(`Release package not found: ${path.relative(repoRoot, zipPath)}`);
  process.exit(1);
}

const entries = execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);

const requiredEntries = [
  `${slug}/npcink-device-inventory.php`,
  `${slug}/includes/v3/class-npcink-device-inventory-v3-rest.php`,
  `${slug}/admin/partials/npcink-device-inventory-admin-menu.php`,
  `${slug}/vite-admin/dist/index.js`,
  `${slug}/vite-admin/dist/index.css`,
  `${slug}/README.txt`,
  `${slug}/LICENSE.txt`,
];

const forbiddenPatterns = [
  /(^|\/)\.git(\/|$)/,
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)vendor(\/|$)/,
  /(^|\/)release(\/|$)/,
  /(^|\/)设备数据备份(\/|$)/,
  /device-inventory-current\.png$/,
  /vite-admin\/src(\/|$)/,
  /vite-admin\/tests(\/|$)/,
  /vite-admin\/scripts(\/|$)/,
  /vite-admin\/package(-lock)?\.json$/,
  /vite-admin\/vite\.config\.ts$/,
  /vite-admin\/tsconfig/,
  /ele-rs(\/|$)/,
  /sj\/.*\.zip$/,
];

const missingRequired = requiredEntries.filter((entry) => !entries.includes(entry));
const outsideRoot = entries.filter((entry) => !entry.startsWith(`${slug}/`));
const forbidden = entries.filter((entry) => forbiddenPatterns.some((pattern) => pattern.test(entry)));

if (missingRequired.length || outsideRoot.length || forbidden.length) {
  console.error("Release package check failed.");
  if (missingRequired.length) {
    console.error(`Missing required entries:\n${missingRequired.join("\n")}`);
  }
  if (outsideRoot.length) {
    console.error(`Entries outside plugin root:\n${outsideRoot.join("\n")}`);
  }
  if (forbidden.length) {
    console.error(`Forbidden entries:\n${forbidden.join("\n")}`);
  }
  process.exit(1);
}

console.log(`Release package check passed: ${entries.length} entries in ${path.relative(repoRoot, zipPath)}`);
