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

  const { collectionFreshness, detectHardwareIssues, issueGroup } = await import(pathToFileURL(outFile).href);
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
  const placeholderIssues = detectHardwareIssues([
    {
      ...assets[1],
      uuid: "fixture-placeholder-one",
      assetNumber: "PLACEHOLDER-001",
      latestObservation: {
        ...assets[1].latestObservation,
        summary: { ...assets[1].latestObservation.summary, primary_ip: "127.0.0.1" },
        hardware: { ...assets[1].latestObservation.hardware, baseboard: { serial: "Default string" } },
      },
    },
    {
      ...assets[1],
      uuid: "fixture-placeholder-two",
      assetNumber: "PLACEHOLDER-002",
      latestObservation: {
        ...assets[1].latestObservation,
        summary: { ...assets[1].latestObservation.summary, primary_ip: "127.0.0.1" },
        hardware: { ...assets[1].latestObservation.hardware, baseboard: { serial: "Default string" } },
      },
    },
  ]);
  const placeholderDuplicateIssues = placeholderIssues.filter((issue) => issue.type === "重复 IP" || issue.type === "疑似重复设备");
  const freshnessNow = Date.parse("2026-07-10T00:00:00Z");
  const freshSample = { ...assets[1], latestObservation: { ...assets[1].latestObservation, observedAt: "2026-07-03T00:00:00Z" } };
  const agingSample = { ...assets[1], latestObservation: { ...assets[1].latestObservation, observedAt: "2026-07-02T00:00:00Z" } };
  const staleSample = { ...assets[1], latestObservation: { ...assets[1].latestObservation, observedAt: "2026-06-09T00:00:00Z" } };
  const missingSample = { ...assets[1], latestObservation: undefined };
  const freshnessClassificationFailed =
    collectionFreshness(freshSample, freshnessNow) !== "fresh" ||
    collectionFreshness(agingSample, freshnessNow) !== "aging" ||
    collectionFreshness(staleSample, freshnessNow) !== "stale" ||
    collectionFreshness(missingSample, freshnessNow) !== "missing";

  if (missingTypes.length || missingGroups.length || !activeMissingOwner || inactiveMissingOwner || !whitespaceMissingOwner || placeholderDuplicateIssues.length || freshnessClassificationFailed) {
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
    if (placeholderDuplicateIssues.length) {
      console.error("Loopback IP and default hardware strings must not create duplicate-risk issues.");
    }
    if (freshnessClassificationFailed) {
      console.error("Collection freshness must preserve the 7-day, 30-day, and missing-data boundaries.");
    }
    console.error(`Detected types: ${Array.from(issueTypes).join(", ")}`);
    process.exit(1);
  }

  console.log(`Hardware audit fixture check passed: ${issues.length} issues, ${groups.size} groups.`);
} finally {
  await rm(outDir, { recursive: true, force: true });
}
