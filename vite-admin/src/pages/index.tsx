import { Fragment, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Checkbox,
  Collapse,
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
import { RestUrl, Site } from "@/utils/index";
import {
  archiveAsset,
  createAsset,
  createAssetEvent,
  createClientToken,
  createPublicQueryPage,
  deleteClientToken,
  getAsset,
  getAssetEvents,
  getAssetIdentities,
  getAssetObservations,
  getAssets,
  getClientTokenPackageConfig,
  getEvents,
  getSettings,
  updateClientToken,
  updateSettings,
  updateAsset,
} from "@/services/v3";
import type {
  Asset,
  AssetEvent,
  AssetEventInput,
  AssetIdentity,
  AssetInput,
  AssetListParams,
  AssetReference,
  AssetObservation,
  ClientToken,
  CreatedClientToken,
  InventorySettings,
  JsonRecord,
} from "@/type/v3";
import {
  assetHardwareContext,
  detectHardwareIssues,
  firstText,
  formatBytes,
  getArray,
  getRecord,
  hardwareDiskBytes,
  hardwareMemoryBytes,
  hardwareSummary,
  issueGroup,
  toNumber,
  type HardwareIssue,
} from "@/utils/hardwareAudit";

const { Text, Title } = Typography;

const ASSET_TYPES = [
  { label: "电脑", value: "pc" },
  { label: "通用电脑", value: "computer" },
  { label: "网络设备", value: "network" },
  { label: "办公设备", value: "office" },
  { label: "自定义", value: "custom" },
];

const DEFAULT_CUSTOM_CATEGORIES = ["显卡", "手机", "机房设备", "网络设备", "办公设备"];

const CUSTOM_PURCHASE_PLATFORM_OPTIONS = [
  { label: "京东", value: "京东|JingDong" },
  { label: "淘宝", value: "淘宝|TaoBao" },
  { label: "闲鱼", value: "闲鱼" },
  { label: "微信", value: "微信" },
  { label: "其他", value: "About" },
];

const STATUS_OPTIONS = [
  { label: "在用", value: "active" },
  { label: "停用", value: "inactive" },
  { label: "维护", value: "maintenance" },
  { label: "退役", value: "retired" },
  { label: "已归档", value: "deleted" },
];

const EVENT_TYPE_OPTIONS = [
  { label: "创建", value: "created" },
  { label: "更新", value: "updated" },
  { label: "批量修改", value: "bulk_updated" },
  { label: "字段变更", value: "field_changed" },
  { label: "采集接收", value: "observation_received" },
  { label: "删除/归档", value: "deleted" },
];

const MANUAL_RECORD_OPTIONS = [
  { label: "备注", value: "note" },
  { label: "维修", value: "maintenance" },
  { label: "借用", value: "borrowed" },
  { label: "归还", value: "returned" },
  { label: "转移", value: "transferred" },
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
  category?: string;
  purchasePlatform?: string;
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

const formatMemoryDiskText = (summary: JsonRecord, importedHardware?: JsonRecord) => {
  const memory = formatBytes(summary.memory_bytes);
  const disk = formatBytes(summary.disk_bytes);
  const importedMemory = fieldText(importedHardware?.memory);
  const importedDisk = fieldText(importedHardware?.disk);
  return `${memory !== "-" ? memory : importedMemory} / ${disk !== "-" ? disk : importedDisk}`;
};

const cpuVendorLabel = (cpu: unknown) => {
  const text = String(cpu || "");
  if (/amd|ryzen|threadripper/i.test(text)) {
    return "AMD";
  }
  if (/intel|core|celeron|pentium|xeon/i.test(text)) {
    return "Intel";
  }
  if (/apple|m[1-9]\b/i.test(text)) {
    return "Apple";
  }
  return text;
};

const formatHardwareHeroText = (
  cpu: unknown,
  summary: JsonRecord,
  importedHardware: JsonRecord,
  fallback: string
) => {
  const memoryDisk = formatMemoryDiskText(summary, importedHardware);
  const vendor = cpuVendorLabel(cpu);
  if (vendor && memoryDisk !== "- / -") {
    return `${vendor} / ${memoryDisk}`;
  }
  if (memoryDisk !== "- / -") {
    return memoryDisk;
  }
  return vendor || fallback;
};

const countStatus = (assets: Asset[], status: string) =>
  assets.filter((asset) => asset.status === status).length;

const fetchAllAssets = async (params: Omit<AssetListParams, "page" | "pageSize"> = {}) => {
  const first = await getAssets({ ...params, page: 1, pageSize: 100 });
  const assets = [...first.data];
  const totalPages = first.pagination.totalPages || 1;
  for (let nextPage = 2; nextPage <= totalPages; nextPage += 1) {
    const next = await getAssets({ ...params, page: nextPage, pageSize: 100 });
    assets.push(...next.data);
  }
  return assets;
};

const bucketLabel = (value: unknown, buckets: { max: number; label: string }[], fallback: string) => {
  const number = toNumber(value);
  if (number <= 0) {
    return fallback;
  }
  return buckets.find((bucket) => number < bucket.max)?.label || buckets[buckets.length - 1]?.label || fallback;
};

const hardwareArray = (asset: Asset, primary: string, fallbackA: string, fallbackB: string) => {
  const hardware = assetHardwareContext(asset).hardware;
  const primaryItems = getArray(hardware[primary]);
  if (primaryItems.length) {
    return primaryItems.map(getRecord);
  }
  const fallbackAItems = getArray(hardware[fallbackA]);
  if (fallbackAItems.length) {
    return fallbackAItems.map(getRecord);
  }
  return getArray(hardware[fallbackB]).map(getRecord);
};

const hardwareModelLabel = (value: unknown, fallback: string) => {
  const text = fieldText(value).replace(/\s+/g, " ").trim();
  if (!text || text === "-") {
    return fallback;
  }
  return text;
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

const parseJsonRecord = (value: unknown): JsonRecord => {
  if (!value) {
    return {};
  }
  if (typeof value === "string") {
    try {
      return getRecord(JSON.parse(value));
    } catch {
      return {};
    }
  }
  return getRecord(value);
};

const legacyRawRecord = (asset: Asset | null): JsonRecord => {
  const legacy = getRecord(getRecord(asset?.metadata).legacy);
  const raw = getRecord(legacy.raw);
  return Object.keys(raw).length ? raw : legacy;
};

const legacyOrderRecord = (asset: Asset | null): JsonRecord => {
  const purchase = getRecord(getRecord(asset?.metadata).purchase);
  if (Object.keys(purchase).length) {
    return purchase;
  }
  const raw = legacyRawRecord(asset);
  return parseJsonRecord(raw.data);
};

const isComputerAsset = (asset?: Asset | null) =>
  asset?.assetType === "pc" || asset?.assetType === "computer";

const plainMoneyText = (value: unknown) => {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) {
    return "-";
  }
  return `${new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(number)} 元`;
};

const customAssetInfo = (asset: Asset) => {
  const raw = legacyRawRecord(asset);
  const order = legacyOrderRecord(asset);
  const quantity = firstText(order.numbers, order.quantity, order.count);
  const total = firstText(order.total, asset.purchasePrice);
  return {
    title: firstText(order.title, asset.name, raw.name, asset.assetNumber, "未命名资产"),
    usage: firstText(asset.ownerName, raw.name),
    number: firstText(asset.assetNumber, raw.number),
    category: firstText(asset.category, raw.category, assetTypeLabel(asset.assetType)),
    purpose: firstText(raw.purpose, getRecord(asset.metadata).purpose, order.purpose),
    status: firstText(raw.state, statusLabel(asset.status)),
    createdAt: firstText(raw.created_at, asset.createdAt),
    purchaser: firstText(order.purchaser),
    quantity,
    total,
    platform: firstText(order.platform),
    orderNo: firstText(order.order),
    orderTime: firstText(order.order_time),
    payMethod: firstText(order.pay_method),
    shopName: firstText(order.shop_name),
    link: firstText(order.link),
    priceText: plainMoneyText(total),
    quantityText: quantity || "-",
  };
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
  const order = parseJsonRecord(row.data);
  const isCustomLegacyAsset = Boolean(category && !cpu && !memory);
  const legacyPurchasePrice =
    Number(pickLegacyValue(row, LEGACY_IMPORT_FIELDS.find((field) => field.value === "purchasePrice")?.aliases || []) || 0) ||
    Number(order.total || 0);
  return {
    assetType: isCustomLegacyAsset ? "custom" : "pc",
    assetNumber,
    name: isCustomLegacyAsset
      ? firstText(order.title, name, assetNumber, "旧数据资产")
      : name || ownerName || parsedHardware.deviceModel || assetNumber || "旧数据资产",
    ownerName: isCustomLegacyAsset ? firstText(ownerName, name) : ownerName,
    department,
    status: mapLegacyStatus(status),
    category,
    purchasePrice: legacyPurchasePrice,
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

type AnalysisViewMode = "chart" | "table";

interface AnalysisBarDatum {
  key: string;
  label: string;
  value: number;
  valueText?: string;
  caption?: string;
  accent?: string;
}

const ViewModeToggle = ({
  value,
  onChange,
}: {
  value: AnalysisViewMode;
  onChange: (value: AnalysisViewMode) => void;
}) => (
  <div className="npcink-v3-view-toggle" role="group" aria-label="视图切换">
    <button
      type="button"
      className={value === "chart" ? "is-active" : ""}
      aria-pressed={value === "chart"}
      onClick={() => onChange("chart")}
    >
      图表
    </button>
    <button
      type="button"
      className={value === "table" ? "is-active" : ""}
      aria-pressed={value === "table"}
      onClick={() => onChange("table")}
    >
      表格
    </button>
  </div>
);

const AnalysisBarChart = ({
  rows,
  loading,
  emptyText,
  valueFormatter = (value) => String(value),
}: {
  rows: AnalysisBarDatum[];
  loading?: boolean;
  emptyText: string;
  valueFormatter?: (value: number) => string;
}) => {
  if (loading) {
    return <div className="npcink-v3-chart-placeholder">统计中</div>;
  }
  if (!rows.length) {
    return <Empty description={emptyText} />;
  }
  const maxValue = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="npcink-v3-analysis-bars">
      {rows.map((row) => (
        <div key={row.key} className="npcink-v3-analysis-bar-row">
          <div className="npcink-v3-analysis-bar-head">
            <span>{row.label}</span>
            <strong>{row.valueText || valueFormatter(row.value)}</strong>
          </div>
          <div className="npcink-v3-analysis-bar-track">
            <i
              style={{
                width: `${Math.max(4, Math.round((row.value / maxValue) * 100))}%`,
                background: row.accent,
              }}
            />
          </div>
          {row.caption ? <em>{row.caption}</em> : null}
        </div>
      ))}
    </div>
  );
};

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

const buildClientUploadEndpoint = (input?: string) => {
  const base = (input || RestUrl).trim().replace(/\/+$/, "");
  if (!base) {
    return "/wp-json/npcink-device-inventory/v1/device-observations";
  }
  if (base.endsWith("/device-observations")) {
    return base;
  }
  if (base.endsWith("/npcink-device-inventory/v1")) {
    return `${base}/device-observations`;
  }
  if (base.endsWith("/wp-json")) {
    return `${base}/npcink-device-inventory/v1/device-observations`;
  }
  return `${base}/wp-json/npcink-device-inventory/v1/device-observations`;
};

const buildClientSubmitCommand = (token: CreatedClientToken, uploadEndpoint: string) =>
  `npcink-device-agent submit --site "${uploadEndpoint}" --token "${buildClientTokenValue(token)}" --note "测试电脑"`;

const writeClipboardText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

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

interface FieldSourceRow {
  key: string;
  label: string;
  standard: string;
  imported: string;
  latest: string;
}

interface DetailSpecRow {
  key: string;
  attribute: string;
  value: string;
}

interface DetailSpecSection {
  key: string;
  label: string;
  rows: DetailSpecRow[];
}

const legacyFieldValue = (asset: Asset, field: (typeof LEGACY_IMPORT_FIELDS)[number]["value"]) => {
  const raw = getRecord(getRecord(getRecord(asset.metadata).legacy).raw);
  const aliases = LEGACY_IMPORT_FIELDS.find((item) => item.value === field)?.aliases || [];
  return pickLegacyValue(raw, aliases);
};

const detailRow = (key: string, attribute: string, value: unknown): DetailSpecRow | null => {
  const text = fieldText(value);
  return text === "-" ? null : { key, attribute, value: text };
};

const detailRows = (...rows: Array<DetailSpecRow | null>) => rows.filter(Boolean) as DetailSpecRow[];

const formatFrequency = (value: unknown) => {
  const number = toNumber(value);
  if (number <= 0) {
    return fieldText(value);
  }
  if (number >= 1000) {
    return `${Number((number / 1000).toFixed(2))} GHz`;
  }
  return `${number} MHz`;
};

const formatCount = (value: unknown) => {
  const number = toNumber(value);
  if (number <= 0 && value !== 0) {
    return fieldText(value);
  }
  return `${number} 个`;
};

const hardwareDetailSections = (
  asset: Asset,
  context: ReturnType<typeof assetHardwareContext>
): DetailSpecSection[] => {
  const hardware = context.hardware;
  const summary = context.summary;
  const cpu = getRecord(hardware.cpu);
  const graphics = getRecord(hardware.graphics);
  const controllers = getArray(graphics.controllers);
  const displays = getArray(graphics.displays);
  const baseboard = getRecord(hardware.baseboard);
  const bios = getRecord(hardware.bios);
  const os = getRecord(hardware.os);
  const system = getRecord(hardware.system);
  const chassis = getRecord(hardware.chassis);
  const uuid = getRecord(hardware.uuid);
  const net = getRecord(hardware.net);
  const network = getArray(hardware.network).length ? getArray(hardware.network) : getArray(net.adapters);
  const memory = getArray(hardware.memory).length
    ? getArray(hardware.memory)
    : getArray(hardware.mem).length
      ? getArray(hardware.mem)
      : getArray(hardware.memLayout);
  const disks = getArray(hardware.disks).length
    ? getArray(hardware.disks)
    : getArray(hardware.disk).length
      ? getArray(hardware.disk)
      : getArray(hardware.diskLayout);

  return [
    {
      key: "asset",
      label: "资产",
      rows: detailRows(
        detailRow("asset-number", "资产编号", asset.assetNumber),
        detailRow("asset-name", "资产名称", asset.name),
        detailRow("owner", "使用人", asset.ownerName),
        detailRow("department", "部门", asset.department),
        detailRow("status", "状态", statusLabel(asset.status)),
        detailRow("category", "分类", asset.category),
        detailRow("purchase", "购置价值", formatMoney(asset.purchasePrice)),
        detailRow("residual", "残值", formatMoney(asset.residualValue)),
        detailRow("updated", "更新时间", formatDate(asset.updatedAt))
      ),
    },
    {
      key: "processor",
      label: "处理器",
      rows: detailRows(
        detailRow("cpu-maker", "制造者", firstText(cpu.manufacturer, cpu.vendor, cpuVendorLabel(context.extracted.cpu))),
        detailRow("cpu-brand", "品牌", context.extracted.cpu),
        detailRow("cpu-base", "基准频率", formatFrequency(firstText(cpu.baseFrequency, cpu.base_frequency, cpu.baseSpeed, cpu.base_speed, cpu.frequency))),
        detailRow("cpu-min", "最低频率", formatFrequency(firstText(cpu.minFrequency, cpu.min_frequency, cpu.minSpeed, cpu.min_speed))),
        detailRow("cpu-max", "最大频率", formatFrequency(firstText(cpu.maxFrequency, cpu.max_frequency, cpu.maxSpeed, cpu.max_speed))),
        detailRow("cpu-cores", "核心数", formatCount(firstText(cpu.cores, cpu.coreCount, cpu.logicalCores))),
        detailRow("cpu-physical", "物理核心", formatCount(firstText(cpu.physicalCores, cpu.physicalCoreCount))),
        detailRow("cpu-performance", "性能核心", formatCount(firstText(cpu.performanceCores, cpu.performanceCoreCount))),
        detailRow("cpu-efficient", "效率核心", formatCount(firstText(cpu.efficiencyCores, cpu.efficiencyCoreCount))),
        detailRow("cpu-processors", "处理器数量", formatCount(firstText(cpu.processors, cpu.packages, cpu.socketCount)))
      ),
    },
    {
      key: "memory",
      label: "内存",
      rows: detailRows(
        detailRow("memory-total", "总容量", firstText(formatBytes(summary.memory_bytes), context.importedHardware.memory)),
        ...memory.flatMap((item, index) => [
          detailRow(`memory-${index}-size`, `内存 ${index + 1} 容量`, formatBytes(item.size)),
          detailRow(`memory-${index}-clock`, `内存 ${index + 1} 频率`, formatFrequency(firstText(item.clockSpeed, item.clock))),
          detailRow(`memory-${index}-type`, `内存 ${index + 1} 类型`, firstText(item.type, item.memoryType)),
        ])
      ),
    },
    {
      key: "graphics",
      label: "显卡",
      rows: detailRows(
        detailRow("graphics-main", "主显卡", context.extracted.graphics),
        ...controllers.flatMap((item, index) => [
          detailRow(`gpu-${index}-model`, `显卡 ${index + 1} 型号`, firstText(item.model, item.name)),
          detailRow(`gpu-${index}-memory`, `显卡 ${index + 1} 显存`, formatBytes(firstText(item.memory, item.vram, item.vramBytes))),
          detailRow(`gpu-${index}-vendor`, `显卡 ${index + 1} 厂商`, firstText(item.vendor, item.manufacturer)),
        ])
      ),
    },
    {
      key: "display",
      label: "显示器",
      rows: detailRows(
        detailRow("display-main", "当前显示", context.extracted.display),
        detailRow("display-model", "显示器型号", context.extracted.displayModel),
        ...displays.flatMap((item, index) => [
          detailRow(`display-${index}-resolution`, `显示器 ${index + 1} 分辨率`, `${fieldText(item.currentResX || item.resolutionX)} x ${fieldText(item.currentResY || item.resolutionY)}`),
          detailRow(`display-${index}-rate`, `显示器 ${index + 1} 刷新率`, item.currentRefreshRate ? `${item.currentRefreshRate} 赫兹` : ""),
        ])
      ),
    },
    {
      key: "baseboard",
      label: "主板",
      rows: detailRows(
        detailRow("baseboard-model", "型号", context.extracted.baseboard),
        detailRow("baseboard-maker", "制造商", firstText(baseboard.manufacturer, baseboard.vendor)),
        detailRow("baseboard-serial", "序列号", firstText(baseboard.serial, baseboard.serialNumber)),
      ),
    },
    {
      key: "disk",
      label: "硬盘",
      rows: detailRows(
        detailRow("disk-total", "总容量", firstText(formatBytes(summary.disk_bytes), context.importedHardware.disk)),
        ...disks.flatMap((item, index) => [
          detailRow(`disk-${index}-name`, `硬盘 ${index + 1} 名称`, firstText(item.name, item.device, item.model)),
          detailRow(`disk-${index}-size`, `硬盘 ${index + 1} 容量`, formatBytes(item.size)),
          detailRow(`disk-${index}-serial`, `硬盘 ${index + 1} 序列号`, firstText(item.serialNum, item.serial, item.serialNumber)),
        ])
      ),
    },
    {
      key: "network",
      label: "网卡",
      rows: detailRows(
        detailRow("network-ip", "IP 地址", firstText(context.extracted.primaryIp, context.importedHardware.ip)),
        detailRow("network-gateway", "默认网关", firstText(net.defaultGateway, net.gateway)),
        ...network.flatMap((item, index) => [
          detailRow(`network-${index}-name`, `网卡 ${index + 1} 名称`, firstText(item.name, item.iface, item.adapterName)),
          detailRow(`network-${index}-mac`, `网卡 ${index + 1} MAC`, firstText(item.mac, item.macAddress)),
          detailRow(`network-${index}-ip`, `网卡 ${index + 1} IP`, firstText(item.ip4, item.ip, item.address)),
        ])
      ),
    },
    {
      key: "bios",
      label: "BIOS",
      rows: detailRows(
        detailRow("bios-vendor", "制造商", firstText(bios.vendor, bios.manufacturer)),
        detailRow("bios-version", "版本", bios.version),
        detailRow("bios-release", "发布日期", firstText(bios.releaseDate, bios.date)),
      ),
    },
    {
      key: "chassis",
      label: "机箱",
      rows: detailRows(
        detailRow("chassis-maker", "制造商", firstText(chassis.manufacturer, chassis.vendor)),
        detailRow("chassis-model", "型号", firstText(chassis.model, chassis.type)),
        detailRow("chassis-serial", "序列号", firstText(chassis.serial, chassis.serialNumber)),
      ),
    },
    {
      key: "os",
      label: "OS",
      rows: detailRows(
        detailRow("os-platform", "平台", firstText(summary.platform, os.platform)),
        detailRow("os-label", "系统版本", firstText(summary.os_label, os.distro, os.release)),
        detailRow("os-kernel", "内核", os.kernel),
        detailRow("os-arch", "架构", os.arch),
      ),
    },
    {
      key: "system",
      label: "系统",
      rows: detailRows(
        detailRow("system-model", "计算机型号", context.extracted.deviceModel),
        detailRow("system-maker", "制造商", firstText(system.manufacturer, system.vendor)),
        detailRow("system-hostname", "主机名", summary.hostname),
        detailRow("system-serial", "序列号", firstText(system.serial, system.serialNumber)),
      ),
    },
    {
      key: "uuid",
      label: "UUID",
      rows: detailRows(
        detailRow("uuid-hardware", "硬件 UUID", firstText(uuid.hardware, uuid.uuid, uuid.machine, uuid.os)),
        detailRow("uuid-asset", "资产 UUID", asset.uuid),
        detailRow("uuid-legacy", "旧 UUID", getRecord(asset.metadata.legacy).uuid),
      ),
    },
  ];
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

interface AutoChangeRow {
  key: string;
  option: string;
  oldValue: string;
  newValue: string;
  time: string;
}

const AUTO_RECORD_FIELDS: Record<string, string> = {
  name: "姓名",
  owner: "姓名",
  ownerName: "姓名",
  owner_name: "姓名",
  state: "设备状态",
  status: "设备状态",
  number: "设备编号",
  assetNumber: "设备编号",
  asset_number: "设备编号",
  department: "部门",
  ip: "IP",
  primary_ip: "IP",
  primaryIp: "IP",
  purchase: "采购价",
  purchasePrice: "采购价",
  purchase_price: "采购价",
  depreciation: "二手价",
  residualValue: "二手价",
  residual_value: "二手价",
};

const normalizeAutoRecordField = (fieldName: string) => {
  const normalized = String(fieldName || "").split(".").pop() || "";
  return AUTO_RECORD_FIELDS[normalized] || "";
};

const formatAutoRecordValue = (option: string, value: unknown) => {
  const text = fieldText(value);
  if (text === "-") {
    return "-";
  }
  if (option === "设备状态") {
    return statusLabel(mapLegacyStatus(text));
  }
  return text;
};

const isAutoChangeRow = (row: AutoChangeRow | null): row is AutoChangeRow => Boolean(row);

const automaticChangeRows = (events: AssetEvent[], search: string): AutoChangeRow[] => {
  const keyword = search.trim().toLowerCase();
  return events
    .filter((event) => event.eventSource !== "manual")
    .map((event) => {
      const option = normalizeAutoRecordField(event.fieldName);
      if (!option) {
        return null;
      }
      const oldValue = formatAutoRecordValue(option, event.oldValue);
      const newValue = formatAutoRecordValue(option, event.newValue);
      if (oldValue === newValue) {
        return null;
      }
      return {
        key: String(event.id),
        option,
        oldValue,
        newValue,
        time: event.createdAt,
      };
    })
    .filter(isAutoChangeRow)
    .filter((row) => {
      if (!keyword) {
        return true;
      }
      const text = `${row.option} ${row.oldValue} ${row.newValue} ${formatDate(row.time)}`.toLowerCase();
      return text.includes(keyword);
    })
    .sort((a, b) => new Date(b.time.replace(" ", "T")).getTime() - new Date(a.time.replace(" ", "T")).getTime()) as AutoChangeRow[];
};

const manualEventTypeLabel = (eventType: string) =>
  MANUAL_RECORD_OPTIONS.find((option) => option.value === eventType)?.label || "手动记录";

const manualRecordOperator = (event: AssetEvent) => {
  const payload = getRecord(event.payload);
  return fieldText(payload.operatorName || event.actorName);
};

const manualRecordItem = (event: AssetEvent) => {
  const payload = getRecord(event.payload);
  return fieldText(payload.changeItem || payload.targetDepartment || manualEventTypeLabel(event.eventType));
};

const changeActorName = (event: AssetEvent) => {
  const payload = getRecord(event.payload);
  return fieldText(payload.operatorName || event.actorName || (event.eventSource.startsWith("legacy") ? "旧版数据" : "系统"));
};

const changeTypeLabel = (event: AssetEvent) => {
  const payload = getRecord(event.payload);
  const manualItem = fieldText(payload.changeItem);
  if (manualItem !== "-") {
    return manualItem;
  }
  const fieldLabel = normalizeAutoRecordField(event.fieldName);
  if (fieldLabel) {
    return fieldLabel;
  }
  if (event.eventSource === "legacy_import") {
    return "导入";
  }
  if (event.eventType === "manual_change") {
    return "手动";
  }
  if (event.eventType === "bulk_updated") {
    return "批量";
  }
  if (event.eventType === "observation_received") {
    return "采集";
  }
  if (event.eventType === "issue_handled") {
    return "盘点";
  }
  return optionLabel(EVENT_TYPE_OPTIONS, event.eventType);
};

const changeContentText = (event: AssetEvent) => {
  const payload = getRecord(event.payload);
  const changedFields = getArray(payload.changedFields)
    .map((item) => getRecord(item))
    .map((item) => fieldText(item.label || item.field || item.name))
    .filter((item) => item !== "-");
  if (changedFields.length) {
    return `批量修改：${changedFields.join("、")}`;
  }

  if (event.oldValue || event.newValue) {
    const type = changeTypeLabel(event);
    return `${type}：${fieldText(event.oldValue)} -> ${fieldText(event.newValue)}`;
  }

  const issueMessage = fieldText(payload.issueMessage);
  if (issueMessage !== "-") {
    return issueMessage;
  }

  const messageText = fieldText(event.message);
  if (messageText !== "-") {
    return messageText
      .replace("Asset created in admin.", "后台创建资产")
      .replace("Asset created from first observation.", "首次采集创建资产")
      .replace("Observation received from client.", "客户端采集数据已接收")
      .replace("Legacy PC asset imported.", "旧版资产导入");
  }
  return "-";
};

const changeAssetLabelParts = (asset: AssetReference | undefined) => {
  if (!asset) {
    return { name: "-", suffix: "" };
  }
  const name = fieldText(asset.name);
  const suffix = [asset.department, asset.assetNumber].filter((item) => fieldText(item) !== "-").join(" _ ");
  return { name: name || "-", suffix };
};

interface AssetFormModalProps {
  asset: Asset | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AssetInput) => Promise<void>;
}

type AssetFormValues = Omit<AssetInput, "metadata"> & {
  purpose?: string;
  numbers?: number;
  purchaser?: string;
  shopName?: string;
  link?: string;
  order?: string;
  orderTime?: string;
  platform?: string;
  payMethod?: string;
};

const assetFormValuesToInput = (values: AssetFormValues, asset: Asset | null): AssetInput => {
  const metadata = getRecord(asset?.metadata);
  const existingPurchase = getRecord(metadata.purchase);
  return {
    assetType: values.assetType,
    assetNumber: values.assetNumber,
    name: values.name,
    ownerName: values.ownerName,
    department: values.department,
    status: values.status,
    category: values.category,
    purchasePrice: Number(values.purchasePrice || 0),
    residualValue: Number(values.residualValue || 0),
    metadata: {
      ...metadata,
      purpose: values.purpose || "",
      purchase: {
        ...existingPurchase,
        title: values.name || "",
        total: Number(values.purchasePrice || 0),
        numbers: Number(values.numbers || 0),
        purchaser: values.purchaser || "",
        shop_name: values.shopName || "",
        link: values.link || "",
        order: values.order || "",
        order_time: values.orderTime || "",
        platform: values.platform || "",
        pay_method: values.payMethod || "",
      },
    },
  };
};

const AssetFormModal = ({ asset, open, onClose, onSubmit }: AssetFormModalProps) => {
  const [form] = Form.useForm<AssetFormValues>();
  const customInfo = useMemo(() => (asset ? customAssetInfo(asset) : null), [asset]);
  const showCustomFields = !asset || !isComputerAsset(asset);

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
      purpose: customInfo?.purpose || "",
      numbers: Number(customInfo?.quantity || 1) || 1,
      purchaser: customInfo?.purchaser || "",
      shopName: customInfo?.shopName || "",
      link: customInfo?.link || "",
      order: customInfo?.orderNo || "",
      orderTime: customInfo?.orderTime || "",
      platform: customInfo?.platform || "",
      payMethod: customInfo?.payMethod || "",
    });
  }, [asset, customInfo, form, open]);

  return (
    <Modal
      title={asset ? "编辑资产" : "采购信息录入"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      destroyOnClose
      width={760}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => onSubmit(assetFormValuesToInput(values, asset))}
        preserve={false}
        className="npcink-v3-asset-form"
      >
        {showCustomFields ? (
          <Form.Item name="assetType" hidden>
            <Input />
          </Form.Item>
        ) : null}
        <div className="npcink-v3-asset-form-section">
          <h4>设备信息</h4>
          <Form.Item name="name" label="设备名称" rules={[{ required: true, message: "请输入设备名称" }]}>
            <Input placeholder="例如：科沃顿 UPS C3K" />
          </Form.Item>
          {showCustomFields ? (
            <Form.Item name="purpose" label="设备用途">
              <Input placeholder="例如：机房备用电源" />
            </Form.Item>
          ) : null}
          <div className="npcink-v3-asset-form-grid">
            <Form.Item name="assetNumber" label="设备编号">
              <Input placeholder="留空自动生成" />
            </Form.Item>
            {!showCustomFields ? (
              <Form.Item name="assetType" label="资产类型">
                <Select options={ASSET_TYPES} />
              </Form.Item>
            ) : null}
            <Form.Item name="ownerName" label="使用人员">
              <Input placeholder="人员、部门或位置" />
            </Form.Item>
            <Form.Item name="department" label="部门">
              <Input placeholder="所属部门" />
            </Form.Item>
            <Form.Item name="category" label="分类">
              <Input placeholder="例如：显卡、手机、机房设备" />
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          </div>
        </div>

        {showCustomFields ? (
          <>
            <div className="npcink-v3-asset-form-section">
              <h4>采购信息</h4>
              <div className="npcink-v3-asset-form-grid">
                <Form.Item name="numbers" label="数量">
                  <InputNumber min={0} precision={0} className="npcink-v3-number" addonAfter="个" />
                </Form.Item>
                <Form.Item name="purchasePrice" label="总计">
                  <InputNumber min={0} precision={2} className="npcink-v3-number" addonAfter="¥" />
                </Form.Item>
                <Form.Item name="purchaser" label="采购人员">
                  <Input placeholder="负责购买此设备的人" />
                </Form.Item>
                <Form.Item name="residualValue" label="残值">
                  <InputNumber min={0} precision={2} className="npcink-v3-number" addonAfter="¥" />
                </Form.Item>
              </div>
            </div>

            <div className="npcink-v3-asset-form-section">
              <h4>订单信息</h4>
              <Form.Item name="shopName" label="店铺名称">
                <Input />
              </Form.Item>
              <Form.Item name="link" label="商品链接">
                <Input />
              </Form.Item>
              <div className="npcink-v3-asset-form-grid">
                <Form.Item name="order" label="单号">
                  <Input />
                </Form.Item>
                <Form.Item name="orderTime" label="时间">
                  <Input placeholder="例如：2026-06-26" />
                </Form.Item>
                <Form.Item name="platform" label="平台">
                  <Input placeholder="例如：淘宝、京东、闲鱼" />
                </Form.Item>
                <Form.Item name="payMethod" label="支付">
                  <Input placeholder="例如：支付宝、微信" />
                </Form.Item>
              </div>
            </div>
          </>
        ) : (
          <div className="npcink-v3-asset-form-grid">
            <Form.Item name="purchasePrice" label="购置价值">
              <InputNumber min={0} precision={2} className="npcink-v3-number" />
            </Form.Item>
            <Form.Item name="residualValue" label="残值">
              <InputNumber min={0} precision={2} className="npcink-v3-number" />
            </Form.Item>
          </div>
        )}
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
      className="npcink-v3-import-modal"
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
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="先粘贴或选择文件，再生成导入预览"
              />
            ),
          }}
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
  const tokenStatusMutation = useMutation(
    ({ id, enabled }: { id: string; enabled: boolean }) => updateClientToken(id, enabled),
    {
      onSuccess: (token) => {
        queryClient.invalidateQueries(["v3-settings"]);
        message.success(token.enabled ? "令牌已启用" : "令牌已停用");
      },
    }
  );
  const packageConfigMutation = useMutation(
    async (token: ClientToken) => {
      const config = await getClientTokenPackageConfig(token.id);
      await writeClipboardText(JSON.stringify(config, null, 2));
      return token;
    },
    {
      onSuccess: () => {
        message.success("上传配置已复制");
      },
    }
  );

  const tokens = settingsQuery.data?.clientTokens || [];
  const uploadEndpoint = buildClientUploadEndpoint(settingsQuery.data?.clientUploadBaseUrl || RestUrl);

  const columns: ColumnsType<ClientToken> = [
    { title: "名称", dataIndex: "name" },
    { title: "Token ID", dataIndex: "id", width: 160 },
    {
      title: "状态",
      dataIndex: "enabled",
      width: 120,
      render: (enabled: boolean) => (
        <Tag color={enabled ? "green" : "default"}>{enabled ? "启用" : "停用"}</Tag>
      ),
    },
    {
      title: "启停",
      dataIndex: "enabled",
      width: 110,
      render: (enabled: boolean, token) => (
        <Switch
          size="small"
          checked={enabled}
          checkedChildren="启用"
          unCheckedChildren="关闭"
          loading={tokenStatusMutation.isLoading && tokenStatusMutation.variables?.id === token.id}
          onChange={(checked) => tokenStatusMutation.mutate({ id: token.id, enabled: checked })}
        />
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
      width: 190,
      render: (_, token) => (
        <Space size={8}>
          <Button
            size="small"
            loading={packageConfigMutation.isLoading && packageConfigMutation.variables?.id === token.id}
            onClick={() =>
              Modal.confirm({
                title: "复制上传配置？",
                content: (
                  <Space direction="vertical" size={4}>
                    <Text>配置包含客户端令牌密钥，可用于客户端导入或生成安装包。</Text>
                    <Text type="secondary">Token ID：{token.id}</Text>
                  </Space>
                ),
                okText: "复制",
                cancelText: "取消",
                onOk: () => packageConfigMutation.mutateAsync(token),
              })
            }
          >
            复制上传配置
          </Button>
          <Button
            size="small"
            danger
            onClick={() =>
              Modal.confirm({
                title: "确认删除这个客户端令牌？",
                content: (
                  <Space direction="vertical" size={4}>
                    <Text>删除后，使用该令牌的客户端将无法继续上传数据。</Text>
                    <Text type="secondary">Token ID：{token.id}</Text>
                  </Space>
                ),
                okText: "确认删除",
                okButtonProps: { danger: true },
                cancelText: "取消",
                onOk: () => deleteMutation.mutateAsync(token.id),
              })
            }
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title="客户端接入"
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnClose
    >
      <div className="npcink-v3-token-endpoint">
        <div>
          <Text strong>客户端上传地址</Text>
          <Text type="secondary">上传地址不是密钥；客户端写入权限由令牌和 HMAC 签名控制。</Text>
        </div>
        <Text copyable code>
          {uploadEndpoint}
        </Text>
      </div>
      <Form
        form={form}
        className="npcink-v3-token-form"
        onFinish={({ name }) => createMutation.mutate(name)}
      >
        <div className="npcink-v3-token-create-row">
          <Form.Item
            name="name"
            label="令牌备注"
            rules={[{ required: true, message: "请输入令牌备注" }]}
          >
            <Input placeholder="例如：财务部采集客户端" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={createMutation.isLoading}>
            创建令牌
          </Button>
        </div>
      </Form>
      {createdToken ? (
        <Alert
          className="npcink-v3-secret"
          type="warning"
          showIcon
          message="完整授权码包含上传权限"
          description={
            <Space direction="vertical" size={8} className="npcink-v3-client-snippet">
              <div className="npcink-v3-client-snippet-item">
                <Text type="secondary">完整授权码</Text>
                <Text copyable code className="npcink-v3-client-snippet-code">
                  {buildClientTokenValue(createdToken)}
                </Text>
              </div>
              <div className="npcink-v3-client-snippet-item">
                <Text type="secondary">命令行验收</Text>
                <Text copyable code className="npcink-v3-client-snippet-code">
                  {buildClientSubmitCommand(createdToken, uploadEndpoint)}
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

interface ManualRecordFormProps {
  open: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSubmit: (values: AssetEventInput) => Promise<unknown>;
  loading?: boolean;
}

interface ManualRecordFormValues {
  operatorName: string;
  changeItem: string;
  changeDescription: string;
}

const ManualRecordModal = ({ open, asset, onClose, onSubmit, loading }: ManualRecordFormProps) => {
  const [form] = Form.useForm<ManualRecordFormValues>();

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [form, open]);

  return (
    <Modal
      title="添加记录"
      open={open}
      okText="添加记录"
      cancelText="取消"
      confirmLoading={loading}
      onCancel={onClose}
      onOk={() => form.submit()}
      destroyOnClose
      width={560}
      className="npcink-v3-manual-record-modal"
    >
      <div className="npcink-v3-manual-record-form">
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ flex: "92px" }}
        wrapperCol={{ flex: "1 1 auto" }}
        colon={false}
        preserve={false}
        requiredMark
        onFinish={async (values) => {
          await onSubmit({
            eventType: "manual_change",
            message: values.changeDescription.trim(),
            payload: {
              assetNumber: asset?.assetNumber || "",
              operatorName: values.operatorName.trim(),
              changeItem: values.changeItem.trim(),
            },
          });
          form.resetFields();
        }}
      >
        <Form.Item
          name="operatorName"
          label="变更人"
          rules={[{ required: true, whitespace: true, message: "请输入变更人" }]}
        >
          <Input placeholder="操作变更同事的名字" />
        </Form.Item>
        <Form.Item
          name="changeItem"
          label="变更项目"
          rules={[{ required: true, whitespace: true, message: "请输入变更项目" }]}
        >
          <Input placeholder="变更的项目，例如硬盘、内存条等" />
        </Form.Item>
        <Form.Item
          name="changeDescription"
          label="变更说明"
          rules={[{ required: true, whitespace: true, message: "请输入变更说明" }]}
        >
          <Input.TextArea rows={3} placeholder="变更内容详情" />
        </Form.Item>
      </Form>
      </div>
    </Modal>
  );
};

interface AssetSettingsPanelProps {
  asset: Asset;
  departmentOptions?: string[];
  onUpdated: (asset: Asset) => void;
  onArchive: (asset: Asset) => void;
}

const AssetSettingsPanel = ({ asset, departmentOptions = [], onUpdated, onArchive }: AssetSettingsPanelProps) => {
  const [form] = Form.useForm<AssetInput>();
  const settingsHardware = assetHardwareContext(asset);
  const primaryIp = firstText(settingsHardware.extracted.primaryIp, settingsHardware.importedHardware.ip);
  const normalizedDepartmentOptions = useMemo(
    () =>
      Array.from(new Set([asset.department, ...departmentOptions].map((item) => String(item || "").trim()).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, "zh-CN")),
    [asset.department, departmentOptions]
  );
  const watchedPurchasePrice = Form.useWatch("purchasePrice", form);
  const watchedResidualValue = Form.useWatch("residualValue", form);
  const purchasePrice = Number(watchedPurchasePrice ?? asset.purchasePrice ?? 0);
  const residualValue = Number(watchedResidualValue ?? asset.residualValue ?? 0);
  const residualRate = purchasePrice > 0 ? Math.round((residualValue / purchasePrice) * 100) : 0;
  const depreciationRate = purchasePrice > 0 ? Math.max(0, 100 - residualRate) : 0;
  const updateMutation = useMutation(
    (values: AssetInput) =>
      updateAsset(asset.uuid, {
        assetNumber: values.assetNumber,
        name: values.name ?? asset.name,
        ownerName: values.ownerName,
        department: values.department,
        status: values.status,
        purchasePrice: Number(values.purchasePrice || 0),
        residualValue: Number(values.residualValue || 0),
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
      assetNumber: asset.assetNumber,
      name: asset.name,
      ownerName: asset.ownerName,
      department: asset.department,
      status: asset.status,
      purchasePrice: asset.purchasePrice,
      residualValue: asset.residualValue,
    });
  }, [asset, form]);

  return (
    <div className="npcink-v3-settings-panel npcink-v3-detail-settings">
      <Form form={form} layout="vertical" onFinish={(values) => updateMutation.mutate(values)}>
        <div className="npcink-v3-settings-section">
          <h4>基础信息</h4>
          <div className="npcink-v3-settings-grid">
            <Form.Item name="ownerName" label="姓名">
              <Input />
            </Form.Item>
            <Form.Item name="assetNumber" label="编号">
              <Input />
            </Form.Item>
            <Form.Item name="department" label="部门">
              <Select
                showSearch
                allowClear
                options={normalizedDepartmentOptions.map((department) => ({ label: department, value: department }))}
                placeholder="选择或输入部门"
                popupMatchSelectWidth={false}
                filterOption={(input, option) => String(option?.label || "").toLowerCase().includes(input.toLowerCase())}
                onSearch={(value) => {
                  if (value.trim()) {
                    form.setFieldValue("department", value.trim());
                  }
                }}
              />
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item label="IP 地址" className="npcink-v3-settings-wide">
              <Input value={primaryIp} readOnly placeholder="暂无采集 IP" />
            </Form.Item>
          </div>
        </div>

        <div className="npcink-v3-settings-section">
          <h4>财务参数</h4>
          <div className="npcink-v3-settings-grid">
            <Form.Item name="purchasePrice" label="采购价">
              <InputNumber min={0} precision={2} className="npcink-v3-number" addonAfter="¥" />
            </Form.Item>
            <Form.Item name="residualValue" label="二手价">
              <InputNumber min={0} precision={2} className="npcink-v3-number" addonAfter="¥" />
            </Form.Item>
          </div>
          <div className="npcink-v3-finance-summary">
            <span>折旧率：{depreciationRate}%</span>
            <span>残值：{formatMoney(residualValue)}</span>
            <span>残值率：{residualRate}%</span>
          </div>
        </div>

        <div className="npcink-v3-settings-actions">
          <Button type="primary" htmlType="submit" loading={updateMutation.isLoading}>
            保存设置
          </Button>
          <Button danger type="text" onClick={() => onArchive(asset)}>
            移除设备
          </Button>
        </div>
      </Form>
    </div>
  );
};

interface CustomAssetSettingsValues {
  name?: string;
  assetNumber?: string;
  category?: string;
  status?: string;
  ownerName?: string;
  purpose?: string;
  purchasePrice?: number;
  residualValue?: number;
  numbers?: number;
  purchaser?: string;
  platform?: string;
  order?: string;
  payMethod?: string;
  orderTime?: string;
  link?: string;
}

const CUSTOM_PLATFORM_EDIT_OPTIONS = ["京东", "淘宝", "闲鱼", "微信", "支付宝", "其他"].map((value) => ({
  label: value,
  value,
}));

const CustomAssetSettingsPanel = ({ asset, onUpdated, onArchive }: AssetSettingsPanelProps) => {
  const [form] = Form.useForm<CustomAssetSettingsValues>();
  const info = useMemo(() => customAssetInfo(asset), [asset]);
  const watchedPurchasePrice = Form.useWatch("purchasePrice", form);
  const watchedResidualValue = Form.useWatch("residualValue", form);
  const purchasePrice = Number(watchedPurchasePrice ?? asset.purchasePrice ?? 0);
  const residualValue = Number(watchedResidualValue ?? asset.residualValue ?? 0);
  const residualRate = purchasePrice > 0 ? Math.round((residualValue / purchasePrice) * 100) : 0;
  const depreciationRate = purchasePrice > 0 ? Math.max(0, 100 - residualRate) : 0;
  const categoryOptions = useMemo(
    () =>
      Array.from(new Set([...DEFAULT_CUSTOM_CATEGORIES, asset.category].map((item) => String(item || "").trim()).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, "zh-CN"))
        .map((value) => ({ label: value, value })),
    [asset.category]
  );
  const updateMutation = useMutation(
    (values: CustomAssetSettingsValues) => {
      const metadata = getRecord(asset.metadata);
      const existingPurchase = getRecord(metadata.purchase);
      return updateAsset(asset.uuid, {
        name: values.name,
        assetNumber: values.assetNumber,
        ownerName: values.ownerName,
        status: values.status,
        category: values.category,
        purchasePrice: Number(values.purchasePrice || 0),
        residualValue: Number(values.residualValue || 0),
        metadata: {
          ...metadata,
          purpose: values.purpose || "",
          purchase: {
            ...existingPurchase,
            title: values.name || "",
            total: Number(values.purchasePrice || 0),
            numbers: Number(values.numbers || 0),
            purchaser: values.purchaser || "",
            platform: values.platform || "",
            order: values.order || "",
            pay_method: values.payMethod || "",
            order_time: values.orderTime || "",
            link: values.link || "",
          },
        },
      });
    },
    {
      onSuccess: (updated) => {
        onUpdated(updated);
        message.success("资产信息已保存");
      },
    }
  );

  useEffect(() => {
    form.setFieldsValue({
      name: info.title,
      assetNumber: info.number,
      category: info.category,
      status: asset.status,
      ownerName: info.usage,
      purpose: info.purpose,
      purchasePrice: Number(info.total || asset.purchasePrice || 0),
      residualValue: asset.residualValue,
      numbers: Number(info.quantity || 0) || undefined,
      purchaser: info.purchaser,
      platform: info.platform,
      order: info.orderNo,
      payMethod: info.payMethod,
      orderTime: info.orderTime,
      link: info.link,
    });
  }, [asset, form, info]);

  return (
    <div className="npcink-v3-custom-settings-panel">
      <Form form={form} layout="vertical" onFinish={(values) => updateMutation.mutate(values)}>
        <div className="npcink-v3-custom-settings-section">
          <h4>基础信息</h4>
          <div className="npcink-v3-custom-settings-grid">
            <Form.Item name="name" label="资产名称">
              <Input placeholder="例如：科沃顿UPS C3K" />
            </Form.Item>
            <Form.Item name="assetNumber" label="设备编号">
              <Input placeholder="设备编号" />
            </Form.Item>
            <Form.Item name="category" label="设备分类">
              <Select
                showSearch
                allowClear
                options={categoryOptions}
                placeholder="选择或输入分类"
                popupMatchSelectWidth={false}
                filterOption={(input, option) => String(option?.label || "").toLowerCase().includes(input.toLowerCase())}
                onSearch={(value) => {
                  if (value.trim()) {
                    form.setFieldValue("category", value.trim());
                  }
                }}
              />
            </Form.Item>
            <Form.Item name="status" label="当前状态">
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item name="ownerName" label="使用人员">
              <Input placeholder="使用人或使用位置" />
            </Form.Item>
            <Form.Item name="purpose" label="设备用途">
              <Input placeholder="例如：机房备用电源" />
            </Form.Item>
          </div>
        </div>

        <div className="npcink-v3-custom-settings-section">
          <h4>采购信息</h4>
          <div className="npcink-v3-custom-settings-grid">
            <Form.Item name="purchasePrice" label="采购总价">
              <InputNumber min={0} precision={2} className="npcink-v3-number" addonAfter="¥" />
            </Form.Item>
            <Form.Item name="residualValue" label="二手价">
              <InputNumber min={0} precision={2} className="npcink-v3-number" addonAfter="¥" />
            </Form.Item>
            <Form.Item name="numbers" label="采购数量">
              <InputNumber min={0} precision={0} className="npcink-v3-number" />
            </Form.Item>
            <Form.Item name="purchaser" label="采购人员">
              <Input placeholder="采购同事" />
            </Form.Item>
          </div>
          <div className="npcink-v3-finance-summary">
            <span>折旧率：{depreciationRate}%</span>
            <span>残值：{formatMoney(residualValue)}</span>
            <span>残值率：{residualRate}%</span>
          </div>
        </div>

        <div className="npcink-v3-custom-settings-section">
          <h4>订单信息</h4>
          <div className="npcink-v3-custom-settings-grid">
            <Form.Item name="order" label="采购单号">
              <Input placeholder="订单号" />
            </Form.Item>
            <Form.Item name="platform" label="采购平台">
              <Select
                showSearch
                allowClear
                options={CUSTOM_PLATFORM_EDIT_OPTIONS}
                placeholder="选择或输入平台"
                popupMatchSelectWidth={false}
                filterOption={(input, option) => String(option?.label || "").toLowerCase().includes(input.toLowerCase())}
                onSearch={(value) => {
                  if (value.trim()) {
                    form.setFieldValue("platform", value.trim());
                  }
                }}
              />
            </Form.Item>
            <Form.Item name="payMethod" label="支付方式">
              <Input placeholder="例如：支付宝" />
            </Form.Item>
            <Form.Item name="orderTime" label="下单时间">
              <Input placeholder="例如：2024-12-27" />
            </Form.Item>
            <Form.Item name="link" label="商品链接" className="npcink-v3-custom-settings-wide">
              <Input placeholder="商品链接或备注" />
            </Form.Item>
          </div>
        </div>

        <div className="npcink-v3-settings-actions npcink-v3-custom-settings-actions">
          <Button type="primary" htmlType="submit" loading={updateMutation.isLoading}>
            保存信息
          </Button>
          <Button danger type="text" onClick={() => onArchive(asset)}>
            移除设备
          </Button>
        </div>
      </Form>
    </div>
  );
};

interface CustomAssetDetailProps {
  asset: Asset;
  autoRecordRows: AutoChangeRow[];
  onUpdated: (asset: Asset) => void;
  onArchive: (asset: Asset) => void;
}

const CustomAssetDetail = ({
  asset,
  autoRecordRows,
  onUpdated,
  onArchive,
}: CustomAssetDetailProps) => {
  const info = customAssetInfo(asset);
  const productLink = /^https?:\/\//i.test(info.link) ? info.link : "";
  const infoItem = (label: string, value: unknown) => (
    <p>
      <strong>{label}：</strong>
      <span>{fieldText(value)}</span>
    </p>
  );

  return (
    <Tabs
      defaultActiveKey="info"
      items={[
        {
          key: "info",
          label: "设备信息",
          children: (
            <div className="npcink-v3-custom-detail">
              <div className="npcink-v3-custom-detail-head">
                <h3>{info.title}</h3>
                {productLink ? (
                  <a href={productLink} target="_blank" rel="noreferrer">
                    {info.shopName || info.title}
                  </a>
                ) : (
                  <span>{info.shopName || "-"}</span>
                )}
              </div>
              <div className="npcink-v3-custom-detail-body">
                <div className="npcink-v3-custom-info-card">
                  <h4>设备信息</h4>
                  <div>
                    {infoItem("采购数量", info.quantityText)}
                    {infoItem("采购总价", info.priceText)}
                    {infoItem("当前状态", info.status)}
                    {infoItem("设备分类", info.category)}
                  </div>
                </div>
                <div className="npcink-v3-custom-info-card">
                  <h4>采购信息</h4>
                  <div>
                    {infoItem("采购人员", info.purchaser)}
                    {infoItem("设备编号", info.number)}
                    {infoItem("使用人员", info.usage)}
                    {infoItem("设备用途", info.purpose)}
                  </div>
                </div>
                <div className="npcink-v3-custom-info-card is-wide">
                  <h4>订单信息</h4>
                  <div className="npcink-v3-custom-order-grid">
                    {infoItem("采购单号", info.orderNo)}
                    {infoItem("下单时间", formatDate(info.orderTime))}
                    {infoItem("采购平台", info.platform)}
                    {infoItem("支付方式", info.payMethod)}
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          key: "records",
          label: "自动记录",
          children: (
            <Table
              rowKey="key"
              size="small"
              className="npcink-v3-auto-table"
              columns={[
                {
                  title: "序号",
                  width: 72,
                  render: (_value, _row, index) => index + 1,
                },
                {
                  title: "选项",
                  dataIndex: "option",
                  width: 160,
                },
                {
                  title: "变更前",
                  dataIndex: "oldValue",
                },
                {
                  title: "变更后",
                  dataIndex: "newValue",
                },
                {
                  title: "时间",
                  dataIndex: "time",
                  width: 180,
                  render: formatDate,
                },
              ]}
              dataSource={autoRecordRows}
              pagination={{ pageSize: 10, hideOnSinglePage: true }}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无自动变更记录" /> }}
            />
          ),
        },
        {
          key: "settings",
          label: "信息修改",
          children: (
            <CustomAssetSettingsPanel
              asset={asset}
              onUpdated={onUpdated}
              onArchive={onArchive}
            />
          ),
        },
      ]}
    />
  );
};

interface DetailDrawerProps {
  uuid: string | null;
  open: boolean;
  departmentOptions?: string[];
  onClose: () => void;
  onArchive: (asset: Asset) => void;
}

const DetailDrawer = ({ uuid, open, departmentOptions = [], onClose, onArchive }: DetailDrawerProps) => {
  const queryClient = useQueryClient();
  const [manualRecordOpen, setManualRecordOpen] = useState(false);
  const [manualRecordKeyword, setManualRecordKeyword] = useState("");
  const [manualRecordSearch, setManualRecordSearch] = useState("");
  const [activeDetailKey, setActiveDetailKey] = useState("processor");
  const [autoRecordSearch, setAutoRecordSearch] = useState("");
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
  const summary = hardwareContext.summary;
  const extracted = hardwareContext.extracted;
  const sourceRows = useMemo(
    () => (asset ? fieldSourceRows(asset, hardwareContext) : []),
    [asset, hardwareContext]
  );
  const detailSections = useMemo(
    () => (asset ? hardwareDetailSections(asset, hardwareContext) : []),
    [asset, hardwareContext]
  );
  const activeDetailSection =
    detailSections.find((section) => section.key === activeDetailKey) ||
    detailSections.find((section) => section.key === "processor") ||
    detailSections[0];
  const autoRecordRows = useMemo(
    () => automaticChangeRows(events, autoRecordSearch),
    [autoRecordSearch, events]
  );
  const manualRecords = useMemo(() => events.filter((event) => event.eventSource === "manual"), [events]);
  const filteredManualRecords = useMemo(() => {
    const keyword = manualRecordSearch.trim().toLowerCase();
    if (!keyword) {
      return manualRecords;
    }
    return manualRecords.filter((event) => {
      const text = [
        manualRecordOperator(event),
        manualRecordItem(event),
        fieldText(event.message),
        formatDate(event.createdAt),
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(keyword);
    });
  }, [manualRecordSearch, manualRecords]);
  const createEventMutation = useMutation(
    (input: AssetEventInput) => createAssetEvent(uuid || "", input),
    {
      onSuccess: () => {
        setManualRecordOpen(false);
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
    {
      title: "序号",
      width: 72,
      render: (_value, _event, index) => index + 1,
    },
    {
      title: "变更人",
      width: 140,
      render: (_, event) => manualRecordOperator(event),
    },
    {
      title: "变更项目",
      width: 180,
      render: (_, event) => manualRecordItem(event),
    },
    {
      title: "变更说明",
      dataIndex: "message",
      render: fieldText,
    },
    {
      title: "时间",
      dataIndex: "createdAt",
      width: 180,
      render: formatDate,
    },
  ];

  return (
    <Modal
      title={isComputerAsset(asset) ? "电脑资产详情" : "自定义资产详情"}
      open={open}
      onCancel={onClose}
      footer={null}
      width={isComputerAsset(asset) ? "min(840px, calc(100vw - 40px))" : "min(860px, calc(100vw - 40px))"}
      className="npcink-v3-detail-modal"
      destroyOnClose
    >
      {assetQuery.isLoading ? (
        <Table loading pagination={false} showHeader={false} />
      ) : asset && !isComputerAsset(asset) ? (
        <CustomAssetDetail
          asset={asset}
          autoRecordRows={autoRecordRows}
          onUpdated={handleAssetUpdated}
          onArchive={onArchive}
        />
      ) : asset ? (
        <Space direction="vertical" size={12} className="npcink-v3-detail-stack">
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
              <p>
                {formatHardwareHeroText(
                  extracted.cpu,
                  summary,
                  hardwareContext.importedHardware,
                  assetTypeLabel(asset.assetType)
                )}
              </p>
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
                <Space direction="vertical" size={12} className="npcink-v3-detail-stack">
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
                </Space>
              ),
            },
            {
              key: "identities",
              label: "详细信息",
              children: (
                <Space direction="vertical" size={12} className="npcink-v3-detail-stack">
                  <div className="npcink-v3-spec-layout">
                    <div className="npcink-v3-spec-nav">
                      {detailSections.map((section) => (
                        <button
                          key={section.key}
                          type="button"
                          className={section.key === activeDetailSection?.key ? "is-active" : ""}
                          onClick={() => setActiveDetailKey(section.key)}
                        >
                          {section.label}
                        </button>
                      ))}
                    </div>
                    <Table
                      rowKey="key"
                      size="small"
                      className="npcink-v3-spec-table"
                      columns={[
                        {
                          title: "序号",
                          width: 92,
                          render: (_value, _row, index) => index + 1,
                        },
                        {
                          title: "属性",
                          dataIndex: "attribute",
                          width: 220,
                        },
                        {
                          title: "配置",
                          dataIndex: "value",
                        },
                      ]}
                      dataSource={activeDetailSection?.rows || []}
                      pagination={{
                        pageSize: 10,
                        hideOnSinglePage: true,
                        showSizeChanger: false,
                      }}
                      locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无该分类信息" /> }}
                    />
                  </div>
                </Space>
              ),
            },
            {
              key: "observations",
              label: "自动记录",
              children: (
                <Space direction="vertical" size={12} className="npcink-v3-detail-stack">
                  <Text type="secondary">
                    自动记录字段：姓名、状态、编号、部门、IP、采购价、二手价
                  </Text>
                  <div className="npcink-v3-auto-search">
                    <Input
                      allowClear
                      className="npcink-v3-auto-search-input"
                      placeholder="搜索变更记录"
                      value={autoRecordSearch}
                      onChange={(event) => setAutoRecordSearch(event.target.value)}
                      onPressEnter={() => setAutoRecordSearch(autoRecordSearch)}
                    />
                    <Button
                      aria-label="搜索变更记录"
                      className="npcink-v3-auto-search-button"
                      icon={<SearchOutlined />}
                      onClick={() => setAutoRecordSearch(autoRecordSearch)}
                    />
                  </div>
                  <Table
                    rowKey="key"
                    size="small"
                    className="npcink-v3-auto-table"
                    columns={[
                      {
                        title: "序号",
                        width: 72,
                        render: (_value, _row, index) => index + 1,
                      },
                      {
                        title: "选项",
                        dataIndex: "option",
                        width: 160,
                      },
                      {
                        title: "变更前",
                        dataIndex: "oldValue",
                      },
                      {
                        title: "变更后",
                        dataIndex: "newValue",
                      },
                      {
                        title: "时间",
                        dataIndex: "time",
                        width: 180,
                        render: formatDate,
                      },
                    ]}
                    dataSource={autoRecordRows}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                    }}
                    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无自动变更记录" /> }}
                  />
                </Space>
              ),
            },
            {
              key: "events",
              label: "手动记录",
              children: (
                <Space direction="vertical" size={12} className="npcink-v3-detail-stack">
                  <div className="npcink-v3-manual-record-toolbar">
                    <Input
                      allowClear
                      className="npcink-v3-manual-record-search"
                      placeholder="搜索变更记录"
                      value={manualRecordKeyword}
                      onChange={(event) => {
                        const value = event.target.value;
                        setManualRecordKeyword(value);
                        if (!value) {
                          setManualRecordSearch("");
                        }
                      }}
                      onPressEnter={() => setManualRecordSearch(manualRecordKeyword.trim())}
                    />
                    <Button icon={<SearchOutlined />} onClick={() => setManualRecordSearch(manualRecordKeyword.trim())}>
                      搜索
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setManualRecordOpen(true)}>
                      添加记录
                    </Button>
                  </div>
                  <Table
                    rowKey="id"
                    size="small"
                    columns={eventColumns}
                    dataSource={filteredManualRecords}
                    loading={eventsQuery.isLoading}
                    pagination={false}
                    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无记录" /> }}
                  />
                </Space>
              ),
            },
            {
              key: "debug",
              label: "调试",
              children: (
                <Collapse
                  size="small"
                  items={[
                    {
                      key: "identities",
                      label: `身份标识 ${(identitiesQuery.data || []).length}`,
                      children: (
                        <Table
                          rowKey="id"
                          size="small"
                          columns={identityColumns}
                          dataSource={identitiesQuery.data || []}
                          loading={identitiesQuery.isLoading}
                          pagination={false}
                        />
                      ),
                    },
                    {
                      key: "sources",
                      label: "字段来源对照",
                      children: (
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
                      ),
                    },
                    {
                      key: "metadata",
                      label: "资产扩展信息",
                      children: renderJsonBlock(asset.metadata),
                    },
                    {
                      key: "observations",
                      label: `采集记录 ${observations.length}`,
                      children: (
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
                      ),
                    },
                  ]}
                />
              ),
            },
            {
              key: "settings",
              label: "设置",
              children: (
                <AssetSettingsPanel
                  asset={asset}
                  departmentOptions={departmentOptions}
                  onUpdated={handleAssetUpdated}
                  onArchive={onArchive}
                />
              ),
            },
            ]}
          />
          <ManualRecordModal
            open={manualRecordOpen}
            asset={asset}
            loading={createEventMutation.isLoading}
            onClose={() => setManualRecordOpen(false)}
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
  const [eventMode, setEventMode] = useState<"manual" | "auto">("auto");
  const [hideNames, setHideNames] = useState(false);
  const queryParams = useMemo(
    () => ({ page, pageSize, search, eventMode }),
    [eventMode, page, pageSize, search]
  );
  const eventsQuery = useQuery(["v3-events", queryParams], () => getEvents(queryParams), {
    keepPreviousData: true,
  });
  const events = eventsQuery.data?.data || [];
  const pagination = eventsQuery.data?.pagination;
  const typeFilters = useMemo(
    () =>
      Array.from(new Set(events.map((event) => changeTypeLabel(event)).filter((value) => value && value !== "-")))
        .sort((a, b) => a.localeCompare(b, "zh-CN"))
        .map((value) => ({ text: value, value })),
    [events]
  );

  const columns: ColumnsType<AssetEvent> = [
    {
      title: "序号",
      width: 96,
      render: (_value, _event, index) => {
        const total = pagination?.totalItems || 0;
        return total ? total - ((page - 1) * pageSize + index) : index + 1;
      },
    },
    {
      title: "姓名",
      width: 160,
      render: (_, event) => (
        <span className={hideNames ? "npcink-v3-name-blur" : undefined}>{changeActorName(event)}</span>
      ),
    },
    {
      title: "类型",
      width: 140,
      filters: typeFilters,
      onFilter: (value, event) => changeTypeLabel(event) === value,
      render: (_, event) => changeTypeLabel(event),
    },
    {
      title: "内容",
      render: (_, event) => <Text className="npcink-v3-change-content">{changeContentText(event)}</Text>,
    },
    {
      title: "设备",
      width: 260,
      render: (_, event) => {
        const asset = changeAssetLabelParts(event.asset);
        return (
          <span>
            <span className={hideNames && asset.name !== "-" ? "npcink-v3-name-blur" : undefined}>{asset.name}</span>
            {asset.suffix ? ` _ ${asset.suffix}` : ""}
          </span>
        );
      },
    },
    {
      title: "日期",
      dataIndex: "createdAt",
      width: 190,
      defaultSortOrder: "descend",
      sorter: (a, b) =>
        new Date(a.createdAt.replace(" ", "T")).getTime() - new Date(b.createdAt.replace(" ", "T")).getTime(),
      render: formatDate,
    },
  ];

  return (
    <div className="npcink-v3-section">
      <div className="npcink-v3-change-layout">
        <div className="npcink-v3-change-actions">
          <Button
            onClick={() => {
              setPage(1);
              setEventMode((value) => (value === "manual" ? "auto" : "manual"));
            }}
          >
            {eventMode === "manual" ? "手动变更数据" : "自动变更数据"}
          </Button>
          <Button onClick={() => setHideNames((value) => !value)}>
            {hideNames ? "显示姓名" : "隐藏姓名"}
          </Button>
        </div>
        <div className="npcink-v3-change-filters">
          <Input.Search
            allowClear
            placeholder="搜索资产、字段或说明"
            onSearch={(value) => {
              setPage(1);
              setSearch(value);
            }}
            className="npcink-v3-search"
          />
        </div>
      </div>
      <Table
        rowKey="id"
        size="middle"
        className="npcink-v3-change-table"
        columns={columns}
        dataSource={events}
        loading={eventsQuery.isLoading || eventsQuery.isFetching}
        scroll={{ x: 980 }}
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
  const [selectedIssueGroup, setSelectedIssueGroup] = useState<string>("全部");
  const [selectedIssueType, setSelectedIssueType] = useState<string>();
  const [hardwareRankType, setHardwareRankType] = useState<"cpu" | "disk" | "memory" | "board">("board");
  const [departmentView, setDepartmentView] = useState<AnalysisViewMode>("chart");
  const [hardwareRankView, setHardwareRankView] = useState<AnalysisViewMode>("chart");
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [showHandledIssues, setShowHandledIssues] = useState(false);
  const [handledIssueKeys, setHandledIssueKeys] = useState<Set<string>>(loadHandledIssueKeys);
  const auditAssetsQuery = useQuery(
    ["v3-hardware-audit-assets"],
    () => fetchAllAssets({ assetScope: "computer" }),
    { staleTime: 60_000 }
  );
  const auditAssets = auditAssetsQuery.data || [];
  const auditTotal = auditAssets.length;
  const auditStatus = countBy(auditAssets, (asset) => statusLabel(asset.status));
  const departmentOptions = useMemo(
    () =>
      Array.from(new Set(auditAssets.map((asset) => asset.department).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, "zh-CN")),
    [auditAssets]
  );
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
  const hardwareInventory = useMemo(() => {
    let disk = 0;
    let memory = 0;
    auditAssets.forEach((asset) => {
      const disks = hardwareArray(asset, "disks", "disk", "diskLayout");
      const memoryItems = hardwareArray(asset, "memory", "mem", "memLayout");
      disk += disks.length || (hardwareDiskBytes(asset) > 0 ? 1 : 0);
      memory += memoryItems.length || (hardwareMemoryBytes(asset) > 0 ? 1 : 0);
    });
    return {
      cpu: auditAssets.length,
      disk,
      memory,
      board: auditAssets.length,
    };
  }, [auditAssets]);
  const hardwareRankRows = useMemo(() => {
    const rows = new Map<string, number>();
    const add = (label: string, increment = 1) => {
      rows.set(label, (rows.get(label) || 0) + increment);
    };

    auditAssets.forEach((asset) => {
      const context = assetHardwareContext(asset);
      if (hardwareRankType === "cpu") {
        add(hardwareModelLabel(context.extracted.cpu, "CPU 未知"));
      } else if (hardwareRankType === "board") {
        add(hardwareModelLabel(context.extracted.baseboard, "主板未知"));
      } else if (hardwareRankType === "disk") {
        const disks = hardwareArray(asset, "disks", "disk", "diskLayout");
        if (disks.length) {
          disks.forEach((item) => {
            add(hardwareModelLabel(firstText(item.name, item.model, item.device, item.serialNum), "硬盘未知"));
          });
        } else {
          add(bucketLabel(
            hardwareDiskBytes(asset),
            [
              { max: 256 * 1024 ** 3, label: "小于 256 GB" },
              { max: 512 * 1024 ** 3, label: "256-511 GB" },
              { max: 1024 * 1024 ** 3, label: "512 GB-1 TB" },
              { max: Number.POSITIVE_INFINITY, label: "1 TB 以上" },
            ],
            "硬盘未知"
          ));
        }
      } else {
        const memoryItems = hardwareArray(asset, "memory", "mem", "memLayout");
        if (memoryItems.length) {
          memoryItems.forEach((item) => {
            const label = firstText(
              item.partNum,
              item.partNumber,
              item.model,
              [item.manufacturer, item.size ? formatBytes(item.size) : "", item.clockSpeed || item.clock ? `${item.clockSpeed || item.clock} MHz` : ""]
                .filter(Boolean)
                .join(" ")
            );
            add(hardwareModelLabel(label, "内存未知"));
          });
        } else {
          add(bucketLabel(
            hardwareMemoryBytes(asset),
            [
              { max: 8 * 1024 ** 3, label: "小于 8 GB" },
              { max: 16 * 1024 ** 3, label: "8-15 GB" },
              { max: 32 * 1024 ** 3, label: "16-31 GB" },
              { max: 64 * 1024 ** 3, label: "32-63 GB" },
              { max: Number.POSITIVE_INFINITY, label: "64 GB 以上" },
            ],
            "内存未知"
          ));
        }
      }
    });

    return sortedEntries(Object.fromEntries(rows)).slice(0, 12).map(([model, count]) => ({ model, count }));
  }, [auditAssets, hardwareRankType]);
  const departmentChartRows = useMemo<AnalysisBarDatum[]>(
    () =>
      departmentRows.map((row) => ({
        key: String(row.department),
        label: String(row.department),
        value: Number(row.total || 0),
        valueText: `${Number(row.total || 0)} 台 · ${percentText(Number(row.total || 0), auditTotal)}`,
        caption: `在用 ${Number(row.active || 0)} / 维护 ${Number(row.maintenance || 0)} / 归档 ${Number(row.deleted || 0)}`,
      })),
    [auditTotal, departmentRows]
  );
  const hardwareRankChartRows = useMemo<AnalysisBarDatum[]>(
    () =>
      hardwareRankRows.map((row) => ({
        key: row.model,
        label: row.model,
        value: row.count,
        valueText: `${row.count} ${hardwareRankType === "disk" ? "块" : hardwareRankType === "memory" ? "条" : "台"} · ${percentText(row.count, Math.max(hardwareInventory[hardwareRankType], 1))}`,
      })),
    [hardwareInventory, hardwareRankRows, hardwareRankType]
  );
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

  return (
    <div className="npcink-v3-section">
      <div className="npcink-v3-section-header">
        <div>
          <Title level={3}>硬件盘点</Title>
          <Text type="secondary">按采集快照查看 CPU、内存、硬盘、主板等硬件明细。</Text>
        </div>
        <Tag color="blue">{auditAssetsQuery.isLoading ? "统计中" : `${auditTotal} 台资产`}</Tag>
      </div>
      <div className="npcink-v3-hardware-overview">
        {[
          { key: "cpu", label: "CPU", unit: "个", value: hardwareInventory.cpu },
          { key: "disk", label: "硬盘", unit: "块", value: hardwareInventory.disk },
          { key: "memory", label: "内存", unit: "条", value: hardwareInventory.memory },
          { key: "board", label: "主板", unit: "个", value: hardwareInventory.board },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            className={hardwareRankType === item.key ? "is-active" : ""}
            onClick={() => setHardwareRankType(item.key as typeof hardwareRankType)}
          >
            <Text type="secondary">{item.label}（{item.unit}）</Text>
            <strong>{auditAssetsQuery.isLoading ? "-" : item.value}</strong>
          </button>
        ))}
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
            <div>
              <Text strong>部门状态</Text>
              <Text type="secondary">显示资产最多的部门</Text>
            </div>
            <ViewModeToggle value={departmentView} onChange={setDepartmentView} />
          </div>
          {departmentView === "chart" ? (
            <AnalysisBarChart
              rows={departmentChartRows}
              loading={auditAssetsQuery.isLoading}
              emptyText="暂无部门数据"
              valueFormatter={(value) => `${value} 台`}
            />
          ) : (
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
          )}
        </div>
        <div className="npcink-v3-audit-block is-wide">
          <div className="npcink-v3-audit-block-head">
            <div>
              <Text strong>型号分布</Text>
              <Text type="secondary">按当前硬件类型统计 Top 12</Text>
            </div>
            <Space size={8} className="npcink-v3-analysis-controls">
              <Space.Compact size="small">
                {[
                  { key: "cpu", label: "CPU" },
                  { key: "disk", label: "硬盘" },
                  { key: "memory", label: "内存" },
                  { key: "board", label: "主板" },
                ].map((item) => (
                  <Button
                    key={item.key}
                    size="small"
                    type={hardwareRankType === item.key ? "primary" : "default"}
                    onClick={() => setHardwareRankType(item.key as typeof hardwareRankType)}
                  >
                    {item.label}
                  </Button>
                ))}
              </Space.Compact>
              <ViewModeToggle value={hardwareRankView} onChange={setHardwareRankView} />
            </Space>
          </div>
          {hardwareRankView === "chart" ? (
            <AnalysisBarChart
              rows={hardwareRankChartRows}
              loading={auditAssetsQuery.isLoading}
              emptyText="暂无型号数据"
              valueFormatter={(value) => `${value}`}
            />
          ) : (
            <Table
              rowKey="model"
              size="small"
              pagination={false}
              dataSource={hardwareRankRows}
              loading={auditAssetsQuery.isLoading}
              columns={[
                { title: "型号", dataIndex: "model" },
                { title: "数量", dataIndex: "count", width: 120 },
              ]}
              locale={{ emptyText: <Empty description="暂无型号数据" /> }}
            />
          )}
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
      <DetailDrawer
        uuid={selectedUuid}
        open={Boolean(selectedUuid)}
        departmentOptions={departmentOptions}
        onClose={() => setSelectedUuid(null)}
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

interface AssetValueGroupRow {
  key: string;
  label: string;
  count: number;
  purchase: number;
  current: number;
  depreciation: number;
  currentRate: number;
}

const moneyValue = (value: unknown) => {
  const number = toNumber(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

const formatPercentValue = (value: number) =>
  `${new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)}%`;

const AssetValueWorkspace = () => {
  const [valueViews, setValueViews] = useState<Record<"department" | "category" | "status", AnalysisViewMode>>({
    department: "chart",
    category: "chart",
    status: "chart",
  });
  const settingsQuery = useQuery(["v3-settings"], getSettings, { staleTime: 60_000 });
  const assetsQuery = useQuery(
    ["v3-asset-value-analysis"],
    () => fetchAllAssets({ assetScope: "all" }),
    { staleTime: 60_000 }
  );
  const assets = assetsQuery.data || [];
  const valueAssets = assets.filter((asset) => asset.status !== "deleted");
  const defaultResidualRate = settingsQuery.data?.defaultResidualRate ?? 5;
  const currentValue = (asset: Asset) => {
    const explicitCurrent = moneyValue(asset.residualValue);
    const purchase = moneyValue(asset.purchasePrice);
    if (explicitCurrent > 0 || purchase <= 0) {
      return explicitCurrent;
    }
    return purchase * (defaultResidualRate / 100);
  };
  const totalPurchase = valueAssets.reduce((total, asset) => total + moneyValue(asset.purchasePrice), 0);
  const totalCurrent = valueAssets.reduce((total, asset) => total + currentValue(asset), 0);
  const totalDepreciation = Math.max(totalPurchase - totalCurrent, 0);
  const currentRate = totalPurchase > 0 ? (totalCurrent / totalPurchase) * 100 : 0;
  const depreciationRate = totalPurchase > 0 ? (totalDepreciation / totalPurchase) * 100 : 0;

  const buildGroupRows = (getLabel: (asset: Asset) => string): AssetValueGroupRow[] => {
    const grouped = valueAssets.reduce<Record<string, AssetValueGroupRow>>((result, asset) => {
      const label = getLabel(asset) || "未填写";
      if (!result[label]) {
        result[label] = {
          key: label,
          label,
          count: 0,
          purchase: 0,
          current: 0,
          depreciation: 0,
          currentRate: 0,
        };
      }
      const purchase = moneyValue(asset.purchasePrice);
      const current = currentValue(asset);
      result[label].count += 1;
      result[label].purchase += purchase;
      result[label].current += current;
      result[label].depreciation += Math.max(purchase - current, 0);
      return result;
    }, {});
    return Object.values(grouped)
      .map((row) => ({
        ...row,
        currentRate: row.purchase > 0 ? (row.current / row.purchase) * 100 : 0,
      }))
      .sort((a, b) => b.purchase - a.purchase);
  };

  const departmentRows = buildGroupRows((asset) => asset.department || "未填写").slice(0, 8);
  const categoryRows = buildGroupRows((asset) => asset.category || assetTypeLabel(asset.assetType)).slice(0, 8);
  const statusRows = buildGroupRows((asset) => statusLabel(asset.status));
  const valueChartRows = (rows: AssetValueGroupRow[]): AnalysisBarDatum[] =>
    rows.map((row) => ({
      key: row.key,
      label: row.label,
      value: row.purchase,
      caption: `${row.count} 条资产 / 当前估值 ${formatMoney(row.current)} / 估值率 ${formatPercentValue(row.currentRate)}`,
    }));
  const setValueView = (key: keyof typeof valueViews, mode: AnalysisViewMode) => {
    setValueViews((previous) => ({ ...previous, [key]: mode }));
  };
  const valueColumns: ColumnsType<AssetValueGroupRow> = [
    { title: "维度", dataIndex: "label" },
    { title: "数量", dataIndex: "count", width: 90 },
    { title: "采购价", dataIndex: "purchase", width: 150, render: formatMoney },
    { title: "当前估值", dataIndex: "current", width: 150, render: formatMoney },
    { title: "估值率", dataIndex: "currentRate", width: 110, render: formatPercentValue },
  ];

  return (
    <div className="npcink-v3-section">
      <div className="npcink-v3-section-header">
        <div>
          <Title level={3}>资产价值</Title>
              <Text type="secondary">按采购价和当前估值查看资产规模、折价和部门分布。</Text>
        </div>
        <Tag color="blue">{assetsQuery.isLoading ? "统计中" : `纳入 ${valueAssets.length} 条资产`}</Tag>
      </div>

      <div className="npcink-v3-summary-strip">
        {[
          { label: "资产数量", value: String(valueAssets.length), note: "不含已归档" },
          { label: "总采购价", value: formatMoney(totalPurchase), note: "采购价合计" },
          { label: "当前估值", value: formatMoney(totalCurrent), note: "二手价/残值字段，缺失时按默认残值率估算", meter: currentRate },
          { label: "已折价", value: formatMoney(totalDepreciation), note: "采购价 - 当前估值", meter: depreciationRate },
          { label: "估值率", value: formatPercentValue(currentRate), note: "当前估值 / 采购价", meter: currentRate },
          { label: "折价率", value: formatPercentValue(depreciationRate), note: "已折价 / 采购价", meter: depreciationRate },
        ].map((item, index) => (
          <div key={item.label} className={`npcink-v3-summary-item${index === 1 ? " is-primary" : ""}`}>
            <Text type="secondary">{item.label}</Text>
            <strong>{assetsQuery.isLoading ? "-" : item.value}</strong>
            {"meter" in item ? (
              <div className="npcink-v3-summary-mini-meter">
                <i style={{ width: `${Math.min(Math.max(Number(item.meter || 0), 0), 100)}%` }} />
              </div>
            ) : null}
            <span>{item.note}</span>
          </div>
        ))}
      </div>

      <div className="npcink-v3-audit-panel">
        <div className="npcink-v3-audit-block">
          <div className="npcink-v3-audit-block-head">
            <div>
              <Text strong>部门价值</Text>
              <Text type="secondary">按采购价排序</Text>
            </div>
            <ViewModeToggle value={valueViews.department} onChange={(mode) => setValueView("department", mode)} />
          </div>
          {valueViews.department === "chart" ? (
            <AnalysisBarChart
              rows={valueChartRows(departmentRows)}
              loading={assetsQuery.isLoading}
              emptyText="暂无部门价值数据"
              valueFormatter={formatMoney}
            />
          ) : (
            <Table
              rowKey="key"
              size="small"
              pagination={false}
              dataSource={departmentRows}
              loading={assetsQuery.isLoading}
              columns={valueColumns}
              scroll={{ x: 620 }}
              locale={{ emptyText: <Empty description="暂无部门价值数据" /> }}
            />
          )}
        </div>
        <div className="npcink-v3-audit-block">
          <div className="npcink-v3-audit-block-head">
            <div>
              <Text strong>分类价值</Text>
              <Text type="secondary">按采购价排序</Text>
            </div>
            <ViewModeToggle value={valueViews.category} onChange={(mode) => setValueView("category", mode)} />
          </div>
          {valueViews.category === "chart" ? (
            <AnalysisBarChart
              rows={valueChartRows(categoryRows)}
              loading={assetsQuery.isLoading}
              emptyText="暂无分类价值数据"
              valueFormatter={formatMoney}
            />
          ) : (
            <Table
              rowKey="key"
              size="small"
              pagination={false}
              dataSource={categoryRows}
              loading={assetsQuery.isLoading}
              columns={valueColumns}
              scroll={{ x: 620 }}
              locale={{ emptyText: <Empty description="暂无分类价值数据" /> }}
            />
          )}
        </div>
        <div className="npcink-v3-audit-block is-wide">
          <div className="npcink-v3-audit-block-head">
            <div>
              <Text strong>状态价值</Text>
              <Text type="secondary">查看在用、停用、维护等状态的金额分布</Text>
            </div>
            <ViewModeToggle value={valueViews.status} onChange={(mode) => setValueView("status", mode)} />
          </div>
          {valueViews.status === "chart" ? (
            <AnalysisBarChart
              rows={valueChartRows(statusRows)}
              loading={assetsQuery.isLoading}
              emptyText="暂无状态价值数据"
              valueFormatter={formatMoney}
            />
          ) : (
            <Table
              rowKey="key"
              size="small"
              pagination={false}
              dataSource={statusRows}
              loading={assetsQuery.isLoading}
              columns={valueColumns}
              scroll={{ x: 620 }}
              locale={{ emptyText: <Empty description="暂无状态价值数据" /> }}
            />
          )}
        </div>
      </div>

      <Collapse
        className="npcink-v3-formula-collapse"
        items={[
          {
            key: "formula",
            label: "计算口径",
            children: (
              <div className="npcink-v3-formula-copy">
                <p>当前估值 = 资产的二手价/残值字段合计；缺失时按设置中的默认残值率估算。</p>
                <p>已折价 = 总采购价 - 当前估值。</p>
                <p>估值率 = 当前估值 / 总采购价。</p>
                <p>折价率 = 已折价 / 总采购价。</p>
                <p>当前默认残值率：{formatPercentValue(defaultResidualRate)}。</p>
                <p>已归档资产不纳入默认统计。</p>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

const AnalysisWorkspace = () => (
  <Tabs
    defaultActiveKey="hardware"
    className="npcink-v3-analysis-tabs"
    items={[
      {
        key: "hardware",
        label: "硬件盘点",
        children: <HardwareAuditWorkspace />,
      },
      {
        key: "value",
        label: "资产价值",
        children: <AssetValueWorkspace />,
      },
    ]}
  />
);

const SettingsWorkspace = () => {
  const [form] = Form.useForm<InventorySettings>();
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const clientUploadBaseUrl = Form.useWatch("clientUploadBaseUrl", form);
  const publicQueryPageSlug = Form.useWatch("publicQueryPageSlug", form);
  const queryClient = useQueryClient();
  const settingsQuery = useQuery(["v3-settings"], getSettings);
  const settingsMutation = useMutation(updateSettings, {
    onSuccess: (settings) => {
      queryClient.setQueryData(["v3-settings"], settings);
      form.setFieldsValue({ publicQueryAccessCode: "" });
      message.success("设置已保存");
    },
  });
  const publicPageMutation = useMutation(createPublicQueryPage, {
    onSuccess: (page) => {
      queryClient.setQueryData<InventorySettings | undefined>(["v3-settings"], (current) =>
        current
          ? {
              ...current,
              publicQueryPageSlug: page.slug,
              publicQueryPage: page,
            }
          : current
      );
      form.setFieldsValue({ publicQueryPageSlug: page.slug });
      message.success("公开查询页面已更新");
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      form.setFieldsValue(settingsQuery.data);
    }
  }, [form, settingsQuery.data]);

  const publicQueryPageUrl = useMemo(() => {
    if (settingsQuery.data?.publicQueryPage?.url) {
      return settingsQuery.data.publicQueryPage.url;
    }
    const slug = (publicQueryPageSlug || "public-search-page").trim();
    if (!Site || !slug) {
      return "";
    }
    return `${Site.replace(/\/$/, "")}/${slug.replace(/^\//, "")}/`;
  }, [publicQueryPageSlug, settingsQuery.data?.publicQueryPage?.url]);
  const publicQueryPage = settingsQuery.data?.publicQueryPage;
  const hasPublicQueryPage = Boolean(publicQueryPage?.exists);
  const clientUploadEndpoint = useMemo(
    () => buildClientUploadEndpoint(clientUploadBaseUrl || RestUrl),
    [clientUploadBaseUrl]
  );

  return (
    <div className="npcink-v3-section">
      <div className="npcink-v3-section-header">
        <div>
          <Title level={3}>设置</Title>
          <Text type="secondary">管理公开查询、资产编号和采集客户端授权。</Text>
        </div>
        <Button onClick={() => setTokenModalOpen(true)}>客户端接入</Button>
      </div>
      <div className="npcink-v3-settings-panel">
        <Form
          form={form}
          className="npcink-v3-global-settings-form"
          layout="vertical"
          onFinish={(values) => settingsMutation.mutate(values)}
        >
          <div className="npcink-v3-settings-section">
            <Title level={4}>客户端接入</Title>
            <div className="npcink-v3-settings-grid">
              <Form.Item
                name="clientUploadBaseUrl"
                label="外部访问地址"
                extra="留空使用当前站点 REST 地址；反向代理、内网穿透或 HTTPS 域名不一致时再填写。"
                className="npcink-v3-settings-wide"
              >
                <Input placeholder={RestUrl} />
              </Form.Item>
            </div>
            <div className="npcink-v3-client-endpoint">
              <Text type="secondary">客户端上传地址</Text>
              <Text copyable code>
                {clientUploadEndpoint}
              </Text>
            </div>
          </div>
          <div className="npcink-v3-settings-section">
            <Title level={4}>公开查询与编号</Title>
            <div className="npcink-v3-settings-grid">
              <Form.Item
                name="publicQueryEnabled"
                label="公开查询"
                valuePropName="checked"
                extra="控制公开查询入口是否允许读取已开放的资产信息。"
              >
                <Switch checkedChildren="启用" unCheckedChildren="关闭" />
              </Form.Item>
              <Form.Item
                name="assetNumberPrefix"
                label="资产编号前缀"
                extra="仅允许字母、数字、下划线和短横线。"
              >
                <Input placeholder="例如：A" />
              </Form.Item>
              <Form.Item
                name="publicQueryPageSlug"
                label="公共查询页面"
                extra={publicQueryPageUrl || "保存页面别名后，可用于后续公开查询入口。"}
                className="npcink-v3-settings-wide"
              >
                <Input placeholder="public-search-page" />
              </Form.Item>
              <Form.Item
                name="publicQueryAccessCode"
                label={
                  <span>
                    查询访问码{" "}
                    <Tag color={settingsQuery.data?.publicQueryAccessCodeSet ? "green" : "default"}>
                      {settingsQuery.data?.publicQueryAccessCodeSet ? "已设置" : "未设置"}
                    </Tag>
                  </span>
                }
                extra="留空不会修改当前访问码；设置后，公开查询页面必须输入访问码。"
                className="npcink-v3-settings-wide"
              >
                <Input.Password placeholder="输入新的查询访问码" autoComplete="new-password" />
              </Form.Item>
            </div>
            <div className="npcink-v3-client-endpoint">
              <Text type="secondary">查询页面</Text>
              <div className="npcink-v3-public-page-box">
                <div className="npcink-v3-public-page-status">
                  <Tag color={hasPublicQueryPage ? "green" : "default"}>
                    {hasPublicQueryPage ? "已创建" : "未创建"}
                  </Tag>
                  <Text copyable={Boolean(publicQueryPageUrl)} code>
                    {publicQueryPageUrl || "-"}
                  </Text>
                </div>
                <div className="npcink-v3-public-page-actions">
                  <Button
                    onClick={() =>
                      publicPageMutation.mutate({
                        publicQueryPageSlug: form.getFieldValue("publicQueryPageSlug"),
                      })
                    }
                    loading={publicPageMutation.isLoading}
                  >
                    {hasPublicQueryPage ? "更新页面" : "创建页面"}
                  </Button>
                  <Button
                    href={publicQueryPage?.editUrl || undefined}
                    target="_blank"
                    disabled={!publicQueryPage?.editUrl}
                  >
                    编辑页面
                  </Button>
                  <Button
                    href={publicQueryPage?.url || undefined}
                    target="_blank"
                    disabled={!publicQueryPage?.url}
                  >
                    打开页面
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="npcink-v3-settings-section">
            <Title level={4}>资产估值</Title>
            <div className="npcink-v3-settings-grid">
              <Form.Item
                name="depreciationPeriodMonths"
                label="折旧年限"
                extra="用于资产价值分析中的默认折旧周期。"
              >
                <InputNumber
                  min={1}
                  precision={0}
                  className="npcink-v3-number"
                  addonAfter="月"
                />
              </Form.Item>
              <Form.Item
                name="defaultResidualRate"
                label="默认残值率"
                extra="用于没有单独残值数据时的估算参考。"
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  className="npcink-v3-number"
                  addonAfter="%"
                />
              </Form.Item>
            </div>
          </div>
          <div className="npcink-v3-settings-section">
            <Title level={4}>维护</Title>
            <div className="npcink-v3-settings-grid">
              <Form.Item
                name="observationRetentionDays"
                label="采集记录保留天数"
                extra="0 表示不按天数自动清理。"
              >
                <InputNumber min={0} precision={0} className="npcink-v3-number" addonAfter="天" />
              </Form.Item>
              <Form.Item
                name="deleteDataOnUninstall"
                label="卸载时删除数据"
                valuePropName="checked"
                extra="开启后，删除插件时会清理插件数据表和设置。"
              >
                <Switch checkedChildren="删除" unCheckedChildren="保留" />
              </Form.Item>
            </div>
          </div>
          <div className="npcink-v3-settings-actions">
            <Button type="primary" htmlType="submit" loading={settingsMutation.isLoading}>
              保存设置
            </Button>
          </div>
        </Form>
        <div className="npcink-v3-settings-section npcink-v3-settings-utility">
          <div>
            <Title level={4}>数据迁移</Title>
            <Text type="secondary">从旧版插件备份文件导入历史资产数据。</Text>
          </div>
          <Button onClick={() => setImportModalOpen(true)}>导入旧数据</Button>
        </div>
      </div>
      <TokenModal open={tokenModalOpen} onClose={() => setTokenModalOpen(false)} />
      <LegacyImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImported={() => queryClient.invalidateQueries(["v3-assets"])}
      />
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
  const isPc = isComputerAsset(asset);
  const customInfo = !isPc ? customAssetInfo(asset) : null;
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
      {customInfo ? (
        <div className="npcink-v3-asset-card-body npcink-v3-custom-card-body">
          <h3>{customInfo.title}</h3>
          <dl>
            <div>
              <dt>编号：</dt>
              <dd>{customInfo.number || "-"}</dd>
            </div>
            <div>
              <dt>分类：</dt>
              <dd>{customInfo.category || "-"}</dd>
            </div>
            <div>
              <dt>使用：</dt>
              <dd>{customInfo.usage || "-"}</dd>
            </div>
            <div>
              <dt>价格：</dt>
              <dd>{customInfo.priceText}</dd>
            </div>
            <div>
              <dt>状态：</dt>
              <dd>{customInfo.status || "-"}</dd>
            </div>
            <div>
              <dt>时间：</dt>
              <dd>{formatDate(customInfo.createdAt)}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <>
          <div className="npcink-v3-asset-card-brand">
          <div className="npcink-v3-card-os-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
            <strong>{extracted.platform || "Windows"}</strong>
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
        </>
      )}
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
  const [searchDraft, setSearchDraft] = useState("");
  const [assetScope, setAssetScope] = useState<AssetScope>(initialScope);
  const [assetType, setAssetType] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [category, setCategory] = useState<string | undefined>();
  const [purchasePlatform, setPurchasePlatform] = useState<string | undefined>();
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
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
      category: assetScope === "other" ? category : undefined,
      purchasePlatform: assetScope === "other" ? purchasePlatform : undefined,
    }),
    [assetScope, assetType, category, page, pageSize, purchasePlatform, search, status]
  );
  const assetsQuery = useQuery(["v3-assets", queryParams], () => getAssets(queryParams), {
    keepPreviousData: true,
  });

  useEffect(() => {
    setSelectedUuids(new Set());
  }, [assetScope, assetType, category, page, pageSize, purchasePlatform, search, status]);

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
  const departmentOptions = useMemo(
    () =>
      Array.from(new Set(assets.map((asset) => asset.department).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, "zh-CN")),
    [assets]
  );
  const selectedCount = selectedUuids.size;
  const allSelected = assets.length > 0 && assets.every((asset) => selectedUuids.has(asset.uuid));
  const activeCount = countStatus(assets, "active");
  const maintenanceCount = countStatus(assets, "maintenance");
  const activeScopeLabel =
    title || ASSET_SCOPE_OPTIONS.find((item) => item.value === assetScope)?.label || "资产";
  const categoryOptions = useMemo(
    () =>
      Array.from(new Set([...DEFAULT_CUSTOM_CATEGORIES, ...assets.map((asset) => asset.category).filter(Boolean)]))
        .sort((a, b) => a.localeCompare(b, "zh-CN"))
        .map((value) => ({ label: value, value })),
    [assets]
  );

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
    setCategory(filter.category);
    setPurchasePlatform(filter.purchasePlatform);
    setSearch(filter.search || "");
    setSearchDraft(filter.search || "");
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
        category,
        purchasePlatform,
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

  const submitSearch = () => {
    setPage(1);
    setSearch(searchDraft.trim());
  };

  const updateSearchDraft = (value: string) => {
    setSearchDraft(value);
    if (!value && search) {
      setPage(1);
      setSearch("");
    }
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
          <Select
            allowClear
            placeholder={assetScope === "other" ? "设备状态" : "状态"}
            options={STATUS_OPTIONS}
            value={status}
            onChange={(value) => {
              setPage(1);
              setStatus(value);
            }}
            className="npcink-v3-filter"
          />
          {assetScope === "other" ? (
            <>
              <Select
                allowClear
                placeholder="分类"
                options={categoryOptions}
                value={category}
                onChange={(value) => {
                  setPage(1);
                  setCategory(value);
                }}
                className="npcink-v3-filter"
              />
              <Select
                allowClear
                placeholder="采购平台"
                options={CUSTOM_PURCHASE_PLATFORM_OPTIONS}
                value={purchasePlatform}
                onChange={(value) => {
                  setPage(1);
                  setPurchasePlatform(value);
                }}
                className="npcink-v3-filter"
              />
            </>
          ) : assetScope !== "computer" ? (
            <Select
              allowClear
              placeholder="资产类型"
              options={ASSET_TYPES}
              value={assetType}
              onChange={(value) => {
                setPage(1);
                setAssetType(value);
              }}
              className="npcink-v3-filter"
            />
          ) : null}
          <div className="npcink-v3-toolbar-search">
            <Input
              allowClear
              value={searchDraft}
              placeholder={assetScope === "other" ? "搜索姓名、订单号、产品名称" : "搜索编号、名称、使用人、部门"}
              onChange={(event) => updateSearchDraft(event.target.value)}
              onPressEnter={submitSearch}
            />
            <Button
              aria-label="搜索资产"
              icon={<SearchOutlined />}
              onClick={submitSearch}
            />
          </div>
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
          {assetScope === "other" ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              新增
            </Button>
          ) : null}
          <Dropdown
            menu={{
              items: [
                { key: "export", label: "导出筛选" },
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
                if (key === "export") {
                  exportCurrentFilter();
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
            <Button>更多</Button>
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
            <div className="npcink-v3-empty-state">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  assetScope === "other"
                    ? "暂无自定义资产，可新增自定义资产或在设置中导入旧数据"
                    : "暂无电脑资产，可在设置中导入旧数据或等待客户端采集"
                }
              />
            </div>
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
        departmentOptions={departmentOptions}
        onClose={() => setSelectedUuid(null)}
        onArchive={confirmArchive}
      />
      <AssetFormModal
        asset={editingAsset}
        open={assetModalOpen}
        onClose={() => setAssetModalOpen(false)}
        onSubmit={submitAsset}
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
            key: "analysis",
            label: "分析",
            children: <AnalysisWorkspace />,
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
