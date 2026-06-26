import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const allowedLocalizedObject = /^(npcinkDeviceInventory|npcink_device_inventory)/;
const sourceRoots = [
  "admin",
  "includes",
  "vite-admin/src",
  "vite-admin/dist",
].map((root) => path.join(repoRoot, root));
const textExtensions = new Set([
  ".php",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".html",
]);
const staticAjaxPathPattern = /(?:^|["'`(=:]\s*)(?:\/api)?\/wp-admin\/admin-ajax\.php\b/;
const legacyLocalizedGlobalPattern = /\b(?:window\.)?dataLocal\b/;
const localizedScriptPattern = /wp_localize_script\s*\(\s*[\s\S]*?,\s*['"]([^'"]+)['"]/g;
const zipArgs = process.argv.slice(2);
const failures = [];

for (const root of sourceRoots) {
  if (existsSync(root)) {
    scanFilesystem(root);
  }
}

for (const zipArg of zipArgs) {
  scanZip(path.resolve(repoRoot, zipArg));
}

if (failures.length) {
  console.error("WordPress.org review rule check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("WordPress.org review rule check passed.");

function scanFilesystem(root) {
  for (const filePath of walk(root)) {
    if (!isTextFile(filePath)) {
      continue;
    }
    const relativePath = path.relative(repoRoot, filePath);
    scanContent(relativePath, readFileSync(filePath, "utf8"));
  }
}

function scanZip(zipPath) {
  if (!existsSync(zipPath)) {
    failures.push(`Missing zip for review scan: ${path.relative(repoRoot, zipPath)}`);
    return;
  }

  const entries = execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .filter(isTextFile);

  for (const entry of entries) {
    const content = execFileSync("unzip", ["-p", zipPath, entry], {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
    scanContent(`${path.relative(repoRoot, zipPath)}:${entry}`, content);
  }
}

function scanContent(label, content) {
  if (staticAjaxPathPattern.test(content)) {
    failures.push(
      `${label} contains a static /wp-admin/admin-ajax.php path. Use admin_url('admin-ajax.php') in PHP and pass it to JS if Ajax is needed.`
    );
  }

  if (legacyLocalizedGlobalPattern.test(content)) {
    failures.push(
      `${label} references the legacy dataLocal global. Use npcinkDeviceInventoryData for localized admin data.`
    );
  }

  if (label.endsWith(".php")) {
    let match;
    localizedScriptPattern.lastIndex = 0;
    while ((match = localizedScriptPattern.exec(content)) !== null) {
      const objectName = match[1];
      if (!allowedLocalizedObject.test(objectName)) {
        failures.push(
          `${label} localizes script data to "${objectName}". wp_localize_script globals must use the npcinkDeviceInventory prefix.`
        );
      }
    }
  }
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === "vendor") {
        continue;
      }
      yield* walk(fullPath);
    } else if (stat.isFile()) {
      yield fullPath;
    }
  }
}

function isTextFile(filePath) {
  return textExtensions.has(path.extname(filePath));
}
