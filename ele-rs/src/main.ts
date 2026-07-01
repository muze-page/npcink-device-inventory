import { invoke } from "@tauri-apps/api/core";
import "./style.css";

type AgentConfig = {
  site: string;
  name: string;
  token: string;
  preset_locked?: boolean;
  preset_label?: string;
};

type ImportedUploadConfig = {
  siteUrl?: unknown;
  uploadEndpoint?: unknown;
  tokenId?: unknown;
  tokenSecret?: unknown;
  tokenValue?: unknown;
  tokenName?: unknown;
};

type DeviceSnapshot = {
  data: Record<string, unknown>;
  stable_device_id_v2: string;
};

type RuntimeStatus = {
  collected_at?: string;
  cpu?: {
    usage_percent?: number;
    cores?: number;
  };
  memory?: {
    total?: number;
    used?: number;
    available?: number;
  };
  disk?: {
    total?: number;
    used?: number;
    available?: number;
    mount?: string;
  };
  network?: Record<string, unknown>;
  temperatures?: Array<{
    label?: string;
    temperature_c?: number;
    critical_c?: number | null;
  }>;
};

type DiagnosticsPackage = {
  directory_path: string;
  zip_path: string;
};

type TabId = "settings" | "overview" | "runtime" | "diagnostics" | "details";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("missing #app");
}

app.innerHTML = `
  <main class="app-shell">
    <section class="card">
      <header class="app-head">
        <div class="brand-line">
          <span class="brand-mark"></span>
          <strong>设备信息上传</strong>
        </div>
        <nav class="tabs" aria-label="页面">
          <button class="tab active" data-tab="settings" type="button">设置</button>
          <button class="tab" data-tab="overview" type="button">概览</button>
          <button class="tab" data-tab="runtime" type="button">运行</button>
          <button class="tab" data-tab="diagnostics" type="button">排障</button>
          <button class="tab" data-tab="details" type="button">技术详情</button>
        </nav>
        <button class="help-button" id="helpButton" type="button">帮助</button>
      </header>

      <section class="tab-page active" id="settingsPage">
        <div class="settings-layout">
          <form class="upload-form" id="configForm">
            <label class="field">
              <span>上传备注</span>
              <input id="name" name="name" placeholder="可选，例如：张三、财务电脑、前台备用机" />
            </label>

            <div class="config-state">
              <span>上传配置</span>
              <strong id="configStateText">未配置</strong>
            </div>

            <div class="preset-notice" id="presetNotice" hidden>
              <strong>已预置上传配置</strong>
              <span>只需填写备注即可提交设备信息。</span>
            </div>

            <div class="config-toolbar" id="configImportToolbar">
              <div class="config-actions">
                <button class="button config-button config-button-dark" id="importConfigButton" type="button">导入配置</button>
                <button class="button config-button config-button-light" id="manualConfigButton" type="button" aria-expanded="false" aria-controls="manualConfigPanel">手动填写</button>
              </div>
              <div class="manual-config-panel" id="manualConfigPanel" hidden>
                <label class="field">
                  <span>完整授权码</span>
                  <input id="token" name="token" type="password" placeholder="后台生成的上传授权码" />
                </label>
                <label class="field">
                  <span>站点地址</span>
                  <input id="site" name="site" placeholder="https://example.com 或 https://example.com/wp-json/npcink-device-inventory/v1" />
                </label>
                <p class="tip">默认提交设备采集接口，并使用完整授权码 HMAC 签名。</p>
              </div>
            </div>

            <button class="button primary submit-button" id="submitButton" type="button" hidden>提交</button>
            <div class="submit-meta" id="submitMeta" hidden></div>
            <div class="message" id="toast"></div>
          </form>

          <div class="side-column">
            <aside class="device-summary" aria-label="本机信息摘要">
              <div class="settings-summary-head">
                <span>本机信息</span>
                <div class="summary-actions">
                  <strong class="collect-state" id="collectState">
                    <span class="collect-spinner" aria-hidden="true"></span>
                    <span id="collectStateText">准备采集</span>
                  </strong>
                  <button class="summary-refresh" id="collectButton" type="button">重新采集</button>
                </div>
              </div>
              <div class="settings-summary-list" id="settingsSummaryList"></div>
            </aside>
          </div>
        </div>
      </section>

      <section class="tab-page" id="overviewPage">
        <div class="overview-grid" id="overviewGrid"></div>
      </section>

      <section class="tab-page" id="runtimePage">
        <section class="runtime-card runtime-page-card" aria-label="运行状态">
          <div class="settings-summary-head runtime-page-head">
            <div>
              <span>运行状态</span>
              <p>持续监控当前设备的关键资源，用于快速判断负载、内存、磁盘和温度状态。</p>
            </div>
            <strong id="runtimeCollectedAt">等待监控</strong>
          </div>
          <div class="runtime-grid runtime-page-grid" id="runtimeGrid"></div>
        </section>
      </section>

      <section class="tab-page" id="diagnosticsPage">
        <div class="diagnostics-layout">
          <section class="diagnostics-panel">
            <span class="panel-kicker">本地排障</span>
            <h2>生成故障诊断包</h2>
            <p>采集系统日志、驱动、磁盘、电源、崩溃记录和当前设备状态，生成本地 zip 文件，便于管理员分析。</p>
            <div class="diagnostics-actions">
              <button class="button primary diagnostics-button" id="generateDiagnosticsButton" type="button">生成诊断包</button>
              <button class="button secondary diagnostics-button" id="openDiagnosticsFolderButton" type="button" hidden>打开文件夹</button>
            </div>
            <div class="diagnostics-result" id="diagnosticsResult"></div>
          </section>
          <section class="diagnostics-note">
            <strong>隐私提示</strong>
            <p>诊断包保存在本机，不会自动上传。分享前请确认其中的系统日志、用户名、路径、驱动和崩溃记录可以交给管理员查看。</p>
          </section>
        </div>
      </section>

      <section class="tab-page" id="detailsPage">
        <div class="detail-layout">
          <div class="detail-menu" id="detailMenu"></div>
          <div class="detail-panel">
            <div class="detail-content" id="detailContent"></div>
          </div>
        </div>
      </section>
    </section>
    <dialog class="config-dialog" id="configImportDialog" aria-labelledby="configImportTitle">
      <div class="config-dialog-box">
        <h2 id="configImportTitle">导入上传配置</h2>
        <textarea id="configJson" spellcheck="false" placeholder='粘贴后台复制的 JSON，例如 {"uploadEndpoint":"...","tokenValue":"..."}'></textarea>
        <div class="dialog-message" id="importDialogMessage"></div>
        <div class="dialog-actions">
          <button class="button secondary compact" id="cancelImportButton" type="button">取消</button>
          <button class="button primary compact" id="confirmImportButton" type="button">导入</button>
        </div>
      </div>
    </dialog>
    <dialog class="config-dialog help-dialog" id="helpDialog" aria-labelledby="helpDialogTitle">
      <div class="config-dialog-box">
        <h2 id="helpDialogTitle">帮助</h2>
        <p class="dialog-copy">使用问题请联系管理员。</p>
        <p class="dialog-note">请不要自行修改上传地址或授权码。</p>
        <div class="dialog-actions">
          <button class="button primary compact" id="closeHelpButton" type="button">知道了</button>
        </div>
      </div>
    </dialog>
    <dialog class="config-dialog result-dialog" id="submitResultDialog" aria-labelledby="submitResultTitle">
      <div class="config-dialog-box">
        <h2 id="submitResultTitle">上传结果</h2>
        <p class="dialog-copy" id="submitResultMessage"></p>
        <div class="dialog-actions">
          <button class="button primary compact" id="closeSubmitResultButton" type="button">知道了</button>
        </div>
      </div>
    </dialog>
  </main>
`;

const siteInput = document.querySelector<HTMLInputElement>("#site")!;
const nameInput = document.querySelector<HTMLInputElement>("#name")!;
const tokenInput = document.querySelector<HTMLInputElement>("#token")!;
const configStateText = document.querySelector<HTMLElement>("#configStateText")!;
const presetNotice = document.querySelector<HTMLElement>("#presetNotice")!;
const configImportToolbar = document.querySelector<HTMLElement>("#configImportToolbar")!;
const manualConfigButton = document.querySelector<HTMLButtonElement>("#manualConfigButton")!;
const manualConfigPanel = document.querySelector<HTMLElement>("#manualConfigPanel")!;
const configForm = document.querySelector<HTMLFormElement>("#configForm")!;
const collectButton = document.querySelector<HTMLButtonElement>("#collectButton")!;
const submitButton = document.querySelector<HTMLButtonElement>("#submitButton")!;
const defaultSubmitButtonText = submitButton.textContent ?? "提交";
const importConfigButton = document.querySelector<HTMLButtonElement>("#importConfigButton")!;
const configImportDialog = document.querySelector<HTMLDialogElement>("#configImportDialog")!;
const configJsonInput = document.querySelector<HTMLTextAreaElement>("#configJson")!;
const importDialogMessage = document.querySelector<HTMLElement>("#importDialogMessage")!;
const cancelImportButton = document.querySelector<HTMLButtonElement>("#cancelImportButton")!;
const confirmImportButton = document.querySelector<HTMLButtonElement>("#confirmImportButton")!;
const helpDialog = document.querySelector<HTMLDialogElement>("#helpDialog")!;
const closeHelpButton = document.querySelector<HTMLButtonElement>("#closeHelpButton")!;
const helpButton = document.querySelector<HTMLButtonElement>("#helpButton")!;
const submitResultDialog = document.querySelector<HTMLDialogElement>("#submitResultDialog")!;
const submitResultTitle = document.querySelector<HTMLElement>("#submitResultTitle")!;
const submitResultMessage = document.querySelector<HTMLElement>("#submitResultMessage")!;
const closeSubmitResultButton = document.querySelector<HTMLButtonElement>("#closeSubmitResultButton")!;
const collectState = document.querySelector<HTMLElement>("#collectState")!;
const collectStateText = document.querySelector<HTMLElement>("#collectStateText")!;
const toast = document.querySelector<HTMLElement>("#toast")!;
const overviewGrid = document.querySelector<HTMLElement>("#overviewGrid")!;
const settingsSummaryList = document.querySelector<HTMLElement>("#settingsSummaryList")!;
const runtimeCollectedAt = document.querySelector<HTMLElement>("#runtimeCollectedAt")!;
const runtimeGrid = document.querySelector<HTMLElement>("#runtimeGrid")!;
const generateDiagnosticsButton = document.querySelector<HTMLButtonElement>("#generateDiagnosticsButton")!;
const openDiagnosticsFolderButton = document.querySelector<HTMLButtonElement>("#openDiagnosticsFolderButton")!;
const diagnosticsResult = document.querySelector<HTMLElement>("#diagnosticsResult")!;
const detailMenu = document.querySelector<HTMLElement>("#detailMenu")!;
const detailContent = document.querySelector<HTMLElement>("#detailContent")!;
const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>(".tab"));
const pages = Array.from(document.querySelectorAll<HTMLElement>(".tab-page"));

let snapshot: DeviceSnapshot | null = null;
let activeDetail = "cpu";
let activeConfig: AgentConfig = { site: "", name: "", token: "" };
let isCollecting = false;
let isSubmitting = false;
let isGeneratingDiagnostics = false;
let lastSubmittedAt: Date | null = null;
let lastSubmittedConfigLabel = "";
let diagnosticsDirectoryPath = "";

const detailItems = [
  { key: "cpu", title: "处理器", desc: "CPU 信息" },
  { key: "memory", title: "内存", desc: "内存条与容量" },
  { key: "diskLayout", title: "硬盘", desc: "磁盘与分区" },
  { key: "graphics", title: "显卡/显示器", desc: "显示设备" },
  { key: "baseboard", title: "主板", desc: "主板信息" },
  { key: "bios", title: "BIOS", desc: "固件信息" },
  { key: "os", title: "系统", desc: "操作系统" },
  { key: "net", title: "网卡", desc: "网络信息" },
  { key: "uuid", title: "标识信息", desc: "调试与匹配字段" },
];

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const readPath = (source: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((current, key) => {
    if (Array.isArray(current)) {
      return current[Number(key)];
    }
    return asRecord(current)[key];
  }, source);

const firstText = (source: unknown, paths: string[], fallback = "未采集") => {
  for (const path of paths) {
    const value = readPath(source, path);
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return fallback;
};

const formatBytes = (value: unknown) => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "未采集";
  }
  const gb = value / 1024 / 1024 / 1024;
  return `${gb.toFixed(gb >= 100 ? 0 : 1)} GB`;
};

const formatPercent = (value: unknown) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "未采集";
  }
  return `${Math.max(0, value).toFixed(0)}%`;
};

const sumSizes = (items: unknown) =>
  asArray(items).reduce<number>((sum, item) => {
    const size = asRecord(item).size;
    return sum + (typeof size === "number" ? size : 0);
  }, 0);

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const displayValue = (value: unknown, fallback = "未采集") => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : fallback;
  }
  if (typeof value === "boolean") {
    return value ? "是" : "否";
  }
  return String(value);
};

const isMissingValue = (value: unknown) =>
  value === null || value === undefined || value === "" || value === "未采集";

const row = (label: string, value: unknown, unit = "") => {
  const display = displayValue(value);
  if (isMissingValue(display)) {
    return "";
  }
  return `
    <div class="info-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(display)}${unit}</strong>
    </div>
  `;
};

const uniqueTexts = (items: unknown[]) =>
  Array.from(
    new Set(
      items
        .map((item) => displayValue(item, "").trim())
        .filter((item) => item && item !== "00:00:00:00:00:00"),
    ),
  );

const joinUnique = (values: unknown[]) => uniqueTexts(values).join(" ");

const systemLabel = (distro: unknown, release: unknown) => {
  const distroText = displayValue(distro, "");
  const releaseText = displayValue(release, "");
  if (!distroText) {
    return releaseText || "未采集";
  }
  if (releaseText && distroText.toLowerCase().includes(releaseText.toLowerCase())) {
    return distroText;
  }
  return joinUnique([distroText, releaseText]) || "未采集";
};

const listRow = (label: string, values: unknown[]) => {
  const items = uniqueTexts(values);
  if (!items.length) {
    return "";
  }
  return `
    <div class="info-row list-row">
      <span>${escapeHtml(label)}</span>
      <ul class="value-list">
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </div>
  `;
};

const section = (title: string, rows: string[]) => {
  const visibleRows = rows.filter(Boolean);
  if (!visibleRows.length) {
    return emptyDetail();
  }
  return `
    <section class="info-section">
      <h3>${escapeHtml(title)}</h3>
      <div class="info-list">${visibleRows.join("")}</div>
    </section>
  `;
};

const emptyDetail = () => `
  <div class="empty-detail">
    <strong>这部分暂无可读信息</strong>
    <span>不同系统开放的硬件字段不完全一致，已采集到的数据会继续用于上传。</span>
  </div>
`;

const listSections = (
  titlePrefix: string,
  items: unknown,
  render: (item: Record<string, unknown>, index: number) => string[],
) => {
  const list = asArray(items);
  if (!list.length) {
    return emptyDetail();
  }
  return list
    .map((item, index) => section(`${titlePrefix} ${index + 1}`, render(asRecord(item), index)))
    .join("");
};

const isTruthy = (value: unknown) => value === true || value === "true" || value === 1;

const primaryNetwork = (items: unknown) => {
  const networks = asArray(items).map(asRecord);
  return (
    networks.find((item) => isTruthy(item.default)) ??
    networks.find((item) => !isTruthy(item.virtual) && !isTruthy(item.internal) && item.mac) ??
    networks[0] ??
    {}
  );
};

const renderHumanDetail = (key: string, data: Record<string, unknown>) => {
  switch (key) {
    case "cpu": {
      const cpu = asRecord(data.cpu);
      return section("处理器信息", [
        row("型号", [cpu.manufacturer, cpu.brand].filter(Boolean).join(" ")),
        row("核心数", cpu.cores),
        row("物理核心", cpu.physicalCores),
        row("处理器数量", cpu.processors),
        row("主频", cpu.speed, " GHz"),
        row("厂商", cpu.vendor),
      ]);
    }
    case "memory": {
      const memory = asArray(data.memory).length ? data.memory : data.memLayout;
      const mem = asRecord(data.mem);
      if (!asArray(memory).length && Object.keys(mem).length) {
        return section("内存信息", [
          row("总内存", formatBytes(mem.total)),
          row("可用内存", formatBytes(mem.available || mem.free)),
          row("已用内存", formatBytes(mem.used)),
          row("交换空间", formatBytes(mem.swapTotal)),
          row("已用交换空间", formatBytes(mem.swapUsed)),
        ]);
      }
      return listSections("内存", memory, (item) => [
        row("容量", formatBytes(item.size)),
        row("类型", item.type),
        row("频率", item.clockSpeed || item.speed, item.clockSpeed || item.speed ? " MHz" : ""),
        row("厂商", item.manufacturer),
        row("插槽", item.bank || item.slot),
        row("序列号", item.serialNum || item.serial),
      ]);
    }
    case "diskLayout":
      return listSections("硬盘", data.diskLayout, (item) => [
        row("名称", item.name || item.device),
        row("类型", item.type),
        row("容量", formatBytes(item.size)),
        row("文件系统", item.fsType),
        row("挂载位置", item.mount),
      ]);
    case "graphics": {
      const graphics = asRecord(data.graphics);
      const controllers = listSections("显卡", graphics.controllers, (item) => [
        row("型号", [item.vendor, item.model].filter(Boolean).join(" ")),
        row("显存", formatBytes(item.vram)),
        row("总线", item.bus),
      ]);
      const displays = listSections("显示器", graphics.displays, (item) => [
        row("型号", item.model),
        row(
          "分辨率",
          item.resolution ||
            (item.resolutionX && item.resolutionY ? `${item.resolutionX} x ${item.resolutionY}` : ""),
        ),
        row("Retina", item.retina),
        row("尺寸", item.sizeX && item.sizeY ? `${item.sizeX} x ${item.sizeY}` : ""),
        row("类型", item.type),
        row("生产年份", item.productionYear),
      ]);
      return `${controllers}${displays}`;
    }
    case "baseboard": {
      const baseboard = asRecord(data.baseboard);
      return section("主板信息", [
        row("厂商", baseboard.manufacturer),
        row("型号", baseboard.product || baseboard.model),
        row("硬件标识", baseboard.model),
        row("芯片", baseboard.chip),
        row("版本", baseboard.version),
        row("序列号", baseboard.serial),
        row("最大内存", formatBytes(baseboard.memMax)),
        row("内存插槽", baseboard.memSlots),
      ]);
    }
    case "bios": {
      const bios = asRecord(data.bios);
      return section("BIOS 信息", [
        row("厂商", bios.vendor),
        row("版本", bios.version),
        row("序列号", bios.serial),
        row("发布日期", bios.releaseDate),
        row("修订版本", bios.revision),
      ]);
    }
    case "os": {
      const os = asRecord(data.os);
      return section("系统信息", [
        row("系统", [os.distro, os.release].filter(Boolean).join(" ")),
        row("构建号", os.build),
        row("架构", os.arch),
        row("主机名", os.hostname),
        row("平台", os.platform),
        row("内核", os.kernel),
      ]);
    }
    case "net":
      return listSections("网卡", data.net, (item) => [
        row("名称", item.ifaceName || item.iface),
        row("MAC 地址", item.mac),
        row("IPv4", item.ip4),
        row("IPv6", item.ip6),
        row("速度", item.speed, item.speed ? " Mbps" : ""),
        row("类型", item.type),
      ]);
    case "uuid": {
      const uuid = asRecord(data.uuid);
      const macs = uniqueTexts(asArray(uuid.macs));
      return section("唯一标识", [
        row("硬件 UUID", uuid.hardware),
        row("设备编号", snapshot?.stable_device_id_v2),
        row("主 MAC 地址", macs[0]),
        listRow("其他 MAC 地址", macs.slice(1)),
      ]);
    }
    default:
      return emptyDetail();
  }
};

const setToast = (message: string, kind: "ok" | "error" | "" = "") => {
  toast.textContent = message;
  toast.className = `message ${kind}`;
};

const errorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object") {
    const record = asRecord(error);
    const message = stringValue(record.message) || stringValue(record.error);
    if (message) {
      return message;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return "发生未知错误。";
    }
  }
  const message = String(error);
  if (message.includes("invoke")) {
    return "桌面采集服务未连接，请在软件窗口中操作。";
  }
  return message;
};

const logAppEvent = (level: "debug" | "info" | "warn" | "error", event: string, message = "") => {
  void invoke("append_app_log", {
    input: {
      level,
      event,
      message,
    },
  }).catch(() => undefined);
};

const stringValue = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const importedConfigPayload = (value: unknown): ImportedUploadConfig => {
  const record = asRecord(value);
  const data = asRecord(record.data);
  return Object.keys(data).length ? data : record;
};

const parseImportedConfig = (raw: string): AgentConfig => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("JSON 格式不正确。");
  }

  const payload = importedConfigPayload(parsed);
  const site = stringValue(payload.uploadEndpoint) || stringValue(payload.siteUrl);
  const tokenValue = stringValue(payload.tokenValue);
  const tokenId = stringValue(payload.tokenId);
  const tokenSecret = stringValue(payload.tokenSecret);
  const token = tokenValue || (tokenId && tokenSecret ? `mda_${tokenId}_${tokenSecret}` : "");

  if (!site) {
    throw new Error("上传配置缺少 uploadEndpoint 或 siteUrl。");
  }
  if (!token) {
    throw new Error("上传配置缺少 tokenValue，或缺少 tokenId/tokenSecret。");
  }

  return {
    site,
    name: nameInput.value.trim(),
    token,
    preset_locked: false,
    preset_label: stringValue(payload.tokenName) || tokenId,
  };
};

const getConfig = (): AgentConfig => ({
  site: siteInput.value.trim(),
  name: nameInput.value.trim(),
  token: tokenInput.value,
  preset_locked: Boolean(activeConfig.preset_locked),
  preset_label: activeConfig.preset_label || "",
});

const hasUploadConfig = (config: AgentConfig = getConfig()) =>
  Boolean(config.preset_locked || (config.site && config.token));

const updateInteractiveState = () => {
  const presetLocked = Boolean(activeConfig.preset_locked);
  nameInput.disabled = isSubmitting;
  siteInput.disabled = isSubmitting || presetLocked;
  tokenInput.disabled = isSubmitting || presetLocked;
  collectButton.disabled = isCollecting || isSubmitting;
  submitButton.disabled = isCollecting || isSubmitting;
  importConfigButton.disabled = isSubmitting;
  manualConfigButton.disabled = isSubmitting;
  generateDiagnosticsButton.disabled = isGeneratingDiagnostics;
};

const setCollecting = (collecting: boolean) => {
  isCollecting = collecting;
  collectState.classList.toggle("is-collecting", collecting);
  settingsSummaryList.classList.toggle("is-collecting", collecting);
  collectButton.textContent = collecting ? "采集中..." : "重新采集";
  updateInteractiveState();
};

const setSubmitting = (submitting: boolean) => {
  isSubmitting = submitting;
  submitButton.textContent = submitting ? "提交中..." : defaultSubmitButtonText;
  updateInteractiveState();
};

const setGeneratingDiagnostics = (generating: boolean) => {
  isGeneratingDiagnostics = generating;
  generateDiagnosticsButton.textContent = generating ? "生成中..." : "生成诊断包";
  updateInteractiveState();
};

const showModalSafely = (dialog: HTMLDialogElement) => {
  if (!dialog.open) {
    dialog.showModal();
  }
};

const closeDialogSafely = (dialog: HTMLDialogElement) => {
  if (dialog.open) {
    dialog.close();
  }
};

const formatClock = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const configLabel = (config: AgentConfig = getConfig()) => {
  if (config.preset_label) {
    return config.preset_label;
  }
  if (config.preset_locked) {
    return "预置配置";
  }
  if (config.site && config.token) {
    return "手动配置";
  }
  return "";
};

const resetSubmittedState = () => {
  lastSubmittedAt = null;
  lastSubmittedConfigLabel = "";
  renderSubmitMeta();
};

const markManualConfigEdited = () => {
  if (!activeConfig.preset_locked) {
    activeConfig = {
      ...activeConfig,
      preset_label: "",
    };
  }
  resetSubmittedState();
  renderConfigStatus();
};

const setManualConfigOpen = (open: boolean) => {
  manualConfigPanel.hidden = !open;
  manualConfigButton.setAttribute("aria-expanded", String(open));
};

const showSubmitResult = (kind: "success" | "error", title: string, message: string) => {
  submitResultDialog.classList.toggle("result-dialog-success", kind === "success");
  submitResultDialog.classList.toggle("result-dialog-error", kind === "error");
  submitResultTitle.textContent = title;
  submitResultMessage.textContent = message;
  showModalSafely(submitResultDialog);
};

const switchTab = (tab: TabId) => {
  tabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
  pages.forEach((page) => page.classList.remove("active"));
  document.querySelector<HTMLElement>(`#${tab}Page`)?.classList.add("active");
};

const overviewRows = () => {
  const data = snapshot?.data ?? {};
  const cpu = asRecord(data.cpu);
  const baseboard = asRecord(data.baseboard);
  const os = asRecord(data.os);
  const firstNet = primaryNetwork(data.net);
  const memoryType = firstText(data, ["memory.0.type", "memLayout.0.type"], "");
  const memorySize = formatBytes(sumSizes(data.memory) || sumSizes(data.memLayout) || asRecord(data.mem).total);
  const ip = displayValue(firstNet.ip4 || firstNet.ip6);
  const iface = displayValue(firstNet.ifaceName || firstNet.iface, "");

  return [
    { label: "上传备注", value: nameInput.value.trim() || "未填写" },
    { label: "电脑名称", value: firstText(data, ["os.hostname", "system.model"], "未采集") },
    { label: "系统", value: systemLabel(os.distro, os.release) },
    {
      label: "处理器",
      value: [cpu.manufacturer, cpu.brand].filter(Boolean).join(" ") || "未采集",
    },
    { label: "内存", value: [memoryType, memorySize].filter(Boolean).join(" ") },
    { label: "硬盘", value: formatBytes(sumSizes(data.diskLayout)) },
    {
      label: "主板型号",
      value: joinUnique([baseboard.product, baseboard.model, asRecord(data.system).model]) || "未采集",
    },
    {
      label: "当前 IP",
      value: iface ? `${ip} (${iface})` : ip,
    },
  ];
};

const settingsSummaryRows = () => {
  const data = snapshot?.data ?? {};
  const cpu = asRecord(data.cpu);
  const os = asRecord(data.os);
  const system = asRecord(data.system);
  const baseboard = asRecord(data.baseboard);
  const firstNet = primaryNetwork(data.net);
  const memoryType = firstText(data, ["memory.0.type", "memLayout.0.type"], "");
  const memorySize = formatBytes(sumSizes(data.memory) || sumSizes(data.memLayout) || asRecord(data.mem).total);
  const ip = displayValue(firstNet.ip4 || firstNet.ip6);
  const iface = displayValue(firstNet.ifaceName || firstNet.iface, "");

  return [
    { label: "电脑名称", value: firstText(data, ["os.hostname", "system.model"], "未采集") },
    { label: "系统", value: systemLabel(os.distro, os.release) },
    { label: "处理器", value: joinUnique([cpu.manufacturer, cpu.brand]) || "未采集" },
    { label: "内存", value: [memoryType, memorySize].filter(Boolean).join(" ") },
    { label: "硬盘", value: formatBytes(sumSizes(data.diskLayout)) },
    {
      label: "主板型号",
      value: joinUnique([baseboard.product, baseboard.model, system.model]) || "未采集",
    },
    { label: "当前 IP", value: iface ? `${ip} (${iface})` : ip },
  ];
};

const renderConfigStatus = (config: AgentConfig = getConfig()) => {
  const canSubmit = hasUploadConfig(config);
  submitButton.hidden = !canSubmit;

  if (config.preset_locked) {
    configStateText.textContent = config.preset_label
      ? `已预置：${config.preset_label}`
      : "已预置";
    return;
  }
  if (config.site && config.token) {
    configStateText.textContent = config.preset_label
      ? `已导入：${config.preset_label}`
      : "已配置";
    return;
  }
  configStateText.textContent = "未配置";
};

const renderSettingsSummary = () => {
  settingsSummaryList.innerHTML = settingsSummaryRows()
    .map(
      (item) => `
        <div class="settings-summary-row">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
        </div>
      `,
    )
    .join("");
};

const runtimeRows = (status: RuntimeStatus | null) => {
  const temperatures = status?.temperatures ?? [];
  const primaryTemperature = temperatures.find((item) => typeof item.temperature_c === "number");
  const memoryUsed = status?.memory?.used ?? 0;
  const memoryTotal = status?.memory?.total ?? 0;
  const diskUsed = status?.disk?.used ?? 0;
  const diskTotal = status?.disk?.total ?? 0;
  const diskMount = status?.disk?.mount && status.disk.mount !== "all" ? ` (${status.disk.mount})` : "";

  return [
    { label: "CPU", value: status ? formatPercent(status.cpu?.usage_percent) : "等待监控" },
    {
      label: "内存",
      value: status ? `${formatBytes(memoryUsed)} / ${formatBytes(memoryTotal)}` : "等待监控",
    },
    {
      label: `磁盘${diskMount}`,
      value: status ? `${formatBytes(diskUsed)} / ${formatBytes(diskTotal)}` : "等待监控",
    },
    {
      label: "温度",
      value: primaryTemperature
        ? `${primaryTemperature.label || "传感器"} ${primaryTemperature.temperature_c?.toFixed(1)} C`
        : "未开放",
    },
  ];
};

const renderRuntimeStatus = (status: RuntimeStatus | null) => {
  runtimeCollectedAt.textContent = status?.collected_at ? `更新 ${formatClock(new Date(status.collected_at))}` : "等待监控";
  runtimeGrid.innerHTML = runtimeRows(status)
    .map(
      (item) => `
        <div class="runtime-row">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
        </div>
      `,
    )
    .join("");
};

const renderOverview = () => {
  overviewGrid.innerHTML = overviewRows()
    .map(
      (item) => `
        <article class="summary-tile">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
        </article>
      `,
    )
    .join("");
};

const renderDetail = () => {
  detailMenu.innerHTML = detailItems
    .map(
      (item) => `
        <button class="detail-button ${item.key === activeDetail ? "active" : ""}" data-detail="${item.key}" type="button">
          <span>${item.title}</span>
          <small>${item.desc}</small>
        </button>
      `,
    )
    .join("");

  const selected = detailItems.find((item) => item.key === activeDetail) ?? detailItems[0];
  const data = snapshot?.data ?? {};
  detailContent.innerHTML = renderHumanDetail(selected.key, data);

  detailMenu.querySelectorAll<HTMLButtonElement>(".detail-button").forEach((button) => {
    button.addEventListener("click", () => {
      activeDetail = button.dataset.detail ?? activeDetail;
      renderDetail();
    });
  });
};

const renderAll = () => {
  renderOverview();
  renderSettingsSummary();
  renderDetail();
  renderSubmitMeta();
};

const renderSubmitMeta = () => {
  const existing = document.querySelector<HTMLElement>("#submitMeta");
  if (!existing) {
    return;
  }
  existing.hidden = !lastSubmittedAt;
  if (!lastSubmittedAt) {
    existing.textContent = "";
    return;
  }
  const label = lastSubmittedConfigLabel ? ` / ${lastSubmittedConfigLabel}` : "";
  existing.textContent = `最近提交：${formatClock(lastSubmittedAt)}${label}`;
};

const renderConfig = (config: AgentConfig) => {
  activeConfig = { ...config };
  siteInput.value = config.site || "";
  nameInput.value = config.name || "";
  tokenInput.value = config.token || "";
  const hasPreset = Boolean(config.preset_locked);
  presetNotice.hidden = !hasPreset;
  configImportToolbar.hidden = hasPreset;
  if (hasPreset) {
    const label = config.preset_label ? `当前预设：${config.preset_label}` : "已预置上传配置";
    presetNotice.querySelector("strong")!.textContent = label;
  }
  if (hasPreset) {
    setManualConfigOpen(false);
  }
  siteInput.disabled = hasPreset;
  tokenInput.disabled = hasPreset;
  renderConfigStatus(config);
  updateInteractiveState();
  renderAll();
};

const loadConfig = async () => {
  const config = await invoke<AgentConfig>("get_saved_config");
  renderConfig(config);
};

const saveConfig = async () => {
  const config = getConfig();
  if (!hasUploadConfig(config)) {
    showSubmitResult("error", "缺少上传配置", "请先导入配置，或手动填写完整授权码和站点地址。");
    return false;
  }

  await invoke("save_config", { config });
  activeConfig = { ...config };
  renderConfigStatus(config);
  renderAll();
  return true;
};

const openImportDialog = () => {
  configJsonInput.value = "";
  importDialogMessage.textContent = "";
  setToast("");
  showModalSafely(configImportDialog);
  configJsonInput.focus();
};

const closeImportDialog = () => {
  closeDialogSafely(configImportDialog);
};

const importConfig = async () => {
  try {
    const config = parseImportedConfig(configJsonInput.value);
    await invoke("save_config", { config });
    resetSubmittedState();
    renderConfig(config);
    setManualConfigOpen(false);
    closeImportDialog();
    setToast("上传配置已导入。", "ok");
    logAppEvent("info", "ui.import_config_succeeded", config.token ? "token_present=true" : "token_present=false");
  } catch (error) {
    const message = errorMessage(error);
    importDialogMessage.textContent = message;
    logAppEvent("warn", "ui.import_config_failed", message);
  }
};

const clearImportDialog = () => {
  configJsonInput.value = "";
  importDialogMessage.textContent = "";
};

const collect = async (options: { submitContext?: boolean; preserveToast?: boolean } = {}) => {
  setCollecting(true);
  if (!options.preserveToast) {
    setToast("");
  }
  collectStateText.textContent = "采集中";
  try {
    snapshot = await invoke<DeviceSnapshot>("collect_device_snapshot");
    collectStateText.textContent = "已采集";
    renderAll();
    return true;
  } catch (error) {
    const message = errorMessage(error);
    collectStateText.textContent = "采集失败";
    setToast(message, "error");
    if (options.submitContext) {
      showSubmitResult("error", "提交失败", `提交前采集设备信息失败：${message}`);
    }
    return false;
  } finally {
    setCollecting(false);
  }
};

const refreshRuntimeStatus = async () => {
  try {
    const status = await invoke<RuntimeStatus>("collect_runtime_status");
    renderRuntimeStatus(status);
  } catch (error) {
    runtimeCollectedAt.textContent = "监控失败";
    runtimeGrid.innerHTML = `
      <div class="runtime-row">
        <span>错误</span>
        <strong>${escapeHtml(errorMessage(error))}</strong>
      </div>
    `;
  }
};

const generateDiagnostics = async () => {
  setGeneratingDiagnostics(true);
  diagnosticsResult.className = "diagnostics-result";
  diagnosticsResult.textContent = "正在生成诊断包...";
  openDiagnosticsFolderButton.hidden = true;
  diagnosticsDirectoryPath = "";
  try {
    const result = await invoke<DiagnosticsPackage>("generate_diagnostics_package");
    diagnosticsDirectoryPath = result.directory_path;
    openDiagnosticsFolderButton.hidden = false;
    diagnosticsResult.className = "diagnostics-result ok";
    diagnosticsResult.innerHTML = `
      <strong>诊断包已生成</strong>
      <span>${escapeHtml(result.zip_path)}</span>
    `;
  } catch (error) {
    diagnosticsResult.className = "diagnostics-result error";
    diagnosticsResult.textContent = errorMessage(error);
  } finally {
    setGeneratingDiagnostics(false);
  }
};

configForm.addEventListener("submit", (event) => {
  event.preventDefault();
});

collectButton.addEventListener("click", () => {
  void collect();
});
importConfigButton.addEventListener("click", openImportDialog);
manualConfigButton.addEventListener("click", () => {
  setManualConfigOpen(manualConfigPanel.hidden);
});
cancelImportButton.addEventListener("click", closeImportDialog);
confirmImportButton.addEventListener("click", importConfig);
configImportDialog.addEventListener("close", clearImportDialog);
generateDiagnosticsButton.addEventListener("click", () => {
  void generateDiagnostics();
});
openDiagnosticsFolderButton.addEventListener("click", () => {
  if (diagnosticsDirectoryPath) {
    logAppEvent("info", "ui.open_diagnostics_folder", diagnosticsDirectoryPath);
    void invoke("open_path", { path: diagnosticsDirectoryPath });
  }
});

submitButton.addEventListener("click", async () => {
  if (!hasUploadConfig()) {
    showSubmitResult("error", "缺少上传配置", "请先导入配置，或手动填写完整授权码和站点地址。");
    logAppEvent("warn", "ui.submit_blocked_missing_config");
    return;
  }
  setSubmitting(true);
  setToast("");
  try {
    if (!snapshot) {
      const collected = await collect({ submitContext: true });
      if (!collected) {
        return;
      }
    }
    if (!snapshot) {
      return;
    }

    const saved = await saveConfig();
    if (!saved) {
      return;
    }
    await invoke<unknown>("submit_device_data", { config: getConfig() });
    lastSubmittedAt = new Date();
    lastSubmittedConfigLabel = configLabel();
    renderSubmitMeta();
    showSubmitResult("success", "上传成功", "设备信息已提交。");
  } catch (error) {
    showSubmitResult("error", "上传失败", errorMessage(error));
  } finally {
    setSubmitting(false);
  }
});

helpButton.addEventListener("click", () => showModalSafely(helpDialog));
closeHelpButton.addEventListener("click", () => closeDialogSafely(helpDialog));
closeSubmitResultButton.addEventListener("click", () => closeDialogSafely(submitResultDialog));

tabs.forEach((button) => {
  button.addEventListener("click", () => switchTab((button.dataset.tab ?? "settings") as TabId));
});

nameInput.addEventListener("input", () => {
  resetSubmittedState();
  renderAll();
});
siteInput.addEventListener("input", () => {
  markManualConfigEdited();
});
tokenInput.addEventListener("input", () => {
  markManualConfigEdited();
});

renderAll();
renderRuntimeStatus(null);

const bootstrap = async () => {
  let loadConfigError = "";
  try {
    await loadConfig();
  } catch (error) {
    loadConfigError = `配置读取失败：${errorMessage(error)}。请重新导入上传配置。`;
    setToast(loadConfigError, "error");
  }

  await collect({ preserveToast: Boolean(loadConfigError) });
  if (loadConfigError && collectStateText.textContent === "已采集") {
    setToast(loadConfigError, "error");
  }
  await refreshRuntimeStatus();
  window.setInterval(() => {
    void refreshRuntimeStatus();
  }, 5000);
};

void bootstrap();
