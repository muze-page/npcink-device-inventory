import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactsDir = path.resolve(repoRoot, process.argv[2] || "artifacts");

const desktopPackage = await readJson(path.join(repoRoot, "ele-rs/package.json"));
const tauriConfig = await readJson(path.join(repoRoot, "ele-rs/src-tauri/tauri.conf.json"));
const latest = await readJson(path.join(artifactsDir, "latest.json"));
const latestDesktop = await readJson(path.join(artifactsDir, "latest-desktop.json"));

const expectedVersion = stringValue(desktopPackage.version);
const tauriVersion = stringValue(tauriConfig.version);

if (!expectedVersion) {
  fail("Missing ele-rs/package.json version.");
}

if (tauriVersion !== expectedVersion) {
  fail(`Desktop version mismatch: ele-rs/package.json=${expectedVersion}, tauri.conf.json=${tauriVersion || "missing"}`);
}

assertEqual(latest.version, expectedVersion, "latest.json version");
assertEqual(latestDesktop.version, expectedVersion, "latest-desktop.json version");
assertEqual(latestDesktop.schema, "npcink-device-agent-updates-v1", "latest-desktop.json schema");

if (!isValidDate(stringValue(latest.pub_date))) {
  fail("latest.json pub_date is missing or invalid.");
}

if (!isValidDate(stringValue(latestDesktop.pubDate))) {
  fail("latest-desktop.json pubDate is missing or invalid.");
}

const platforms = latest.platforms && typeof latest.platforms === "object" ? latest.platforms : {};
assertPlatform(platforms, "darwin-aarch64");
assertPlatform(platforms, "windows-x86_64");

const downloads = latestDesktop.downloads && typeof latestDesktop.downloads === "object" ? latestDesktop.downloads : {};
assertDownload(downloads.macosAarch64, "latest-desktop.json downloads.macosAarch64");
assertDownload(downloads.windowsX64, "latest-desktop.json downloads.windowsX64");
assertReleaseUrl(latestDesktop.releaseUrl, "latest-desktop.json releaseUrl", "/releases/tag/");

console.log(`Desktop update manifest check passed for ${expectedVersion}.`);

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    fail(`Unable to read JSON ${path.relative(repoRoot, filePath)}: ${error.message}`);
  }
}

function assertPlatform(platforms, key) {
  const platform = platforms[key];
  if (!platform || typeof platform !== "object") {
    fail(`latest.json missing platform ${key}.`);
  }

  if (!stringValue(platform.signature)) {
    fail(`latest.json platform ${key} is missing a signature.`);
  }

  assertReleaseUrl(platform.url, `latest.json platform ${key} url`, "/releases/download/");
}

function assertDownload(download, label) {
  if (!download || typeof download !== "object") {
    fail(`${label} is missing.`);
  }

  if (!stringValue(download.label)) {
    fail(`${label} is missing a label.`);
  }

  assertReleaseUrl(download.url, `${label} url`, "/releases/download/");
}

function assertReleaseUrl(value, label, requiredSegment) {
  const url = stringValue(value);
  if (!url) {
    fail(`${label} is missing.`);
  }

  if (!url.startsWith("https://github.com/") || !url.includes(requiredSegment)) {
    fail(`${label} must be a GitHub release URL: ${url}`);
  }

  if (/%20/i.test(url) || /\s/.test(url)) {
    fail(`${label} must not contain encoded or raw spaces: ${url}`);
  }
}

function assertEqual(actual, expected, label) {
  if (stringValue(actual) !== expected) {
    fail(`${label} must be ${expected}, got ${stringValue(actual) || "missing"}.`);
  }
}

function isValidDate(value) {
  return Boolean(value) && !Number.isNaN(Date.parse(value));
}

function stringValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function fail(message) {
  console.error(`Desktop update manifest check failed: ${message}`);
  process.exit(1);
}
