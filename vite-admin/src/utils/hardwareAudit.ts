import type { Asset, AssetObservation, JsonRecord } from "@/type/v3";

const DEFAULT_DEPARTMENT = "未分配";

export interface HardwareIssue {
  key: string;
  level: "error" | "warning" | "info";
  type: string;
  asset: Asset;
  message: string;
}

export type CollectionFreshness = "fresh" | "aging" | "stale" | "missing";
export type CollectionAgeBand = "fresh" | "aging" | "stale_31_60" | "stale_61_90" | "stale_90_plus" | "missing";

export const toNumber = (value: unknown) => {
  const number = typeof value === "number" ? value : Number(value || 0);
  return Number.isFinite(number) ? number : 0;
};

export const formatBytes = (value: unknown) => {
  const bytes = typeof value === "number" ? value : Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "-";
  }
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let size = bytes;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${Number(size.toFixed(size >= 10 ? 0 : 1))} ${units[index]}`;
};

export const getRecord = (value: unknown): JsonRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};

export const getArray = (value: unknown): JsonRecord[] =>
  Array.isArray(value) ? value.filter((item) => item && typeof item === "object") as JsonRecord[] : [];

export const firstText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return "";
};

const fieldText = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "-";
  }
  if (typeof value === "boolean") {
    return value ? "是" : "否";
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
};

export const hardwareSummary = (summary: JsonRecord, hardware: JsonRecord) => {
  const cpu = getRecord(hardware.cpu);
  const graphics = getRecord(hardware.graphics);
  const controllers = getArray(graphics.controllers);
  const system = getRecord(hardware.system);
  const baseboard = getRecord(hardware.baseboard);
  const displays = getArray(graphics.displays);
  const disks = getArray(hardware.disks).length
    ? getArray(hardware.disks)
    : getArray(hardware.disk).length
      ? getArray(hardware.disk)
      : getArray(hardware.diskLayout);
  const memory = getArray(hardware.memory).length
    ? getArray(hardware.memory)
    : getArray(hardware.mem).length
      ? getArray(hardware.mem)
      : getArray(hardware.memLayout);
  const net = getRecord(hardware.net);

  return {
    platform: firstText(summary.platform, getRecord(hardware.os).platform, "Windows"),
    cpu: firstText(summary.cpu, cpu.brand, cpu.model, cpu.manufacturer),
    graphics: firstText(summary.graphics, controllers[0]?.model),
    deviceModel: firstText(summary.device_model, system.model),
    baseboard: firstText(baseboard.model, baseboard.serial, system.model),
    memoryLines: memory.map((item) =>
      [
        item.clockSpeed || item.clock ? `频率: ${item.clockSpeed || item.clock} MHz` : "",
        item.size ? `大小: ${formatBytes(item.size)}` : "",
      ].filter(Boolean).join(" ")
    ).filter(Boolean),
    display: displays[0]
      ? `${fieldText(displays[0].currentResX || displays[0].resolutionX)} x ${fieldText(displays[0].currentResY || displays[0].resolutionY)}${displays[0].currentRefreshRate ? ` (${displays[0].currentRefreshRate} 赫兹)` : ""}`
      : "",
    displayModel: firstText(displays[0]?.model),
    primaryDisk: firstText(disks[0]?.name, disks[0]?.device, disks[0]?.serialNum),
    primaryIp: firstText(summary.primary_ip, net.ip4, net.defaultGateway),
  };
};

export const assetHardwareContext = (asset?: Asset | null) => {
  const latestSummary = getRecord(asset?.latestObservation?.summary);
  const latestHardware = getRecord(asset?.latestObservation?.hardware);
  const manualHardware = getRecord(getRecord(asset?.metadata).manualHardware);
  const manualRaw = getRecord(manualHardware.raw);
  const hasLatestHardware = Object.keys(latestSummary).length > 0 || Object.keys(latestHardware).length > 0;
  const summary = hasLatestHardware
    ? latestSummary
    : {
        cpu: manualHardware.cpu,
        graphics: manualHardware.graphics,
        device_model: firstText(manualHardware.deviceModel, getRecord(manualRaw.system).model),
        primary_ip: manualHardware.ip,
        platform: getRecord(manualRaw.os).platform,
      };
  const hardware = hasLatestHardware ? latestHardware : manualRaw;
  return {
    summary,
    hardware,
    manualHardware,
    extracted: hardwareSummary(getRecord(summary), getRecord(hardware)),
    hasLatestHardware,
  };
};

export const hardwareMemoryBytes = (asset: Asset) => {
  const { summary, hardware } = assetHardwareContext(asset);
  const summaryBytes = toNumber(summary.memory_bytes);
  if (summaryBytes > 0) {
    return summaryBytes;
  }
  const memory = getArray(hardware.memory).length
    ? getArray(hardware.memory)
    : getArray(hardware.mem).length
      ? getArray(hardware.mem)
      : getArray(hardware.memLayout);
  return memory.reduce((total, item) => total + toNumber(item.size), 0);
};

export const hardwareDiskBytes = (asset: Asset) => {
  const { summary, hardware } = assetHardwareContext(asset);
  const summaryBytes = toNumber(summary.disk_bytes);
  if (summaryBytes > 0) {
    return summaryBytes;
  }
  const disks = getArray(hardware.disks).length
    ? getArray(hardware.disks)
    : getArray(hardware.disk).length
      ? getArray(hardware.disk)
      : getArray(hardware.diskLayout);
  return disks.reduce((total, item) => total + toNumber(item.size), 0);
};

const hardwareBoardSerial = (asset: Asset) => {
  const { hardware } = assetHardwareContext(asset);
  const baseboard = getRecord(hardware.baseboard);
  return firstText(baseboard.serial, baseboard.serialNumber);
};

export const observationSnapshot = (observation?: AssetObservation) => {
  const summary = getRecord(observation?.summary);
  const hardware = getRecord(observation?.hardware);
  const extracted = hardwareSummary(summary, hardware);
  return {
    cpu: extracted.cpu,
    memory_bytes: formatBytes(summary.memory_bytes),
    disk_bytes: formatBytes(summary.disk_bytes),
    graphics: extracted.graphics,
    primary_ip: extracted.primaryIp,
    baseboard: extracted.baseboard,
  };
};

export const observationChanges = (observations: AssetObservation[]) => {
  const auditFields = [
    { label: "CPU", value: "cpu" },
    { label: "内存", value: "memory_bytes" },
    { label: "硬盘", value: "disk_bytes" },
    { label: "显卡", value: "graphics" },
    { label: "IP", value: "primary_ip" },
    { label: "主板", value: "baseboard" },
  ] as const;
  const changes: Array<{
    key: string;
    label: string;
    observedAt: string;
    oldValue: string;
    newValue: string;
  }> = [];
  for (let index = 0; index < observations.length - 1; index += 1) {
    const current = observationSnapshot(observations[index]);
    const previous = observationSnapshot(observations[index + 1]);
    auditFields.forEach((field) => {
      const key = field.value as keyof typeof current;
      const oldValue = previous[key] || "-";
      const newValue = current[key] || "-";
      if (oldValue !== "-" && newValue !== "-" && oldValue !== newValue) {
        changes.push({
          key: `${observations[index].id}-${field.value}`,
          label: field.label,
          observedAt: observations[index].observedAt,
          oldValue,
          newValue,
        });
      }
    });
  }
  return changes;
};

const latestObservationTime = (asset: Asset) => asset.latestObservation?.observedAt || "";

const daysSince = (value?: string, now = Date.now()) => {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.max(Math.floor((now - date.getTime()) / 86400000), 0);
};

export const collectionAgeDays = (asset: Asset, now = Date.now()): number | null => {
  const days = daysSince(latestObservationTime(asset), now);
  if (!Number.isFinite(days)) {
    return null;
  }
  return days;
};

export const collectionAgeBand = (asset: Asset, now = Date.now()): CollectionAgeBand => {
  const days = collectionAgeDays(asset, now);
  if (days === null) {
    return "missing";
  }
  if (days <= 7) {
    return "fresh";
  }
  if (days <= 30) {
    return "aging";
  }
  if (days <= 60) {
    return "stale_31_60";
  }
  if (days <= 90) {
    return "stale_61_90";
  }
  return "stale_90_plus";
};

export const collectionFreshness = (asset: Asset, now = Date.now()): CollectionFreshness => {
  const band = collectionAgeBand(asset, now);
  if (band === "fresh" || band === "aging" || band === "missing") {
    return band;
  }
  return "stale";
};

const ignoredAuditFields = (asset: Asset) => {
  const audit = getRecord(getRecord(asset.metadata).audit);
  return Array.isArray(audit.ignoredFields) ? new Set(audit.ignoredFields.map(String)) : new Set<string>();
};

const normalizeDuplicateValue = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

const PLACEHOLDER_DUPLICATE_VALUES = new Set([
  "default",
  "default string",
  "n/a",
  "na",
  "none",
  "null",
  "unknown",
  "to be filled by o.e.m.",
]);

const isDuplicateCandidate = (value: string, kind: "number" | "ip" | "board") => {
  const normalized = normalizeDuplicateValue(value);
  if (!normalized || normalized === "-" || PLACEHOLDER_DUPLICATE_VALUES.has(normalized)) {
    return false;
  }
  if (kind === "ip" && ["127.0.0.1", "0.0.0.0", "::1", "localhost"].includes(normalized)) {
    return false;
  }
  return true;
};

const duplicateMap = (
  assets: Asset[],
  kind: "number" | "ip" | "board",
  getValue: (asset: Asset) => string
) => {
  const result = new Map<string, Asset[]>();
  assets.forEach((asset) => {
    const value = getValue(asset);
    if (!isDuplicateCandidate(value, kind)) {
      return;
    }
    const key = normalizeDuplicateValue(value);
    result.set(key, [...(result.get(key) || []), asset]);
  });
  return result;
};

const missingHardwareValue = (value: string) => !value || value.trim() === "-" || /^暂无/.test(value.trim());

export const issueGroup = (type: string) => {
  if (type.includes("重复")) {
    return "重复风险";
  }
  if (type.includes("CPU") || type.includes("显卡") || type.includes("内存") || type.includes("硬盘")) {
    return "硬件缺失";
  }
  if (type.includes("缺失")) {
    return "资料缺失";
  }
  if (type.includes("采集")) {
    return "采集状态";
  }
  if (type.includes("维护")) {
    return "维护状态";
  }
  return "其他";
};

export const detectHardwareIssues = (assets: Asset[]) => {
  const byNumber = duplicateMap(assets, "number", (asset) => asset.assetNumber);
  const byIp = duplicateMap(assets, "ip", (asset) => assetHardwareContext(asset).extracted.primaryIp);
  const byBoard = duplicateMap(assets, "board", hardwareBoardSerial);
  const issues: HardwareIssue[] = [];

  assets.forEach((asset) => {
    const ignored = ignoredAuditFields(asset);
    const context = assetHardwareContext(asset);
    const assetLabel = asset.assetNumber || asset.name || asset.uuid;
    const extracted = context.extracted;
    const numberKey = normalizeDuplicateValue(asset.assetNumber);
    if (isDuplicateCandidate(asset.assetNumber, "number") && (byNumber.get(numberKey)?.length || 0) > 1) {
      issues.push({
        key: `${asset.uuid}-duplicate-number`,
        level: "error",
        type: "重复编号",
        asset,
        message: `${asset.assetNumber} 已关联 ${byNumber.get(numberKey)?.length || 0} 条资产`,
      });
    }
    const ip = context.extracted.primaryIp;
    const ipKey = normalizeDuplicateValue(ip);
    if (isDuplicateCandidate(ip, "ip") && !ignored.has("primary_ip") && (byIp.get(ipKey)?.length || 0) > 1) {
      issues.push({
        key: `${asset.uuid}-duplicate-ip`,
        level: "warning",
        type: "重复 IP",
        asset,
        message: `${ip} 同时出现在 ${byIp.get(ipKey)?.length || 0} 条资产`,
      });
    }
    const boardKey = hardwareBoardSerial(asset);
    const boardDuplicateKey = normalizeDuplicateValue(boardKey);
    if (isDuplicateCandidate(boardKey, "board") && !ignored.has("baseboard") && (byBoard.get(boardDuplicateKey)?.length || 0) > 1) {
      issues.push({
        key: `${asset.uuid}-duplicate-board`,
        level: "warning",
        type: "疑似重复设备",
        asset,
        message: `${boardKey} 与其他资产重复`,
      });
    }
    if (!asset.department || asset.department === DEFAULT_DEPARTMENT) {
      issues.push({
        key: `${asset.uuid}-missing-department`,
        level: "info",
        type: "部门待分配",
        asset,
        message: `${assetLabel} 需要分配到具体部门`,
      });
    }
    if (asset.status === "active" && !String(asset.ownerName || "").trim()) {
      issues.push({
        key: `${asset.uuid}-missing-owner`,
        level: "info",
        type: "责任人缺失",
        asset,
        message: `${assetLabel} 未设置责任人`,
      });
    }
    if (!ignored.has("cpu") && missingHardwareValue(extracted.cpu)) {
      issues.push({
        key: `${asset.uuid}-missing-cpu`,
        level: "warning",
        type: "CPU 缺失",
        asset,
        message: `${assetLabel} 缺少 CPU 型号`,
      });
    }
    if (!ignored.has("graphics") && missingHardwareValue(extracted.graphics)) {
      issues.push({
        key: `${asset.uuid}-missing-graphics`,
        level: "warning",
        type: "显卡缺失",
        asset,
        message: `${assetLabel} 缺少显卡型号`,
      });
    }
    if (!ignored.has("memory_bytes") && hardwareMemoryBytes(asset) <= 0 && missingHardwareValue(String(context.manualHardware.memory || ""))) {
      issues.push({
        key: `${asset.uuid}-missing-memory`,
        level: "warning",
        type: "内存缺失",
        asset,
        message: `${assetLabel} 缺少内存信息`,
      });
    }
    if (!ignored.has("disk_bytes") && hardwareDiskBytes(asset) <= 0 && missingHardwareValue(String(context.manualHardware.disk || ""))) {
      issues.push({
        key: `${asset.uuid}-missing-disk`,
        level: "warning",
        type: "硬盘缺失",
        asset,
        message: `${assetLabel} 缺少硬盘信息`,
      });
    }
    if (!latestObservationTime(asset) && Object.keys(context.manualHardware).length > 0) {
      issues.push({
        key: `${asset.uuid}-manual-hardware-only`,
        level: "info",
        type: "未接入采集",
        asset,
        message: `${assetLabel} 目前只有手动硬件信息`,
      });
    } else if (collectionFreshness(asset) === "stale") {
      issues.push({
        key: `${asset.uuid}-stale-observation`,
        level: "warning",
        type: "长期未采集",
        asset,
        message: latestObservationTime(asset) ? `距上次采集 ${daysSince(latestObservationTime(asset))} 天` : "暂无采集记录",
      });
    }
    if (asset.status === "maintenance") {
      issues.push({
        key: `${asset.uuid}-maintenance`,
        level: "warning",
        type: "待维护",
        asset,
        message: `${assetLabel} 当前处于维护状态`,
      });
    }
  });

  return issues;
};
