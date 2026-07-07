import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const args = parseArgs(process.argv.slice(2));
const previousApp = path.resolve(args["previous-app"] || "");
const artifactsDir = path.resolve(args.artifacts || "artifacts");

if (!args["previous-app"]) {
  fail("Set --previous-app=/path/to/Npcink Device Agent.app.");
}

const previousVersion = await readBundleVersion(previousApp);
const latest = await readJson(path.join(artifactsDir, "latest.json"));
const latestDesktop = await readJson(path.join(artifactsDir, "latest-desktop.json"));
const latestVersion = stringValue(latest.version);
const latestDesktopVersion = stringValue(latestDesktop.version);

if (!previousVersion) {
  fail(`Unable to read previous app version from ${previousApp}.`);
}

if (!latestVersion || latestVersion !== latestDesktopVersion) {
  fail(`Latest manifest versions must match, got latest.json=${latestVersion || "missing"} and latest-desktop.json=${latestDesktopVersion || "missing"}.`);
}

if (compareVersions(latestVersion, previousVersion) <= 0) {
  fail(`Latest version ${latestVersion} must be greater than previous app version ${previousVersion}.`);
}

const platforms = latest.platforms && typeof latest.platforms === "object" ? latest.platforms : {};
const macUpdater = platforms["darwin-aarch64"];
if (!macUpdater || typeof macUpdater !== "object") {
  fail("latest.json missing darwin-aarch64 updater entry.");
}

assertReleaseDownloadUrl(macUpdater.url, "latest.json darwin-aarch64 url", ".app.tar.gz");
if (!stringValue(macUpdater.signature)) {
  fail("latest.json darwin-aarch64 signature is missing.");
}

const downloads = latestDesktop.downloads && typeof latestDesktop.downloads === "object" ? latestDesktop.downloads : {};
const macDownload = downloads.macosAarch64;
if (!macDownload || typeof macDownload !== "object") {
  fail("latest-desktop.json missing macosAarch64 download entry.");
}

assertReleaseDownloadUrl(macDownload.url, "latest-desktop.json macosAarch64 url", "_aarch64.dmg", latestVersion);

console.log(`Desktop update transition preflight passed: ${previousVersion} -> ${latestVersion}.`);

async function readBundleVersion(appPath) {
  const plist = path.join(appPath, "Contents", "Info.plist");
  try {
    const { stdout } = await execFileAsync("/usr/libexec/PlistBuddy", ["-c", "Print :CFBundleShortVersionString", plist]);
    return stringValue(stdout);
  } catch (error) {
    fail(`Unable to read CFBundleShortVersionString: ${error.message}`);
  }
}

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    fail(`Unable to read JSON ${filePath}: ${error.message}`);
  }
}

function assertReleaseDownloadUrl(value, label, expectedSuffix, version = "") {
  const url = stringValue(value);
  if (!url) {
    fail(`${label} is missing.`);
  }

  if (!url.startsWith("https://github.com/") || !url.includes("/releases/download/")) {
    fail(`${label} must be a GitHub release download URL: ${url}`);
  }

  if (version && !url.includes(version)) {
    fail(`${label} must include latest version ${version}: ${url}`);
  }

  if (!url.endsWith(expectedSuffix)) {
    fail(`${label} must end with ${expectedSuffix}: ${url}`);
  }

  if (/%20/i.test(url) || /\s/.test(url)) {
    fail(`${label} must not contain encoded or raw spaces: ${url}`);
  }
}

function compareVersions(left, right) {
  const leftParts = splitVersion(left);
  const rightParts = splitVersion(right);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftValue = leftParts[index] || 0;
    const rightValue = rightParts[index] || 0;
    if (leftValue !== rightValue) {
      return leftValue > rightValue ? 1 : -1;
    }
  }

  return 0;
}

function splitVersion(value) {
  return stringValue(value)
    .split(".")
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0));
}

function parseArgs(rawArgs) {
  const parsed = {};
  for (const arg of rawArgs) {
    if (!arg.startsWith("--") || !arg.includes("=")) {
      continue;
    }
    const [key, ...rest] = arg.slice(2).split("=");
    parsed[key] = rest.join("=");
  }
  return parsed;
}

function stringValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function fail(message) {
  console.error(`Desktop update transition preflight failed: ${message}`);
  process.exit(1);
}
