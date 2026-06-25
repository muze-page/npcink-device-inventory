import { Fragment, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Checkbox,
  Collapse,
  Descriptions,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { RestUrl } from "@/utils/index";
import {
  archiveAsset,
  createAsset,
  createAssetEvent,
  createClientToken,
  deleteClientToken,
  getAsset,
  getAssetEvents,
  getAssetIdentities,
  getAssetObservations,
  getAssets,
  getEvents,
  getObservations,
  getSettings,
  updateSettings,
  updateAsset,
} from "@/services/v3";
import type {
  Asset,
  AssetEvent,
  AssetEventInput,
  AssetIdentity,
  AssetInput,
  AssetReference,
  AssetObservation,
  ClientToken,
  CreatedClientToken,
  InventorySettings,
  JsonRecord,
} from "@/type/v3";

const { Text, Title } = Typography;

const ASSET_TYPES = [
  { label: "电脑", value: "pc" },
  { label: "通用电脑", value: "computer" },
  { label: "网络设备", value: "network" },
  { label: "办公设备", value: "office" },
  { label: "自定义", value: "custom" },
];

const STATUS_OPTIONS = [
  { label: "在用", value: "active" },
  { label: "停用", value: "inactive" },
  { label: "维护", value: "maintenance" },
  { label: "退役", value: "retired" },
  { label: "已归档", value: "deleted" },
];

const EVENT_SOURCE_OPTIONS = [
  { label: "人工", value: "manual" },
  { label: "系统", value: "system" },
  { label: "上传", value: "upload" },
  { label: "导入", value: "import" },
  { label: "旧版自动", value: "legacy_auto" },
  { label: "旧版手动", value: "legacy_manual" },
  { label: "旧版导入", value: "legacy_import" },
];

const EVENT_TYPE_OPTIONS = [
  { label: "创建", value: "created" },
  { label: "更新", value: "updated" },
  { label: "批量修改", value: "bulk_updated" },
  { label: "字段变更", value: "field_changed" },
  { label: "采集接收", value: "observation_received" },
  { label: "删除/归档", value: "deleted" },
];

const OBSERVATION_SOURCE_OPTIONS = [
  { label: "采集客户端", value: "uploader" },
  { label: "后台导入", value: "admin_import" },
  { label: "人工录入", value: "manual_entry" },
  { label: "旧版导入", value: "legacy_import" },
];

const MANUAL_RECORD_OPTIONS = [
  { label: "备注", value: "note" },
  { label: "维修", value: "maintenance" },
  { label: "借用", value: "borrowed" },
  { label: "归还", value: "returned" },
  { label: "转移", value: "transferred" },
];

const AUDIT_FIELD_OPTIONS = [
  { label: "CPU", value: "cpu" },
  { label: "内存", value: "memory_bytes" },
  { label: "硬盘", value: "disk_bytes" },
  { label: "显卡", value: "graphics" },
  { label: "IP", value: "primary_ip" },
  { label: "主板", value: "baseboard" },
];

const ASSET_SCOPE_OPTIONS = [
  { label: "电脑资产", value: "computer" },
  { label: "其他资产", value: "other" },
  { label: "全部资产", value: "all" },
] as const;

type AssetScope = (typeof ASSET_SCOPE_OPTIONS)[number]["value"];

interface SavedAssetFilter {
  id: string;
  name: string;
  assetScope: AssetScope;
  assetType?: string;
  status?: string;
  search?: string;
}

interface HardwareIssue {
  key: string;
  level: "error" | "warning" | "info";
  type: string;
  asset: Asset;
  message: string;
}

const LEGACY_IMPORT_FIELDS = [
  { label: "资产编号", value: "assetNumber", aliases: ["assetNumber", "资产编号", "编号", "number", "code", "id"] },
  { label: "资产名称", value: "name", aliases: ["name", "资产名称", "名称", "电脑名称", "hostname", "主机名"] },
  { label: "使用人", value: "ownerName", aliases: ["ownerName", "使用人", "责任人", "用户", "owner", "user"] },
  { label: "部门", value: "department", aliases: ["department", "部门", "所在部门", "dept"] },
  { label: "状态", value: "status", aliases: ["status", "state", "状态"] },
  { label: "分类", value: "category", aliases: ["category", "分类", "类型"] },
  { label: "购置价值", value: "purchasePrice", aliases: ["purchasePrice", "purchase", "购置价值", "采购价"] },
  { label: "残值", value: "residualValue", aliases: ["residualValue", "depreciation", "残值", "折旧"] },
  { label: "CPU", value: "cpu", aliases: ["cpu", "CPU", "中央处理器"] },
  { label: "内存", value: "memory", aliases: ["memory", "内存", "memory_bytes"] },
  { label: "硬盘", value: "disk", aliases: ["disk", "硬盘", "disk_bytes"] },
  { label: "IP", value: "ip", aliases: ["ip", "IP", "primary_ip"] },
  { label: "旧 UUID", value: "legacyUuid", aliases: ["uuid", "旧UUID", "legacyUuid"] },
] as const;

const SAVED_FILTER_STORAGE_KEY = "npcink-device-inventory.savedFilters";
const HANDLED_ISSUES_STORAGE_KEY = "npcink-device-inventory.handledIssues";

const statusColor: Record<string, string> = {
  active: "green",
  inactive: "default",
  maintenance: "orange",
  retired: "blue",
  deleted: "red",
};

const statusLabel = (value: string) =>
  STATUS_OPTIONS.find((item) => item.value === value)?.label || value || "-";

const assetTypeLabel = (value: string) =>
  ASSET_TYPES.find((item) => item.value === value)?.label || value || "-";

const optionLabel = (options: { label: string; value: string }[], value: string) =>
  options.find((item) => item.value === value)?.label || value || "-";

const formatDate = (value?: string) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("zh-CN", { hour12: false });
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const formatBytes = (value: unknown) => {
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

const formatMemoryDiskText = (summary: JsonRecord, importedHardware?: JsonRecord) => {
  const memory = formatBytes(summary.memory_bytes);
  const disk = formatBytes(summary.disk_bytes);
  const importedMemory = fieldText(importedHardware?.memory);
  const importedDisk = fieldText(importedHardware?.disk);
  return `${memory !== "-" ? memory : importedMemory} / ${disk !== "-" ? disk : importedDisk}`;
};

const countStatus = (assets: Asset[], status: string) =>
  assets.filter((asset) => asset.status === status).length;

const toNumber = (value: unknown) => {
  const number = typeof value === "number" ? value : Number(value || 0);
  return Number.isFinite(number) ? number : 0;
};

const bucketLabel = (value: unknown, buckets: { max: number; label: string }[], fallback: string) => {
  const number = toNumber(value);
  if (number <= 0) {
    return fallback;
  }
  return buckets.find((bucket) => number < bucket.max)?.label || buckets[buckets.length - 1]?.label || fallback;
};

const countBy = <T,>(items: T[], getKey: (item: T) => string) =>
  items.reduce<Record<string, number>>((result, item) => {
    const key = getKey(item) || "未知";
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});

const sortedEntries = (record: Record<string, number>) =>
  Object.entries(record).sort((a, b) => b[1] - a[1]);

const percentText = (value: number, total: number) =>
  total > 0 ? `${Math.round((value / total) * 100)}%` : "0%";

const csvCell = (value: unknown) => {
  const text = fieldText(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const downloadTextFile = (filename: string, text: string, type = "text/csv;charset=utf-8") => {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const parseCsvLine = (line: string) => {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
};

const parseTabularText = (text: string): JsonRecord[] => {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map(getRecord);
    }
    if (Array.isArray(parsed.data)) {
      return parsed.data.map(getRecord);
    }
    return [getRecord(parsed)];
  }
  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return headers.reduce<JsonRecord>((row, header, index) => {
      row[header] = cells[index] || "";
      return row;
    }, {});
  });
};

const pickLegacyValue = (row: JsonRecord, keys: readonly string[]) => {
  const rowKeys = Object.keys(row);
  for (const key of keys) {
    const matchedKey = rowKeys.find((rowKey) => rowKey.toLowerCase() === key.toLowerCase());
    if (!matchedKey) {
      continue;
    }
    const value = row[matchedKey];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
};

const mapLegacyStatus = (value: string) => {
  if (/闲置|停用|idle|inactive|apply/i.test(value)) {
    return "inactive";
  }
  if (/维修|维护|repair|maintenance/i.test(value)) {
    return "maintenance";
  }
  if (/退役|报废|retired/i.test(value)) {
    return "retired";
  }
  if (/归档|删除|deleted/i.test(value)) {
    return "deleted";
  }
  return "active";
};

const parseLegacyHardware = (row: JsonRecord) => {
  const data = row.data;
  const parsed = typeof data === "string" ? getRecord(JSON.parse(data || "{}")) : getRecord(data);
  const cpu = getRecord(parsed.cpu);
  const mem = getArray(parsed.mem).length ? getArray(parsed.mem) : getArray(parsed.memLayout);
  const disks = getArray(parsed.disk).length ? getArray(parsed.disk) : getArray(parsed.diskLayout);
  const graphics = getRecord(parsed.graphics);
  const controllers = getArray(graphics.controllers);
  return {
    raw: parsed,
    cpu: firstText(cpu.brand, cpu.model),
    memory: firstText(
      parsed.memLayout,
      mem.map((item) => formatBytes(getRecord(item).size)).filter((value) => value !== "-").join(" / ")
    ),
    disk: firstText(
      disks.map((item) => firstText(getRecord(item).name, getRecord(item).device, formatBytes(getRecord(item).size))).filter(Boolean).join(" / ")
    ),
    ip: firstText(getRecord(parsed.net)?.ip4, getRecord(parsed.os)?.fqdn),
    graphics: firstText(controllers[0]?.model),
    deviceModel: firstText(getRecord(parsed.system).model, getRecord(parsed.baseboard).model),
  };
};

const mapLegacyRow = (row: JsonRecord): AssetInput => {
  const parsedHardware = (() => {
    try {
      return parseLegacyHardware(row);
    } catch {
      return { raw: {}, cpu: "", memory: "", disk: "", ip: "", graphics: "", deviceModel: "" };
    }
  })();
  const assetNumber = pickLegacyValue(row, LEGACY_IMPORT_FIELDS.find((field) => field.value === "assetNumber")?.aliases || []);
  const name = pickLegacyValue(row, LEGACY_IMPORT_FIELDS.find((field) => field.value === "name")?.aliases || []);
  const ownerName = pickLegacyValue(row, LEGACY_IMPORT_FIELDS.find((field) => field.value === "ownerName")?.aliases || []);
  const department = pickLegacyValue(row, LEGACY_IMPORT_FIELDS.find((field) => field.value === "department")?.aliases || []);
  const status = pickLegacyValue(row, LEGACY_IMPORT_FIELDS.find((field) => field.value === "status")?.aliases || []);
  const category = pickLegacyValue(row, LEGACY_IMPORT_FIELDS.find((field) => field.value === "category")?.aliases || []);
  const cpu = pickLegacyValue(row, LEGACY_IMPORT_FIELDS.find((field) => field.value === "cpu")?.aliases || []) || parsedHardware.cpu;
  const memory = pickLegacyValue(row, LEGACY_IMPORT_FIELDS.find((field) => field.value === "memory")?.aliases || []) || parsedHardware.memory;
  const disk = pickLegacyValue(row, LEGACY_IMPORT_FIELDS.find((field) => field.value === "disk")?.aliases || []) || parsedHardware.disk;
  const ip = pickLegacyValue(row, LEGACY_IMPORT_FIELDS.find((field) => field.value === "ip")?.aliases || []) || parsedHardware.ip;
  const legacyUuid = pickLegacyValue(row, LEGACY_IMPORT_FIELDS.find((field) => field.value === "legacyUuid")?.aliases || []);
  return {
    assetType: category && !cpu && !memory ? "custom" : "pc",
    assetNumber,
    name: name || ownerName || parsedHardware.deviceModel || assetNumber || "旧数据资产",
    ownerName,
    department,
    status: mapLegacyStatus(status),
    category,
    purchasePrice: Number(pickLegacyValue(row, LEGACY_IMPORT_FIELDS.find((field) => field.value === "purchasePrice")?.aliases || []) || 0),
    residualValue: Number(pickLegacyValue(row, LEGACY_IMPORT_FIELDS.find((field) => field.value === "residualValue")?.aliases || []) || 0),
    metadata: {
      legacy: {
        source: "import_preview",
        uuid: legacyUuid,
        raw: row,
      },
      importedHardware: {
        cpu,
        memory,
        disk,
        ip,
        graphics: parsedHardware.graphics,
        raw: parsedHardware.raw,
      },
    },
  };
};

const loadSavedFilters = (): SavedAssetFilter[] => {
  try {
    const value = window.localStorage.getItem(SAVED_FILTER_STORAGE_KEY);
    if (!value) {
      return [];
    }
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((item) => item as SavedAssetFilter) : [];
  } catch {
    return [];
  }
};

const saveFilters = (filters: SavedAssetFilter[]) => {
  window.localStorage.setItem(SAVED_FILTER_STORAGE_KEY, JSON.stringify(filters));
};

const loadHandledIssueKeys = () => {
  try {
    const value = window.localStorage.getItem(HANDLED_ISSUES_STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set<string>();
  }
};

const saveHandledIssueKeys = (keys: Set<string>) => {
  window.localStorage.setItem(HANDLED_ISSUES_STORAGE_KEY, JSON.stringify(Array.from(keys)));
};

const assetsToCsv = (assets: Asset[]) => {
  const headers = ["资产编号", "资产名称", "资产类型", "使用人", "部门", "状态", "IP", "配置", "更新时间"];
  const rows = assets.map((asset) => {
    const { summary, importedHardware, extracted } = assetHardwareContext(asset);
    return [
      asset.assetNumber,
      asset.name,
      assetTypeLabel(asset.assetType),
      asset.ownerName,
      asset.department,
      statusLabel(asset.status),
      extracted.primaryIp,
      formatMemoryDiskText(summary, importedHardware),
      formatDate(asset.updatedAt),
    ];
  });
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
};

const issuesToCsv = (issues: HardwareIssue[], handledIssueKeys: Set<string>) => {
  const headers = ["处理状态", "级别", "类型", "资产编号", "资产名称", "使用人", "部门", "说明"];
  const rows = issues.map((issue) => [
    handledIssueKeys.has(issue.key) ? "已处理" : "未处理",
    issue.level === "error" ? "高" : issue.level === "warning" ? "中" : "低",
    issue.type,
    issue.asset.assetNumber,
    issue.asset.name,
    issue.asset.ownerName,
    issue.asset.department,
    issue.message,
  ]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
};

type BulkEditableField = "department" | "ownerName" | "status" | "category";

const BULK_EDIT_FIELDS: Array<{ key: BulkEditableField; label: string }> = [
  { key: "department", label: "部门" },
  { key: "ownerName", label: "使用人" },
  { key: "status", label: "状态" },
  { key: "category", label: "分类" },
];

const displayBulkValue = (field: BulkEditableField, value: unknown) => {
  if (field === "status") {
    return statusLabel(String(value || ""));
  }
  return fieldText(value);
};

const bulkUpdateChanges = (asset: Asset, input: AssetInput) =>
  BULK_EDIT_FIELDS.filter(({ key }) => Object.prototype.hasOwnProperty.call(input, key))
    .map(({ key, label }) => {
      const oldValue = displayBulkValue(key, asset[key]);
      const newValue = displayBulkValue(key, input[key]);
      return {
        field: key,
        label,
        oldValue,
        newValue,
      };
    })
    .filter((change) => change.oldValue !== change.newValue);

const buildClientTokenValue = (token: CreatedClientToken) =>
  `mda_${token.id}_${token.secret}`;

const buildClientSubmitCommand = (token: CreatedClientToken) =>
  `npcink-device-agent submit --site "${RestUrl}" --token "${buildClientTokenValue(token)}" --note "测试电脑"`;

const compactJson = (value: JsonRecord) => {
  const entries = Object.entries(value || {});
  if (entries.length === 0) {
    return "-";
  }
  return entries
    .slice(0, 6)
    .map(([key, item]) => `${key}: ${String(item)}`)
    .join("；");
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

const renderJsonBlock = (value: unknown) => (
  <pre className="npcink-v3-json">
    {JSON.stringify(value || {}, null, 2)}
  </pre>
);

const getRecord = (value: unknown): JsonRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};

const getArray = (value: unknown): JsonRecord[] =>
  Array.isArray(value) ? value.filter((item) => item && typeof item === "object") as JsonRecord[] : [];

const firstText = (...values: unknown[]) => {
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

const hardwareSummary = (summary: JsonRecord, hardware: JsonRecord) => {
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

const assetHardwareContext = (asset?: Asset | null) => {
  const latestSummary = getRecord(asset?.latestObservation?.summary);
  const latestHardware = getRecord(asset?.latestObservation?.hardware);
  const importedHardware = getRecord(getRecord(asset?.metadata).importedHardware);
  const importedRaw = getRecord(importedHardware.raw);
  const hasLatestHardware = Object.keys(latestSummary).length > 0 || Object.keys(latestHardware).length > 0;
  const summary = hasLatestHardware
    ? latestSummary
    : {
        cpu: importedHardware.cpu,
        graphics: importedHardware.graphics,
        device_model: firstText(importedHardware.deviceModel, getRecord(importedRaw.system).model),
        primary_ip: importedHardware.ip,
        platform: getRecord(importedRaw.os).platform,
      };
  const hardware = hasLatestHardware ? latestHardware : importedRaw;
  return {
    summary,
    hardware,
    importedHardware,
    extracted: hardwareSummary(getRecord(summary), getRecord(hardware)),
    hasLatestHardware,
  };
};

const hardwareMemoryBytes = (asset: Asset) => {
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

const hardwareDiskBytes = (asset: Asset) => {
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

const observationSnapshot = (observation?: AssetObservation) => {
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

const observationChanges = (observations: AssetObservation[]) => {
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
    AUDIT_FIELD_OPTIONS.forEach((field) => {
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

interface FieldSourceRow {
  key: string;
  label: string;
  standard: string;
  imported: string;
  latest: string;
}

const legacyFieldValue = (asset: Asset, field: (typeof LEGACY_IMPORT_FIELDS)[number]["value"]) => {
  const raw = getRecord(getRecord(getRecord(asset.metadata).legacy).raw);
  const aliases = LEGACY_IMPORT_FIELDS.find((item) => item.value === field)?.aliases || [];
  return pickLegacyValue(raw, aliases);
};

const fieldSourceRows = (asset: Asset, context: ReturnType<typeof assetHardwareContext>): FieldSourceRow[] => {
  const latestSummary = getRecord(asset.latestObservation?.summary);
  const latestHardware = getRecord(asset.latestObservation?.hardware);
  const latestExtracted = hardwareSummary(latestSummary, latestHardware);
  const importedRaw = getRecord(context.importedHardware.raw);
  const importedExtracted = hardwareSummary({}, importedRaw);
  const importedMemory = firstText(context.importedHardware.memory, importedExtracted.memoryLines.join("\n"));
  const latestMemory = firstText(latestExtracted.memoryLines.join("\n"), formatBytes(latestSummary.memory_bytes));

  return [
    {
      key: "assetNumber",
      label: "资产编号",
      standard: fieldText(asset.assetNumber),
      imported: fieldText(legacyFieldValue(asset, "assetNumber")),
      latest: "-",
    },
    {
      key: "name",
      label: "资产名称",
      standard: fieldText(asset.name),
      imported: fieldText(legacyFieldValue(asset, "name")),
      latest: fieldText(firstText(latestSummary.hostname, latestSummary.device_model)),
    },
    {
      key: "owner",
      label: "使用人",
      standard: fieldText(asset.ownerName),
      imported: fieldText(legacyFieldValue(asset, "ownerName")),
      latest: "-",
    },
    {
      key: "department",
      label: "部门",
      standard: fieldText(asset.department),
      imported: fieldText(legacyFieldValue(asset, "department")),
      latest: "-",
    },
    {
      key: "status",
      label: "状态",
      standard: statusLabel(asset.status),
      imported: fieldText(legacyFieldValue(asset, "status")),
      latest: "-",
    },
    {
      key: "cpu",
      label: "CPU",
      standard: fieldText(context.extracted.cpu),
      imported: fieldText(firstText(context.importedHardware.cpu, importedExtracted.cpu)),
      latest: fieldText(latestExtracted.cpu),
    },
    {
      key: "graphics",
      label: "显卡",
      standard: fieldText(context.extracted.graphics),
      imported: fieldText(firstText(context.importedHardware.graphics, importedExtracted.graphics)),
      latest: fieldText(latestExtracted.graphics),
    },
    {
      key: "deviceModel",
      label: "计算机型号",
      standard: fieldText(context.extracted.deviceModel),
      imported: fieldText(importedExtracted.deviceModel),
      latest: fieldText(latestExtracted.deviceModel),
    },
    {
      key: "baseboard",
      label: "主板型号",
      standard: fieldText(context.extracted.baseboard),
      imported: fieldText(importedExtracted.baseboard),
      latest: fieldText(latestExtracted.baseboard),
    },
    {
      key: "memory",
      label: "内存",
      standard: fieldText(firstText(context.extracted.memoryLines.join("\n"), context.importedHardware.memory, formatBytes(context.summary.memory_bytes))),
      imported: fieldText(importedMemory),
      latest: fieldText(latestMemory),
    },
    {
      key: "disk",
      label: "硬盘",
      standard: fieldText(firstText(context.extracted.primaryDisk, context.importedHardware.disk, formatBytes(context.summary.disk_bytes))),
      imported: fieldText(firstText(context.importedHardware.disk, importedExtracted.primaryDisk)),
      latest: fieldText(firstText(latestExtracted.primaryDisk, formatBytes(latestSummary.disk_bytes))),
    },
    {
      key: "ip",
      label: "IP",
      standard: fieldText(context.extracted.primaryIp),
      imported: fieldText(firstText(context.importedHardware.ip, importedExtracted.primaryIp)),
      latest: fieldText(latestExtracted.primaryIp),
    },
  ];
};

interface ActivityItem {
  key: string;
  tag: string;
  color: string;
  title: string;
  description: string;
  time: string;
}

const recentActivityItems = (
  observations: AssetObservation[],
  events: AssetEvent[],
  changes: ReturnType<typeof observationChanges>
): ActivityItem[] => [
  ...changes.map((change) => ({
    key: `change-${change.key}`,
    tag: "配置变化",
    color: "purple",
    title: change.label,
    description: `${change.oldValue} -> ${change.newValue}`,
    time: change.observedAt,
  })),
  ...observations.map((observation) => {
    const snapshot = observationSnapshot(observation);
    return {
      key: `observation-${observation.id}`,
      tag: "自动采集",
      color: "blue",
      title: optionLabel(OBSERVATION_SOURCE_OPTIONS, observation.source),
      description: [snapshot.cpu, snapshot.memory_bytes, snapshot.disk_bytes, snapshot.primary_ip]
        .filter((item) => item && item !== "-")
        .join(" / ") || "收到一条硬件采集",
      time: observation.observedAt || observation.receivedAt,
    };
  }),
  ...events.map((event) => ({
    key: `event-${event.id}`,
    tag: optionLabel(EVENT_SOURCE_OPTIONS, event.eventSource),
    color: event.eventSource === "manual" ? "orange" : "green",
    title: optionLabel(EVENT_TYPE_OPTIONS, event.eventType),
    description: event.message || [event.fieldName, event.oldValue, event.newValue].filter(Boolean).join(" / ") || "记录已写入",
    time: event.createdAt,
  })),
].sort((a, b) => new Date(b.time.replace(" ", "T")).getTime() - new Date(a.time.replace(" ", "T")).getTime()).slice(0, 8);

const latestObservationTime = (asset: Asset) => asset.latestObservation?.observedAt || "";

const daysSince = (value?: string) => {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.floor((Date.now() - date.getTime()) / 86400000);
};

const ignoredAuditFields = (asset: Asset) => {
  const audit = getRecord(getRecord(asset.metadata).audit);
  return Array.isArray(audit.ignoredFields) ? new Set(audit.ignoredFields.map(String)) : new Set<string>();
};

const duplicateMap = (assets: Asset[], getValue: (asset: Asset) => string) => {
  const result = new Map<string, Asset[]>();
  assets.forEach((asset) => {
    const value = getValue(asset).trim();
    if (!value || value === "-") {
      return;
    }
    result.set(value, [...(result.get(value) || []), asset]);
  });
  return result;
};

const missingHardwareValue = (value: string) => !value || value.trim() === "-" || /^暂无/.test(value.trim());

const issueGroup = (type: string) => {
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

const detectHardwareIssues = (assets: Asset[]) => {
  const byNumber = duplicateMap(assets, (asset) => asset.assetNumber);
  const byIp = duplicateMap(assets, (asset) => assetHardwareContext(asset).extracted.primaryIp);
  const byBoard = duplicateMap(assets, hardwareBoardSerial);
  const issues: HardwareIssue[] = [];

  assets.forEach((asset) => {
    const ignored = ignoredAuditFields(asset);
    const context = assetHardwareContext(asset);
    const assetLabel = asset.assetNumber || asset.name || asset.uuid;
    const extracted = context.extracted;
    if (asset.assetNumber && (byNumber.get(asset.assetNumber)?.length || 0) > 1) {
      issues.push({
        key: `${asset.uuid}-duplicate-number`,
        level: "error",
        type: "重复编号",
        asset,
        message: `${asset.assetNumber} 已关联 ${byNumber.get(asset.assetNumber)?.length || 0} 条资产`,
      });
    }
    const ip = context.extracted.primaryIp;
    if (ip && !ignored.has("primary_ip") && (byIp.get(ip)?.length || 0) > 1) {
      issues.push({
        key: `${asset.uuid}-duplicate-ip`,
        level: "warning",
        type: "重复 IP",
        asset,
        message: `${ip} 同时出现在 ${byIp.get(ip)?.length || 0} 条资产`,
      });
    }
    const boardKey = hardwareBoardSerial(asset);
    if (boardKey && !ignored.has("baseboard") && (byBoard.get(boardKey)?.length || 0) > 1) {
      issues.push({
        key: `${asset.uuid}-duplicate-board`,
        level: "warning",
        type: "疑似重复设备",
        asset,
        message: `${boardKey} 与其他资产重复`,
      });
    }
    if (!asset.department) {
      issues.push({
        key: `${asset.uuid}-missing-department`,
        level: "info",
        type: "部门缺失",
        asset,
        message: `${assetLabel} 未设置部门`,
      });
    }
    if (!asset.ownerName) {
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
    if (!ignored.has("memory_bytes") && hardwareMemoryBytes(asset) <= 0 && missingHardwareValue(String(context.importedHardware.memory || ""))) {
      issues.push({
        key: `${asset.uuid}-missing-memory`,
        level: "warning",
        type: "内存缺失",
        asset,
        message: `${assetLabel} 缺少内存信息`,
      });
    }
    if (!ignored.has("disk_bytes") && hardwareDiskBytes(asset) <= 0 && missingHardwareValue(String(context.importedHardware.disk || ""))) {
      issues.push({
        key: `${asset.uuid}-missing-disk`,
        level: "warning",
        type: "硬盘缺失",
        asset,
        message: `${assetLabel} 缺少硬盘信息`,
      });
    }
    if (!latestObservationTime(asset) && Object.keys(context.importedHardware).length > 0) {
      issues.push({
        key: `${asset.uuid}-imported-only`,
        level: "info",
        type: "未接入采集",
        asset,
        message: `${assetLabel} 目前只有导入硬件信息`,
      });
    } else if (daysSince(latestObservationTime(asset)) > 30) {
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

const assetReferenceLabel = (asset?: AssetReference) => {
  if (!asset) {
    return "-";
  }
  return [asset.assetNumber, asset.name].filter(Boolean).join(" / ") || asset.uuid || "-";
};

const hardwareSections = (hardware: JsonRecord) =>
  Object.entries(hardware || {}).filter(([, value]) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (value && typeof value === "object") {
      return Object.keys(value).length > 0;
    }
    return value !== null && value !== undefined && value !== "";
  });

const detailItems = (asset?: Asset) => {
  if (!asset) {
    return [];
  }
  return [
    { key: "number", label: "资产编号", children: asset.assetNumber || "-" },
    { key: "type", label: "资产类型", children: assetTypeLabel(asset.assetType) },
    { key: "owner", label: "使用人", children: asset.ownerName || "-" },
    { key: "department", label: "部门", children: asset.department || "-" },
    { key: "category", label: "分类", children: asset.category || "-" },
    {
      key: "status",
      label: "状态",
      children: (
        <Tag color={statusColor[asset.status] || "default"}>
          {statusLabel(asset.status)}
        </Tag>
      ),
    },
    { key: "purchase", label: "购置价值", children: formatMoney(asset.purchasePrice) },
    { key: "residual", label: "残值", children: formatMoney(asset.residualValue) },
    { key: "updated", label: "更新时间", children: formatDate(asset.updatedAt) },
    {
      key: "legacy",
      label: "旧数据来源",
      children: fieldText(getRecord(asset.metadata.legacy).source_table),
    },
    {
      key: "legacyUuid",
      label: "旧UUID",
      children: fieldText(getRecord(asset.metadata.legacy).uuid),
    },
  ];
};

interface AssetFormModalProps {
  asset: Asset | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AssetInput) => Promise<void>;
}

type AssetFormValues = Omit<AssetInput, "metadata">;

const AssetFormModal = ({ asset, open, onClose, onSubmit }: AssetFormModalProps) => {
  const [form] = Form.useForm<AssetFormValues>();

  useEffect(() => {
    if (!open) {
      return;
    }
    form.setFieldsValue({
      assetType: asset?.assetType || "custom",
      assetNumber: asset?.assetNumber || "",
      name: asset?.name || "",
      ownerName: asset?.ownerName || "",
      department: asset?.department || "",
      category: asset?.category || "",
      status: asset?.status || "active",
      purchasePrice: asset?.purchasePrice || 0,
      residualValue: asset?.residualValue || 0,
    });
  }, [asset, form, open]);

  return (
    <Modal
      title={asset ? "编辑资产" : "新增资产"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      destroyOnClose
      width={640}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => onSubmit(values)}
        preserve={false}
      >
        <Form.Item name="name" label="资产名称" rules={[{ required: true }]}>
          <Input placeholder="例如：财务部工作站" />
        </Form.Item>
        <Space.Compact block>
          <Form.Item name="assetNumber" label="资产编号" className="npcink-v3-half">
            <Input placeholder="留空自动生成" />
          </Form.Item>
          <Form.Item name="assetType" label="资产类型" className="npcink-v3-half">
            <Select options={ASSET_TYPES} />
          </Form.Item>
        </Space.Compact>
        <Space.Compact block>
          <Form.Item name="ownerName" label="使用人" className="npcink-v3-half">
            <Input />
          </Form.Item>
          <Form.Item name="department" label="部门" className="npcink-v3-half">
            <Input />
          </Form.Item>
        </Space.Compact>
        <Space.Compact block>
          <Form.Item name="category" label="分类" className="npcink-v3-half">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态" className="npcink-v3-half">
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
        </Space.Compact>
        <Space.Compact block>
          <Form.Item name="purchasePrice" label="购置价值" className="npcink-v3-half">
            <InputNumber min={0} precision={2} className="npcink-v3-number" />
          </Form.Item>
          <Form.Item name="residualValue" label="残值" className="npcink-v3-half">
            <InputNumber min={0} precision={2} className="npcink-v3-number" />
          </Form.Item>
        </Space.Compact>
      </Form>
    </Modal>
  );
};

interface LegacyImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

const LegacyImportModal = ({ open, onClose, onImported }: LegacyImportModalProps) => {
  const [rawText, setRawText] = useState("");
  const [previewRows, setPreviewRows] = useState<AssetInput[]>([]);
  const importMutation = useMutation(
    async (rows: AssetInput[]) => {
      for (const row of rows) {
        await createAsset(row);
      }
    },
    {
      onSuccess: () => {
        message.success("旧数据已导入");
        setRawText("");
        setPreviewRows([]);
        onImported();
        onClose();
      },
    }
  );

  const parseSource = (text = rawText) => {
    try {
      const rows = parseTabularText(text).map(mapLegacyRow);
      setPreviewRows(rows);
      if (!rows.length) {
        message.warning("没有识别到可导入的数据");
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : "解析失败");
    }
  };

  return (
    <Modal
      title="旧数据导入预览"
      open={open}
      onCancel={onClose}
      width={920}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="preview" onClick={() => parseSource()}>
          生成预览
        </Button>,
        <Button
          key="import"
          type="primary"
          disabled={!previewRows.length}
          loading={importMutation.isLoading}
          onClick={() => importMutation.mutate(previewRows)}
        >
          导入 {previewRows.length} 条
        </Button>,
      ]}
    >
      <Space direction="vertical" size={12} className="npcink-v3-detail-stack">
        <Alert
          type="info"
          showIcon
          message="支持 CSV 或 JSON"
          description="导入前会自动识别常见旧字段并生成预览；确认后会创建 v3 资产记录，原始行会保存在 metadata.legacy.raw。"
        />
        <input
          type="file"
          accept=".csv,.json,text/csv,application/json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              const text = String(reader.result || "");
              setRawText(text);
              parseSource(text);
            };
            reader.readAsText(file);
          }}
        />
        <Input.TextArea
          rows={6}
          value={rawText}
          onChange={(event) => {
            setRawText(event.target.value);
            setPreviewRows([]);
          }}
          placeholder="粘贴 CSV 或 JSON。第一行作为 CSV 表头，例如：编号,名称,使用人,部门,CPU,内存,硬盘,状态"
        />
        <Table
          rowKey={(row, index) => `${row.assetNumber || row.name}-${index}`}
          size="small"
          pagination={{ pageSize: 5, showSizeChanger: false }}
          dataSource={previewRows}
          columns={[
            { title: "编号", dataIndex: "assetNumber", width: 150, render: fieldText },
            { title: "名称", dataIndex: "name", render: fieldText },
            { title: "使用人", dataIndex: "ownerName", width: 120, render: fieldText },
            { title: "部门", dataIndex: "department", width: 120, render: fieldText },
            { title: "状态", dataIndex: "status", width: 100, render: statusLabel },
          ]}
          locale={{ emptyText: <Empty description="暂无预览数据" /> }}
        />
      </Space>
    </Modal>
  );
};

interface BulkEditModalProps {
  open: boolean;
  count: number;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: AssetInput) => Promise<void>;
}

const BulkEditModal = ({ open, count, loading, onClose, onSubmit }: BulkEditModalProps) => {
  const [form] = Form.useForm<AssetInput>();

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [form, open]);

  return (
    <Modal
      title="批量修改资产"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      destroyOnClose
      width={560}
    >
      <Alert
        type="info"
        showIcon
        className="npcink-v3-secret"
        message={`将修改 ${count} 条已选资产`}
        description="留空字段不会覆盖原值；发生变化的资产会写入一条批量修改记录。"
      />
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        onFinish={(values) => {
          const input = Object.fromEntries(
            Object.entries(values).filter(([, value]) => value !== undefined && value !== "")
          ) as AssetInput;
          onSubmit(input);
        }}
      >
        <Form.Item name="department" label="部门">
          <Input placeholder="统一修改部门" />
        </Form.Item>
        <Form.Item name="ownerName" label="使用人 / 责任人">
          <Input placeholder="统一修改使用人" />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select allowClear options={STATUS_OPTIONS} placeholder="统一修改状态" />
        </Form.Item>
        <Form.Item name="category" label="分类">
          <Input placeholder="统一修改分类" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

interface TokenModalProps {
  open: boolean;
  onClose: () => void;
}

const TokenModal = ({ open, onClose }: TokenModalProps) => {
  const [form] = Form.useForm<{ name: string }>();
  const [createdToken, setCreatedToken] = useState<CreatedClientToken | null>(null);
  const queryClient = useQueryClient();
  const settingsQuery = useQuery(["v3-settings"], getSettings, { enabled: open });
  const createMutation = useMutation(createClientToken, {
    onSuccess: (token) => {
      setCreatedToken(token);
      form.resetFields();
      queryClient.invalidateQueries(["v3-settings"]);
      message.success("令牌已创建，请立即保存完整授权码");
    },
  });
  const deleteMutation = useMutation(deleteClientToken, {
    onSuccess: () => {
      queryClient.invalidateQueries(["v3-settings"]);
      message.success("令牌已删除");
    },
  });

  const tokens = settingsQuery.data?.clientTokens || [];

  const columns: ColumnsType<ClientToken> = [
    { title: "名称", dataIndex: "name" },
    { title: "Token ID", dataIndex: "id", width: 160 },
    {
      title: "状态",
      dataIndex: "enabled",
      width: 88,
      render: (enabled: boolean) => (
        <Tag color={enabled ? "green" : "default"}>{enabled ? "启用" : "停用"}</Tag>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      width: 180,
      render: formatDate,
    },
    {
      title: "操作",
      width: 88,
      render: (_, token) => (
        <Button
          size="small"
          danger
          onClick={() =>
            Modal.confirm({
              title: "删除客户端令牌？",
              content: `Token ID: ${token.id}`,
              okText: "删除",
              okButtonProps: { danger: true },
              cancelText: "取消",
              onOk: () => deleteMutation.mutateAsync(token.id),
            })
          }
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title="采集客户端令牌"
      open={open}
      onCancel={onClose}
      footer={null}
      width={820}
      destroyOnClose
    >
      <Form
        form={form}
        layout="inline"
        className="npcink-v3-token-form"
        onFinish={({ name }) => createMutation.mutate(name)}
      >
        <Form.Item name="name" rules={[{ required: true, message: "请输入令牌名称" }]}>
          <Input placeholder="例如：财务部采集客户端" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={createMutation.isLoading}>
          创建令牌
        </Button>
      </Form>
      {createdToken ? (
        <Alert
          className="npcink-v3-secret"
          type="warning"
          showIcon
          message="完整授权码只显示一次"
          description={
            <Space direction="vertical" size={8} className="npcink-v3-client-snippet">
              <div>
                <Text type="secondary">站点地址</Text>
                <Text copyable code>
                  {RestUrl}
                </Text>
              </div>
              <div>
                <Text type="secondary">完整授权码</Text>
                <Text copyable code>
                  {buildClientTokenValue(createdToken)}
                </Text>
              </div>
              <div>
                <Text type="secondary">命令行验收</Text>
                <Text copyable code>
                  {buildClientSubmitCommand(createdToken)}
                </Text>
              </div>
            </Space>
          }
        />
      ) : null}
      <Table
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={tokens}
        loading={settingsQuery.isLoading}
        pagination={false}
      />
    </Modal>
  );
};

interface ManualRecordModalProps {
  open: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSubmit: (values: AssetEventInput) => Promise<unknown>;
}

const ManualRecordModal = ({ open, asset, onClose, onSubmit }: ManualRecordModalProps) => {
  const [form] = Form.useForm<AssetEventInput & { targetDepartment?: string }>();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({ eventType: "note", message: "", payload: {} });
    }
  }, [form, open]);

  return (
    <Modal
      title="新增手动记录"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      destroyOnClose
      width={560}
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        onFinish={(values) =>
          onSubmit({
            eventType: values.eventType || "note",
            message: values.message,
            payload: {
              assetNumber: asset?.assetNumber || "",
              targetDepartment: values.targetDepartment || "",
            },
          })
        }
      >
        <Form.Item name="eventType" label="记录类型">
          <Select options={MANUAL_RECORD_OPTIONS} />
        </Form.Item>
        <Form.Item name="targetDepartment" label="目标部门 / 去向">
          <Input placeholder="转移、借用时可填写" />
        </Form.Item>
        <Form.Item name="message" label="记录内容" rules={[{ required: true, message: "请输入记录内容" }]}>
          <Input.TextArea rows={4} placeholder="例如：更换硬盘，已交付财务部继续使用" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

interface AssetSettingsPanelProps {
  asset: Asset;
  onUpdated: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  onArchive: (asset: Asset) => void;
}

const AssetSettingsPanel = ({ asset, onUpdated, onEdit, onArchive }: AssetSettingsPanelProps) => {
  const [form] = Form.useForm<AssetInput & { ignoredFields?: string[] }>();
  const metadata = getRecord(asset.metadata);
  const audit = getRecord(metadata.audit);
  const updateMutation = useMutation(
    (values: AssetInput & { ignoredFields?: string[] }) =>
      updateAsset(asset.uuid, {
        name: values.name,
        ownerName: values.ownerName,
        department: values.department,
        status: values.status,
        metadata: {
          ...metadata,
          audit: {
            ...audit,
            ignoredFields: values.ignoredFields || [],
          },
        },
      }),
    {
      onSuccess: (updated) => {
        onUpdated(updated);
        message.success("资产设置已保存");
      },
    }
  );

  useEffect(() => {
    form.setFieldsValue({
      name: asset.name,
      ownerName: asset.ownerName,
      department: asset.department,
      status: asset.status,
      ignoredFields: Array.isArray(audit.ignoredFields) ? (audit.ignoredFields as string[]) : [],
    });
  }, [asset, audit.ignoredFields, form]);

  return (
    <div className="npcink-v3-settings-panel npcink-v3-detail-settings">
      <Form form={form} layout="vertical" onFinish={(values) => updateMutation.mutate(values)}>
        <Space.Compact block>
          <Form.Item name="name" label="资产别名" className="npcink-v3-half">
            <Input />
          </Form.Item>
          <Form.Item name="ownerName" label="责任人" className="npcink-v3-half">
            <Input />
          </Form.Item>
        </Space.Compact>
        <Space.Compact block>
          <Form.Item name="department" label="部门" className="npcink-v3-half">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态" className="npcink-v3-half">
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
        </Space.Compact>
        <Form.Item name="ignoredFields" label="忽略盘点字段">
          <Select mode="multiple" allowClear options={AUDIT_FIELD_OPTIONS} placeholder="选择后异常发现会跳过这些字段" />
        </Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={updateMutation.isLoading}>
            保存设置
          </Button>
          <Button onClick={() => onEdit(asset)}>完整编辑</Button>
          <Button danger onClick={() => onArchive(asset)}>
            归档资产
          </Button>
        </Space>
      </Form>
    </div>
  );
};

interface DetailDrawerProps {
  uuid: string | null;
  open: boolean;
  onClose: () => void;
  onEdit: (asset: Asset) => void;
  onArchive: (asset: Asset) => void;
}

const DetailDrawer = ({ uuid, open, onClose, onEdit, onArchive }: DetailDrawerProps) => {
  const queryClient = useQueryClient();
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const enabled = Boolean(uuid && open);
  const assetQuery = useQuery(["v3-asset", uuid], () => getAsset(uuid || ""), {
    enabled,
  });
  const identitiesQuery = useQuery(
    ["v3-asset-identities", uuid],
    () => getAssetIdentities(uuid || ""),
    { enabled }
  );
  const observationsQuery = useQuery(
    ["v3-asset-observations", uuid],
    () => getAssetObservations(uuid || "", 1, 20),
    { enabled }
  );
  const eventsQuery = useQuery(
    ["v3-asset-events", uuid],
    () => getAssetEvents(uuid || "", 1, 30),
    { enabled }
  );

  const asset = assetQuery.data || null;
  const observations = observationsQuery.data?.data || [];
  const events = eventsQuery.data?.data || [];
  const hardwareContext = assetHardwareContext(asset);
  const latestHardware = hardwareContext.hardware;
  const summary = hardwareContext.summary;
  const extracted = hardwareContext.extracted;
  const changes = useMemo(() => observationChanges(observations).slice(0, 8), [observations]);
  const sourceRows = useMemo(
    () => (asset ? fieldSourceRows(asset, hardwareContext) : []),
    [asset, hardwareContext]
  );
  const activityItems = useMemo(
    () => recentActivityItems(observations, events, changes),
    [changes, events, observations]
  );
  const createEventMutation = useMutation(
    (input: AssetEventInput) => createAssetEvent(uuid || "", input),
    {
      onSuccess: () => {
        setRecordModalOpen(false);
        queryClient.invalidateQueries(["v3-asset-events", uuid]);
        queryClient.invalidateQueries(["v3-events"]);
        message.success("手动记录已添加");
      },
    }
  );

  const handleAssetUpdated = (updated: Asset) => {
    queryClient.setQueryData(["v3-asset", updated.uuid], updated);
    queryClient.invalidateQueries(["v3-assets"]);
    queryClient.invalidateQueries(["v3-asset-events", updated.uuid]);
  };

  const identityColumns: ColumnsType<AssetIdentity> = [
    { title: "类型", dataIndex: "identityType", width: 130 },
    { title: "值", dataIndex: "identityValue" },
    {
      title: "主标识",
      dataIndex: "isPrimary",
      width: 90,
      render: (isPrimary: boolean) => (isPrimary ? <Tag color="blue">主</Tag> : "-"),
    },
    {
      title: "置信度",
      dataIndex: "confidence",
      width: 92,
      render: (value: number) => `${Number(value).toFixed(0)}%`,
    },
    { title: "来源", dataIndex: "source", width: 100 },
  ];

  const observationColumns: ColumnsType<AssetObservation> = [
    { title: "来源", dataIndex: "source", width: 100 },
    { title: "采集时间", dataIndex: "observedAt", width: 180, render: formatDate },
    { title: "接收时间", dataIndex: "receivedAt", width: 180, render: formatDate },
    {
      title: "摘要",
      dataIndex: "summary",
      render: (summary: JsonRecord) => (
        <Space direction="vertical" size={2}>
          <Text>{fieldText(summary.device_model || summary.hostname)}</Text>
          <Text type="secondary">{compactJson(summary)}</Text>
        </Space>
      ),
    },
  ];

  const eventColumns: ColumnsType<AssetEvent> = [
    { title: "时间", dataIndex: "createdAt", width: 180, render: formatDate },
    { title: "来源", dataIndex: "eventSource", width: 100 },
    { title: "类型", dataIndex: "eventType", width: 140 },
    { title: "字段", dataIndex: "fieldName", width: 120, render: fieldText },
    {
      title: "说明",
      render: (_, event) => (
        <Space direction="vertical" size={2}>
          <Text>{event.message || "-"}</Text>
          {event.oldValue || event.newValue ? (
            <Text type="secondary">
              {fieldText(event.oldValue)} -&gt; {fieldText(event.newValue)}
            </Text>
          ) : null}
          {event.actorName ? <Text type="secondary">操作人：{event.actorName}</Text> : null}
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={asset?.assetType === "pc" || asset?.assetType === "computer" ? "电脑资产详情" : "资产详情"}
      open={open}
      onCancel={onClose}
      footer={null}
      width="min(940px, calc(100vw - 32px))"
      className="npcink-v3-detail-modal"
      destroyOnClose
    >
      {assetQuery.isLoading ? (
        <Table loading pagination={false} showHeader={false} />
      ) : asset ? (
        <Space direction="vertical" size={16} className="npcink-v3-detail-stack">
          <div className="npcink-v3-device-hero">
            <div className="npcink-v3-device-brand">
              <div className="npcink-v3-os-mark" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
              <strong>{extracted.platform || "Device"}</strong>
            </div>
            <div>
              <h3>{asset.ownerName || asset.name || "未命名资产"}</h3>
              <p>{[extracted.cpu, formatMemoryDiskText(summary, hardwareContext.importedHardware)].filter((item) => item && item !== "- / -").join(" / ") || assetTypeLabel(asset.assetType)}</p>
              <div className="npcink-v3-device-meta">
                <span>部门：{asset.department || "-"}</span>
                <span>状态：{statusLabel(asset.status)}</span>
                <span>编号：{asset.assetNumber || "-"}</span>
              </div>
            </div>
          </div>
          <Tabs
            defaultActiveKey="overview"
            items={[
            {
              key: "overview",
              label: "硬件信息",
              children: (
                <Space direction="vertical" size={14} className="npcink-v3-detail-stack">
                  <div className="npcink-v3-hardware-grid">
                    <div>
                      <Text strong>中央处理器(CPU)型号</Text>
                      <strong>{fieldText(extracted.cpu)}</strong>
                    </div>
                    <div>
                      <Text strong>显卡型号</Text>
                      <strong>{fieldText(extracted.graphics)}</strong>
                    </div>
                    <div>
                      <Text strong>计算机型号</Text>
                      <strong>{fieldText(extracted.deviceModel)}</strong>
                    </div>
                    <div>
                      <Text strong>主板型号</Text>
                      <strong>{fieldText(extracted.baseboard)}</strong>
                    </div>
                    <div>
                      <Text strong>内存信息</Text>
                      <strong>{extracted.memoryLines.length ? extracted.memoryLines.join("\n") : fieldText(hardwareContext.importedHardware.memory || formatBytes(summary.memory_bytes))}</strong>
                    </div>
                    <div>
                      <Text strong>显示器</Text>
                      <strong>{fieldText(extracted.display)}</strong>
                      <span>{fieldText(extracted.displayModel)}</span>
                    </div>
                    <div>
                      <Text strong>主硬盘</Text>
                      <strong>{fieldText(extracted.primaryDisk || hardwareContext.importedHardware.disk || formatBytes(summary.disk_bytes))}</strong>
                    </div>
                    <div>
                      <Text strong>添加时间</Text>
                      <strong>{formatDate(asset.createdAt)}</strong>
                    </div>
                  </div>
                  <div className="npcink-v3-activity-list">
                    <div className="npcink-v3-activity-head">
                      <Text strong>最近记录</Text>
                      <Text type="secondary">合并自动采集、配置变化和手动记录</Text>
                    </div>
                    {activityItems.length ? (
                      activityItems.map((item) => (
                        <div key={item.key}>
                          <Tag color={item.color}>{item.tag}</Tag>
                          <div>
                            <Text strong>{item.title}</Text>
                            <Text type="secondary">{item.description}</Text>
                          </div>
                          <Text type="secondary">{formatDate(item.time)}</Text>
                        </div>
                      ))
                    ) : (
                      <div className="npcink-v3-activity-empty">
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无最近记录" />
                      </div>
                    )}
                  </div>
                  <Collapse
                    size="small"
                    items={[
                      {
                        key: "hardware",
                        label: `硬件明细 ${hardwareSections(latestHardware).length}`,
                        children: renderJsonBlock(latestHardware),
                      },
                      {
                        key: "metadata",
                        label: "资产扩展信息",
                        children: renderJsonBlock(asset.metadata),
                      },
                    ]}
                  />
                </Space>
              ),
            },
            {
              key: "identities",
              label: "详细信息",
              children: (
                <Space direction="vertical" size={14} className="npcink-v3-detail-stack">
                  <Descriptions bordered size="small" column={2} items={detailItems(asset)} />
                  <div className="npcink-v3-field-source">
                    <div className="npcink-v3-field-source-head">
                      <Text strong>字段来源对照</Text>
                      <Text type="secondary">标准字段、导入字段和最新采集字段并排查看。</Text>
                    </div>
                    <div className="npcink-v3-field-source-grid">
                      <strong>字段</strong>
                      <strong>标准字段</strong>
                      <strong>导入字段</strong>
                      <strong>最新采集</strong>
                      {sourceRows.map((row) => (
                        <Fragment key={row.key}>
                          <span>{row.label}</span>
                          <span>{row.standard}</span>
                          <span>{row.imported}</span>
                          <span>{row.latest}</span>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                  <Table
                    rowKey="id"
                    size="small"
                    columns={identityColumns}
                    dataSource={identitiesQuery.data || []}
                    loading={identitiesQuery.isLoading}
                    pagination={false}
                  />
                </Space>
              ),
            },
            {
              key: "observations",
              label: "自动记录",
              children: (
                <Space direction="vertical" size={14} className="npcink-v3-detail-stack">
                  <div className="npcink-v3-change-strip">
                    <div>
                      <Text strong>采集变化</Text>
                      <Text type="secondary">比较相邻两次自动采集</Text>
                    </div>
                    {changes.length ? (
                      changes.map((change) => (
                        <div key={change.key}>
                          <Tag color="blue">{change.label}</Tag>
                          <Text>{change.oldValue}</Text>
                          <Text type="secondary">-&gt;</Text>
                          <Text strong>{change.newValue}</Text>
                          <Text type="secondary">{formatDate(change.observedAt)}</Text>
                        </div>
                      ))
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无可识别配置变化" />
                    )}
                  </div>
                  <Table
                    rowKey="id"
                    size="small"
                    columns={observationColumns}
                    dataSource={observations}
                    loading={observationsQuery.isLoading}
                    pagination={false}
                    expandable={{
                      expandedRowRender: (observation) => (
                        <Collapse
                          size="small"
                          items={[
                            {
                              key: "hardware",
                              label: "硬件明细",
                              children: renderJsonBlock(observation.hardware),
                            },
                            {
                              key: "raw",
                              label: "原始数据",
                              children: renderJsonBlock(observation.raw),
                            },
                          ]}
                        />
                      ),
                    }}
                  />
                </Space>
              ),
            },
            {
              key: "events",
              label: "手动记录",
              children: (
                <Space direction="vertical" size={12} className="npcink-v3-detail-stack">
                  <div className="npcink-v3-record-toolbar">
                    <Text type="secondary">维修、借用、归还、转移和备注会写入统一事件表。</Text>
                    <Button type="primary" onClick={() => setRecordModalOpen(true)}>
                      新增记录
                    </Button>
                  </div>
                  <Table
                    rowKey="id"
                    size="small"
                    columns={eventColumns}
                    dataSource={events}
                    loading={eventsQuery.isLoading}
                    pagination={false}
                    expandable={{
                      expandedRowRender: (event) => renderJsonBlock(event.payload),
                    }}
                  />
                </Space>
              ),
            },
            {
              key: "settings",
              label: "设置",
              children: (
                <AssetSettingsPanel
                  asset={asset}
                  onUpdated={handleAssetUpdated}
                  onEdit={onEdit}
                  onArchive={onArchive}
                />
              ),
            },
            ]}
          />
          <ManualRecordModal
            open={recordModalOpen}
            asset={asset}
            onClose={() => setRecordModalOpen(false)}
            onSubmit={(values) => createEventMutation.mutateAsync(values)}
          />
        </Space>
      ) : (
        <Empty description="未找到资产" />
      )}
    </Modal>
  );
};

const ChangeWorkspace = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [eventSource, setEventSource] = useState<string | undefined>();
  const [eventType, setEventType] = useState<string | undefined>();
  const queryParams = useMemo(
    () => ({ page, pageSize, search, eventSource, eventType }),
    [eventSource, eventType, page, pageSize, search]
  );
  const eventsQuery = useQuery(["v3-events", queryParams], () => getEvents(queryParams), {
    keepPreviousData: true,
  });
  const events = eventsQuery.data?.data || [];
  const pagination = eventsQuery.data?.pagination;

  const columns: ColumnsType<AssetEvent> = [
    { title: "时间", dataIndex: "createdAt", width: 180, render: formatDate },
    {
      title: "资产",
      render: (_, event) => (
        <Space direction="vertical" size={2}>
          <Text strong>{assetReferenceLabel(event.asset)}</Text>
          <Text type="secondary">{event.asset?.department || "-"}</Text>
        </Space>
      ),
    },
    {
      title: "来源",
      dataIndex: "eventSource",
      width: 110,
      render: (value: string) => <Tag>{optionLabel(EVENT_SOURCE_OPTIONS, value)}</Tag>,
    },
    {
      title: "类型",
      dataIndex: "eventType",
      width: 130,
      render: (value: string) => optionLabel(EVENT_TYPE_OPTIONS, value),
    },
    { title: "字段", dataIndex: "fieldName", width: 130, render: fieldText },
    {
      title: "变更",
      width: 220,
      render: (_, event) =>
        event.oldValue || event.newValue ? (
          <Text type="secondary">
            {fieldText(event.oldValue)} -&gt; {fieldText(event.newValue)}
          </Text>
        ) : (
          "-"
        ),
    },
    { title: "说明", dataIndex: "message", render: fieldText },
  ];

  return (
    <div className="npcink-v3-section">
      <div className="npcink-v3-section-header">
        <div>
          <Title level={3}>变更数据</Title>
          <Text type="secondary">来自 v3 统一事件表，包含人工修改、导入、上传和系统记录。</Text>
        </div>
        <Tag color="blue">{pagination?.totalItems ?? "-"} 条事件</Tag>
      </div>
      <div className="npcink-v3-toolbar-shell">
        <div className="npcink-v3-toolbar-title">
          <Text strong>事件列表</Text>
          <Text type="secondary">按来源、类型和资产信息筛选</Text>
        </div>
        <div className="npcink-v3-toolbar">
          <Input.Search
            allowClear
            placeholder="搜索资产、字段或说明"
            onSearch={(value) => {
              setPage(1);
              setSearch(value);
            }}
            className="npcink-v3-search"
          />
          <Select
            allowClear
            placeholder="来源"
            options={EVENT_SOURCE_OPTIONS}
            value={eventSource}
            onChange={(value) => {
              setPage(1);
              setEventSource(value);
            }}
            className="npcink-v3-filter"
          />
          <Select
            allowClear
            placeholder="类型"
            options={EVENT_TYPE_OPTIONS}
            value={eventType}
            onChange={(value) => {
              setPage(1);
              setEventType(value);
            }}
            className="npcink-v3-filter"
          />
        </div>
      </div>
      <Table
        rowKey="id"
        size="middle"
        columns={columns}
        dataSource={events}
        loading={eventsQuery.isLoading || eventsQuery.isFetching}
        scroll={{ x: 1100 }}
        expandable={{
          expandedRowRender: (event) => renderJsonBlock(event.payload),
        }}
        pagination={{
          current: page,
          pageSize,
          total: pagination?.totalItems || 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条变更记录`,
        }}
        onChange={(nextPagination) => {
          setPage(nextPagination.current || 1);
          setPageSize(nextPagination.pageSize || 20);
        }}
        locale={{ emptyText: <Empty description="暂无变更数据" /> }}
      />
    </div>
  );
};

const HardwareAuditWorkspace = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<string | undefined>();
  const [selectedIssueGroup, setSelectedIssueGroup] = useState<string>("全部");
  const [selectedIssueType, setSelectedIssueType] = useState<string>();
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [showHandledIssues, setShowHandledIssues] = useState(false);
  const [handledIssueKeys, setHandledIssueKeys] = useState<Set<string>>(loadHandledIssueKeys);
  const queryParams = useMemo(
    () => ({ page, pageSize, search, source }),
    [page, pageSize, search, source]
  );
  const observationsQuery = useQuery(
    ["v3-observations", queryParams],
    () => getObservations(queryParams),
    { keepPreviousData: true }
  );
  const auditAssetsQuery = useQuery(
    ["v3-hardware-audit-assets"],
    async () => {
      const first = await getAssets({ page: 1, pageSize: 100, assetScope: "computer" });
      const assets = [...first.data];
      const totalPages = first.pagination.totalPages || 1;
      for (let nextPage = 2; nextPage <= totalPages; nextPage += 1) {
        const next = await getAssets({ page: nextPage, pageSize: 100, assetScope: "computer" });
        assets.push(...next.data);
      }
      return assets;
    },
    { staleTime: 60_000 }
  );
  const observations = observationsQuery.data?.data || [];
  const pagination = observationsQuery.data?.pagination;
  const auditAssets = auditAssetsQuery.data || [];
  const auditTotal = auditAssets.length;
  const auditStatus = countBy(auditAssets, (asset) => statusLabel(asset.status));
  const departmentRows = useMemo(() => {
    const rows = new Map<string, Record<string, number | string>>();
    auditAssets.forEach((asset) => {
      const department = asset.department || "未分配";
      const existing = rows.get(department) || {
        department,
        total: 0,
        active: 0,
        inactive: 0,
        maintenance: 0,
        retired: 0,
        deleted: 0,
      };
      existing.total = Number(existing.total) + 1;
      existing[asset.status] = Number(existing[asset.status] || 0) + 1;
      rows.set(department, existing);
    });
    return Array.from(rows.values()).sort((a, b) => Number(b.total) - Number(a.total)).slice(0, 8);
  }, [auditAssets]);
  const hardwareBuckets = useMemo(() => {
    const gib = 1024 ** 3;
    return {
      memory: countBy(auditAssets, (asset) =>
        bucketLabel(
          hardwareMemoryBytes(asset),
          [
            { max: 8 * gib, label: "小于 8 GB" },
            { max: 16 * gib, label: "8-15 GB" },
            { max: 32 * gib, label: "16-31 GB" },
            { max: 64 * gib, label: "32-63 GB" },
            { max: Number.POSITIVE_INFINITY, label: "64 GB 以上" },
          ],
          "内存未知"
        )
      ),
      disk: countBy(auditAssets, (asset) =>
        bucketLabel(
          hardwareDiskBytes(asset),
          [
            { max: 256 * gib, label: "小于 256 GB" },
            { max: 512 * gib, label: "256-511 GB" },
            { max: 1024 * gib, label: "512 GB-1 TB" },
            { max: Number.POSITIVE_INFINITY, label: "1 TB 以上" },
          ],
          "硬盘未知"
        )
      ),
      cpu: countBy(auditAssets, (asset) => {
        const cpu = String(assetHardwareContext(asset).extracted.cpu || "");
        if (/intel/i.test(cpu)) {
          return "Intel";
        }
        if (/amd/i.test(cpu)) {
          return "AMD";
        }
        if (/apple/i.test(cpu)) {
          return "Apple";
        }
        return cpu ? "其他 CPU" : "CPU 未知";
      }),
    };
  }, [auditAssets]);
  const hardwareIssues = useMemo(() => detectHardwareIssues(auditAssets), [auditAssets]);
  const filteredIssuePool = useMemo(
    () =>
      hardwareIssues.filter((issue) => {
        const groupMatched = selectedIssueGroup === "全部" || issueGroup(issue.type) === selectedIssueGroup;
        const typeMatched = !selectedIssueType || issue.type === selectedIssueType;
        return groupMatched && typeMatched;
      }),
    [hardwareIssues, selectedIssueGroup, selectedIssueType]
  );
  const visibleIssues = useMemo(
    () => filteredIssuePool.filter((issue) => showHandledIssues || !handledIssueKeys.has(issue.key)),
    [filteredIssuePool, handledIssueKeys, showHandledIssues]
  );
  const unresolvedIssues = hardwareIssues.filter((issue) => !handledIssueKeys.has(issue.key));
  const issueCounts = countBy(filteredIssuePool, (issue) => issue.type);
  const issueGroups = useMemo(() => {
    const counts = countBy(hardwareIssues, (issue) => issueGroup(issue.type));
    return [
      { group: "全部", total: hardwareIssues.length, unresolved: unresolvedIssues.length },
      ...sortedEntries(counts).map(([group, total]) => ({
        group,
        total,
        unresolved: hardwareIssues.filter((issue) => issueGroup(issue.type) === group && !handledIssueKeys.has(issue.key)).length,
      })),
    ];
  }, [handledIssueKeys, hardwareIssues, unresolvedIssues.length]);
  const issueRecordMutation = useMutation(
    ({ issue, message: recordMessage }: { issue: HardwareIssue; message: string }) =>
      createAssetEvent(issue.asset.uuid, {
        eventType: "issue_handled",
        message: recordMessage,
        payload: {
          issueKey: issue.key,
          issueType: issue.type,
          issueMessage: issue.message,
        },
      }),
    {
      onSuccess: (_, variables) => {
        setHandledIssueKeys((previous) => {
          const next = new Set(previous);
          next.add(variables.issue.key);
          saveHandledIssueKeys(next);
          return next;
        });
        queryClient.invalidateQueries(["v3-asset-events", variables.issue.asset.uuid]);
        queryClient.invalidateQueries(["v3-events"]);
        message.success("异常已记录为已处理");
      },
    }
  );
  const updateAssetMutation = useMutation(
    ({ uuid, input }: { uuid: string; input: AssetInput }) => updateAsset(uuid, input),
    {
      onSuccess: (asset) => {
        setEditingAsset(null);
        queryClient.invalidateQueries(["v3-hardware-audit-assets"]);
        queryClient.invalidateQueries(["v3-assets"]);
        queryClient.invalidateQueries(["v3-asset", asset.uuid]);
        message.success("资产已更新");
      },
    }
  );

  const markIssueHandled = (issue: HardwareIssue) => {
    const note = window.prompt("处理说明", `已处理：${issue.type} - ${issue.message}`);
    if (!note) {
      return;
    }
    issueRecordMutation.mutate({ issue, message: note });
  };

  const markIssueLocalOnly = (issue: HardwareIssue) => {
    setHandledIssueKeys((previous) => {
      const next = new Set(previous);
      next.add(issue.key);
      saveHandledIssueKeys(next);
      return next;
    });
    message.success("已标记处理");
  };

  const restoreIssue = (issue: HardwareIssue) => {
    setHandledIssueKeys((previous) => {
      const next = new Set(previous);
      next.delete(issue.key);
      saveHandledIssueKeys(next);
      return next;
    });
    message.success("已恢复为未处理");
  };

  const columns: ColumnsType<AssetObservation> = [
    {
      title: "资产",
      render: (_, observation) => (
        <Space direction="vertical" size={2}>
          <Text strong>{assetReferenceLabel(observation.asset)}</Text>
          <Text type="secondary">{observation.asset?.department || "-"}</Text>
        </Space>
      ),
    },
    {
      title: "来源",
      dataIndex: "source",
      width: 120,
      render: (value: string) => <Tag>{optionLabel(OBSERVATION_SOURCE_OPTIONS, value)}</Tag>,
    },
    { title: "采集时间", dataIndex: "observedAt", width: 180, render: formatDate },
    { title: "接收时间", dataIndex: "receivedAt", width: 180, render: formatDate },
    {
      title: "设备摘要",
      dataIndex: "summary",
      render: (summary: JsonRecord) => (
        <Space direction="vertical" size={2}>
          <Text>{fieldText(summary.device_model || summary.hostname)}</Text>
          <Text type="secondary">{compactJson(summary)}</Text>
        </Space>
      ),
    },
  ];

  return (
    <div className="npcink-v3-section">
      <div className="npcink-v3-section-header">
        <div>
          <Title level={3}>硬件盘点</Title>
          <Text type="secondary">按采集快照查看 CPU、内存、硬盘、主板等硬件明细。</Text>
        </div>
        <Tag color="blue">{pagination?.totalItems ?? "-"} 条采集</Tag>
      </div>
      <div className="npcink-v3-audit-summary">
        <div>
          <Text type="secondary">电脑资产</Text>
          <strong>{auditAssetsQuery.isLoading ? "-" : auditTotal}</strong>
          <span>纳入盘点范围</span>
        </div>
        <div>
          <Text type="secondary">在用</Text>
          <strong>{auditStatus["在用"] || 0}</strong>
          <span>{percentText(auditStatus["在用"] || 0, auditTotal)} 占比</span>
        </div>
        <div>
          <Text type="secondary">维护</Text>
          <strong>{auditStatus["维护"] || 0}</strong>
          <span>需跟进设备</span>
        </div>
        <div>
          <Text type="secondary">最近采集</Text>
          <strong>{formatDate(observations[0]?.observedAt)}</strong>
          <span>当前记录列表</span>
        </div>
      </div>
      <div className="npcink-v3-audit-panel">
        <div className="npcink-v3-audit-block">
          <div className="npcink-v3-audit-block-head">
            <Text strong>设备状态</Text>
            <Text type="secondary">按资产状态汇总</Text>
          </div>
          <div className="npcink-v3-bar-list">
            {sortedEntries(auditStatus).map(([label, count]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{count}</strong>
                <div>
                  <i style={{ width: percentText(count, auditTotal) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="npcink-v3-audit-block">
          <div className="npcink-v3-audit-block-head">
            <Text strong>部门状态</Text>
            <Text type="secondary">显示资产最多的部门</Text>
          </div>
          <Table
            rowKey={(row) => String(row.department)}
            size="small"
            pagination={false}
            dataSource={departmentRows}
            loading={auditAssetsQuery.isLoading}
            columns={[
              { title: "部门", dataIndex: "department" },
              { title: "总数", dataIndex: "total", width: 70 },
              { title: "在用", dataIndex: "active", width: 70 },
              { title: "维护", dataIndex: "maintenance", width: 70 },
              { title: "归档", dataIndex: "deleted", width: 70 },
            ]}
            locale={{ emptyText: <Empty description="暂无部门数据" /> }}
          />
        </div>
        <div className="npcink-v3-audit-block is-wide">
          <div className="npcink-v3-audit-block-head">
            <Text strong>硬件概览</Text>
            <Text type="secondary">根据最新采集摘要分布</Text>
          </div>
          <div className="npcink-v3-hardware-buckets">
            {[
              { title: "内存", data: hardwareBuckets.memory },
              { title: "硬盘", data: hardwareBuckets.disk },
              { title: "CPU", data: hardwareBuckets.cpu },
            ].map((group) => (
              <div key={group.title}>
                <Text strong>{group.title}</Text>
                {sortedEntries(group.data).slice(0, 5).map(([label, count]) => (
                  <p key={label}>
                    <span>{label}</span>
                    <strong>{count}</strong>
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="npcink-v3-issue-panel">
        <div className="npcink-v3-issue-head">
          <div>
            <Text strong>异常发现</Text>
            <Text type="secondary">
              当前显示 {visibleIssues.length} 条，未处理 {unresolvedIssues.length} / 全部 {hardwareIssues.length}
            </Text>
          </div>
          <Space wrap>
            <Select
              allowClear
              placeholder="问题类型"
              value={selectedIssueType}
              onChange={setSelectedIssueType}
              className="npcink-v3-filter"
              options={sortedEntries(issueCounts).map(([label, count]) => ({
                label: `${label} ${count}`,
                value: label,
              }))}
            />
            <Checkbox
              checked={showHandledIssues}
              onChange={(event) => setShowHandledIssues(event.target.checked)}
            >
              显示已处理
            </Checkbox>
            <Button
              onClick={() =>
                downloadTextFile(`hardware-issues-${Date.now()}.csv`, issuesToCsv(hardwareIssues, handledIssueKeys))
              }
            >
              导出异常
            </Button>
          </Space>
        </div>
        <div className="npcink-v3-issue-groups">
          {issueGroups.map((item) => (
            <button
              key={item.group}
              type="button"
              className={selectedIssueGroup === item.group ? "is-active" : ""}
              onClick={() => {
                setSelectedIssueGroup(item.group);
                setSelectedIssueType(undefined);
              }}
            >
              <span>{item.group}</span>
              <strong>{item.unresolved}</strong>
              <em>全部 {item.total}</em>
            </button>
          ))}
        </div>
        <Table
          rowKey="key"
          size="small"
          pagination={{ pageSize: 6, showSizeChanger: false }}
          dataSource={visibleIssues}
          loading={auditAssetsQuery.isLoading || issueRecordMutation.isLoading}
          columns={[
            {
              title: "状态",
              width: 86,
              render: (_, issue) => (
                <Tag color={handledIssueKeys.has(issue.key) ? "green" : "default"}>
                  {handledIssueKeys.has(issue.key) ? "已处理" : "未处理"}
                </Tag>
              ),
            },
            {
              title: "级别",
              dataIndex: "level",
              width: 90,
              render: (level: string) => (
                <Tag color={level === "error" ? "red" : level === "warning" ? "orange" : "blue"}>
                  {level === "error" ? "高" : level === "warning" ? "中" : "低"}
                </Tag>
              ),
            },
            {
              title: "类型",
              dataIndex: "type",
              width: 140,
              render: (type: string) => (
                <Space direction="vertical" size={2}>
                  <Text>{type}</Text>
                  <Text type="secondary">{issueGroup(type)}</Text>
                </Space>
              ),
            },
            {
              title: "资产",
              width: 180,
              render: (_, issue) => (
                <Space direction="vertical" size={2}>
                  <Text strong>{issue.asset.assetNumber || issue.asset.name || issue.asset.uuid}</Text>
                  <Text type="secondary">{[issue.asset.ownerName, issue.asset.department].filter(Boolean).join(" / ") || "-"}</Text>
                </Space>
              ),
            },
            { title: "说明", dataIndex: "message", width: 260 },
            {
              title: "操作",
              width: 250,
              render: (_, issue) => (
                <Space>
                  <Button
                    size="small"
                    type="link"
                    className="npcink-v3-link"
                    onClick={() => setSelectedUuid(issue.asset.uuid)}
                  >
                    查看资产
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    className="npcink-v3-link"
                    disabled={handledIssueKeys.has(issue.key)}
                    onClick={() => markIssueHandled(issue)}
                  >
                    记录处理
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    className="npcink-v3-link"
                    disabled={handledIssueKeys.has(issue.key)}
                    onClick={() => markIssueLocalOnly(issue)}
                  >
                    标记
                  </Button>
                  {handledIssueKeys.has(issue.key) ? (
                    <Button
                      size="small"
                      type="link"
                      className="npcink-v3-link"
                      onClick={() => restoreIssue(issue)}
                    >
                      恢复
                    </Button>
                  ) : null}
                </Space>
              ),
            },
          ]}
          scroll={{ x: 1000 }}
          locale={{ emptyText: <Empty description="暂无异常发现" /> }}
        />
      </div>
      <div className="npcink-v3-toolbar-shell">
        <div className="npcink-v3-toolbar-title">
          <Text strong>采集记录</Text>
          <Text type="secondary">展开行可查看硬件和原始数据</Text>
        </div>
        <div className="npcink-v3-toolbar">
          <Input.Search
            allowClear
            placeholder="搜索资产、部门或摘要"
            onSearch={(value) => {
              setPage(1);
              setSearch(value);
            }}
            className="npcink-v3-search"
          />
          <Select
            allowClear
            placeholder="来源"
            options={OBSERVATION_SOURCE_OPTIONS}
            value={source}
            onChange={(value) => {
              setPage(1);
              setSource(value);
            }}
            className="npcink-v3-filter"
          />
        </div>
      </div>
      <Table
        rowKey="id"
        size="middle"
        columns={columns}
        dataSource={observations}
        loading={observationsQuery.isLoading || observationsQuery.isFetching}
        scroll={{ x: 980 }}
        expandable={{
          expandedRowRender: (observation) => (
            <Collapse
              size="small"
              items={[
                {
                  key: "hardware",
                  label: "硬件明细",
                  children: renderJsonBlock(observation.hardware),
                },
                {
                  key: "raw",
                  label: "原始数据",
                  children: renderJsonBlock(observation.raw),
                },
              ]}
            />
          ),
        }}
        pagination={{
          current: page,
          pageSize,
          total: pagination?.totalItems || 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条采集记录`,
        }}
        onChange={(nextPagination) => {
          setPage(nextPagination.current || 1);
          setPageSize(nextPagination.pageSize || 20);
        }}
        locale={{ emptyText: <Empty description="暂无硬件采集数据" /> }}
      />
      <DetailDrawer
        uuid={selectedUuid}
        open={Boolean(selectedUuid)}
        onClose={() => setSelectedUuid(null)}
        onEdit={(asset) => setEditingAsset(asset)}
        onArchive={() => {
          queryClient.invalidateQueries(["v3-hardware-audit-assets"]);
          queryClient.invalidateQueries(["v3-assets"]);
        }}
      />
      <AssetFormModal
        asset={editingAsset}
        open={Boolean(editingAsset)}
        onClose={() => setEditingAsset(null)}
        onSubmit={async (input) => {
          if (!editingAsset) {
            return;
          }
          await updateAssetMutation.mutateAsync({ uuid: editingAsset.uuid, input });
        }}
      />
    </div>
  );
};

const SettingsWorkspace = () => {
  const [form] = Form.useForm<InventorySettings>();
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const settingsQuery = useQuery(["v3-settings"], getSettings);
  const settingsMutation = useMutation(updateSettings, {
    onSuccess: (settings) => {
      queryClient.setQueryData(["v3-settings"], settings);
      message.success("设置已保存");
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      form.setFieldsValue(settingsQuery.data);
    }
  }, [form, settingsQuery.data]);

  return (
    <div className="npcink-v3-section">
      <div className="npcink-v3-section-header">
        <div>
          <Title level={3}>设置</Title>
          <Text type="secondary">管理公开查询、资产编号和采集客户端授权。</Text>
        </div>
        <Button onClick={() => setTokenModalOpen(true)}>客户端令牌</Button>
      </div>
      <div className="npcink-v3-settings-panel">
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => settingsMutation.mutate(values)}
        >
          <Form.Item
            name="publicQueryEnabled"
            label="公开查询"
            valuePropName="checked"
            extra="启用后，已授权的公开查询入口可以读取允许展示的设备信息。"
          >
            <Switch checkedChildren="启用" unCheckedChildren="关闭" />
          </Form.Item>
          <Form.Item
            name="assetNumberPrefix"
            label="资产编号前缀"
            extra="仅允许字母、数字、下划线和短横线；新建资产自动编号时使用。"
          >
            <Input placeholder="例如：A" />
          </Form.Item>
          <Form.Item
            name="observationRetentionDays"
            label="采集记录保留天数"
            extra="0 表示不按天数自动清理。"
          >
            <InputNumber min={0} precision={0} className="npcink-v3-number" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={settingsMutation.isLoading}>
            保存设置
          </Button>
        </Form>
      </div>
      <TokenModal open={tokenModalOpen} onClose={() => setTokenModalOpen(false)} />
    </div>
  );
};

interface AssetCardProps {
  asset: Asset;
  onOpen: () => void;
  selectable?: boolean;
  selected?: boolean;
  compact?: boolean;
  onSelect?: () => void;
}

const AssetCard = ({
  asset,
  onOpen,
  selectable = false,
  selected = false,
  compact = false,
  onSelect,
}: AssetCardProps) => {
  const { summary, importedHardware, extracted } = assetHardwareContext(asset);
  const title = asset.ownerName || asset.name || "未命名资产";
  const isPc = asset.assetType === "pc" || asset.assetType === "computer";
  const handleOpen = () => {
    if (selectable) {
      onSelect?.();
      return;
    }
    onOpen();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`npcink-v3-asset-card${selected ? " is-selected" : ""}${compact ? " is-compact" : ""}`}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpen();
        }
      }}
    >
      {selectable ? (
        <div className="npcink-v3-card-check" onClick={(event) => event.stopPropagation()}>
          <Checkbox checked={selected} onChange={() => onSelect?.()} />
        </div>
      ) : null}
      <div className="npcink-v3-asset-card-brand">
        {isPc ? (
          <div className="npcink-v3-card-os-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        ) : (
          <div className="npcink-v3-card-type-mark">{assetTypeLabel(asset.assetType).slice(0, 1)}</div>
        )}
        <strong>{isPc ? extracted.platform || "Windows" : assetTypeLabel(asset.assetType)}</strong>
      </div>
      <div className="npcink-v3-asset-card-body">
        <h3>{title}</h3>
        <p>{fieldText(extracted.baseboard || extracted.deviceModel)}</p>
        <p>{fieldText(extracted.cpu)}</p>
        <p>{fieldText(extracted.graphics)}</p>
        <dl>
          <div>
            <dt>配置：</dt>
            <dd>{formatMemoryDiskText(summary, importedHardware)}</dd>
          </div>
          <div>
            <dt>编号：</dt>
            <dd>{asset.assetNumber || "-"}</dd>
          </div>
          <div>
            <dt>状态：</dt>
            <dd>{statusLabel(asset.status)}</dd>
          </div>
          <div>
            <dt>部门：</dt>
            <dd>{asset.department || "-"}</dd>
          </div>
          <div>
            <dt>IP：</dt>
            <dd>{extracted.primaryIp || "-"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

interface AssetWorkspaceProps {
  initialScope?: AssetScope;
  title?: string;
}

const AssetWorkspace = ({ initialScope = "computer", title }: AssetWorkspaceProps) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [assetScope, setAssetScope] = useState<AssetScope>(initialScope);
  const [assetType, setAssetType] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [compactCards, setCompactCards] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedUuids, setSelectedUuids] = useState<Set<string>>(new Set());
  const [savedFilters, setSavedFilters] = useState<SavedAssetFilter[]>(loadSavedFilters);
  const queryParams = useMemo(
    () => ({
      page,
      pageSize,
      search,
      assetScope,
      assetType: assetScope === "computer" ? undefined : assetType,
      status,
    }),
    [assetScope, assetType, page, pageSize, search, status]
  );
  const assetsQuery = useQuery(["v3-assets", queryParams], () => getAssets(queryParams), {
    keepPreviousData: true,
  });

  useEffect(() => {
    setSelectedUuids(new Set());
  }, [assetScope, assetType, page, pageSize, search, status]);

  useEffect(() => {
    if (!batchMode) {
      setSelectedUuids(new Set());
    }
  }, [batchMode]);

  const createMutation = useMutation(createAsset, {
    onSuccess: (asset) => {
      setAssetModalOpen(false);
      setEditingAsset(null);
      setSelectedUuid(asset.uuid);
      queryClient.invalidateQueries(["v3-assets"]);
      message.success("资产已创建");
    },
  });
  const updateMutation = useMutation(
    ({ uuid, input }: { uuid: string; input: AssetInput }) => updateAsset(uuid, input),
    {
      onSuccess: (asset) => {
        setAssetModalOpen(false);
        setEditingAsset(null);
        setSelectedUuid(asset.uuid);
        queryClient.invalidateQueries(["v3-assets"]);
        queryClient.invalidateQueries(["v3-asset", asset.uuid]);
        queryClient.invalidateQueries(["v3-asset-events", asset.uuid]);
        message.success("资产已更新");
      },
    }
  );
  const archiveMutation = useMutation(archiveAsset, {
    onSuccess: (asset) => {
      queryClient.invalidateQueries(["v3-assets"]);
      queryClient.invalidateQueries(["v3-asset", asset.uuid]);
      queryClient.invalidateQueries(["v3-asset-events", asset.uuid]);
      message.success("资产已归档");
    },
  });
  const batchArchiveMutation = useMutation(
    async (uuids: string[]) => {
      await Promise.all(uuids.map((uuid) => archiveAsset(uuid)));
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["v3-assets"]);
        setSelectedUuids(new Set());
        setBatchMode(false);
        message.success("已归档所选资产");
      },
    }
  );
  const batchUpdateMutation = useMutation(
    async ({ targets, input }: { targets: Asset[]; input: AssetInput }) => {
      const changedTargets = targets
        .map((asset) => ({ asset, changes: bulkUpdateChanges(asset, input) }))
        .filter((item) => item.changes.length > 0);

      if (!changedTargets.length) {
        message.warning("没有字段发生变化");
        return 0;
      }

      for (const { asset, changes } of changedTargets) {
        await updateAsset(asset.uuid, input);
        await createAssetEvent(asset.uuid, {
          eventType: "bulk_updated",
          message: `批量修改：${changes.map((change) => change.label).join("、")}`,
          payload: {
            source: "asset_batch_edit",
            changedFields: changes,
            selectedCount: targets.length,
          },
        });
      }
      return changedTargets.length;
    },
    {
      onSuccess: (changedCount) => {
        if (changedCount === 0) {
          return;
        }
        queryClient.invalidateQueries(["v3-assets"]);
        queryClient.invalidateQueries(["v3-events"]);
        setBulkModalOpen(false);
        setSelectedUuids(new Set());
        setBatchMode(false);
        message.success(`已批量修改 ${changedCount} 条资产并写入变更记录`);
      },
    }
  );

  const assets = assetsQuery.data?.data || [];
  const pagination = assetsQuery.data?.pagination;
  const selectedCount = selectedUuids.size;
  const allSelected = assets.length > 0 && assets.every((asset) => selectedUuids.has(asset.uuid));
  const activeCount = countStatus(assets, "active");
  const maintenanceCount = countStatus(assets, "maintenance");
  const activeScopeLabel =
    title || ASSET_SCOPE_OPTIONS.find((item) => item.value === assetScope)?.label || "资产";

  const toggleSelect = (uuid: string) => {
    setSelectedUuids((previous) => {
      const next = new Set(previous);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedUuids(new Set());
      return;
    }
    setSelectedUuids(new Set(assets.map((asset) => asset.uuid)));
  };

  const selectedAssets = assets.filter((asset) => selectedUuids.has(asset.uuid));

  const applySavedFilter = (id: string) => {
    const filter = savedFilters.find((item) => item.id === id);
    if (!filter) {
      return;
    }
    setAssetScope(filter.assetScope);
    setAssetType(filter.assetType);
    setStatus(filter.status);
    setSearch(filter.search || "");
    setPage(1);
  };

  const saveCurrentFilter = () => {
    const name = window.prompt("筛选名称", activeScopeLabel);
    if (!name) {
      return;
    }
    const next = [
      ...savedFilters.filter((item) => item.name !== name),
      {
        id: `${Date.now()}`,
        name,
        assetScope,
        assetType,
        status,
        search,
      },
    ];
    setSavedFilters(next);
    saveFilters(next);
    message.success("筛选已保存");
  };

  const exportCurrentFilter = async () => {
    const first = await getAssets({ ...queryParams, page: 1, pageSize: 100 });
    const allAssets = [...first.data];
    for (let nextPage = 2; nextPage <= (first.pagination.totalPages || 1); nextPage += 1) {
      const next = await getAssets({ ...queryParams, page: nextPage, pageSize: 100 });
      allAssets.push(...next.data);
    }
    downloadTextFile(`assets-${Date.now()}.csv`, assetsToCsv(allAssets));
    message.success(`已导出 ${allAssets.length} 条资产`);
  };

  const columns: ColumnsType<Asset> = [
    {
      title: "资产编号",
      dataIndex: "assetNumber",
      width: 170,
      render: (value: string) => <Text code>{value || "-"}</Text>,
    },
    {
      title: "资产名称",
      dataIndex: "name",
      render: (value: string, asset) => (
        <Button
          type="link"
          className="npcink-v3-link"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedUuid(asset.uuid);
          }}
        >
          {value || "未命名资产"}
        </Button>
      ),
    },
    {
      title: "类型",
      dataIndex: "assetType",
      width: 120,
      render: assetTypeLabel,
    },
    { title: "使用人", dataIndex: "ownerName", width: 120, render: (value) => value || "-" },
    { title: "部门", dataIndex: "department", width: 140, render: (value) => value || "-" },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (value: string) => (
        <Tag color={statusColor[value] || "default"}>{statusLabel(value)}</Tag>
      ),
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      width: 180,
      render: formatDate,
    },
    {
      title: "操作",
      width: 96,
      render: (_, asset) => (
        <Button
          type="link"
          className="npcink-v3-link"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedUuid(asset.uuid);
          }}
        >
          查看
        </Button>
      ),
    },
  ];

  const submitAsset = async (values: AssetInput) => {
    if (editingAsset) {
      await updateMutation.mutateAsync({ uuid: editingAsset.uuid, input: values });
      return;
    }
    await createMutation.mutateAsync(values);
  };

  const openCreateModal = () => {
    setEditingAsset(null);
    setAssetModalOpen(true);
  };

  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetModalOpen(true);
  };

  const confirmArchive = (asset: Asset) => {
    Modal.confirm({
      title: "归档这台资产？",
      content: `${asset.assetNumber || asset.uuid} 将被标记为已归档，不会物理删除。`,
      okText: "归档",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: () => archiveMutation.mutateAsync(asset.uuid),
    });
  };

  const confirmBatchArchive = () => {
    if (selectedCount === 0) {
      message.warning("请先选择要归档的资产");
      return;
    }
    const targets = Array.from(selectedUuids);
    Modal.confirm({
      title: "归档所选资产？",
      content: `已选 ${selectedCount} 条资产记录，将统一标记为已归档，不会物理删除。`,
      okText: "归档",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: () => batchArchiveMutation.mutateAsync(targets),
    });
  };

  const handleTableChange = (nextPagination: TablePaginationConfig) => {
    setPage(nextPagination.current || 1);
    setPageSize(nextPagination.pageSize || 20);
  };

  return (
    <div className="npcink-v3-section">
      <div className="npcink-v3-toolbar-shell is-plain">
        <div className="npcink-v3-toolbar-title">
          <Text strong>{activeScopeLabel}</Text>
          <Text type="secondary">
            共 {pagination?.totalItems ?? "-"} 条，当前页在用 {activeCount}，维护 {maintenanceCount}
          </Text>
        </div>
        <div className="npcink-v3-toolbar">
          {assetScope !== "computer" ? (
            <Select
              allowClear
              placeholder="资产类型"
              options={ASSET_TYPES.filter((item) =>
                assetScope === "other" ? item.value !== "pc" && item.value !== "computer" : true
              )}
              value={assetType}
              onChange={(value) => {
                setPage(1);
                setAssetType(value);
              }}
              className="npcink-v3-filter"
            />
          ) : null}
          <Select
            allowClear
            placeholder="状态"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(value) => {
              setPage(1);
              setStatus(value);
            }}
            className="npcink-v3-filter"
          />
          <Input.Search
            allowClear
            value={search}
            placeholder="搜索编号、名称、使用人、部门"
            onChange={(event) => setSearch(event.target.value)}
            onSearch={(value) => {
              setPage(1);
              setSearch(value);
            }}
            className="npcink-v3-search"
          />
          <Space.Compact>
            <Button
              type={viewMode === "card" ? "primary" : "default"}
              onClick={() => setViewMode("card")}
            >
              卡片
            </Button>
            <Button
              type={viewMode === "table" ? "primary" : "default"}
              onClick={() => setViewMode("table")}
            >
              列表
            </Button>
          </Space.Compact>
          <Button onClick={() => queryClient.invalidateQueries(["v3-assets"])}>
            刷新
          </Button>
          <Dropdown
            menu={{
              items: [
                { key: "create", label: "新增资产" },
                { key: "import", label: "导入旧数据" },
                { key: "export", label: "导出筛选" },
                { key: "tokens", label: "客户端令牌" },
                { key: "save-filter", label: "保存筛选" },
                { key: "batch", label: batchMode ? "退出批量模式" : "批量模式" },
                ...(viewMode === "card"
                  ? [{ key: "compact", label: compactCards ? "舒展卡片" : "紧凑卡片" }]
                  : []),
                ...savedFilters.map((filter) => ({
                  key: `filter:${filter.id}`,
                  label: `筛选：${filter.name}`,
                })),
              ],
              onClick: ({ key }) => {
                if (key === "create") {
                  openCreateModal();
                } else if (key === "import") {
                  setImportModalOpen(true);
                } else if (key === "export") {
                  exportCurrentFilter();
                } else if (key === "tokens") {
                  setTokenModalOpen(true);
                } else if (key === "save-filter") {
                  saveCurrentFilter();
                } else if (key === "batch") {
                  setBatchMode((value) => !value);
                } else if (key === "compact") {
                  setCompactCards((value) => !value);
                } else if (key.startsWith("filter:")) {
                  applySavedFilter(key.replace("filter:", ""));
                }
              },
            }}
          >
            <Button>更多操作</Button>
          </Dropdown>
        </div>
      </div>
      {batchMode ? (
        <div className="npcink-v3-batch-actions">
          <Space wrap>
            <Text type="secondary">已选 {selectedCount} 条</Text>
            <Button onClick={toggleSelectAll} disabled={!assets.length}>
              {allSelected ? "取消全选" : "全选当前页"}
            </Button>
            <Button
              danger
              disabled={selectedCount === 0}
              loading={batchArchiveMutation.isLoading}
              onClick={confirmBatchArchive}
            >
              归档已选
            </Button>
            <Button disabled={selectedCount === 0} onClick={() => setBulkModalOpen(true)}>
              批量修改
            </Button>
            <Button onClick={() => setBatchMode(false)}>退出批量</Button>
          </Space>
        </div>
      ) : null}

      {viewMode === "card" ? (
        <div className="npcink-v3-card-surface">
          {assetsQuery.isLoading || assetsQuery.isFetching ? (
            <Table loading pagination={false} showHeader={false} />
          ) : assets.length ? (
            <div className="npcink-v3-card-grid">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.uuid}
                  asset={asset}
                  onOpen={() => setSelectedUuid(asset.uuid)}
                  selectable={batchMode}
                  selected={selectedUuids.has(asset.uuid)}
                  compact={compactCards}
                  onSelect={() => toggleSelect(asset.uuid)}
                />
              ))}
            </div>
          ) : (
            <Empty description="暂无资产" />
          )}
          <div className="npcink-v3-card-pagination">
            <Text type="secondary">共 {pagination?.totalItems || 0} 条资产</Text>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={pagination?.totalItems || 0}
              showSizeChanger
              onChange={(nextPage, nextPageSize) => {
                setPage(nextPage);
                setPageSize(nextPageSize);
              }}
            />
          </div>
        </div>
      ) : (
        <Table
          rowKey="uuid"
          size="middle"
          columns={columns}
          dataSource={assets}
          loading={assetsQuery.isLoading || assetsQuery.isFetching}
          onChange={handleTableChange}
          rowSelection={
            batchMode
              ? {
                  selectedRowKeys: Array.from(selectedUuids),
                  onChange: (keys) => setSelectedUuids(new Set(keys.map(String))),
                }
              : undefined
          }
          onRow={(asset) => ({
            onClick: () => {
              if (batchMode) {
                toggleSelect(asset.uuid);
                return;
              }
              setSelectedUuid(asset.uuid);
            },
          })}
          scroll={{ x: 980 }}
          pagination={{
            current: page,
            pageSize,
            total: pagination?.totalItems || 0,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条资产`,
          }}
          locale={{ emptyText: <Empty description="暂无资产" /> }}
        />
      )}

      <DetailDrawer
        uuid={selectedUuid}
        open={Boolean(selectedUuid)}
        onClose={() => setSelectedUuid(null)}
        onEdit={openEditModal}
        onArchive={confirmArchive}
      />
      <AssetFormModal
        asset={editingAsset}
        open={assetModalOpen}
        onClose={() => setAssetModalOpen(false)}
        onSubmit={submitAsset}
      />
      <LegacyImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImported={() => queryClient.invalidateQueries(["v3-assets"])}
      />
      <BulkEditModal
        open={bulkModalOpen}
        count={selectedCount}
        loading={batchUpdateMutation.isLoading}
        onClose={() => setBulkModalOpen(false)}
        onSubmit={async (input) => {
          await batchUpdateMutation.mutateAsync({ targets: selectedAssets, input });
        }}
      />
      <TokenModal open={tokenModalOpen} onClose={() => setTokenModalOpen(false)} />
    </div>
  );
};

const InventoryAdmin = () => {
  return (
    <div className="npcink-v3-app">
      <Tabs
        defaultActiveKey="computer"
        className="npcink-v3-workspace-tabs"
        items={[
          {
            key: "computer",
            label: "电脑设备",
            children: <AssetWorkspace initialScope="computer" title="电脑资产" />,
          },
          {
            key: "custom",
            label: "自定义设备",
            children: <AssetWorkspace initialScope="other" title="自定义资产" />,
          },
          {
            key: "events",
            label: "变更数据",
            children: <ChangeWorkspace />,
          },
          {
            key: "hardware",
            label: "硬件盘点",
            children: <HardwareAuditWorkspace />,
          },
          {
            key: "settings",
            label: "设置",
            children: <SettingsWorkspace />,
          },
        ]}
      />
    </div>
  );
};

export default InventoryAdmin;
