import { build } from "esbuild";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const fixturePath = path.join(root, "tests/fixtures/hardware-audit-assets.json");
const entryPath = path.join(root, "src/utils/hardwareAudit.ts");
const outDir = await mkdtemp(path.join(tmpdir(), "npcink-hardware-audit-"));
const outFile = path.join(outDir, "hardwareAudit.mjs");

const aliasPlugin = {
  name: "npcink-alias",
  setup(buildApi) {
    buildApi.onResolve({ filter: /^@\// }, (args) => ({
      path: path.join(root, "src", args.path.slice(2)),
    }));
  },
};

try {
  await build({
    entryPoints: [entryPath],
    outfile: outFile,
    bundle: true,
    format: "esm",
    platform: "node",
    plugins: [aliasPlugin],
    logLevel: "silent",
  });

  const { detectHardwareIssues, issueGroup } = await import(pathToFileURL(outFile).href);
  const assets = JSON.parse(await readFile(fixturePath, "utf8"));
  const issues = detectHardwareIssues(assets);
  const whitespaceOwnerIssues = detectHardwareIssues([
    {
      ...assets[1],
      uuid: "fixture-active-whitespace-owner",
      assetNumber: "OWNER-WS-001",
      ownerName: "   ",
    },
  ]);
  const issueTypes = new Set(issues.map((issue) => issue.type));
  const groups = new Set(issues.map((issue) => issueGroup(issue.type)));

  const expectedTypes = [
    "重复编号",
    "重复 IP",
    "部门待分配",
    "责任人缺失",
    "CPU 缺失",
    "显卡缺失",
    "内存缺失",
    "硬盘缺失",
    "未接入采集",
    "待维护",
  ];
  const expectedGroups = [
    "重复风险",
    "资料缺失",
    "硬件缺失",
    "采集状态",
    "维护状态",
  ];

  const missingTypes = expectedTypes.filter((type) => !issueTypes.has(type));
  const missingGroups = expectedGroups.filter((group) => !groups.has(group));
  const activeMissingOwner = issues.some((issue) => issue.key === "fixture-missing-hardware-missing-owner");
  const inactiveMissingOwner = issues.some((issue) => issue.key === "fixture-inactive-unassigned-missing-owner");
  const whitespaceMissingOwner = whitespaceOwnerIssues.some(
    (issue) => issue.key === "fixture-active-whitespace-owner-missing-owner"
  );

  if (missingTypes.length || missingGroups.length || !activeMissingOwner || inactiveMissingOwner || !whitespaceMissingOwner) {
    console.error("Hardware audit fixture check failed.");
    if (missingTypes.length) {
      console.error(`Missing issue types: ${missingTypes.join(", ")}`);
    }
    if (missingGroups.length) {
      console.error(`Missing issue groups: ${missingGroups.join(", ")}`);
    }
    if (!activeMissingOwner) {
      console.error("Active asset without an owner must report 责任人缺失.");
    }
    if (inactiveMissingOwner) {
      console.error("Inactive asset without an owner must not report 责任人缺失.");
    }
    if (!whitespaceMissingOwner) {
      console.error("Whitespace-only owner names must report 责任人缺失 for active assets.");
    }
    console.error(`Detected types: ${Array.from(issueTypes).join(", ")}`);
    process.exit(1);
  }

  console.log(`Hardware audit fixture check passed: ${issues.length} issues, ${groups.size} groups.`);
} finally {
  await rm(outDir, { recursive: true, force: true });
}
