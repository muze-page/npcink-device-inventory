import { Fragment, type ReactNode, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppleFilled, DesktopOutlined, PlusOutlined, SearchOutlined, WindowsFilled } from "@ant-design/icons";
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
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import type { SelectProps } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { InitialAssets, RestUrl, Site } from "@/utils/index";
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
  getIssueStates,
  getObservations,
  getSettings,
  restoreBackup,
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
  BackupRestoreSummary,
  ClientToken,
  CreatedClientToken,
  InventorySettings,
  JsonRecord,
  PaginatedResult,
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
  { label: "闲置", value: "inactive" },
  { label: "维护", value: "maintenance" },
  { label: "报废", value: "retired" },
  { label: "已归档", value: "deleted" },
];

const EDITABLE_STATUS_OPTIONS = STATUS_OPTIONS.filter((item) => item.value !== "deleted");
const AVAILABLE_ASSET_STATUSES = new Set(["active", "inactive"]);

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

const ASSET_IMPORT_FIELDS = [
  { label: "资产编号", value: "assetNumber", required: true },
  { label: "资产名称", value: "name" },
  { label: "资产类型", value: "assetType" },
  { label: "使用人", value: "ownerName" },
  { label: "部门", value: "department" },
  { label: "状态", value: "status" },
  { label: "分类", value: "category" },
  { label: "购置价格", value: "purchasePrice" },
  { label: "残值", value: "residualValue" },
  { label: "购置日期", value: "purchaseDate" },
  { label: "CPU", value: "cpu" },
  { label: "内存", value: "memory" },
  { label: "硬盘", value: "disk" },
  { label: "IP", value: "ip" },
  { label: "备注", value: "notes" },
] as const;

type AssetImportFieldKey = (typeof ASSET_IMPORT_FIELDS)[number]["value"];
type AssetImportStrategy = "create-only" | "update-by-number" | "upsert-by-number";
type AssetImportSection = "basic" | "finance" | "hardware";
type BackupExportSection = "settings" | "assets" | "identities" | "events" | "observations";

interface AssetImportPreviewRow {
  key: string;
  rowNumber: number;
  input: AssetInput;
  purchaseDate?: string;
  manualHardware: JsonRecord;
  errors: string[];
  existing?: Asset;
  action: "create" | "update" | "skip" | "invalid";
}

type AssetExportFieldKey =
  | "assetNumber"
  | "name"
  | "assetType"
  | "ownerName"
  | "department"
  | "status"
  | "category"
  | "purchasePrice"
  | "residualValue"
  | "purchaseDate"
  | "cpu"
  | "memory"
  | "disk"
  | "ip"
  | "graphics"
  | "deviceModel"
  | "baseboard"
  | "createdAt"
  | "updatedAt";

type AssetExportScope = "current-filter" | "selected" | "computer" | "custom" | "all";

const DEFAULT_ASSET_IMPORT_SECTIONS: AssetImportSection[] = ["basic", "finance", "hardware"];
const DEFAULT_BACKUP_EXPORT_SECTIONS: BackupExportSection[] = ["settings", "assets", "identities", "events", "observations"];

const BACKUP_RESTORE_SECTION_LABELS: Record<keyof BackupRestoreSummary["available"], string> = {
  settings: "设置",
  assets: "资产台账",
  identities: "设备匹配标识",
  events: "变更记录",
  observations: "电脑采集快照",
};

const BACKUP_RESTORE_PLAN_LABELS: Record<keyof BackupRestoreSummary["planned"], string> = {
  settings: "设置恢复",
  assetsCreated: "新增资产",
  assetsUpdated: "更新资产",
  identitiesCreated: "新增设备匹配标识",
  identitiesExisting: "已存在设备匹配标识",
  observationsCreated: "新增电脑采集快照",
  observationsExisting: "已存在电脑采集快照",
  eventsCreated: "新增变更记录",
  eventsExisting: "已存在变更记录",
};

const SAVED_FILTER_STORAGE_KEY = "npcink-device-inventory.savedFilters";
const WORKSPACE_TAB_STORAGE_KEY = "npcink-device-inventory.workspaceTab";
const ANALYSIS_TAB_STORAGE_KEY = "npcink-device-inventory.analysisTab.v2";
const ASSET_LAYOUT_MODE_STORAGE_KEY = "npcink-device-inventory.assetLayoutMode";

const loadStoredTab = <T extends string>(storageKey: string, allowedKeys: readonly T[], fallback: T): T => {
  try {
    const value = window.localStorage.getItem(storageKey);
    return allowedKeys.includes(value as T) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
};

const saveStoredTab = (storageKey: string, value: string) => {
  try {
    window.localStorage.setItem(storageKey, value);
  } catch {
    // Ignore private browsing or storage quota failures; tab navigation should still work.
  }
};

const statusColor: Record<string, string> = {
  active: "green",
  inactive: "default",
  maintenance: "orange",
  retired: "blue",
  deleted: "red",
};

const statusLabel = (value: string) =>
  STATUS_OPTIONS.find((item) => item.value === value)?.label || value || "-";

const shouldCountAsset = (asset: Pick<Asset, "status">, countAvailableAssetsOnly: boolean) =>
  !countAvailableAssetsOnly || AVAILABLE_ASSET_STATUSES.has(asset.status);

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

const parseDateValue = (value?: string) => {
  if (!value) {
    return null;
  }
  const text = value.trim();
  if (!text) {
    return null;
  }
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T00:00:00`)
    : new Date(text.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateInput = (value?: string) => {
  const date = parseDateValue(value);
  if (!date) {
    return value || "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const formatMemoryDiskText = (summary: JsonRecord, manualHardware?: JsonRecord) => {
  const memory = formatBytes(summary.memory_bytes);
  const disk = formatBytes(summary.disk_bytes);
  const manualMemory = fieldText(manualHardware?.memory);
  const manualDisk = fieldText(manualHardware?.disk);
  return `${memory !== "-" ? memory : manualMemory} / ${disk !== "-" ? disk : manualDisk}`;
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
  manualHardware: JsonRecord,
  fallback: string
) => {
  const memoryDisk = formatMemoryDiskText(summary, manualHardware);
  const vendor = cpuVendorLabel(cpu);
  if (vendor && memoryDisk !== "- / -") {
    return `${vendor} / ${memoryDisk}`;
  }
  if (memoryDisk !== "- / -") {
    return memoryDisk;
  }
  return vendor || fallback;
};

type PlatformKind = "macos" | "windows" | "device";

interface PlatformVisual {
  kind: PlatformKind;
  label: string;
}

const resolvePlatformVisual = (...values: unknown[]): PlatformVisual => {
  const text = values
    .map((value) => String(value || ""))
    .join(" ")
    .toLowerCase();
  if (/macos|mac\s*os|darwin|\bmac\b|macbook|imac|mac\s*mini|mac\s*studio|apple\s*m\d|\bm\d\s*(pro|max|ultra)?\b/i.test(text)) {
    return { kind: "macos", label: "macOS" };
  }
  if (/windows|win32|win64|\bwin\b/i.test(text)) {
    return { kind: "windows", label: "Windows" };
  }
  return { kind: "device", label: "Device" };
};

const platformIcon = (kind: PlatformKind) => {
  if (kind === "macos") {
    return <AppleFilled />;
  }
  if (kind === "windows") {
    return <WindowsFilled />;
  }
  return <DesktopOutlined />;
};

const PlatformMark = ({ visual, variant }: { visual: PlatformVisual; variant: "card" | "hero" }) => (
  <div className={`npcink-v3-platform-mark is-${variant} is-${visual.kind}`} aria-hidden="true">
    {platformIcon(visual.kind)}
  </div>
);

const countStatus = (assets: Asset[], status: string) =>
  assets.filter((asset) => asset.status === status).length;

const fetchAllAssets = async (params: AssetListParams = {}) => {
  const first = await getAssets({ ...params, page: 1, pageSize: 100 });
  const assets = [...first.data];
  const totalPages = first.pagination.totalPages || 1;
  for (let nextPage = 2; nextPage <= totalPages; nextPage += 1) {
    const next = await getAssets({ ...params, page: nextPage, pageSize: 100 });
    assets.push(...next.data);
  }
  return assets;
};

const firstPositiveNumber = (...values: unknown[]) => {
  for (const value of values) {
    const number = toNumber(value);
    if (number > 0) {
      return number;
    }
  }
  return 0;
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

const hardwareCapacityLabel = (value: unknown, fallback: string) => {
  const text = capacityLabel(toNumber(value));
  return text === "-" ? fallback : text;
};

const hardwareItemBytes = (item: JsonRecord) =>
  firstPositiveNumber(item.size, item.sizeBytes, item.size_bytes, item.capacity, item.capacityBytes, item.capacity_bytes, item.total);

const diskKindLabel = (item: JsonRecord) => {
  const typeText = [
    item.type,
    item.mediaType,
    item.media_type,
    item.kind,
    item.busType,
    item.bus_type,
  ].map(fieldText).join(" ").toLowerCase();
  const identityText = [
    item.name,
    item.model,
    item.caption,
    item.description,
    item.interfaceType,
    item.interface_type,
    item.device,
  ].map(fieldText).join(" ").toLowerCase();
  const text = `${typeText} ${identityText}`;
  if (/(ssd|solid\s*state|nvme|m\.?2|固态)/i.test(text)) {
    return "固态";
  }
  if (/(^|\s)(hdd|mechanical)(\s|$)|hard\s*disk\s*drive|机械|st\d{3,}|wdc\s+wd|toshiba\s+dt|dt01/i.test(text)) {
    return "机械";
  }
  return "未知类型";
};

const cardBaseboardLabel = (value: unknown) => {
  const text = hardwareModelLabel(value, "-").replace(/\s*\([^)]*\)\s*$/g, "").trim();
  if (!text || text === "-") {
    return "-";
  }
  const tokens = text.split(" ");
  const chipsetIndex = tokens.findIndex((token) => /^(?:H|B|Z|X|A|Q|W)\d{3}[A-Z0-9-]*/i.test(token));
  return chipsetIndex >= 0 ? tokens.slice(chipsetIndex).join(" ") : text;
};

const cardCpuLabel = (value: unknown) => {
  const text = hardwareModelLabel(value, "-")
    .replace(/\b(?:Gen\s+)?Intel(?:\(R\)|®)?\s*/gi, "")
    .replace(/\bCore(?:\(TM\)|™)?\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text || text === "-") {
    return "-";
  }
  const matched = text.match(/\b(?:i[3579]-\d{3,5}[A-Z]*|Ryzen\s+[3579]\s+\d{3,5}[A-Z]*|Apple\s+M\d(?:\s+(?:Pro|Max|Ultra))?)\b/i);
  return matched ? matched[0] : text;
};

const cardGraphicsLabel = (value: unknown) => {
  const text = hardwareModelLabel(value, "-")
    .replace(/\bNVIDIA\s+(?:GeForce\s+)?/gi, "")
    .replace(/\bIntel(?:\(R\)|®)?\s*/gi, "")
    .replace(/\bAMD\s+/gi, "")
    .replace(/\(R\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text || text === "-") {
    return "-";
  }
  const matched = text.match(/\b(?:RTX|GTX|RX|Arc)\s+[A-Z0-9 ]+\b/i);
  return matched ? matched[0].trim() : text;
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

const downloadCsvFile = (filename: string, text: string) => {
  downloadTextFile(filename, `\uFEFF${text}`);
};

const downloadJsonFile = (filename: string, value: unknown) => {
  downloadTextFile(filename, JSON.stringify(value, null, 2), "application/json;charset=utf-8");
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

const pickRowValue = (row: JsonRecord, keys: readonly string[]) => {
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

const importFieldValue = (row: JsonRecord, field: AssetImportFieldKey) => {
  const fieldConfig = ASSET_IMPORT_FIELDS.find((item) => item.value === field);
  return pickRowValue(row, [field, fieldConfig?.label || ""]);
};

const assetPurchaseRecord = (asset: Asset | null): JsonRecord => {
  const purchase = getRecord(getRecord(asset?.metadata).purchase);
  return Object.keys(purchase).length ? purchase : {};
};

const isComputerAsset = (asset?: Asset | null) =>
  asset?.assetType === "pc" || asset?.assetType === "computer";

const assetPurchaseDateText = (asset: Asset) => {
  const purchase = getRecord(getRecord(asset.metadata).purchase);
  return firstText(purchase.order_time, asset.createdAt);
};

const assetUpdateTimeText = (asset: Asset) =>
  formatDate(asset.latestObservation?.observedAt || asset.updatedAt);

const searchHighlightKeyword = (keyword?: string) => (keyword || "").trim();

const shouldHighlightText = (text: string, keyword: string, exactShortMatch = false) => {
  if (!keyword || text === "-") {
    return false;
  }
  if (keyword.length >= 2) {
    return text.toLowerCase().includes(keyword.toLowerCase());
  }
  return exactShortMatch && text.toLowerCase() === keyword.toLowerCase();
};

const highlightText = (value: unknown, keyword?: string, exactShortMatch = false): ReactNode => {
  const text = fieldText(value);
  const normalizedKeyword = searchHighlightKeyword(keyword);
  if (!shouldHighlightText(text, normalizedKeyword, exactShortMatch)) {
    return text;
  }
  const index = text.toLowerCase().indexOf(normalizedKeyword.toLowerCase());
  if (index < 0) {
    return text;
  }
  const before = text.slice(0, index);
  const match = text.slice(index, index + normalizedKeyword.length);
  const after = text.slice(index + normalizedKeyword.length);
  return (
    <>
      {before}
      <mark className="npcink-v3-search-highlight">{match}</mark>
      {after}
    </>
  );
};

const ASSET_LIST_CACHE_PREFIX = "npcinkDeviceInventoryAssetList:";
const ASSET_LIST_CACHE_TTL_MS = 10 * 60 * 1000;

const normalizedAssetListParams = (params: AssetListParams) => ({
  page: params.page || 1,
  pageSize: params.pageSize || 10,
  search: params.search || "",
  assetScope: params.assetScope || "computer",
  assetType: params.assetType || "",
  status: params.status || "",
  department: params.department || "",
  category: params.category || "",
  purchasePlatform: params.purchasePlatform || "",
  sortBy: params.sortBy || "latestObserved",
  includeDeleted: Boolean(params.includeDeleted),
});

const assetListCacheKey = (params: AssetListParams) =>
  `${ASSET_LIST_CACHE_PREFIX}${JSON.stringify(normalizedAssetListParams(params))}`;

const readCachedAssetList = (params: AssetListParams): PaginatedResult<Asset> | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }
  try {
    const raw = window.localStorage.getItem(assetListCacheKey(params));
    if (!raw) {
      return undefined;
    }
    const parsed = JSON.parse(raw) as { cachedAt?: number; result?: PaginatedResult<Asset> };
    if (!parsed.cachedAt || Date.now() - parsed.cachedAt > ASSET_LIST_CACHE_TTL_MS) {
      window.localStorage.removeItem(assetListCacheKey(params));
      return undefined;
    }
    return parsed.result;
  } catch {
    return undefined;
  }
};

const writeCachedAssetList = (params: AssetListParams, result: PaginatedResult<Asset>) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      assetListCacheKey(params),
      JSON.stringify({
        cachedAt: Date.now(),
        result,
      })
    );
  } catch {
    // Storage can be unavailable in private mode; the REST result remains authoritative.
  }
};

const initialAssetsForParams = (params: AssetListParams): PaginatedResult<Asset> | undefined => {
  if (!InitialAssets?.params || !InitialAssets.result) {
    return undefined;
  }
  const initialParams = normalizedAssetListParams(InitialAssets.params as AssetListParams);
  const currentParams = normalizedAssetListParams(params);
  return JSON.stringify(initialParams) === JSON.stringify(currentParams)
    ? (InitialAssets.result as PaginatedResult<Asset>)
    : undefined;
};

const plainMoneyText = (value: unknown) => {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) {
    return "-";
  }
  return `${new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(number)} 元`;
};

const customAssetInfo = (asset: Asset) => {
  const order = assetPurchaseRecord(asset);
  const quantity = firstText(order.numbers, order.quantity, order.count);
  const total = firstText(order.total, asset.purchasePrice);
  return {
    title: firstText(order.title, asset.name, asset.assetNumber, "未命名资产"),
    usage: firstText(asset.ownerName),
    number: firstText(asset.assetNumber),
    category: firstText(asset.category, assetTypeLabel(asset.assetType)),
    purpose: firstText(getRecord(asset.metadata).purpose, order.purpose),
    status: statusLabel(asset.status),
    createdAt: asset.createdAt,
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

const normalizeAssetStatus = (value: string) => {
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

const ASSET_EXPORT_FIELDS: Array<{
  key: AssetExportFieldKey;
  label: string;
  group: "基础信息" | "财务信息" | "硬件信息" | "系统信息";
  defaultChecked?: boolean;
  value: (asset: Asset) => unknown;
}> = [
  { key: "assetNumber", label: "资产编号", group: "基础信息", defaultChecked: true, value: (asset) => asset.assetNumber },
  { key: "name", label: "资产名称", group: "基础信息", defaultChecked: true, value: (asset) => asset.name },
  { key: "assetType", label: "资产类型", group: "基础信息", defaultChecked: true, value: (asset) => assetTypeLabel(asset.assetType) },
  { key: "ownerName", label: "使用人", group: "基础信息", defaultChecked: true, value: (asset) => asset.ownerName },
  { key: "department", label: "部门", group: "基础信息", defaultChecked: true, value: (asset) => asset.department },
  { key: "status", label: "状态", group: "基础信息", defaultChecked: true, value: (asset) => statusLabel(asset.status) },
  { key: "category", label: "分类", group: "基础信息", value: (asset) => asset.category },
  { key: "purchasePrice", label: "购置价格", group: "财务信息", value: (asset) => asset.purchasePrice },
  { key: "residualValue", label: "残值", group: "财务信息", value: (asset) => asset.residualValue },
  { key: "purchaseDate", label: "购置日期", group: "财务信息", value: assetPurchaseDateText },
  { key: "cpu", label: "CPU", group: "硬件信息", defaultChecked: true, value: (asset) => assetHardwareContext(asset).extracted.cpu },
  {
    key: "memory",
    label: "内存",
    group: "硬件信息",
    defaultChecked: true,
    value: (asset) => {
      const context = assetHardwareContext(asset);
      return firstText(context.extracted.memoryLines.join("\n"), context.manualHardware.memory, formatBytes(context.summary.memory_bytes));
    },
  },
  {
    key: "disk",
    label: "硬盘",
    group: "硬件信息",
    defaultChecked: true,
    value: (asset) => {
      const context = assetHardwareContext(asset);
      return firstText(context.extracted.primaryDisk, context.manualHardware.disk, formatBytes(context.summary.disk_bytes));
    },
  },
  { key: "ip", label: "IP", group: "硬件信息", defaultChecked: true, value: (asset) => assetHardwareContext(asset).extracted.primaryIp },
  { key: "graphics", label: "显卡", group: "硬件信息", value: (asset) => assetHardwareContext(asset).extracted.graphics },
  { key: "deviceModel", label: "计算机型号", group: "硬件信息", value: (asset) => assetHardwareContext(asset).extracted.deviceModel },
  { key: "baseboard", label: "主板型号", group: "硬件信息", value: (asset) => assetHardwareContext(asset).extracted.baseboard },
  { key: "createdAt", label: "创建时间", group: "系统信息", value: (asset) => formatDate(asset.createdAt) },
  { key: "updatedAt", label: "更新时间", group: "系统信息", defaultChecked: true, value: assetUpdateTimeText },
];

const DEFAULT_ASSET_EXPORT_FIELD_KEYS = ASSET_EXPORT_FIELDS
  .filter((field) => field.defaultChecked)
  .map((field) => field.key);

const assetsToCsv = (assets: Asset[], fieldKeys: AssetExportFieldKey[] = DEFAULT_ASSET_EXPORT_FIELD_KEYS) => {
  const fields = ASSET_EXPORT_FIELDS.filter((field) => fieldKeys.includes(field.key));
  const selectedFields = fields.length ? fields : ASSET_EXPORT_FIELDS.filter((field) => field.defaultChecked);
  const headers = selectedFields.map((field) => field.label);
  const rows = assets.map((asset) => selectedFields.map((field) => field.value(asset)));
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
};

const importTemplateCsv = () => {
  const headers = ASSET_IMPORT_FIELDS.map((field) => field.label);
  const example = [
    "PC-202607-001",
    "财务部台式机",
    "pc",
    "张三",
    "财务部",
    "在用",
    "台式机",
    "4500",
    "300",
    "2026-07-03",
    "Intel Core i5",
    "16 GB",
    "512 GB SSD",
    "192.168.1.20",
    "标准模板示例，正式导入前可删除本行",
  ];
  return [headers, example].map((row) => row.map(csvCell).join(",")).join("\n");
};

const parseNumberValue = (value: string) => {
  const normalized = value.replace(/[,，￥¥元\s]/g, "");
  const number = Number(normalized || 0);
  return Number.isFinite(number) ? number : 0;
};

const normalizeAssetType = (value: string) => {
  const text = value.trim();
  if (!text) {
    return "pc";
  }
  const matched = ASSET_TYPES.find((item) => item.value === text || item.label === text);
  if (matched) {
    return matched.value;
  }
  if (/电脑|pc|computer/i.test(text)) {
    return "pc";
  }
  if (/网络/.test(text)) {
    return "network";
  }
  if (/办公/.test(text)) {
    return "office";
  }
  return "custom";
};

const manualHardwareFromImportRow = (row: JsonRecord): JsonRecord => {
  const hardware = {
    cpu: importFieldValue(row, "cpu"),
    memory: importFieldValue(row, "memory"),
    disk: importFieldValue(row, "disk"),
    ip: importFieldValue(row, "ip"),
  };
  const compact = Object.fromEntries(Object.entries(hardware).filter(([, value]) => value));
  return Object.keys(compact).length ? { ...compact, raw: compact } : {};
};

const buildAssetImportInput = (
  row: JsonRecord,
  existing?: Asset,
  sections: AssetImportSection[] = DEFAULT_ASSET_IMPORT_SECTIONS
): AssetImportPreviewRow["input"] => {
  const includeBasic = sections.includes("basic");
  const includeFinance = sections.includes("finance");
  const includeHardware = sections.includes("hardware");
  const purchaseDate = importFieldValue(row, "purchaseDate");
  const purchasePriceText = importFieldValue(row, "purchasePrice");
  const residualValueText = importFieldValue(row, "residualValue");
  const notes = importFieldValue(row, "notes");
  const manualHardware = manualHardwareFromImportRow(row);
  const existingMetadata = getRecord(existing?.metadata);
  const purchase = {
    ...getRecord(existingMetadata.purchase),
    ...(includeFinance && purchaseDate ? { order_time: formatDateInput(purchaseDate) } : {}),
    ...(includeFinance && purchasePriceText ? { total: parseNumberValue(purchasePriceText) } : {}),
  };
  const metadata: JsonRecord = {
    ...existingMetadata,
    ...(includeFinance && Object.keys(purchase).length ? { purchase } : {}),
    ...(includeHardware && Object.keys(manualHardware).length ? { manualHardware } : {}),
    ...(includeBasic && notes ? { notes } : {}),
  };
  const valueOrExisting = (field: AssetImportFieldKey, fallback = "") =>
    importFieldValue(row, field) || fallback;

  return {
    assetNumber: valueOrExisting("assetNumber", existing?.assetNumber || ""),
    name: includeBasic ? valueOrExisting("name", existing?.name || "") : existing?.name || "",
    assetType: includeBasic ? normalizeAssetType(valueOrExisting("assetType", existing?.assetType || "pc")) : existing?.assetType || "pc",
    ownerName: includeBasic ? valueOrExisting("ownerName", existing?.ownerName || "") : existing?.ownerName || "",
    department: includeBasic
      ? valueOrExisting("department", existing?.department || DEFAULT_DEPARTMENT)
      : existing?.department || DEFAULT_DEPARTMENT,
    status: includeBasic ? normalizeAssetStatus(valueOrExisting("status", existing?.status || "active")) : existing?.status || "active",
    category: includeBasic ? valueOrExisting("category", existing?.category || "") : existing?.category || "",
    purchasePrice: includeFinance && purchasePriceText ? parseNumberValue(purchasePriceText) : existing?.purchasePrice || 0,
    residualValue: includeFinance && residualValueText ? parseNumberValue(residualValueText) : existing?.residualValue || 0,
    metadata,
  };
};

const buildImportPreviewRows = (
  rows: JsonRecord[],
  existingAssets: Asset[],
  strategy: AssetImportStrategy,
  sections: AssetImportSection[],
  departmentOptions: string[] = []
): AssetImportPreviewRow[] => {
  const existingByNumber = new Map(
    existingAssets
      .filter((asset) => asset.assetNumber)
      .map((asset) => [asset.assetNumber.trim().toLowerCase(), asset])
  );
  const seenNumbers = new Set<string>();
  return rows.map((row, index) => {
    const assetNumber = importFieldValue(row, "assetNumber");
    const existing = assetNumber ? existingByNumber.get(assetNumber.trim().toLowerCase()) : undefined;
    const input = buildAssetImportInput(row, existing, sections);
    const errors: string[] = [];
    if (!assetNumber) {
      errors.push("资产编号必填");
    }
    const normalizedNumber = assetNumber.trim().toLowerCase();
    if (normalizedNumber && seenNumbers.has(normalizedNumber)) {
      errors.push("导入文件内资产编号重复");
    }
    if (normalizedNumber) {
      seenNumbers.add(normalizedNumber);
    }
    if (sections.includes("basic") && input.department && !isAllowedDepartment(departmentOptions, input.department)) {
      errors.push(`部门「${input.department}」不在设置部门列表中`);
    }
    const action = (() => {
      if (errors.length) {
        return "invalid";
      }
      if (strategy === "create-only") {
        return existing ? "skip" : "create";
      }
      if (strategy === "update-by-number") {
        return existing ? "update" : "skip";
      }
      return existing ? "update" : "create";
    })();
    return {
      key: `${index}-${assetNumber || "row"}`,
      rowNumber: index + 2,
      input,
      purchaseDate: importFieldValue(row, "purchaseDate"),
      manualHardware: manualHardwareFromImportRow(row),
      errors,
      existing,
      action,
    };
  });
};

const fetchAllEvents = async () => {
  const first = await getEvents({ page: 1, pageSize: 100 });
  const allEvents = [...first.data];
  for (let nextPage = 2; nextPage <= (first.pagination.totalPages || 1); nextPage += 1) {
    const next = await getEvents({ page: nextPage, pageSize: 100 });
    allEvents.push(...next.data);
  }
  return allEvents;
};

const fetchAllObservations = async () => {
  const first = await getObservations({ page: 1, pageSize: 100 });
  const allObservations = [...first.data];
  for (let nextPage = 2; nextPage <= (first.pagination.totalPages || 1); nextPage += 1) {
    const next = await getObservations({ page: nextPage, pageSize: 100 });
    allObservations.push(...next.data);
  }
  return allObservations;
};

const fetchAllIdentities = async (assets: Asset[]) => {
  const results = await Promise.all(
    assets.map(async (asset) => ({
      assetUuid: asset.uuid,
      assetNumber: asset.assetNumber,
      assetName: asset.name,
      identities: await getAssetIdentities(asset.uuid),
    }))
  );
  return results.filter((item) => item.identities.length > 0);
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
type AnalysisTabKey = "summary" | "hardware" | "value";
type AnalysisFocusTarget = {
  version: number;
  hardwareSection?: "collection" | "issues";
  hardwareIssueGroup?: string;
  valueSection?: "valuation";
};
type AssetLayoutMode = "compact" | "spacious";
type HardwareRankType = "cpu" | "disk" | "memory" | "board";

const HARDWARE_INVENTORY_META: Record<
  HardwareRankType,
  { label: string; unit: string; column: string; emptyText: string }
> = {
  cpu: { label: "CPU", unit: "个", column: "型号", emptyText: "暂无 CPU 型号数据" },
  disk: { label: "硬盘", unit: "块", column: "类型 / 容量", emptyText: "暂无硬盘容量数据" },
  memory: { label: "内存", unit: "条", column: "容量", emptyText: "暂无内存容量数据" },
  board: { label: "主板", unit: "个", column: "品牌/型号", emptyText: "暂无主板型号数据" },
};

interface AnalysisBarDatum {
  key: string;
  label: string;
  value: number;
  valueText?: string;
  caption?: string;
  accent?: string;
}

interface AnalysisBlockProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

interface HardwareQueryState {
  memoryGb?: string;
  graphics?: string;
  board?: string;
  diskCapacity?: string;
  department?: string;
  status?: string;
}

interface HardwareQueryItem {
  asset: Asset;
  memory: string;
  disk: string;
  graphics: string;
  board: string;
  department: string;
  status: string;
}

interface HardwareQueryDepartmentRow {
  department: string;
  matched: number;
  total: number;
  resultRate: number;
  departmentRate: number;
}

const BYTES_PER_GB = 1024 ** 3;

const capacityLabel = (bytes: number) => {
  if (bytes <= 0) {
    return "-";
  }
  const gb = bytes / BYTES_PER_GB;
  const roundedGb = Math.round(gb);
  if (roundedGb >= 1 && Math.abs(gb - roundedGb) <= 0.35) {
    return `${roundedGb} GB`;
  }
  return formatBytes(bytes);
};

const hardwareQueryItem = (asset: Asset): HardwareQueryItem => {
  const context = assetHardwareContext(asset);
  const baseboard = getRecord(context.hardware.baseboard);
  return {
    asset,
    memory: capacityLabel(hardwareMemoryBytes(asset)),
    disk: capacityLabel(hardwareDiskBytes(asset)),
    graphics: hardwareModelLabel(context.extracted.graphics, "显卡未知"),
    board: hardwareModelLabel(firstText(baseboard.model, baseboard.name, baseboard.product), "主板未知"),
    department: asset.department || "未分配",
    status: asset.status,
  };
};

const memoryMatches = (item: HardwareQueryItem, targetGb?: string) => {
  if (!targetGb) {
    return true;
  }
  return item.memory === targetGb;
};

const diskMatches = (item: HardwareQueryItem, diskCapacity?: string) => {
  if (!diskCapacity) {
    return true;
  }
  return item.disk === diskCapacity;
};

const hardwareQueryActive = (query: HardwareQueryState) =>
  Boolean(query.memoryGb || query.graphics || query.board || query.diskCapacity || query.department || query.status);

const hardwareQueryAssetMatches = (
  item: HardwareQueryItem,
  query: HardwareQueryState,
  ignoredField?: keyof HardwareQueryState
) => {
  if (ignoredField !== "department" && query.department && item.department !== query.department) {
    return false;
  }
  if (ignoredField !== "status" && query.status && item.status !== query.status) {
    return false;
  }
  if (ignoredField !== "memoryGb" && !memoryMatches(item, query.memoryGb)) {
    return false;
  }
  if (ignoredField !== "diskCapacity" && !diskMatches(item, query.diskCapacity)) {
    return false;
  }
  if (ignoredField !== "graphics" && query.graphics && item.graphics !== query.graphics) {
    return false;
  }
  if (ignoredField !== "board" && query.board && item.board !== query.board) {
    return false;
  }
  return true;
};

const hardwareFacetOptions = (
  items: HardwareQueryItem[],
  query: HardwareQueryState,
  ignoredField: keyof HardwareQueryState,
  getValue: (item: HardwareQueryItem) => string,
  compare?: (a: string, b: string) => number
) => {
  const counts = countBy(
    items.filter((item) => hardwareQueryAssetMatches(item, query, ignoredField)),
    getValue
  );
  return Object.entries(counts)
    .filter(([value]) => value && !value.endsWith("未知") && value !== "-")
    .sort(([a], [b]) => (compare ? compare(a, b) : a.localeCompare(b, "zh-CN")))
    .map(([value, count]) => ({
      label: `${value}（${count}）`,
      value,
    }));
};

const memoryOptionCompare = (a: string, b: string) => {
  const first = Number.parseFloat(a);
  const second = Number.parseFloat(b);
  if (Number.isFinite(first) && Number.isFinite(second)) {
    return first - second;
  }
  return a.localeCompare(b, "zh-CN");
};

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

const AnalysisBlock = ({ title, description, eyebrow, actions, children, className = "" }: AnalysisBlockProps) => (
  <section className={`npcink-v3-analysis-block${className ? ` ${className}` : ""}`}>
    <div className="npcink-v3-analysis-block-head">
      <div>
        {eyebrow ? <span>{eyebrow}</span> : null}
        <Text strong>{title}</Text>
        {description ? <Text type="secondary">{description}</Text> : null}
      </div>
      {actions ? <div className="npcink-v3-analysis-block-actions">{actions}</div> : null}
    </div>
    {children}
  </section>
);

const STATUS_SEGMENTS = [
  { key: "active", label: "在用", className: "is-active" },
  { key: "inactive", label: "闲置", className: "is-inactive" },
  { key: "maintenance", label: "维护", className: "is-maintenance" },
  { key: "retired", label: "报废", className: "is-retired" },
  { key: "deleted", label: "归档", className: "is-deleted" },
];

const StatusStack = ({ row }: { row: Record<string, number | string> }) => {
  const total = Math.max(Number(row.total || 0), 0);
  return (
    <div className="npcink-v3-status-stack">
      <div className="npcink-v3-status-stack-bar">
        {STATUS_SEGMENTS.map((segment) => {
          const count = Math.max(Number(row[segment.key] || 0), 0);
          if (!count || !total) {
            return null;
          }
          return (
            <i
              key={segment.key}
              className={segment.className}
              style={{ width: `${Math.max(3, (count / total) * 100)}%` }}
              title={`${segment.label} ${count}`}
            />
          );
        })}
      </div>
      <div className="npcink-v3-status-stack-legend">
        {STATUS_SEGMENTS.filter((segment) => Number(row[segment.key] || 0) > 0).map((segment) => (
          <span key={segment.key}>
            <i className={segment.className} />
            {segment.label} {Number(row[segment.key] || 0)}
          </span>
        ))}
      </div>
    </div>
  );
};

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

const DONUT_BREAKDOWN_COLORS = ["#2f6fed", "#22a06b", "#8b5cf6", "#06b6d4", "#6366f1", "#14b8a6", "#a855f7", "#0ea5e9"];
const ISSUE_GROUP_COLORS: Record<string, string> = {
  采集状态: "#f59e0b",
  重复风险: "#ef4444",
  资料缺失: "#64748b",
  硬件缺失: "#8b5cf6",
  维护状态: "#d97706",
};

const stablePaletteColor = (key: string) => {
  const normalizedKey = String(key || "");
  if (/^其他/.test(normalizedKey)) {
    return "#94a3b8";
  }
  const hash = Array.from(normalizedKey).reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) % DONUT_BREAKDOWN_COLORS.length,
    0
  );
  return DONUT_BREAKDOWN_COLORS[hash];
};

const donutRowColor = (row: AnalysisBarDatum, index: number) =>
  row.accent || stablePaletteColor(row.key || row.label || String(index));

const issueTypeColor = (type: string) => ISSUE_GROUP_COLORS[issueGroup(type)] || stablePaletteColor(type);

const AnalysisDonutBreakdown = ({
  rows,
  loading,
  emptyText,
  totalLabel,
  totalText,
  valueFormatter = (value) => String(value),
}: {
  rows: AnalysisBarDatum[];
  loading?: boolean;
  emptyText: string;
  totalLabel: string;
  totalText?: string;
  valueFormatter?: (value: number) => string;
}) => {
  if (loading) {
    return <div className="npcink-v3-chart-placeholder">统计中</div>;
  }

  const visibleRows = rows.filter((row) => row.value > 0);
  const total = visibleRows.reduce((sum, row) => sum + row.value, 0);

  if (!visibleRows.length || total <= 0) {
    return <Empty description={emptyText} />;
  }

  const gradientStops = visibleRows
    .map((row, index, items) => {
      const start = items.slice(0, index).reduce((sum, item) => sum + (item.value / total) * 100, 0);
      const width = (row.value / total) * 100;
      const end = start + width;
      const color = donutRowColor(row, index);
      return `${color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="npcink-v3-donut-breakdown">
      <div className="npcink-v3-donut-ring" style={{ background: `conic-gradient(${gradientStops})` }}>
        <div>
          <span>{totalLabel}</span>
          <strong>{totalText || valueFormatter(total)}</strong>
        </div>
      </div>
      <div className="npcink-v3-donut-list">
        {visibleRows.map((row, index) => {
          const share = (row.value / total) * 100;
          const color = donutRowColor(row, index);
          return (
            <div key={row.key} className="npcink-v3-donut-list-row">
              <span className="npcink-v3-donut-swatch" style={{ background: color }} />
              <div>
                <Text strong>{row.label}</Text>
                {row.caption ? <em>{row.caption}</em> : null}
              </div>
              <strong>{formatPercentValue(share)}</strong>
              <span>{row.valueText || valueFormatter(row.value)}</span>
            </div>
          );
        })}
      </div>
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

const DEFAULT_DEPARTMENT = "未分配";

const normalizeDepartmentList = (departments: unknown) => {
  const normalized = Array.isArray(departments)
    ? departments
        .map((department) => String(department || "").trim().slice(0, 80))
        .filter(Boolean)
    : [];
  if (!normalized.includes(DEFAULT_DEPARTMENT)) {
    normalized.push(DEFAULT_DEPARTMENT);
  }
  return Array.from(new Set(normalized)).sort((a, b) => a.localeCompare(b, "zh-CN"));
};

const departmentSelectOptions = (departments: string[]) =>
  normalizeDepartmentList(departments).map((department) => ({ label: department, value: department }));

const departmentTagRender: SelectProps<string[]>["tagRender"] = ({ label, value, closable, onClose }) => {
  const protectedDepartment = String(value) === DEFAULT_DEPARTMENT;
  return (
    <Tag
      closable={!protectedDepartment && closable}
      onClose={onClose}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      title={protectedDepartment ? "系统兜底部门，不能删除" : undefined}
    >
      {label}
    </Tag>
  );
};

const isAllowedDepartment = (departments: string[], value: unknown) => {
  const department = String(value || "").trim();
  return !department || normalizeDepartmentList(departments).includes(department);
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
  manual: string;
  latest: string;
}

const normalizeFieldSourceText = (value: string) => value.replace(/\s+/g, " ").trim();

const fieldSourceCellClassName = (
  value: string,
  role: "label" | "standard" | "manual" | "latest",
  row?: FieldSourceRow
) => {
  const classes = ["npcink-v3-field-source-cell", `is-${role}`];
  if (value === "-") {
    classes.push("is-empty");
  }
  if (
    role === "latest" &&
    row &&
    value !== "-" &&
    row.standard !== "-" &&
    normalizeFieldSourceText(value) !== normalizeFieldSourceText(row.standard)
  ) {
    classes.push("is-different");
  }
  return classes.join(" ");
};

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
        detailRow("updated", "更新时间", assetUpdateTimeText(asset))
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
        detailRow("memory-total", "总容量", firstText(formatBytes(summary.memory_bytes), context.manualHardware.memory)),
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
        detailRow("disk-total", "总容量", firstText(formatBytes(summary.disk_bytes), context.manualHardware.disk)),
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
        detailRow("network-ip", "IP 地址", firstText(context.extracted.primaryIp, context.manualHardware.ip)),
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
      ),
    },
  ];
};

const fieldSourceRows = (asset: Asset, context: ReturnType<typeof assetHardwareContext>): FieldSourceRow[] => {
  const latestSummary = getRecord(asset.latestObservation?.summary);
  const latestHardware = getRecord(asset.latestObservation?.hardware);
  const latestExtracted = hardwareSummary(latestSummary, latestHardware);
  const manualRaw = getRecord(context.manualHardware.raw);
  const manualExtracted = hardwareSummary({}, manualRaw);
  const manualMemory = firstText(context.manualHardware.memory, manualExtracted.memoryLines.join("\n"));
  const latestMemory = firstText(latestExtracted.memoryLines.join("\n"), formatBytes(latestSummary.memory_bytes));

  return [
    {
      key: "assetNumber",
      label: "资产编号",
      standard: fieldText(asset.assetNumber),
      manual: "-",
      latest: "-",
    },
    {
      key: "name",
      label: "资产名称",
      standard: fieldText(asset.name),
      manual: "-",
      latest: fieldText(firstText(latestSummary.hostname, latestSummary.device_model)),
    },
    {
      key: "owner",
      label: "使用人",
      standard: fieldText(asset.ownerName),
      manual: "-",
      latest: "-",
    },
    {
      key: "department",
      label: "部门",
      standard: fieldText(asset.department),
      manual: "-",
      latest: "-",
    },
    {
      key: "status",
      label: "状态",
      standard: statusLabel(asset.status),
      manual: "-",
      latest: "-",
    },
    {
      key: "cpu",
      label: "CPU",
      standard: fieldText(context.extracted.cpu),
      manual: fieldText(firstText(context.manualHardware.cpu, manualExtracted.cpu)),
      latest: fieldText(latestExtracted.cpu),
    },
    {
      key: "graphics",
      label: "显卡",
      standard: fieldText(context.extracted.graphics),
      manual: fieldText(firstText(context.manualHardware.graphics, manualExtracted.graphics)),
      latest: fieldText(latestExtracted.graphics),
    },
    {
      key: "deviceModel",
      label: "计算机型号",
      standard: fieldText(context.extracted.deviceModel),
      manual: fieldText(manualExtracted.deviceModel),
      latest: fieldText(latestExtracted.deviceModel),
    },
    {
      key: "baseboard",
      label: "主板型号",
      standard: fieldText(context.extracted.baseboard),
      manual: fieldText(manualExtracted.baseboard),
      latest: fieldText(latestExtracted.baseboard),
    },
    {
      key: "memory",
      label: "内存",
      standard: fieldText(firstText(context.extracted.memoryLines.join("\n"), context.manualHardware.memory, formatBytes(context.summary.memory_bytes))),
      manual: fieldText(manualMemory),
      latest: fieldText(latestMemory),
    },
    {
      key: "disk",
      label: "硬盘",
      standard: fieldText(firstText(context.extracted.primaryDisk, context.manualHardware.disk, formatBytes(context.summary.disk_bytes))),
      manual: fieldText(firstText(context.manualHardware.disk, manualExtracted.primaryDisk)),
      latest: fieldText(firstText(latestExtracted.primaryDisk, formatBytes(latestSummary.disk_bytes))),
    },
    {
      key: "ip",
      label: "IP",
      standard: fieldText(context.extracted.primaryIp),
      manual: fieldText(firstText(context.manualHardware.ip, manualExtracted.primaryIp)),
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
    return statusLabel(normalizeAssetStatus(text));
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
  return fieldText(payload.operatorName || event.actorName || "系统");
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
  if (event.eventType === "manual_change") {
    return "手动";
  }
  if (event.eventType === "bulk_updated") {
    return "批量";
  }
  if (event.eventType === "observation_received") {
    return "采集";
  }
  if (event.eventType === "issue_handled" || event.eventType === "issue_reopened") {
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
      .replace("Observation received from client.", "客户端采集数据已接收");
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
  departmentOptions?: string[];
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

const AssetFormModal = ({ asset, open, departmentOptions = [], onClose, onSubmit }: AssetFormModalProps) => {
  const [form] = Form.useForm<AssetFormValues>();
  const customInfo = useMemo(() => (asset ? customAssetInfo(asset) : null), [asset]);
  const showCustomFields = !asset || !isComputerAsset(asset);
  const normalizedDepartmentOptions = useMemo(() => normalizeDepartmentList(departmentOptions), [departmentOptions]);

  useEffect(() => {
    if (!open) {
      return;
    }
    form.setFieldsValue({
      assetType: asset?.assetType || "custom",
      assetNumber: asset?.assetNumber || "",
      name: asset?.name || "",
      ownerName: asset?.ownerName || "",
      department: asset?.department || DEFAULT_DEPARTMENT,
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
            <Form.Item
              name="department"
              label="部门"
              extra="只能选择设置中维护的部门；未选择时会归入未分配。"
              rules={[
                {
                  validator: async (_, value) => {
                    if (!isAllowedDepartment(normalizedDepartmentOptions, value)) {
                      throw new Error("请选择设置中已有的部门");
                    }
                  },
                },
              ]}
            >
              <Select
                showSearch
                options={departmentSelectOptions(normalizedDepartmentOptions)}
                placeholder="选择部门"
                popupMatchSelectWidth={false}
                filterOption={(input, option) => String(option?.label || "").toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>
            <Form.Item name="category" label="分类">
              <Input placeholder="例如：显卡、手机、机房设备" />
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select options={EDITABLE_STATUS_OPTIONS} />
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

interface AssetImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

const AssetImportModal = ({ open, onClose, onImported }: AssetImportModalProps) => {
  const [rawText, setRawText] = useState("");
  const [strategy, setStrategy] = useState<AssetImportStrategy>("upsert-by-number");
  const [sections, setSections] = useState<AssetImportSection[]>(DEFAULT_ASSET_IMPORT_SECTIONS);
  const [previewRows, setPreviewRows] = useState<AssetImportPreviewRow[]>([]);
  const settingsQuery = useQuery(["v3-settings"], getSettings, { enabled: open, staleTime: 60_000 });
  const departmentOptions = useMemo(
    () => normalizeDepartmentList(settingsQuery.data?.departments || []),
    [settingsQuery.data?.departments]
  );
  const existingAssetsQuery = useQuery(["v3-assets-import-index"], () => fetchAllAssets({ assetScope: "all", includeDeleted: true }), {
    enabled: open,
  });
  const importMutation = useMutation(
    async (rows: AssetImportPreviewRow[]) => {
      let created = 0;
      let updated = 0;
      let skipped = 0;
      for (const row of rows) {
        if (row.action === "create") {
          await createAsset(row.input);
          created += 1;
        } else if (row.action === "update" && row.existing) {
          await updateAsset(row.existing.uuid, row.input);
          updated += 1;
        } else {
          skipped += 1;
        }
      }
      return { created, updated, skipped };
    },
    {
      onSuccess: (result) => {
        message.success(`导入完成：新增 ${result.created} 条，更新 ${result.updated} 条，跳过 ${result.skipped} 条`);
        setRawText("");
        setPreviewRows([]);
        onImported();
        onClose();
      },
    }
  );

  const parseSource = (text = rawText) => {
    try {
      const rows = buildImportPreviewRows(parseTabularText(text), existingAssetsQuery.data || [], strategy, sections, departmentOptions);
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
      title="资产表格导入"
      open={open}
      onCancel={onClose}
      width={980}
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
          disabled={!previewRows.some((row) => row.action === "create" || row.action === "update")}
          loading={importMutation.isLoading}
          onClick={() => importMutation.mutate(previewRows)}
        >
          导入可执行数据
        </Button>,
      ]}
    >
      <Space direction="vertical" size={12} className="npcink-v3-detail-stack">
        <Alert
          type="info"
          showIcon
          message="只支持标准资产 CSV"
          description="请先下载模板填写。导入以资产编号为匹配键，可选择仅新增、仅更新，或按编号新增/更新。"
        />
        <Space wrap>
          <Button onClick={() => downloadCsvFile(`asset-import-template-${Date.now()}.csv`, importTemplateCsv())}>
            下载导入模板
          </Button>
          <Radio.Group
            value={strategy}
            onChange={(event) => {
              setStrategy(event.target.value);
              setPreviewRows([]);
            }}
            options={[
              { label: "新增或更新", value: "upsert-by-number" },
              { label: "只新增", value: "create-only" },
              { label: "只更新", value: "update-by-number" },
            ]}
          />
        </Space>
        <div>
          <Text strong>导入数据</Text>
          <Checkbox.Group
            className="npcink-v3-checkbox-row"
            value={sections}
            onChange={(values) => {
              setSections(values as AssetImportSection[]);
              setPreviewRows([]);
            }}
            options={[
              { label: "基础信息", value: "basic" },
              { label: "财务信息", value: "finance" },
              { label: "手动硬件", value: "hardware" },
            ]}
          />
        </div>
        <input
          type="file"
          accept=".csv,text/csv"
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
          placeholder="粘贴标准 CSV。第一行应使用模板表头：资产编号,资产名称,资产类型,使用人,部门,状态..."
        />
        <Table
          rowKey="key"
          size="small"
          pagination={{ pageSize: 5, showSizeChanger: false }}
          dataSource={previewRows}
          columns={[
            { title: "行号", dataIndex: "rowNumber", width: 76 },
            { title: "动作", dataIndex: "action", width: 96, render: (value) => (
              <Tag color={value === "create" ? "green" : value === "update" ? "blue" : value === "invalid" ? "red" : "default"}>
                {value === "create" ? "新增" : value === "update" ? "更新" : value === "invalid" ? "错误" : "跳过"}
              </Tag>
            ) },
            { title: "编号", render: (_, row) => fieldText(row.input.assetNumber), width: 150 },
            { title: "名称", render: (_, row) => fieldText(row.input.name) },
            { title: "使用人", render: (_, row) => fieldText(row.input.ownerName), width: 120 },
            { title: "部门", render: (_, row) => fieldText(row.input.department), width: 120 },
            { title: "状态", render: (_, row) => statusLabel(String(row.input.status || "")), width: 100 },
            {
              title: "校验",
              render: (_, row) => row.errors.length ? <Text type="danger">{row.errors.join("；")}</Text> : <Text type="secondary">通过</Text>,
            },
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

interface AssetExportModalProps {
  open: boolean;
  currentScopeLabel: string;
  currentQueryParams: AssetListParams;
  currentTotal?: number;
  selectedAssets?: Asset[];
  onClose: () => void;
}

const AssetExportModal = ({
  open,
  currentScopeLabel,
  currentQueryParams,
  currentTotal,
  selectedAssets = [],
  onClose,
}: AssetExportModalProps) => {
  const [scope, setScope] = useState<AssetExportScope>("current-filter");
  const [fieldKeys, setFieldKeys] = useState<AssetExportFieldKey[]>(DEFAULT_ASSET_EXPORT_FIELD_KEYS);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (open) {
      setScope(selectedAssets.length ? "selected" : "current-filter");
      setFieldKeys(DEFAULT_ASSET_EXPORT_FIELD_KEYS);
    }
  }, [open, selectedAssets.length]);

  const exportAssets = async () => {
    setExporting(true);
    try {
      const exportParams: Record<Exclude<AssetExportScope, "current-filter" | "selected">, AssetListParams> = {
        computer: { assetScope: "computer" },
        custom: { assetScope: "other" },
        all: { assetScope: "all" },
      };
      const assets = scope === "selected"
        ? selectedAssets
        : await fetchAllAssets(scope === "current-filter" ? currentQueryParams : exportParams[scope]);
      downloadCsvFile(`assets-${scope}-${Date.now()}.csv`, assetsToCsv(assets, fieldKeys));
      message.success(`已导出 ${assets.length} 条资产`);
      onClose();
    } finally {
      setExporting(false);
    }
  };
  const currentFilterCountText =
    typeof currentTotal === "number" ? `${currentTotal} 条` : "导出时计算";

  return (
    <Modal
      title="资产表格导出"
      open={open}
      onCancel={onClose}
      onOk={exportAssets}
      okText="导出 CSV"
      confirmLoading={exporting}
      width={760}
      destroyOnClose
    >
      <Space direction="vertical" size={16} className="npcink-v3-detail-stack">
        <div>
          <Text strong>导出范围</Text>
          <Text type="secondary" className="npcink-v3-export-range-note">
            符合当前筛选条件的数据，就是资产列表里筛选后的全部结果，不只是当前页。
          </Text>
          <Radio.Group
            className="npcink-v3-radio-stack"
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            options={[
              {
                label: `符合当前筛选条件的数据：${currentScopeLabel}，${currentFilterCountText}`,
                value: "current-filter",
              },
              {
                label: `只导出已勾选的数据：${selectedAssets.length} 条`,
                value: "selected",
                disabled: !selectedAssets.length,
              },
              { label: "全部电脑设备", value: "computer" },
              { label: "全部自定义设备", value: "custom" },
              { label: "忽略筛选，导出全部资产", value: "all" },
            ]}
          />
        </div>
        <div>
          <Text strong>导出字段</Text>
          <div className="npcink-v3-export-fields">
            {["基础信息", "财务信息", "硬件信息", "系统信息"].map((group) => (
              <div key={group}>
                <Text type="secondary">{group}</Text>
                <Checkbox.Group
                  value={fieldKeys}
                  onChange={(values) => setFieldKeys(values as AssetExportFieldKey[])}
                  options={ASSET_EXPORT_FIELDS.filter((field) => field.group === group).map((field) => ({
                    label: field.label,
                    value: field.key,
                  }))}
                />
              </div>
            ))}
          </div>
        </div>
      </Space>
    </Modal>
  );
};

interface BulkEditModalProps {
  open: boolean;
  count: number;
  loading: boolean;
  departmentOptions?: string[];
  onClose: () => void;
  onSubmit: (values: AssetInput) => Promise<void>;
}

const BulkEditModal = ({ open, count, loading, departmentOptions = [], onClose, onSubmit }: BulkEditModalProps) => {
  const [form] = Form.useForm<AssetInput>();
  const normalizedDepartmentOptions = useMemo(() => normalizeDepartmentList(departmentOptions), [departmentOptions]);

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
        <Form.Item
          name="department"
          label="部门"
          extra={normalizedDepartmentOptions.length ? "只能选择设置中维护的部门；留空表示不修改。" : "请先到设置 > 部门管理添加部门。"}
          rules={[
            {
              validator: async (_, value) => {
                if (!isAllowedDepartment(normalizedDepartmentOptions, value)) {
                  throw new Error("请选择设置中已有的部门");
                }
              },
            },
          ]}
        >
          <Select
            allowClear
            showSearch
            options={departmentSelectOptions(normalizedDepartmentOptions)}
            placeholder={normalizedDepartmentOptions.length ? "统一修改部门" : "暂无可选部门"}
            popupMatchSelectWidth={false}
            disabled={!normalizedDepartmentOptions.length}
            filterOption={(input, option) => String(option?.label || "").toLowerCase().includes(input.toLowerCase())}
          />
        </Form.Item>
        <Form.Item name="ownerName" label="使用人 / 责任人">
          <Input placeholder="统一修改使用人" />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select allowClear options={EDITABLE_STATUS_OPTIONS} placeholder="统一修改状态" />
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

type AssetSettingsValues = AssetInput & {
  orderTime?: string;
};

const AssetSettingsPanel = ({ asset, departmentOptions = [], onUpdated, onArchive }: AssetSettingsPanelProps) => {
  const [form] = Form.useForm<AssetSettingsValues>();
  const settingsHardware = assetHardwareContext(asset);
  const primaryIp = firstText(settingsHardware.extracted.primaryIp, settingsHardware.manualHardware.ip);
  const normalizedDepartmentOptions = useMemo(
    () => normalizeDepartmentList(departmentOptions),
    [departmentOptions]
  );
  const watchedPurchasePrice = Form.useWatch("purchasePrice", form);
  const watchedResidualValue = Form.useWatch("residualValue", form);
  const purchasePrice = Number(watchedPurchasePrice ?? asset.purchasePrice ?? 0);
  const residualValue = Number(watchedResidualValue ?? asset.residualValue ?? 0);
  const residualRate = purchasePrice > 0 ? Math.round((residualValue / purchasePrice) * 100) : 0;
  const depreciationRate = purchasePrice > 0 ? Math.max(0, 100 - residualRate) : 0;
  const updateMutation = useMutation(
    (values: AssetSettingsValues) => {
      const metadata = getRecord(asset.metadata);
      const existingPurchase = getRecord(metadata.purchase);
      return updateAsset(asset.uuid, {
        assetNumber: values.assetNumber,
        name: values.name ?? asset.name,
        ownerName: values.ownerName,
        department: values.department,
        status: values.status,
        purchasePrice: Number(values.purchasePrice || 0),
        residualValue: Number(values.residualValue || 0),
        metadata: {
          ...metadata,
          purchase: {
            ...existingPurchase,
            order_time: values.orderTime || "",
            total: Number(values.purchasePrice || 0),
          },
        },
      });
    },
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
      department: asset.department || DEFAULT_DEPARTMENT,
      status: asset.status,
      purchasePrice: asset.purchasePrice,
      residualValue: asset.residualValue,
      orderTime: formatDateInput(assetPurchaseDateText(asset)),
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
          </div>
          <div className="npcink-v3-settings-grid npcink-v3-settings-grid-three">
            <Form.Item
              name="department"
              label="部门"
              extra="只能选择设置中维护的部门；未选择时会归入未分配。"
              rules={[
                {
                  validator: async (_, value) => {
                    if (!isAllowedDepartment(normalizedDepartmentOptions, value)) {
                      throw new Error("请选择设置中已有的部门");
                    }
                  },
                },
              ]}
            >
              <Select
                showSearch
                options={departmentSelectOptions(normalizedDepartmentOptions)}
                placeholder="选择部门"
                popupMatchSelectWidth={false}
                filterOption={(input, option) => String(option?.label || "").toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select options={EDITABLE_STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item label="IP 地址">
              <Input value={primaryIp} readOnly placeholder="暂无采集 IP" />
            </Form.Item>
          </div>
        </div>

        <div className="npcink-v3-settings-section">
          <h4>财务参数</h4>
          <div className="npcink-v3-settings-grid npcink-v3-settings-grid-three">
            <Form.Item name="purchasePrice" label="采购价">
              <InputNumber min={0} precision={2} className="npcink-v3-number" addonAfter="¥" />
            </Form.Item>
            <Form.Item name="residualValue" label="二手价">
              <InputNumber min={0} precision={2} className="npcink-v3-number" addonAfter="¥" />
            </Form.Item>
            <Form.Item name="orderTime" label="购置日期">
              <Input placeholder="例如：2026-06-26" />
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
              <Select options={EDITABLE_STATUS_OPTIONS} />
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
  const infoItem = (label: string, value: unknown, tone: "default" | "primary" | "status" = "default") => (
    <div className={`npcink-v3-custom-info-item is-${tone}`}>
      <span>{label}</span>
      <strong>{fieldText(value)}</strong>
    </div>
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
                    {infoItem("采购总价", info.priceText, "primary")}
                    {infoItem("当前状态", info.status, "status")}
                    {infoItem("设备分类", info.category)}
                  </div>
                </div>
                <div className="npcink-v3-custom-info-card">
                  <h4>采购信息</h4>
                  <div>
                    {infoItem("采购人员", info.purchaser)}
                    {infoItem("设备编号", info.number, "primary")}
                    {infoItem("使用人员", info.usage, "primary")}
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
  initialAsset?: Asset | null;
  departmentOptions?: string[];
  onClose: () => void;
  onArchive: (asset: Asset) => void;
}

const DetailDrawer = ({ uuid, open, initialAsset = null, departmentOptions = [], onClose, onArchive }: DetailDrawerProps) => {
  const queryClient = useQueryClient();
  const [manualRecordOpen, setManualRecordOpen] = useState(false);
  const [manualRecordKeyword, setManualRecordKeyword] = useState("");
  const [manualRecordSearch, setManualRecordSearch] = useState("");
  const [activeDetailKey, setActiveDetailKey] = useState("processor");
  const [autoRecordSearch, setAutoRecordSearch] = useState("");
  const enabled = Boolean(uuid && open);
  const assetQuery = useQuery(["v3-asset", uuid], () => getAsset(uuid || ""), {
    enabled,
    initialData: initialAsset || undefined,
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
  const platformVisual = resolvePlatformVisual(
    extracted.platform,
    extracted.cpu,
    extracted.deviceModel,
    summary.os_label
  );
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
          <div className={`npcink-v3-device-hero is-${platformVisual.kind}`}>
            <div className="npcink-v3-device-brand">
              <PlatformMark visual={platformVisual} variant="hero" />
              <strong>{platformVisual.label}</strong>
            </div>
            <div>
              <h3>{asset.ownerName || asset.name || "未命名资产"}</h3>
              <p>
                {formatHardwareHeroText(
                  extracted.cpu,
                  summary,
                  hardwareContext.manualHardware,
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
                    <div className="npcink-v3-hardware-card is-primary">
                      <span className="npcink-v3-hardware-label">CPU 型号</span>
                      <strong className="npcink-v3-hardware-value">{fieldText(extracted.cpu)}</strong>
                    </div>
                    <div className="npcink-v3-hardware-card is-primary">
                      <span className="npcink-v3-hardware-label">显卡型号</span>
                      <strong className="npcink-v3-hardware-value">{fieldText(extracted.graphics)}</strong>
                    </div>
                    <div className="npcink-v3-hardware-card">
                      <span className="npcink-v3-hardware-label">计算机型号</span>
                      <strong className="npcink-v3-hardware-value">{fieldText(extracted.deviceModel)}</strong>
                    </div>
                    <div className="npcink-v3-hardware-card">
                      <span className="npcink-v3-hardware-label">主板型号</span>
                      <strong className="npcink-v3-hardware-value">{fieldText(extracted.baseboard)}</strong>
                    </div>
                    <div className="npcink-v3-hardware-card is-primary">
                      <span className="npcink-v3-hardware-label">内存信息</span>
                      <strong className="npcink-v3-hardware-value">{extracted.memoryLines.length ? extracted.memoryLines.join("\n") : fieldText(hardwareContext.manualHardware.memory || formatBytes(summary.memory_bytes))}</strong>
                    </div>
                    <div className="npcink-v3-hardware-card">
                      <span className="npcink-v3-hardware-label">显示器</span>
                      <strong className="npcink-v3-hardware-value">{fieldText(extracted.display)}</strong>
                      <span className="npcink-v3-hardware-meta">{fieldText(extracted.displayModel)}</span>
                    </div>
                    <div className="npcink-v3-hardware-card is-primary">
                      <span className="npcink-v3-hardware-label">主硬盘</span>
                      <strong className="npcink-v3-hardware-value">{fieldText(extracted.primaryDisk || hardwareContext.manualHardware.disk || formatBytes(summary.disk_bytes))}</strong>
                    </div>
                    <div className="npcink-v3-hardware-card is-muted">
                      <span className="npcink-v3-hardware-label">添加时间</span>
                      <strong className="npcink-v3-hardware-value">{formatDate(asset.createdAt)}</strong>
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
                            <Text type="secondary">标准字段、手动硬件字段和最新采集字段并排查看。</Text>
                          </div>
                          <div className="npcink-v3-field-source-grid">
                            <strong>字段</strong>
                            <strong>标准字段</strong>
                            <strong>手动字段</strong>
                            <strong>最新采集</strong>
                            {sourceRows.map((row) => (
                              <Fragment key={row.key}>
                                <span className={fieldSourceCellClassName(row.label, "label")}>{row.label}</span>
                                <span className={fieldSourceCellClassName(row.standard, "standard", row)}>{row.standard}</span>
                                <span className={fieldSourceCellClassName(row.manual, "manual", row)}>{row.manual}</span>
                                <span className={fieldSourceCellClassName(row.latest, "latest", row)}>{row.latest}</span>
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

interface HardwareAuditWorkspaceProps {
  focus?: AnalysisFocusTarget;
}

const HardwareAuditWorkspace = ({ focus }: HardwareAuditWorkspaceProps) => {
  const queryClient = useQueryClient();
  const [selectedIssueGroup, setSelectedIssueGroup] = useState<string>("全部");
  const [selectedIssueType, setSelectedIssueType] = useState<string>();
  const [hardwareRankType, setHardwareRankType] = useState<HardwareRankType>("board");
  const [departmentView, setDepartmentView] = useState<AnalysisViewMode>("chart");
  const [hardwareQueryView, setHardwareQueryView] = useState<AnalysisViewMode>("table");
  const [hardwareQuery, setHardwareQuery] = useState<HardwareQueryState>({});
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [showHandledIssues, setShowHandledIssues] = useState(false);
  const auditAssetsQuery = useQuery(
    ["v3-hardware-audit-assets"],
    () => fetchAllAssets({ assetScope: "computer" }),
    { staleTime: 60_000 }
  );
  const settingsQuery = useQuery(["v3-settings"], getSettings, { staleTime: 60_000 });
  const issueStatesQuery = useQuery(["v3-analysis-issue-states"], getIssueStates, { staleTime: 30_000 });
  const handledIssueKeys = useMemo(
    () => new Set(issueStatesQuery.data?.handledIssueKeys || []),
    [issueStatesQuery.data?.handledIssueKeys]
  );
  const allAuditAssets = auditAssetsQuery.data || [];
  const countAvailableAssetsOnly = settingsQuery.data?.countAvailableAssetsOnly ?? true;
  const auditAssets = useMemo(
    () => allAuditAssets.filter((asset) => shouldCountAsset(asset, countAvailableAssetsOnly)),
    [allAuditAssets, countAvailableAssetsOnly]
  );
  const hardwareQueryItems = useMemo(() => auditAssets.map(hardwareQueryItem), [auditAssets]);
  const auditTotal = auditAssets.length;
  const departmentOptions = useMemo(
    () => normalizeDepartmentList(settingsQuery.data?.departments || []),
    [settingsQuery.data?.departments]
  );
  const hardwareMemoryOptions = useMemo(
    () => hardwareFacetOptions(hardwareQueryItems, hardwareQuery, "memoryGb", (item) => item.memory, memoryOptionCompare),
    [hardwareQuery, hardwareQueryItems]
  );
  const hardwareDiskOptions = useMemo(
    () => hardwareFacetOptions(hardwareQueryItems, hardwareQuery, "diskCapacity", (item) => item.disk, memoryOptionCompare),
    [hardwareQuery, hardwareQueryItems]
  );
  const graphicsOptions = useMemo(
    () => hardwareFacetOptions(hardwareQueryItems, hardwareQuery, "graphics", (item) => item.graphics),
    [hardwareQuery, hardwareQueryItems]
  );
  const boardOptions = useMemo(
    () => hardwareFacetOptions(hardwareQueryItems, hardwareQuery, "board", (item) => item.board),
    [hardwareQuery, hardwareQueryItems]
  );
  const hardwareDepartmentOptions = useMemo(
    () => hardwareFacetOptions(hardwareQueryItems, hardwareQuery, "department", (item) => item.department),
    [hardwareQuery, hardwareQueryItems]
  );
  const hardwareStatusOptions = useMemo(
    () =>
      hardwareFacetOptions(hardwareQueryItems, hardwareQuery, "status", (item) => item.status)
        .map((option) => ({
          ...option,
          label: `${statusLabel(option.value)}${option.label.replace(option.value, "")}`,
        })),
    [hardwareQuery, hardwareQueryItems]
  );
  const hardwareBaseItems = useMemo(
    () =>
      hardwareQueryItems.filter((item) => {
        if (hardwareQuery.department && item.department !== hardwareQuery.department) {
          return false;
        }
        if (hardwareQuery.status && item.status !== hardwareQuery.status) {
          return false;
        }
        return true;
      }),
    [hardwareQuery.department, hardwareQuery.status, hardwareQueryItems]
  );
  const hardwareQueryItemsMatched = useMemo(
    () => hardwareQueryItems.filter((item) => hardwareQueryAssetMatches(item, hardwareQuery)),
    [hardwareQuery, hardwareQueryItems]
  );
  const hardwareQueryRows = useMemo<HardwareQueryDepartmentRow[]>(() => {
    const totals = countBy(hardwareBaseItems, (item) => item.department);
    const matched = countBy(hardwareQueryItemsMatched, (item) => item.department);
    return sortedEntries(matched).map(([department, count]) => ({
      department,
      matched: count,
      total: totals[department] || count,
      resultRate: hardwareQueryItemsMatched.length > 0 ? (count / hardwareQueryItemsMatched.length) * 100 : 0,
      departmentRate: (totals[department] || 0) > 0 ? (count / totals[department]) * 100 : 0,
    }));
  }, [hardwareBaseItems, hardwareQueryItemsMatched]);
  const hardwareQueryChartRows = useMemo<AnalysisBarDatum[]>(
    () =>
      hardwareQueryRows.map((row) => ({
        key: row.department,
        label: row.department,
        value: row.matched,
        valueText: `${row.matched} 台`,
        caption: `占该部门 ${formatPercentValue(row.departmentRate)}，部门电脑 ${row.total} 台`,
      })),
    [hardwareQueryRows]
  );
  const updateHardwareQuery = <K extends keyof HardwareQueryState>(key: K, value: HardwareQueryState[K]) => {
    setHardwareQuery((previous) => ({ ...previous, [key]: value }));
  };
  useEffect(() => {
    if (auditAssetsQuery.isLoading || !auditAssetsQuery.data) {
      return;
    }
    const next = { ...hardwareQuery };
    const labels: Record<keyof HardwareQueryState, string> = {
      memoryGb: "内存容量",
      graphics: "显卡型号",
      board: "主板型号",
      diskCapacity: "硬盘容量",
      department: "部门",
      status: "状态",
    };
    const optionMap: Record<keyof HardwareQueryState, string[]> = {
      memoryGb: hardwareMemoryOptions.map((option) => option.value),
      graphics: graphicsOptions.map((option) => option.value),
      board: boardOptions.map((option) => option.value),
      diskCapacity: hardwareDiskOptions.map((option) => option.value),
      department: hardwareDepartmentOptions.map((option) => option.value),
      status: hardwareStatusOptions.map((option) => option.value),
    };
    const clearedLabels: string[] = [];
    (Object.keys(optionMap) as Array<keyof HardwareQueryState>).forEach((key) => {
      if (next[key] && !optionMap[key].includes(String(next[key]))) {
        delete next[key];
        clearedLabels.push(labels[key]);
      }
    });
    if (clearedLabels.length) {
      setHardwareQuery(next);
      message.info(`已清除无匹配的${clearedLabels.join("、")}`);
    }
  }, [auditAssetsQuery.data, auditAssetsQuery.isLoading, boardOptions, graphicsOptions, hardwareDepartmentOptions, hardwareDiskOptions, hardwareMemoryOptions, hardwareQuery, hardwareStatusOptions]);
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
            add(`${diskKindLabel(item)} · ${hardwareCapacityLabel(hardwareItemBytes(item), "容量未知")}`);
          });
        } else {
          add(`未知类型 · ${hardwareCapacityLabel(hardwareDiskBytes(asset), "容量未知")}`);
        }
      } else {
        const memoryItems = hardwareArray(asset, "memory", "mem", "memLayout");
        if (memoryItems.length) {
          memoryItems.forEach((item) => {
            add(hardwareCapacityLabel(hardwareItemBytes(item), "容量未知"));
          });
        } else {
          add(hardwareCapacityLabel(hardwareMemoryBytes(asset), "容量未知"));
        }
      }
    });

    return sortedEntries(Object.fromEntries(rows)).map(([model, count]) => ({ model, count }));
  }, [auditAssets, hardwareRankType]);
  const currentInventoryMeta = HARDWARE_INVENTORY_META[hardwareRankType];
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
  const resolvedIssuesCount = Math.max(hardwareIssues.length - unresolvedIssues.length, 0);
  const resolvedIssuesRate = hardwareIssues.length > 0 ? (resolvedIssuesCount / hardwareIssues.length) * 100 : 0;
  const issueProgressBackground = hardwareIssues.length > 0
    ? `conic-gradient(#22a06b 0 ${resolvedIssuesRate}%, #f59e0b ${resolvedIssuesRate}% 100%)`
    : "conic-gradient(#e5e7eb 0 100%)";
  const unresolvedIssueTypeRows = useMemo<AnalysisBarDatum[]>(
    () =>
      sortedEntries(countBy(unresolvedIssues, (issue) => issue.type))
        .map(([type, count]) => ({
          key: type,
          label: type,
          value: count,
          valueText: `${count} 条`,
          caption: issueGroup(type),
          accent: issueTypeColor(type),
        })),
    [unresolvedIssues]
  );
  const unresolvedIssueDepartmentRows = useMemo<AnalysisBarDatum[]>(
    () =>
      sortedEntries(countBy(unresolvedIssues, (issue) => issue.asset.department || "未分配"))
        .map(([department, count]) => ({
          key: department,
          label: department,
          value: count,
          valueText: `${count} 条`,
        })),
    [unresolvedIssues]
  );
  const unresolvedIssueLevelRows = useMemo<AnalysisBarDatum[]>(
    () => {
      const counts = countBy(unresolvedIssues, (issue) => issue.level);
      return [
        { key: "error", label: "高", value: counts.error || 0, accent: "#ef4444" },
        { key: "warning", label: "中", value: counts.warning || 0, accent: "#f59e0b" },
        { key: "info", label: "低", value: counts.info || 0, accent: "#2f6fed" },
      ]
        .filter((row) => row.value > 0)
        .map((row) => ({
          ...row,
          valueText: `${row.value} 条 · ${percentText(row.value, unresolvedIssues.length)}`,
        }));
    },
    [unresolvedIssues]
  );
  const hardwareScopeText = countAvailableAssetsOnly ? "统计范围：在用、闲置" : "统计范围：全部状态";
  const collectedAssetsCount = auditAssets.filter((asset) => Boolean(asset.latestObservation?.observedAt)).length;
  const duplicateRiskIssues = hardwareIssues.filter((issue) => issueGroup(issue.type) === "重复风险").length;
  const missingProfileIssues = hardwareIssues.filter((issue) => issueGroup(issue.type) === "资料缺失").length;
  const missingHardwareIssues = hardwareIssues.filter((issue) => issueGroup(issue.type) === "硬件缺失").length;
  const staleCollectionIssues = hardwareIssues.filter((issue) => issueGroup(issue.type) === "采集状态").length;
  const maintenanceIssues = hardwareIssues.filter((issue) => issueGroup(issue.type) === "维护状态").length;
  const hardwareInsightItems = [
    {
      label: "采集覆盖",
      value: `${collectedAssetsCount} / ${auditTotal}`,
      note: `${formatPercentValue(auditTotal ? (collectedAssetsCount / auditTotal) * 100 : 0)} 已接入上传`,
      tone: "primary",
    },
    {
      label: "资料缺口",
      value: String(missingProfileIssues + missingHardwareIssues),
      note: `资料 ${missingProfileIssues}，硬件 ${missingHardwareIssues}`,
      tone: missingProfileIssues + missingHardwareIssues > 0 ? "warning" : "default",
    },
    {
      label: "重复风险",
      value: String(duplicateRiskIssues),
      note: "编号、IP 或主板序列号重复",
      tone: duplicateRiskIssues > 0 ? "danger" : "default",
    },
    {
      label: "待跟进",
      value: String(staleCollectionIssues + maintenanceIssues),
      note: `采集 ${staleCollectionIssues}，维护 ${maintenanceIssues}`,
      tone: staleCollectionIssues + maintenanceIssues > 0 ? "warning" : "default",
    },
  ];
  const issueRecordMutation = useMutation(
    ({ issue, message: recordMessage, eventType }: { issue: HardwareIssue; message: string; eventType: "issue_handled" | "issue_reopened" }) =>
      createAssetEvent(issue.asset.uuid, {
        eventType,
        message: recordMessage,
        payload: {
          issueKey: issue.key,
          issueType: issue.type,
          issueMessage: issue.message,
        },
      }),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(["v3-asset-events", variables.issue.asset.uuid]);
        queryClient.invalidateQueries(["v3-events"]);
        queryClient.invalidateQueries(["v3-analysis-issue-states"]);
        message.success(variables.eventType === "issue_reopened" ? "异常已恢复为未处理" : "异常已记录为已处理");
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
    issueRecordMutation.mutate({ issue, message: note, eventType: "issue_handled" });
  };

  const markIssueLocalOnly = (issue: HardwareIssue) => {
    issueRecordMutation.mutate({
      issue,
      eventType: "issue_handled",
      message: `已标记处理：${issue.type} - ${issue.message}`,
    });
  };

  const restoreIssue = (issue: HardwareIssue) => {
    issueRecordMutation.mutate({
      issue,
      eventType: "issue_reopened",
      message: `恢复未处理：${issue.type} - ${issue.message}`,
    });
  };

  useEffect(() => {
    if (!focus?.version) {
      return;
    }
    if (focus.hardwareIssueGroup) {
      setSelectedIssueGroup(focus.hardwareIssueGroup);
      setSelectedIssueType(undefined);
    }
    if (focus.hardwareSection === "issues") {
      window.requestAnimationFrame(() => {
        document.getElementById("npcink-v3-hardware-issues")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [focus?.hardwareIssueGroup, focus?.hardwareSection, focus?.version]);

  return (
    <div className="npcink-v3-section npcink-v3-hardware-health-layout">
      <div className="npcink-v3-analysis-page-head">
        <div>
          <span>硬件</span>
          <strong>盘点电脑采集质量和硬件库存</strong>
          <p>先处理异常和采集缺口，库存分布和组合筛选作为辅助工具。</p>
        </div>
        <Space wrap>
          <Tag color="blue">
            {auditAssetsQuery.isLoading ? "统计中" : `纳入 ${auditTotal} / 全部 ${allAuditAssets.length} 台`}
          </Tag>
          <Tag>{hardwareScopeText}</Tag>
        </Space>
      </div>
      <AnalysisBlock
        eyebrow="01"
        title="健康概览"
        description="用采集覆盖、资料缺口和重复风险判断今天是否需要处理。"
        className="npcink-v3-hardware-health-overview"
      >
        <div className="npcink-v3-insight-grid">
          {hardwareInsightItems.map((item) => (
            <div key={item.label} className={`npcink-v3-insight-card is-${item.tone}`}>
              <Text type="secondary">{item.label}</Text>
              <strong>{auditAssetsQuery.isLoading ? "-" : item.value}</strong>
              <span>{item.note}</span>
            </div>
          ))}
        </div>
      </AnalysisBlock>

      <AnalysisBlock
        eyebrow="03"
        title="硬件库存"
        description="辅助查看 CPU、硬盘、内存和主板库存结构。"
        className="npcink-v3-hardware-auxiliary"
        actions={
          <Space size={8} className="npcink-v3-analysis-controls">
            <Space.Compact size="small">
              {([
                { key: "cpu", label: "CPU" },
                { key: "disk", label: "硬盘" },
                { key: "memory", label: "内存" },
                { key: "board", label: "主板" },
              ] as Array<{ key: HardwareRankType; label: string }>).map((item) => (
                <Button
                  key={item.key}
                  size="small"
                  type={hardwareRankType === item.key ? "primary" : "default"}
                  onClick={() => setHardwareRankType(item.key)}
                >
                  {item.label}
                </Button>
              ))}
            </Space.Compact>
          </Space>
        }
      >
        <div className="npcink-v3-analysis-split">
          <div className="npcink-v3-inventory-board">
            <div className="npcink-v3-inventory-board-head">
              <Text strong>资产盘点</Text>
              <Text type="secondary">点击上方类别或下方卡片切换盘点口径。</Text>
            </div>
            <div className="npcink-v3-hardware-overview">
              {([
                { key: "cpu", value: hardwareInventory.cpu },
                { key: "disk", value: hardwareInventory.disk },
                { key: "memory", value: hardwareInventory.memory },
                { key: "board", value: hardwareInventory.board },
              ] as Array<{ key: HardwareRankType; value: number }>).map((item) => {
                const meta = HARDWARE_INVENTORY_META[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`${hardwareRankType === item.key ? "is-active" : ""} is-${item.key}`.trim()}
                    onClick={() => setHardwareRankType(item.key)}
                  >
                    <Text>{meta.label}（{meta.unit}）</Text>
                    <strong>{auditAssetsQuery.isLoading ? "-" : item.value}</strong>
                  </button>
                );
              })}
            </div>
            <div className={`npcink-v3-inventory-table is-${hardwareRankType}`}>
              <div className="npcink-v3-inventory-table-head">
                <span>{currentInventoryMeta.column}</span>
                <span>数量（{currentInventoryMeta.unit}）</span>
              </div>
              <div className="npcink-v3-inventory-table-body">
                {auditAssetsQuery.isLoading ? (
                  <div className="npcink-v3-inventory-empty">统计中...</div>
                ) : hardwareRankRows.length ? (
                  hardwareRankRows.map((row) => (
                    <div key={row.model} className="npcink-v3-inventory-row">
                      <span title={row.model}>{row.model}</span>
                      <strong>{row.count}</strong>
                    </div>
                  ))
                ) : (
                  <Empty description={currentInventoryMeta.emptyText} />
                )}
              </div>
            </div>
          </div>
          <div className="npcink-v3-audit-block">
            <div className="npcink-v3-audit-block-head">
              <div>
                <Text strong>部门状态</Text>
                <Text type="secondary">用堆叠条查看各部门状态构成。</Text>
              </div>
              <ViewModeToggle value={departmentView} onChange={setDepartmentView} />
            </div>
            {departmentView === "chart" ? (
              <div className="npcink-v3-status-stack-list">
                {departmentRows.map((row) => (
                  <div key={String(row.department)}>
                    <div className="npcink-v3-status-stack-row-head">
                      <strong>{String(row.department)}</strong>
                      <span>{Number(row.total || 0)} 台</span>
                    </div>
                    <StatusStack row={row} />
                  </div>
                ))}
              </div>
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
                  { title: "闲置", dataIndex: "inactive", width: 70 },
                  { title: "维护", dataIndex: "maintenance", width: 70 },
                  { title: "报废", dataIndex: "retired", width: 70 },
                  { title: "归档", dataIndex: "deleted", width: 70 },
                ]}
                locale={{ emptyText: <Empty description="暂无部门数据" /> }}
              />
            )}
          </div>
        </div>
      </AnalysisBlock>

      <AnalysisBlock
        eyebrow="04"
        title="组合筛选"
        description="作为辅助查询工具，按硬件、部门和状态筛出机器。"
        className="npcink-v3-hardware-auxiliary"
        actions={
          <Space wrap>
            <Tag color={hardwareQueryActive(hardwareQuery) ? "blue" : "default"}>
              命中 {auditAssetsQuery.isLoading ? "-" : hardwareQueryItemsMatched.length} / {hardwareBaseItems.length} 台
            </Tag>
            <Button
              size="small"
              disabled={!hardwareQueryActive(hardwareQuery)}
              onClick={() => setHardwareQuery({})}
            >
              重置
            </Button>
          </Space>
        }
      >
        <div className="npcink-v3-hardware-query is-embedded">
          <div className="npcink-v3-hardware-query-controls">
            <Select
              allowClear
              showSearch
              placeholder="内存容量"
              options={hardwareMemoryOptions}
              value={hardwareQuery.memoryGb}
              onChange={(value) => updateHardwareQuery("memoryGb", value)}
              popupMatchSelectWidth={false}
              filterOption={(input, option) => String(option?.label || "").toLowerCase().includes(input.toLowerCase())}
            />
            <Select
              allowClear
              showSearch
              placeholder="显卡型号"
              options={graphicsOptions}
              value={hardwareQuery.graphics}
              onChange={(value) => updateHardwareQuery("graphics", value)}
              popupMatchSelectWidth={false}
              filterOption={(input, option) => String(option?.label || "").toLowerCase().includes(input.toLowerCase())}
            />
            <Select
              allowClear
              showSearch
              placeholder="主板型号"
              options={boardOptions}
              value={hardwareQuery.board}
              onChange={(value) => updateHardwareQuery("board", value)}
              popupMatchSelectWidth={false}
              filterOption={(input, option) => String(option?.label || "").toLowerCase().includes(input.toLowerCase())}
            />
            <Select
              allowClear
              placeholder="硬盘容量"
              options={hardwareDiskOptions}
              value={hardwareQuery.diskCapacity}
              onChange={(value) => updateHardwareQuery("diskCapacity", value)}
              popupMatchSelectWidth={false}
            />
            <Select
              allowClear
              showSearch
              placeholder="部门"
              options={hardwareDepartmentOptions}
              value={hardwareQuery.department}
              onChange={(value) => updateHardwareQuery("department", value)}
              popupMatchSelectWidth={false}
              filterOption={(input, option) => String(option?.label || "").toLowerCase().includes(input.toLowerCase())}
            />
            <Select
              allowClear
              placeholder="状态"
              options={hardwareStatusOptions}
              value={hardwareQuery.status}
              onChange={(value) => updateHardwareQuery("status", value)}
            />
          </div>
          <div className="npcink-v3-hardware-query-summary">
            <div>
              <Text type="secondary">筛选范围</Text>
              <strong>{hardwareBaseItems.length}</strong>
              <span>台电脑</span>
            </div>
            <div className="is-primary">
              <Text type="secondary">命中数量</Text>
              <strong>{hardwareQueryItemsMatched.length}</strong>
              <span>占范围 {formatPercentValue(hardwareBaseItems.length ? (hardwareQueryItemsMatched.length / hardwareBaseItems.length) * 100 : 0)}</span>
            </div>
            <div>
              <Text type="secondary">涉及部门</Text>
              <strong>{hardwareQueryRows.length}</strong>
              <span>个部门</span>
            </div>
          </div>
          <div className="npcink-v3-hardware-query-results">
            <div className="npcink-v3-audit-block">
              <div className="npcink-v3-audit-block-head">
                <div>
                  <Text strong>部门命中</Text>
                  <Text type="secondary">占结果 = 该部门命中 / 全部命中。</Text>
                </div>
                <ViewModeToggle value={hardwareQueryView} onChange={setHardwareQueryView} />
              </div>
              {hardwareQueryView === "chart" ? (
                <AnalysisDonutBreakdown
                  rows={hardwareQueryChartRows}
                  loading={auditAssetsQuery.isLoading}
                  emptyText="暂无匹配部门"
                  totalLabel="命中"
                  totalText={`${hardwareQueryItemsMatched.length} 台`}
                  valueFormatter={(value) => `${value} 台`}
                />
              ) : (
                <Table
                  rowKey="department"
                  size="small"
                  pagination={false}
                  dataSource={hardwareQueryRows}
                  loading={auditAssetsQuery.isLoading}
                  columns={[
                    { title: "部门", dataIndex: "department" },
                    { title: "命中", dataIndex: "matched", width: 80 },
                    { title: "部门电脑", dataIndex: "total", width: 100 },
                    { title: "占结果", dataIndex: "resultRate", width: 100, render: formatPercentValue },
                    { title: "部门占比", dataIndex: "departmentRate", width: 110, render: formatPercentValue },
                  ]}
                  locale={{ emptyText: <Empty description="暂无匹配部门" /> }}
                />
              )}
            </div>
            <div className="npcink-v3-audit-block">
              <div className="npcink-v3-audit-block-head">
                <div>
                  <Text strong>命中机器</Text>
                  <Text type="secondary">打开资产详情核对采集字段。</Text>
                </div>
              </div>
              <Table
                rowKey={(item) => item.asset.uuid}
                size="small"
                pagination={{ pageSize: 6, showSizeChanger: false }}
                dataSource={hardwareQueryItemsMatched}
                loading={auditAssetsQuery.isLoading}
                columns={[
                  {
                    title: "资产",
                    width: 180,
                    render: (_, item) => (
                      <Space direction="vertical" size={2}>
                        <Text strong>{item.asset.assetNumber || item.asset.name || item.asset.uuid}</Text>
                        <Text type="secondary">{[item.asset.ownerName, item.asset.department].filter(Boolean).join(" / ") || "-"}</Text>
                      </Space>
                    ),
                  },
                  { title: "内存", width: 90, dataIndex: "memory" },
                  { title: "硬盘", width: 90, dataIndex: "disk" },
                  { title: "显卡", dataIndex: "graphics" },
                  { title: "主板", dataIndex: "board" },
                  {
                    title: "操作",
                    width: 88,
                    render: (_, item) => (
                      <Button
                        size="small"
                        type="link"
                        className="npcink-v3-link"
                        onClick={() => setSelectedUuid(item.asset.uuid)}
                      >
                        查看
                      </Button>
                    ),
                  },
                ]}
                scroll={{ x: 940 }}
                locale={{ emptyText: <Empty description="暂无匹配机器" /> }}
              />
            </div>
          </div>
        </div>
      </AnalysisBlock>
      <AnalysisBlock
        eyebrow="02"
        title="排障工作区"
        description={`主工作区：当前显示 ${visibleIssues.length} 条，未处理 ${unresolvedIssues.length} / 全部 ${hardwareIssues.length}。`}
        className="npcink-v3-hardware-main"
        actions={
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
        }
      >
      <div id="npcink-v3-hardware-issues" className="npcink-v3-issue-panel">
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
        <div className="npcink-v3-issue-troubleshoot">
          <div className="npcink-v3-audit-block">
            <div className="npcink-v3-audit-block-head">
              <div>
                <Text strong>问题类型</Text>
                <Text type="secondary">按未处理数量排序，优先处理数量最高的类型。</Text>
              </div>
            </div>
            <AnalysisDonutBreakdown
              rows={unresolvedIssueTypeRows}
              loading={auditAssetsQuery.isLoading}
              emptyText="暂无未处理问题"
              totalLabel="未处理"
              totalText={`${unresolvedIssueTypeRows.reduce((total, row) => total + row.value, 0)} 条`}
              valueFormatter={(value) => `${value} 条`}
            />
          </div>
          <div className="npcink-v3-audit-block">
            <div className="npcink-v3-audit-block-head">
              <div>
                <Text strong>部门问题</Text>
                <Text type="secondary">定位问题集中的部门，便于批量核对。</Text>
              </div>
            </div>
            <AnalysisDonutBreakdown
              rows={unresolvedIssueDepartmentRows}
              loading={auditAssetsQuery.isLoading}
              emptyText="暂无部门问题"
              totalLabel="未处理"
              totalText={`${unresolvedIssueDepartmentRows.reduce((total, row) => total + row.value, 0)} 条`}
              valueFormatter={(value) => `${value} 条`}
            />
          </div>
          <div className="npcink-v3-audit-block">
            <div className="npcink-v3-audit-block-head">
              <div>
                <Text strong>处理进度</Text>
                <Text type="secondary">进度用环形图，级别明细保留条形图。</Text>
              </div>
            </div>
            <div className="npcink-v3-issue-progress">
              <div className="npcink-v3-issue-progress-donut" style={{ background: issueProgressBackground }}>
                <div>
                  <span>已处理</span>
                  <strong>{formatPercentValue(resolvedIssuesRate)}</strong>
                </div>
              </div>
              <div className="npcink-v3-issue-progress-meta">
                <div>
                  <span className="npcink-v3-value-swatch is-custom" />
                  <Text type="secondary">已处理</Text>
                  <strong>{resolvedIssuesCount}</strong>
                </div>
                <div>
                  <span className="npcink-v3-value-swatch is-warning" />
                  <Text type="secondary">未处理</Text>
                  <strong>{unresolvedIssues.length}</strong>
                </div>
              </div>
            </div>
            <div className="npcink-v3-issue-levels">
              <AnalysisBarChart
                rows={unresolvedIssueLevelRows}
                loading={auditAssetsQuery.isLoading}
                emptyText="暂无未处理级别"
                valueFormatter={(value) => `${value} 条`}
              />
            </div>
          </div>
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
      </AnalysisBlock>
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
        departmentOptions={departmentOptions}
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

type AssetTypeValueMetric = "current" | "purchase" | "count";

interface ValueDistributionChartProps {
  rows: AssetValueGroupRow[];
  loading?: boolean;
  emptyText: string;
}

const VALUE_DISTRIBUTION_COLORS = ["#2f6fed", "#22a06b", "#f59e0b", "#ef4444", "#64748b", "#8b5cf6"];

const ValueDistributionChart = ({ rows, loading, emptyText }: ValueDistributionChartProps) => {
  if (loading) {
    return <div className="npcink-v3-chart-placeholder">统计中</div>;
  }

  const visibleRows = rows.filter((row) => row.purchase > 0);
  const totalPurchase = visibleRows.reduce((total, row) => total + row.purchase, 0);

  if (!visibleRows.length || totalPurchase <= 0) {
    return <Empty description={emptyText} />;
  }

  return (
    <div className="npcink-v3-percent-distribution">
      <div className="npcink-v3-percent-distribution-head">
        <div>
          <Text type="secondary">采购价合计</Text>
          <strong>{formatMoney(totalPurchase)}</strong>
        </div>
        <Tag color="blue">按状态占比</Tag>
      </div>
      <div className="npcink-v3-percent-stack" aria-label="状态采购价占比分布">
        {visibleRows.map((row, index) => {
          const share = (row.purchase / totalPurchase) * 100;
          return (
            <i
              key={row.key}
              style={{
                width: `${share}%`,
                background: VALUE_DISTRIBUTION_COLORS[index % VALUE_DISTRIBUTION_COLORS.length],
              }}
              title={`${row.label} ${formatPercentValue(share)} ${formatMoney(row.purchase)}`}
            />
          );
        })}
      </div>
      <div className="npcink-v3-percent-legend">
        {visibleRows.map((row, index) => {
          const share = (row.purchase / totalPurchase) * 100;
          return (
            <div key={row.key} className="npcink-v3-percent-legend-row">
              <span
                className="npcink-v3-percent-legend-swatch"
                style={{ background: VALUE_DISTRIBUTION_COLORS[index % VALUE_DISTRIBUTION_COLORS.length] }}
              />
              <div>
                <Text strong>{row.label}</Text>
                <em>{row.count} 条 / 当前估值 {formatMoney(row.current)}</em>
              </div>
              <strong>{formatPercentValue(share)}</strong>
              <span>{formatMoney(row.purchase)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const moneyValue = (value: unknown) => {
  const number = toNumber(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

const elapsedMonthsSince = (date: Date, now = new Date()) => {
  const elapsedMs = now.getTime() - date.getTime();
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) {
    return 0;
  }
  return elapsedMs / (1000 * 60 * 60 * 24 * 30.4375);
};

const depreciatedValue = (purchase: number, purchaseDate: Date | null, periodMonths: number, residualRate: number) => {
  if (purchase <= 0) {
    return 0;
  }
  const floorValue = purchase * (Math.min(100, Math.max(0, residualRate)) / 100);
  if (!purchaseDate) {
    return floorValue;
  }
  const usablePeriod = Math.max(1, periodMonths);
  const progress = Math.min(elapsedMonthsSince(purchaseDate) / usablePeriod, 1);
  return Math.max(floorValue, purchase - (purchase - floorValue) * progress);
};

const assetCurrentValue = (asset: Asset, depreciationPeriodMonths: number, defaultResidualRate: number) => {
  const explicitCurrent = moneyValue(asset.residualValue);
  const purchase = moneyValue(asset.purchasePrice);
  if (explicitCurrent > 0 || purchase <= 0) {
    return explicitCurrent;
  }
  return depreciatedValue(
    purchase,
    parseDateValue(assetPurchaseDateText(asset)),
    depreciationPeriodMonths,
    defaultResidualRate
  );
};

const formatPercentValue = (value: number) =>
  `${new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)}%`;

interface AnalysisSummaryWorkspaceProps {
  onOpenTab: (tab: AnalysisTabKey, focus?: Omit<AnalysisFocusTarget, "version">) => void;
}

const AnalysisSummaryWorkspace = ({ onOpenTab }: AnalysisSummaryWorkspaceProps) => {
  const settingsQuery = useQuery(["v3-settings"], getSettings, { staleTime: 60_000 });
  const assetsQuery = useQuery(
    ["v3-analysis-summary-assets"],
    () => fetchAllAssets({ assetScope: "all", includeDeleted: true }),
    { staleTime: 60_000 }
  );
  const issueStatesQuery = useQuery(["v3-analysis-issue-states"], getIssueStates, { staleTime: 30_000 });
  const handledIssueKeys = useMemo(
    () => new Set(issueStatesQuery.data?.handledIssueKeys || []),
    [issueStatesQuery.data?.handledIssueKeys]
  );
  const assets = assetsQuery.data || [];
  const countAvailableAssetsOnly = settingsQuery.data?.countAvailableAssetsOnly ?? true;
  const depreciationPeriodMonths = settingsQuery.data?.depreciationPeriodMonths ?? 36;
  const defaultResidualRate = settingsQuery.data?.defaultResidualRate ?? 5;
  const scopedAssets = useMemo(
    () => assets.filter((asset) => shouldCountAsset(asset, countAvailableAssetsOnly)),
    [assets, countAvailableAssetsOnly]
  );
  const computerAssets = useMemo(() => scopedAssets.filter(isComputerAsset), [scopedAssets]);
  const hardwareIssues = useMemo(() => detectHardwareIssues(computerAssets), [computerAssets]);
  const unresolvedIssues = useMemo(
    () => hardwareIssues.filter((issue) => !handledIssueKeys.has(issue.key)),
    [handledIssueKeys, hardwareIssues]
  );
  const highRiskIssues = unresolvedIssues.filter((issue) => issue.level === "error");
  const collectedAssetsCount = computerAssets.filter((asset) => Boolean(asset.latestObservation?.observedAt)).length;
  const collectionRate = computerAssets.length ? (collectedAssetsCount / computerAssets.length) * 100 : 0;
  const totalPurchase = scopedAssets.reduce((total, asset) => total + moneyValue(asset.purchasePrice), 0);
  const totalCurrent = scopedAssets.reduce(
    (total, asset) => total + assetCurrentValue(asset, depreciationPeriodMonths, defaultResidualRate),
    0
  );
  const explicitResidualCount = scopedAssets.filter((asset) => moneyValue(asset.residualValue) > 0).length;
  const depreciationEstimatedCount = scopedAssets.filter((asset) => (
    moneyValue(asset.residualValue) <= 0 && moneyValue(asset.purchasePrice) > 0
  )).length;
  const missingValuationCount = Math.max(scopedAssets.length - explicitResidualCount - depreciationEstimatedCount, 0);
  const valuationConfidenceRate = scopedAssets.length > 0
    ? ((explicitResidualCount + depreciationEstimatedCount * 0.6) / scopedAssets.length) * 100
    : 0;
  const idleAssets = scopedAssets.filter((asset) => asset.status === "inactive");
  const maintenanceAssets = scopedAssets.filter((asset) => asset.status === "maintenance");
  const idleAndMaintenanceValue = [...idleAssets, ...maintenanceAssets].reduce(
    (total, asset) => total + assetCurrentValue(asset, depreciationPeriodMonths, defaultResidualRate),
    0
  );
  const issueGroupCounts = countBy(unresolvedIssues, (issue) => issueGroup(issue.type));
  const topIssueGroups = sortedEntries(issueGroupCounts).slice(0, 4);
  const priorityIssueGroup = sortedEntries(countBy(
    highRiskIssues.length ? highRiskIssues : unresolvedIssues,
    (issue) => issueGroup(issue.type)
  ))[0]?.[0];
  const latestObservedTimes = computerAssets
    .map((asset) => parseDateValue(asset.latestObservation?.observedAt || ""))
    .filter((date): date is Date => Boolean(date))
    .map((date) => date.getTime());
  const latestObservedAt = latestObservedTimes.length ? formatDate(new Date(Math.max(...latestObservedTimes)).toISOString()) : "-";
  const isLoading = assetsQuery.isLoading || settingsQuery.isLoading || issueStatesQuery.isLoading;
  const summaryTone = highRiskIssues.length > 0
    ? "danger"
    : unresolvedIssues.length > 0 || missingValuationCount > 0
      ? "warning"
      : "primary";
  const summaryHeadline = highRiskIssues.length > 0
    ? `先处理 ${highRiskIssues.length} 条高风险资产异常`
    : unresolvedIssues.length > 0
      ? `还有 ${unresolvedIssues.length} 条资产问题待处理`
      : missingValuationCount > 0
        ? `补齐 ${missingValuationCount} 条资产估值基础`
        : "当前资产台账没有明显阻塞项";
  const summaryCopy = highRiskIssues.length > 0
    ? "重复编号、重复 IP 或关键硬件缺失会影响台账可信度，建议先进入硬件健康处理。"
    : unresolvedIssues.length > 0
      ? "先收敛异常清单，再看库存和价值报表。"
      : missingValuationCount > 0
        ? "价值分析已经可用，但部分资产缺少采购价或残值基础。"
        : "采集、异常和估值基础处于可接受状态，可以直接查看库存和价值分布。";
  const actionItems = [
    {
      key: "risk",
      title: highRiskIssues.length > 0 ? "处理高风险异常" : "查看异常清单",
      meta: highRiskIssues.length > 0 ? `${highRiskIssues.length} 条高风险` : `${unresolvedIssues.length} 条未处理`,
      description: topIssueGroups.length
        ? topIssueGroups.map(([group, count]) => `${group} ${count}`).join(" / ")
        : "暂无未处理异常",
      tone: highRiskIssues.length > 0 ? "danger" : unresolvedIssues.length > 0 ? "warning" : "primary",
      action: "进入硬件健康",
      tab: "hardware" as const,
      focus: {
        hardwareSection: "issues" as const,
        hardwareIssueGroup: priorityIssueGroup || "全部",
      },
    },
    {
      key: "collection",
      title: "核对采集覆盖",
      meta: `${collectedAssetsCount} / ${computerAssets.length} 台`,
      description: `覆盖率 ${formatPercentValue(collectionRate)}，最近采集 ${latestObservedAt}`,
      tone: collectionRate >= 90 || computerAssets.length === 0 ? "primary" : "warning",
      action: "查看采集",
      tab: "hardware" as const,
      focus: {
        hardwareSection: "collection" as const,
      },
    },
    {
      key: "valuation",
      title: "补估值基础",
      meta: missingValuationCount > 0 ? `${missingValuationCount} 条缺基础` : formatPercentValue(valuationConfidenceRate),
      description: `采购价 ${formatMoney(totalPurchase)}，当前估值 ${formatMoney(totalCurrent)}`,
      tone: missingValuationCount > 0 ? "warning" : "primary",
      action: "看价值",
      tab: "value" as const,
      focus: {
        valueSection: "valuation" as const,
      },
    },
  ];

  return (
    <div className="npcink-v3-section">
      <div className={`npcink-v3-analysis-summary-hero is-${summaryTone}`}>
        <div>
          <span>管理摘要</span>
          <strong>{isLoading ? "正在汇总资产状态" : summaryHeadline}</strong>
          <p>{summaryCopy}</p>
        </div>
        <Space wrap>
          <Button
            type="primary"
            onClick={() =>
              onOpenTab(
                highRiskIssues.length || unresolvedIssues.length ? "hardware" : "value",
                highRiskIssues.length || unresolvedIssues.length
                  ? { hardwareSection: "issues", hardwareIssueGroup: priorityIssueGroup || "全部" }
                  : { valueSection: "valuation" }
              )
            }
          >
            {highRiskIssues.length || unresolvedIssues.length ? "处理异常" : "查看价值"}
          </Button>
          <Button onClick={() => onOpenTab("hardware", { hardwareSection: "collection" })}>硬件健康</Button>
        </Space>
      </div>

      <div className="npcink-v3-summary-kpi-strip">
        {[
          { label: "采集覆盖", value: isLoading ? "-" : formatPercentValue(collectionRate), meta: `${collectedAssetsCount} / ${computerAssets.length} 台电脑`, tone: collectionRate >= 90 || computerAssets.length === 0 ? "primary" : "warning" },
          { label: "未处理异常", value: isLoading ? "-" : String(unresolvedIssues.length), meta: highRiskIssues.length ? `${highRiskIssues.length} 条高风险` : "按问题类型下钻", tone: highRiskIssues.length ? "danger" : unresolvedIssues.length ? "warning" : "primary" },
          { label: "估值可信度", value: isLoading ? "-" : formatPercentValue(valuationConfidenceRate), meta: missingValuationCount ? `${missingValuationCount} 条缺基础` : "基础完整", tone: missingValuationCount ? "warning" : "primary" },
          { label: "闲置/维护价值", value: isLoading ? "-" : formatMoney(idleAndMaintenanceValue), meta: `${idleAssets.length} 闲置 / ${maintenanceAssets.length} 维护`, tone: idleAndMaintenanceValue > 0 ? "warning" : "default" },
        ].map((item) => (
          <div key={item.label} className={`is-${item.tone}`}>
            <Text type="secondary">{item.label}</Text>
            <strong>{item.value}</strong>
            <span>{item.meta}</span>
          </div>
        ))}
      </div>

      <div className="npcink-v3-summary-workgrid">
        <section className="npcink-v3-summary-action-list">
          <div className="npcink-v3-summary-section-head">
            <Text strong>下一步</Text>
            <Text type="secondary">按影响台账可信度的顺序处理。</Text>
          </div>
          {actionItems.map((item) => (
            <button key={item.key} type="button" className={`is-${item.tone}`} onClick={() => onOpenTab(item.tab, item.focus)}>
              <span>{item.title}</span>
              <strong>{item.meta}</strong>
              <em>{item.description}</em>
              <i>{item.action}</i>
            </button>
          ))}
        </section>

        <section className="npcink-v3-summary-drilldowns">
          <div className="npcink-v3-summary-section-head">
            <Text strong>下钻入口</Text>
            <Text type="secondary">报表和工具收进二级视图。</Text>
          </div>
          <div>
            <button type="button" onClick={() => onOpenTab("hardware")}>
              <Text strong>硬件健康</Text>
              <span>采集覆盖、硬件缺失、重复风险、异常清单</span>
            </button>
            <button type="button" onClick={() => onOpenTab("value")}>
              <Text strong>资产价值</Text>
              <span>采购价、当前估值、折价、部门/分类分布</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

interface AssetValueWorkspaceProps {
  focus?: AnalysisFocusTarget;
}

const AssetValueWorkspace = ({ focus }: AssetValueWorkspaceProps) => {
  const queryClient = useQueryClient();
  const [editingValuationAsset, setEditingValuationAsset] = useState<Asset | null>(null);
  const [valueViews, setValueViews] = useState<Record<"department" | "category" | "status", AnalysisViewMode>>({
    department: "chart",
    category: "chart",
    status: "chart",
  });
  const [assetTypeMetric, setAssetTypeMetric] = useState<AssetTypeValueMetric>("current");
  const settingsQuery = useQuery(["v3-settings"], getSettings, { staleTime: 60_000 });
  const assetsQuery = useQuery(
    ["v3-asset-value-analysis"],
    () => fetchAllAssets({ assetScope: "all", includeDeleted: true }),
    { staleTime: 60_000 }
  );
  const assets = assetsQuery.data || [];
  const countAvailableAssetsOnly = settingsQuery.data?.countAvailableAssetsOnly ?? true;
  const departmentOptions = useMemo(
    () => normalizeDepartmentList(settingsQuery.data?.departments || []),
    [settingsQuery.data?.departments]
  );
  const valueAssets = assets.filter((asset) => shouldCountAsset(asset, countAvailableAssetsOnly));
  const depreciationPeriodMonths = settingsQuery.data?.depreciationPeriodMonths ?? 36;
  const defaultResidualRate = settingsQuery.data?.defaultResidualRate ?? 5;
  const currentValue = (asset: Asset) => assetCurrentValue(asset, depreciationPeriodMonths, defaultResidualRate);
  const totalPurchase = valueAssets.reduce((total, asset) => total + moneyValue(asset.purchasePrice), 0);
  const totalCurrent = valueAssets.reduce((total, asset) => total + currentValue(asset), 0);
  const totalDepreciation = Math.max(totalPurchase - totalCurrent, 0);
  const currentRate = totalPurchase > 0 ? (totalCurrent / totalPurchase) * 100 : 0;
  const depreciationRate = totalPurchase > 0 ? (totalDepreciation / totalPurchase) * 100 : 0;
  const valueScopeText = countAvailableAssetsOnly ? "统计范围：在用、闲置" : "统计范围：全部状态";
  const purchasePricedCount = valueAssets.filter((asset) => moneyValue(asset.purchasePrice) > 0).length;
  const explicitResidualCount = valueAssets.filter((asset) => moneyValue(asset.residualValue) > 0).length;
  const depreciationEstimatedCount = valueAssets.filter((asset) => (
    moneyValue(asset.residualValue) <= 0 && moneyValue(asset.purchasePrice) > 0
  )).length;
  const missingValuationAssets = valueAssets.filter((asset) => (
    moneyValue(asset.residualValue) <= 0 && moneyValue(asset.purchasePrice) <= 0
  ));
  const missingValuationCount = Math.max(valueAssets.length - explicitResidualCount - depreciationEstimatedCount, 0);
  const valuationConfidenceRate = valueAssets.length > 0
    ? ((explicitResidualCount + depreciationEstimatedCount * 0.6) / valueAssets.length) * 100
    : 0;
  const valuationQualityItems = [
    {
      label: "采购价覆盖",
      value: `${purchasePricedCount} / ${valueAssets.length}`,
      note: `${formatPercentValue(valueAssets.length ? (purchasePricedCount / valueAssets.length) * 100 : 0)} 有采购价`,
      tone: "primary",
    },
    {
      label: "明确残值",
      value: String(explicitResidualCount),
      note: "直接使用二手价/残值字段",
      tone: "default",
    },
    {
      label: "折旧估算",
      value: String(depreciationEstimatedCount),
      note: `按 ${depreciationPeriodMonths} 个月和默认残值率估算`,
      tone: depreciationEstimatedCount > 0 ? "warning" : "default",
    },
    {
      label: "缺估值基础",
      value: String(missingValuationCount),
      note: `估值可信度 ${formatPercentValue(valuationConfidenceRate)}`,
      tone: missingValuationCount > 0 ? "danger" : "default",
    },
  ];

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

  const summarizeValueGroupRows = (rows: AssetValueGroupRow[], limit: number, otherLabel: string) => {
    if (rows.length <= limit) {
      return rows;
    }
    const visible = rows.slice(0, limit);
    const other = rows.slice(limit).reduce<AssetValueGroupRow>(
      (result, row) => ({
        ...result,
        count: result.count + row.count,
        purchase: result.purchase + row.purchase,
        current: result.current + row.current,
        depreciation: result.depreciation + row.depreciation,
      }),
      {
        key: otherLabel,
        label: otherLabel,
        count: 0,
        purchase: 0,
        current: 0,
        depreciation: 0,
        currentRate: 0,
      }
    );
    other.currentRate = other.purchase > 0 ? (other.current / other.purchase) * 100 : 0;
    return [...visible, other];
  };

  const allDepartmentRows = buildGroupRows((asset) => asset.department || "未填写");
  const allCategoryRows = buildGroupRows((asset) => asset.category || assetTypeLabel(asset.assetType));
  const departmentRows = allDepartmentRows.slice(0, 8);
  const categoryRows = allCategoryRows.slice(0, 8);
  const departmentChartRows = summarizeValueGroupRows(allDepartmentRows, 7, "其他部门");
  const categoryChartRows = summarizeValueGroupRows(allCategoryRows, 7, "其他分类");
  const statusRows = buildGroupRows((asset) => statusLabel(asset.status));
  const rawAssetTypeRows = buildGroupRows((asset) => (isComputerAsset(asset) ? "电脑设备" : "自定义设备"));
  const assetTypeRows = ["电脑设备", "自定义设备"].map((label) => rawAssetTypeRows.find((row) => row.label === label) || {
    key: label,
    label,
    count: 0,
    purchase: 0,
    current: 0,
    depreciation: 0,
    currentRate: 0,
  });
  const assetTypeMetricValue = (row: AssetValueGroupRow) => {
    if (assetTypeMetric === "purchase") {
      return row.purchase;
    }
    if (assetTypeMetric === "count") {
      return row.count;
    }
    return row.current;
  };
  const assetTypeMetricTotal = assetTypeRows.reduce((total, row) => total + assetTypeMetricValue(row), 0);
  const assetTypeMetricLabel = assetTypeMetric === "purchase" ? "采购价" : assetTypeMetric === "count" ? "数量" : "当前估值";
  const assetTypeMetricFormatter = assetTypeMetric === "count" ? (value: number) => `${value} 条` : formatMoney;
  const assetTypeDonutRows: AnalysisBarDatum[] = assetTypeRows.map((row, index) => {
    const value = assetTypeMetricValue(row);
    return {
      key: row.key,
      label: row.label,
      value,
      valueText: assetTypeMetricFormatter(value),
      caption: `${row.count} 条 / 采购价 ${formatMoney(row.purchase)} / 当前估值 ${formatMoney(row.current)}`,
      accent: index === 0 ? "#2f6fed" : "#22a06b",
    };
  });
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
  const updateValuationAssetMutation = useMutation(
    ({ uuid, input }: { uuid: string; input: AssetInput }) => updateAsset(uuid, input),
    {
      onSuccess: (asset) => {
        setEditingValuationAsset(null);
        queryClient.invalidateQueries(["v3-asset-value-analysis"]);
        queryClient.invalidateQueries(["v3-analysis-summary-assets"]);
        queryClient.invalidateQueries(["v3-assets"]);
        queryClient.invalidateQueries(["v3-asset", asset.uuid]);
        message.success("估值基础已更新");
      },
    }
  );
  useEffect(() => {
    if (focus?.valueSection !== "valuation") {
      return;
    }
    window.requestAnimationFrame(() => {
      document.getElementById("npcink-v3-value-valuation")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [focus?.valueSection, focus?.version]);

  return (
    <div className="npcink-v3-section">
      <div className="npcink-v3-analysis-page-head">
        <div>
          <span>价值</span>
          <strong>查看资产规模、折价和价值分布</strong>
          <p>先看总金额和折价，再看设备类型、部门和分类分布。</p>
        </div>
        <Space wrap>
          <Tag color="blue">
            {assetsQuery.isLoading ? "统计中" : `纳入 ${valueAssets.length} / 全部 ${assets.length} 条`}
          </Tag>
          <Tag>{valueScopeText}</Tag>
        </Space>
      </div>

      <AnalysisBlock
        eyebrow="01"
        title="财务总览"
        description="用三个主指标判断资产规模和折价情况。"
      >
        <div className="npcink-v3-value-main-grid">
          {[
            { label: "总采购价", value: formatMoney(totalPurchase), note: "采购价合计", tone: "primary" },
            { label: "当前估值", value: formatMoney(totalCurrent), note: "残值/二手价，缺失时按折旧估算", meter: currentRate, tone: "default" },
            { label: "已折价", value: formatMoney(totalDepreciation), note: "采购价 - 当前估值", meter: depreciationRate, tone: "warning" },
          ].map((item) => (
            <div key={item.label} className={`npcink-v3-value-main-card is-${item.tone}`}>
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
        <div className="npcink-v3-value-rate-strip">
          <div>
            <span>资产数量</span>
            <strong>{valueAssets.length} 条</strong>
            <em>{countAvailableAssetsOnly ? "不含维护、报废、归档" : "包含全部状态"}</em>
          </div>
          <div>
            <span>估值率</span>
            <strong>{formatPercentValue(currentRate)}</strong>
            <em>当前估值 / 采购价</em>
          </div>
          <div>
            <span>折价率</span>
            <strong>{formatPercentValue(depreciationRate)}</strong>
            <em>已折价 / 采购价</em>
          </div>
        </div>
      </AnalysisBlock>

      <div id="npcink-v3-value-valuation">
      <AnalysisBlock
        eyebrow="02"
        title="估值基础待补"
        description="优先补齐采购价或二手价，后面的价值分布才更可信。"
        actions={
          <Tag color={missingValuationCount > 0 ? "orange" : "green"}>
            {missingValuationCount > 0 ? `${missingValuationCount} 条待补` : "基础完整"}
          </Tag>
        }
        className="npcink-v3-value-primary-work"
      >
        {missingValuationAssets.length ? (
          <div className="npcink-v3-missing-valuation">
            <Table
              rowKey="uuid"
              size="small"
              pagination={{ pageSize: 8, showSizeChanger: false }}
              dataSource={missingValuationAssets}
              loading={assetsQuery.isLoading}
              columns={[
                {
                  title: "资产",
                  render: (_, asset) => (
                    <Space direction="vertical" size={2}>
                      <Text strong>{asset.assetNumber || asset.name || asset.uuid}</Text>
                      <Text type="secondary">{asset.name || assetTypeLabel(asset.assetType)}</Text>
                    </Space>
                  ),
                },
                { title: "状态", dataIndex: "status", width: 90, render: statusLabel },
                { title: "部门", dataIndex: "department", width: 120, render: (value: string) => value || "-" },
                { title: "责任人", dataIndex: "ownerName", width: 120, render: (value: string) => value || "-" },
                {
                  title: "操作",
                  width: 88,
                  render: (_, asset) => (
                    <Button
                      size="small"
                      type="link"
                      className="npcink-v3-link"
                      onClick={() => setEditingValuationAsset(asset)}
                    >
                      编辑
                    </Button>
                  ),
                },
              ]}
              scroll={{ x: 720 }}
              locale={{ emptyText: <Empty description="暂无缺估值基础资产" /> }}
            />
          </div>
        ) : (
          <Empty description="暂无缺估值基础资产" />
        )}
      </AnalysisBlock>
      </div>

      <AnalysisBlock
        eyebrow="04"
        title="类型对比"
        description="电脑设备和自定义设备分开看，避免混在一个总数里。"
        actions={
          <div className="npcink-v3-view-toggle" role="group" aria-label="资产类型占比口径">
            {[
              { key: "current", label: "当前估值" },
              { key: "purchase", label: "采购价" },
              { key: "count", label: "数量" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                className={assetTypeMetric === item.key ? "is-active" : ""}
                aria-pressed={assetTypeMetric === item.key}
                onClick={() => setAssetTypeMetric(item.key as AssetTypeValueMetric)}
              >
                {item.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="npcink-v3-value-type-distribution">
          <AnalysisDonutBreakdown
            rows={assetTypeDonutRows}
            loading={assetsQuery.isLoading}
            emptyText="暂无类型对比数据"
            totalLabel={assetTypeMetricLabel}
            totalText={assetTypeMetricFormatter(assetTypeMetricTotal)}
            valueFormatter={assetTypeMetricFormatter}
          />
        </div>
      </AnalysisBlock>

      <AnalysisBlock
        eyebrow="03"
        title="估值可信度"
        description="区分直接录入、折旧估算和缺少基础价格的数据。"
        actions={
          <Tag color={missingValuationCount > 0 ? "orange" : "green"}>
            {formatPercentValue(valuationConfidenceRate)}
          </Tag>
        }
      >
        <div className="npcink-v3-insight-grid">
          {valuationQualityItems.map((item) => (
            <div key={item.label} className={`npcink-v3-insight-card is-${item.tone}`}>
              <Text type="secondary">{item.label}</Text>
              <strong>{assetsQuery.isLoading ? "-" : item.value}</strong>
              <span>{item.note}</span>
            </div>
          ))}
        </div>
      </AnalysisBlock>

      <AnalysisBlock
        eyebrow="05"
        title="排行明细"
        description="图表模式用环形占比图；需要精确数值时切到表格。"
      >
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
            <AnalysisDonutBreakdown
              rows={valueChartRows(departmentChartRows)}
              loading={assetsQuery.isLoading}
              emptyText="暂无部门价值数据"
              totalLabel="采购价"
              totalText={formatMoney(departmentChartRows.reduce((total, row) => total + row.purchase, 0))}
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
            <AnalysisDonutBreakdown
              rows={valueChartRows(categoryChartRows)}
              loading={assetsQuery.isLoading}
              emptyText="暂无分类价值数据"
              totalLabel="采购价"
              totalText={formatMoney(categoryChartRows.reduce((total, row) => total + row.purchase, 0))}
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
              <Text type="secondary">查看在用、闲置、维护、报废等状态的金额分布</Text>
            </div>
            <ViewModeToggle value={valueViews.status} onChange={(mode) => setValueView("status", mode)} />
          </div>
          {valueViews.status === "chart" ? (
            <ValueDistributionChart
              rows={statusRows}
              loading={assetsQuery.isLoading}
              emptyText="暂无状态价值数据"
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
      </AnalysisBlock>

      <Collapse
        className="npcink-v3-formula-collapse"
        items={[
          {
            key: "formula",
            label: "计算口径",
            children: (
              <div className="npcink-v3-formula-copy">
                <p>当前估值 = 资产的二手价/残值字段合计；缺失时按购置日期、折旧年限和默认残值率做直线折旧估算。</p>
                <p>已折价 = 总采购价 - 当前估值。</p>
                <p>估值率 = 当前估值 / 总采购价。</p>
                <p>折价率 = 已折价 / 总采购价。</p>
                <p>当前折旧年限：{depreciationPeriodMonths} 个月。</p>
                <p>当前默认残值率：{formatPercentValue(defaultResidualRate)}。</p>
                <p>{countAvailableAssetsOnly ? "当前只统计在用、闲置资产；维护、报废、归档不纳入。" : "当前统计全部状态资产。"}</p>
              </div>
            ),
          },
        ]}
      />
      <AssetFormModal
        asset={editingValuationAsset}
        open={Boolean(editingValuationAsset)}
        departmentOptions={departmentOptions}
        onClose={() => setEditingValuationAsset(null)}
        onSubmit={async (input) => {
          if (!editingValuationAsset) {
            return;
          }
          await updateValuationAssetMutation.mutateAsync({
            uuid: editingValuationAsset.uuid,
            input,
          });
        }}
      />
    </div>
  );
};

const ANALYSIS_TAB_KEYS: AnalysisTabKey[] = ["summary", "hardware", "value"];

const AnalysisWorkspace = () => {
  const [activeTab, setActiveTab] = useState<AnalysisTabKey>(() =>
    loadStoredTab(ANALYSIS_TAB_STORAGE_KEY, ANALYSIS_TAB_KEYS, "summary")
  );
  const [focusTarget, setFocusTarget] = useState<AnalysisFocusTarget>({ version: 0 });
  const openAnalysisTab = (tab: AnalysisTabKey, focus?: Omit<AnalysisFocusTarget, "version">) => {
    setActiveTab(tab);
    saveStoredTab(ANALYSIS_TAB_STORAGE_KEY, tab);
    setFocusTarget((previous) => ({
      version: previous.version + 1,
      ...focus,
    }));
  };

  return (
    <div className="npcink-v3-analysis-workspace">
      <div className="npcink-v3-analysis-switch" role="tablist" aria-label="分析视图">
        {[
          { key: "summary", label: "管理摘要", hint: "重点、风险、下一步" },
          { key: "hardware", label: "硬件健康", hint: "采集、库存、排障" },
          { key: "value", label: "资产价值", hint: "金额、折价、分布" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            className={activeTab === item.key ? "is-active" : ""}
            aria-selected={activeTab === item.key}
            onClick={() => {
              openAnalysisTab(item.key as AnalysisTabKey);
            }}
          >
            <strong>{item.label}</strong>
            <span>{item.hint}</span>
          </button>
        ))}
      </div>
      {activeTab === "summary" ? (
        <AnalysisSummaryWorkspace onOpenTab={openAnalysisTab} />
      ) : activeTab === "hardware" ? (
        <HardwareAuditWorkspace focus={focusTarget} />
      ) : (
        <AssetValueWorkspace focus={focusTarget} />
      )}
    </div>
  );
};

interface BackupRestoreModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

const BackupRestoreModal = ({ open, onClose, onImported }: BackupRestoreModalProps) => {
  const [rawText, setRawText] = useState("");
  const [backup, setBackup] = useState<unknown>(null);
  const [summary, setSummary] = useState<BackupRestoreSummary | null>(null);
  const [restoreConfirmed, setRestoreConfirmed] = useState(false);
  const previewMutation = useMutation(
    async (text: string) => {
      const parsed = JSON.parse(text);
      const result = await restoreBackup(parsed, true);
      return { parsed, summary: result.summary };
    },
    {
      onSuccess: (result) => {
        setBackup(result.parsed);
        setSummary(result.summary);
        setRestoreConfirmed(false);
        message.success("备份文件校验通过");
      },
      onError: (error) => {
        setBackup(null);
        setSummary(null);
        setRestoreConfirmed(false);
        message.error(error instanceof Error ? error.message : "备份文件校验失败");
      },
    }
  );
  const restoreMutation = useMutation(
    async () => {
      if (!backup) {
        throw new Error("请先校验备份文件");
      }
      return restoreBackup(backup, false);
    },
    {
      onSuccess: (result) => {
        setSummary(result.summary);
        message.success("JSON 备份导入完成");
        setRawText("");
        setBackup(null);
        setSummary(null);
        setRestoreConfirmed(false);
        onImported();
        onClose();
      },
      onError: (error) => {
        setRestoreConfirmed(false);
        message.error(error instanceof Error ? error.message : "JSON 备份导入失败");
      },
    }
  );

  useEffect(() => {
    if (!open) {
      setRawText("");
      setBackup(null);
      setSummary(null);
      setRestoreConfirmed(false);
      previewMutation.reset();
      restoreMutation.reset();
    }
  }, [open]);

  const parseSource = (text = rawText) => {
    if (!text.trim()) {
      message.warning("请选择或粘贴 JSON 备份文件");
      return;
    }
    previewMutation.mutate(text);
  };

  const availableRows = summary
    ? Object.entries(summary.available).map(([key, value]) => ({
      key,
      label: BACKUP_RESTORE_SECTION_LABELS[key as keyof BackupRestoreSummary["available"]],
      count: value,
    }))
    : [];
  const planRows = summary
    ? Object.entries(summary.planned).map(([key, value]) => ({
      key,
      label: BACKUP_RESTORE_PLAN_LABELS[key as keyof BackupRestoreSummary["planned"]],
      count: value,
    })).filter((item) => item.count > 0)
    : [];
  const skipRows = summary
    ? Object.entries(summary.skipped).map(([key, value]) => ({
      key,
      label: BACKUP_RESTORE_SECTION_LABELS[key as keyof BackupRestoreSummary["skipped"]],
      count: value,
    })).filter((item) => item.count > 0)
    : [];
  const hasConflicts = Boolean(summary?.conflicts.length);

  return (
    <Modal
      title="导入 JSON 备份"
      open={open}
      onCancel={onClose}
      width={860}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="preview" loading={previewMutation.isLoading} onClick={() => parseSource()}>
          校验并预览
        </Button>,
        <Button
          key="restore"
          type="primary"
          danger
          disabled={!backup || !summary || hasConflicts || !restoreConfirmed}
          loading={restoreMutation.isLoading}
          onClick={() => restoreMutation.mutate()}
        >
          导入备份
        </Button>,
      ]}
    >
      <Space direction="vertical" size={14} className="npcink-v3-detail-stack">
        <Alert
          type="warning"
          showIcon
          message="导入采用合并/更新策略"
          description="会按资产 UUID 或资产编号更新/新增插件业务数据，不会清空正式站点现有数据。上传授权码、公开查询访问码、公开查询启用状态和客户端上传基础 URL 不会恢复。"
        />
        <input
          type="file"
          accept=".json,application/json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              const text = String(reader.result || "");
              setRawText(text);
              setBackup(null);
              setSummary(null);
              setRestoreConfirmed(false);
              parseSource(text);
            };
            reader.readAsText(file);
          }}
        />
        <Input.TextArea
          rows={7}
          value={rawText}
          onChange={(event) => {
            setRawText(event.target.value);
            setBackup(null);
            setSummary(null);
            setRestoreConfirmed(false);
          }}
          placeholder="粘贴从本插件“JSON 备份导出”生成的备份内容"
        />
        {summary ? (
          <Space direction="vertical" size={10} className="npcink-v3-detail-stack">
            <div>
              <Text strong>备份信息</Text>
              <Text type="secondary" className="npcink-v3-export-range-note">
                {summary.exportedAt ? `导出时间：${summary.exportedAt}` : "未记录导出时间"}
              </Text>
            </div>
            <Table
              rowKey="key"
              size="small"
              pagination={false}
              dataSource={availableRows}
              columns={[
                { title: "数据区段", dataIndex: "label" },
                { title: "可导入数量", dataIndex: "count", width: 140 },
              ]}
            />
            <Table
              rowKey="key"
              size="small"
              pagination={false}
              dataSource={planRows}
              locale={{ emptyText: "没有需要创建或更新的数据" }}
              columns={[
                { title: "导入计划", dataIndex: "label" },
                { title: "数量", dataIndex: "count", width: 140 },
              ]}
            />
            {skipRows.length ? (
              <Table
                rowKey="key"
                size="small"
                pagination={false}
                dataSource={skipRows}
                columns={[
                  { title: "跳过区段", dataIndex: "label" },
                  { title: "跳过数量", dataIndex: "count", width: 140 },
                ]}
              />
            ) : null}
            {hasConflicts ? (
              <Alert
                type="error"
                showIcon
                message="发现导入冲突"
                description={(
                  <Space direction="vertical" size={4}>
                    {summary.conflicts.map((conflict) => (
                      <Text key={conflict} type="danger">
                        {conflict}
                      </Text>
                    ))}
                  </Space>
                )}
              />
            ) : null}
            <div className="npcink-v3-checkbox-row">
              {summary.warnings.map((warning) => (
                <Tag color="orange" key={warning}>
                  {warning}
                </Tag>
              ))}
            </div>
            <Checkbox
              checked={restoreConfirmed}
              disabled={hasConflicts}
              onChange={(event) => setRestoreConfirmed(event.target.checked)}
            >
              我确认会按预览计划合并/更新正式站点数据，且已保留当前站点备份
            </Checkbox>
          </Space>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="先选择或粘贴 JSON，再校验预览" />
        )}
      </Space>
    </Modal>
  );
};

const DataToolsWorkspace = () => {
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [backupImportModalOpen, setBackupImportModalOpen] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupSections, setBackupSections] = useState<BackupExportSection[]>(DEFAULT_BACKUP_EXPORT_SECTIONS);
  const queryClient = useQueryClient();

  const exportBackup = async () => {
    setBackupLoading(true);
    try {
      const assetsNeeded = backupSections.includes("assets") || backupSections.includes("identities");
      const [settings, assets, events, observations] = await Promise.all([
        backupSections.includes("settings") ? getSettings() : Promise.resolve(undefined),
        assetsNeeded ? fetchAllAssets({ assetScope: "all", includeDeleted: true }) : Promise.resolve(undefined),
        backupSections.includes("events") ? fetchAllEvents() : Promise.resolve(undefined),
        backupSections.includes("observations") ? fetchAllObservations() : Promise.resolve(undefined),
      ]);
      const identities = backupSections.includes("identities") && assets
        ? await fetchAllIdentities(assets)
        : undefined;
      downloadJsonFile(`npcink-device-inventory-backup-${Date.now()}.json`, {
        schema: "npcink-device-inventory/v3-admin-export",
        exportedAt: new Date().toISOString(),
        sections: backupSections,
        ...(settings ? { settings } : {}),
        ...(assets ? { assets } : {}),
        ...(identities ? { identities } : {}),
        ...(events ? { events } : {}),
        ...(observations ? { observations } : {}),
      });
      message.success("JSON 备份已导出");
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <div className="npcink-v3-section">
      <div className="npcink-v3-section-header">
        <div>
          <Title level={3}>数据工具</Title>
          <Text type="secondary">导入标准资产表格，按需导出资产台账，并生成管理员备份文件。</Text>
        </div>
      </div>
      <div className="npcink-v3-data-tools">
        <div className="npcink-v3-tool-panel">
          <div>
            <Title level={4}>资产表格导入</Title>
            <Text type="secondary">下载标准模板后填写，可按资产编号新增或更新资产主表、财务字段和手动硬件字段。</Text>
          </div>
          <Button type="primary" onClick={() => setImportModalOpen(true)}>
            导入资产表格
          </Button>
        </div>
        <div className="npcink-v3-tool-panel">
          <div>
            <Title level={4}>资产表格导出</Title>
            <Text type="secondary">给财务/行政查看、筛选、统计；可选择电脑设备、自定义设备、当前筛选或已勾选资产。</Text>
          </div>
          <Button onClick={() => setExportModalOpen(true)}>导出资产表格</Button>
        </div>
        <div className="npcink-v3-tool-panel">
          <div>
            <Title level={4}>JSON 备份导出</Title>
            <Text type="secondary">
              给管理员完整迁移或归档，默认导出全部业务数据，不按电脑/自定义设备拆分；不会导出令牌密钥或访问码明文。
            </Text>
            <Text type="secondary" className="npcink-v3-export-range-note">
              电脑采集快照用于保留客户端上报的硬件历史；日常台账表格导出不需要。
            </Text>
            <Checkbox.Group
              className="npcink-v3-checkbox-row"
              value={backupSections}
              onChange={(values) => setBackupSections(values as BackupExportSection[])}
              options={[
                { label: "设置", value: "settings" },
                { label: "资产台账", value: "assets" },
                { label: "设备匹配标识", value: "identities" },
                { label: "变更记录", value: "events" },
                { label: "电脑采集快照", value: "observations" },
              ]}
            />
          </div>
          <Button loading={backupLoading} disabled={!backupSections.length} onClick={exportBackup}>
            导出 JSON 备份
          </Button>
        </div>
        <div className="npcink-v3-tool-panel">
          <div>
            <Title level={4}>JSON 备份导入</Title>
            <Text type="secondary">将本插件备份恢复到当前站点；导入前会校验文件并展示各区段数量。</Text>
            <Text type="secondary" className="npcink-v3-export-range-note">
              适合本地整理后迁移到正式站点；令牌、访问码和站点 URL 相关设置需重新配置。
            </Text>
          </div>
          <Button danger onClick={() => setBackupImportModalOpen(true)}>
            导入 JSON 备份
          </Button>
        </div>
      </div>
      <AssetImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImported={() => {
          queryClient.invalidateQueries(["v3-assets"]);
          queryClient.invalidateQueries(["v3-assets-import-index"]);
        }}
      />
      <AssetExportModal
        open={exportModalOpen}
        currentScopeLabel="全部资产"
        currentQueryParams={{ assetScope: "all", includeDeleted: true }}
        onClose={() => setExportModalOpen(false)}
      />
      <BackupRestoreModal
        open={backupImportModalOpen}
        onClose={() => setBackupImportModalOpen(false)}
        onImported={() => {
          queryClient.invalidateQueries(["v3-assets"]);
          queryClient.invalidateQueries(["v3-assets-import-index"]);
          queryClient.invalidateQueries(["v3-events"]);
          queryClient.invalidateQueries(["v3-observations"]);
          queryClient.invalidateQueries(["v3-settings"]);
        }}
      />
    </div>
  );
};

const SettingsWorkspace = () => {
  const [form] = Form.useForm<InventorySettings>();
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
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
      form.setFieldsValue({
        ...settingsQuery.data,
        departments: normalizeDepartmentList(settingsQuery.data.departments),
      });
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
  const hasPublicQueryAccessCode = Boolean(settingsQuery.data?.publicQueryAccessCodeSet);
  return (
    <div className="npcink-v3-section">
      <div className="npcink-v3-section-header">
        <div>
          <Title level={3}>设置</Title>
          <Text type="secondary">管理公开查询、采集客户端授权和统计口径。</Text>
        </div>
      </div>
      <div className="npcink-v3-settings-panel">
        <Form
          form={form}
          className="npcink-v3-global-settings-form"
          layout="vertical"
          onFinish={(values) =>
            settingsMutation.mutate({
              ...values,
              departments: normalizeDepartmentList(values.departments),
            })
          }
        >
          <div className="npcink-v3-settings-section">
            <div className="npcink-v3-settings-section-head">
              <Title level={4}>客户端接入</Title>
              <Button onClick={() => setTokenModalOpen(true)}>客户端接入</Button>
            </div>
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
          </div>
          <div className="npcink-v3-settings-section">
            <Title level={4}>公开查询</Title>
            <div className="npcink-v3-settings-grid">
              <div className="npcink-v3-setting-switch-row">
                <div>
                  <Text strong>公开查询</Text>
                  <Text type="secondary">控制公开查询入口是否允许读取已开放的资产信息。</Text>
                </div>
                <Form.Item name="publicQueryEnabled" valuePropName="checked" noStyle>
                  <Switch checkedChildren="启用" unCheckedChildren="关闭" />
                </Form.Item>
              </div>
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
                rules={[
                  ({ getFieldValue }) => ({
                    validator: async (_, value) => {
                      if (getFieldValue("publicQueryEnabled") && !hasPublicQueryAccessCode && !String(value || "").trim()) {
                        throw new Error("启用公开查询前必须设置访问码");
                      }
                    },
                  }),
                ]}
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
            <Title level={4}>部门管理</Title>
            <div className="npcink-v3-settings-grid">
              <Form.Item
                name="departments"
                label="部门列表"
                extra="未分配是系统兜底部门，不能删除；设备详情、批量修改和表格导入只能选择这里维护的部门。"
                className="npcink-v3-settings-wide"
              >
                <Select
                  mode="tags"
                  showSearch
                  tokenSeparators={[",", "，", "\n"]}
                  options={departmentSelectOptions(form.getFieldValue("departments") || [])}
                  tagRender={departmentTagRender}
                  onChange={(value) => form.setFieldValue("departments", normalizeDepartmentList(value))}
                  placeholder="输入部门名称后回车，例如：财务部"
                  popupMatchSelectWidth={false}
                />
              </Form.Item>
            </div>
          </div>
          <div className="npcink-v3-settings-section">
            <Title level={4}>资产估值</Title>
            <div className="npcink-v3-settings-grid">
              <Form.Item
                name="depreciationPeriodMonths"
                label="折旧年限"
                extra="用于没有单独二手价/残值时，按购置日期估算当前价值。"
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
                extra="用于按折旧年限估算时的最低残值。"
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
            <Title level={4}>统计口径</Title>
            <div className="npcink-v3-settings-grid">
              <div className="npcink-v3-setting-switch-row">
                <div>
                  <Text strong>只统计可用资产</Text>
                  <Text type="secondary">开启后，硬件盘点和资产价值只统计在用、闲置设备；维护、报废、归档不计入。</Text>
                </div>
                <Form.Item name="countAvailableAssetsOnly" valuePropName="checked" noStyle>
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                </Form.Item>
              </div>
            </div>
          </div>
          <div className="npcink-v3-settings-section npcink-v3-danger-section">
            <Title level={4}>危险操作</Title>
            <div className="npcink-v3-settings-grid">
              <div className="npcink-v3-setting-switch-row">
                <div>
                  <Text strong>卸载时删除数据</Text>
                  <Text type="secondary">开启后，删除插件时会清理插件数据表和设置。</Text>
                </div>
                <Form.Item name="deleteDataOnUninstall" valuePropName="checked" noStyle>
                  <Switch checkedChildren="删除" unCheckedChildren="保留" />
                </Form.Item>
              </div>
            </div>
          </div>
          <div className="npcink-v3-settings-actions">
            <Button type="primary" htmlType="submit" loading={settingsMutation.isLoading}>
              保存设置
            </Button>
          </div>
        </Form>
      </div>
      <TokenModal open={tokenModalOpen} onClose={() => setTokenModalOpen(false)} />
    </div>
  );
};

interface AssetCardProps {
  asset: Asset;
  onOpen: () => void;
  searchKeyword?: string;
  selectable?: boolean;
  selected?: boolean;
  compact?: boolean;
  onSelect?: () => void;
}

const AssetCard = ({
  asset,
  onOpen,
  searchKeyword = "",
  selectable = false,
  selected = false,
  compact = false,
  onSelect,
}: AssetCardProps) => {
  const { summary, manualHardware, extracted } = assetHardwareContext(asset);
  const title = asset.ownerName || asset.name || "未命名资产";
  const isPc = isComputerAsset(asset);
  const customInfo = !isPc ? customAssetInfo(asset) : null;
  const baseboardLabel = cardBaseboardLabel(extracted.baseboard || extracted.deviceModel);
  const cpuLabel = cardCpuLabel(extracted.cpu);
  const graphicsLabel = cardGraphicsLabel(extracted.graphics);
  const platformVisual = resolvePlatformVisual(extracted.platform, extracted.cpu, extracted.deviceModel);
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
          <h3>{highlightText(customInfo.title, searchKeyword)}</h3>
          <dl>
            <div>
              <dt>编号：</dt>
              <dd>{highlightText(customInfo.number, searchKeyword, true)}</dd>
            </div>
            <div>
              <dt>分类：</dt>
              <dd>{highlightText(customInfo.category, searchKeyword)}</dd>
            </div>
            <div>
              <dt>使用：</dt>
              <dd>{highlightText(customInfo.usage, searchKeyword)}</dd>
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
              <dt>购置：</dt>
              <dd>{formatDate(customInfo.orderTime || customInfo.createdAt)}</dd>
            </div>
            <div>
              <dt>更新：</dt>
              <dd>{assetUpdateTimeText(asset)}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <>
          <div className="npcink-v3-asset-card-brand">
            <PlatformMark visual={platformVisual} variant="card" />
            <strong>{platformVisual.label}</strong>
          </div>
          <div className="npcink-v3-asset-card-body">
            <h3>{highlightText(title, searchKeyword)}</h3>
            <p title={fieldText(extracted.baseboard || extracted.deviceModel)}>
              {highlightText(baseboardLabel, searchKeyword)}
            </p>
            <p title={fieldText(extracted.cpu)}>{highlightText(cpuLabel, searchKeyword)}</p>
            <p title={fieldText(extracted.graphics)}>{highlightText(graphicsLabel, searchKeyword)}</p>
            <dl>
              <div>
                <dt>配置：</dt>
                <dd>{formatMemoryDiskText(summary, manualHardware)}</dd>
              </div>
              <div>
                <dt>编号：</dt>
                <dd>{highlightText(asset.assetNumber, searchKeyword, true)}</dd>
              </div>
              <div>
                <dt>状态：</dt>
                <dd>{statusLabel(asset.status)}</dd>
              </div>
              <div>
                <dt>部门：</dt>
                <dd>{highlightText(asset.department, searchKeyword)}</dd>
              </div>
              <div>
                <dt>更新：</dt>
                <dd>{assetUpdateTimeText(asset)}</dd>
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
  const [assetLayoutMode, setAssetLayoutMode] = useState<AssetLayoutMode>(() =>
    loadStoredTab(ASSET_LAYOUT_MODE_STORAGE_KEY, ["compact", "spacious"] as const, "spacious")
  );
  const [batchMode, setBatchMode] = useState(false);
  const [selectedUuids, setSelectedUuids] = useState<Set<string>>(new Set());
  const [savedFilters, setSavedFilters] = useState<SavedAssetFilter[]>(loadSavedFilters);
  const [exportModalOpen, setExportModalOpen] = useState(false);
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
      sortBy: "latestObserved" as const,
    }),
    [assetScope, assetType, category, page, pageSize, purchasePlatform, search, status]
  );
  const initialAssetsData = useMemo(
    () => initialAssetsForParams(queryParams) || readCachedAssetList(queryParams),
    [queryParams]
  );
  const settingsQuery = useQuery(["v3-settings"], getSettings, { staleTime: 60_000 });
  const assetsQuery = useQuery(["v3-assets", queryParams], () => getAssets(queryParams), {
    initialData: initialAssetsData,
    keepPreviousData: true,
    onSuccess: (result) => {
      if (result) {
        writeCachedAssetList(queryParams, result);
      }
    },
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
    () => normalizeDepartmentList(settingsQuery.data?.departments || []),
    [settingsQuery.data?.departments]
  );
  const selectedCount = selectedUuids.size;
  const allSelected = assets.length > 0 && assets.every((asset) => selectedUuids.has(asset.uuid));
  const compactLayout = assetLayoutMode === "compact";
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
  const selectedAsset = selectedUuid ? assets.find((asset) => asset.uuid === selectedUuid) || null : null;

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

  const columns: ColumnsType<Asset> = [
    {
      title: "资产编号",
      dataIndex: "assetNumber",
      width: 170,
      render: (value: string) => <Text code>{highlightText(value, search, true)}</Text>,
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
          {highlightText(value || "未命名资产", search)}
        </Button>
      ),
    },
    {
      title: "类型",
      dataIndex: "assetType",
      width: 120,
      render: assetTypeLabel,
    },
    { title: "使用人", dataIndex: "ownerName", width: 120, render: (value) => highlightText(value, search) },
    { title: "部门", dataIndex: "department", width: 140, render: (value) => highlightText(value, search) },
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
      render: (_value, asset) => assetUpdateTimeText(asset),
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

  const toggleAssetLayoutMode = () => {
    setAssetLayoutMode((value) => {
      const next = value === "compact" ? "spacious" : "compact";
      saveStoredTab(ASSET_LAYOUT_MODE_STORAGE_KEY, next);
      return next;
    });
  };

  return (
    <div className={`npcink-v3-section${viewMode === "card" && compactLayout ? " is-compact-card-layout" : ""}`}>
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
                { key: "export", label: "导出表格" },
                { key: "save-filter", label: "保存筛选" },
                { key: "batch", label: batchMode ? "退出批量模式" : "批量模式" },
                ...(viewMode === "card"
                  ? [{ key: "layout", label: compactLayout ? "舒展模式" : "紧凑模式" }]
                  : []),
                ...savedFilters.map((filter) => ({
                  key: `filter:${filter.id}`,
                  label: `筛选：${filter.name}`,
                })),
              ],
              onClick: ({ key }) => {
                if (key === "export") {
                  setExportModalOpen(true);
                } else if (key === "save-filter") {
                  saveCurrentFilter();
                } else if (key === "batch") {
                  setBatchMode((value) => !value);
                } else if (key === "layout") {
                  toggleAssetLayoutMode();
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
            <Button disabled={selectedCount === 0} onClick={() => setExportModalOpen(true)}>
              导出已选
            </Button>
            <Button onClick={() => setBatchMode(false)}>退出批量</Button>
          </Space>
        </div>
      ) : null}

      {viewMode === "card" ? (
        <div className="npcink-v3-card-surface">
          {assetsQuery.isLoading && !assets.length ? (
            <Table loading pagination={false} showHeader={false} />
          ) : assets.length ? (
            <div className="npcink-v3-card-grid">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.uuid}
                  asset={asset}
                  searchKeyword={search}
                  onOpen={() => setSelectedUuid(asset.uuid)}
                  selectable={batchMode}
                  selected={selectedUuids.has(asset.uuid)}
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
                    ? "暂无自定义资产，可新增自定义资产或在数据工具中导入标准表格"
                    : "暂无电脑资产，可在数据工具中导入标准表格或等待客户端采集"
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
          loading={assetsQuery.isLoading && !assets.length}
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
        initialAsset={selectedAsset}
        departmentOptions={departmentOptions}
        onClose={() => setSelectedUuid(null)}
        onArchive={confirmArchive}
      />
      <AssetFormModal
        asset={editingAsset}
        open={assetModalOpen}
        departmentOptions={departmentOptions}
        onClose={() => setAssetModalOpen(false)}
        onSubmit={submitAsset}
      />
      <BulkEditModal
        open={bulkModalOpen}
        count={selectedCount}
        loading={batchUpdateMutation.isLoading}
        departmentOptions={departmentOptions}
        onClose={() => setBulkModalOpen(false)}
        onSubmit={async (input) => {
          await batchUpdateMutation.mutateAsync({ targets: selectedAssets, input });
        }}
      />
      <AssetExportModal
        open={exportModalOpen}
        currentScopeLabel={activeScopeLabel}
        currentQueryParams={queryParams}
        currentTotal={pagination?.totalItems}
        selectedAssets={selectedAssets}
        onClose={() => setExportModalOpen(false)}
      />
    </div>
  );
};

const WORKSPACE_TAB_KEYS = ["computer", "custom", "events", "analysis", "tools", "settings"] as const;

const InventoryAdmin = () => {
  const [activeTab, setActiveTab] = useState<(typeof WORKSPACE_TAB_KEYS)[number]>(() =>
    loadStoredTab(WORKSPACE_TAB_STORAGE_KEY, WORKSPACE_TAB_KEYS, "computer")
  );

  return (
    <div className="npcink-v3-app">
      <Tabs
        activeKey={activeTab}
        className="npcink-v3-workspace-tabs"
        onChange={(key) => {
          const nextKey = WORKSPACE_TAB_KEYS.includes(key as (typeof WORKSPACE_TAB_KEYS)[number])
            ? (key as (typeof WORKSPACE_TAB_KEYS)[number])
            : "computer";
          setActiveTab(nextKey);
          saveStoredTab(WORKSPACE_TAB_STORAGE_KEY, nextKey);
        }}
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
            key: "tools",
            label: "数据工具",
            children: <DataToolsWorkspace />,
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
