import { invoke } from "@tauri-apps/api/core";
import "./style.css";

type AgentConfig = {
  site: string;
  name: string;
  password: string;
};

type DeviceSnapshot = {
  data: Record<string, unknown>;
  stable_device_id_v2: string;
};

type TabId = "settings" | "overview" | "details";

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
          <button class="tab" data-tab="details" type="button">详情</button>
        </nav>
        <button class="help-button" id="helpButton" type="button">帮助</button>
      </header>

      <section class="tab-page active" id="settingsPage">
        <form class="upload-form" id="configForm">
          <label class="field">
            <span>姓名</span>
            <input id="name" name="name" placeholder="请输入当前电脑使用人" />
          </label>

          <details class="more-config">
            <summary>更多配置</summary>
            <label class="field">
              <span>上传授权码</span>
              <input id="password" name="password" type="password" placeholder="后台生成的上传授权码" />
            </label>
            <label class="field">
              <span>接口地址</span>
              <input id="site" name="site" placeholder="https://example.com/wp-json/npcink/v1/device-post-data-v2" />
            </label>
            <p class="tip">默认提交新版 v2 接口；旧接口只保留作回退测试。</p>
          </details>

          <div class="form-actions">
            <button class="button secondary" id="collectButton" type="button">重新采集</button>
            <button class="button primary" id="submitButton" type="button">提交</button>
          </div>
          <div class="inline-state">
            <span id="collectState">准备采集</span>
            <span id="submitState">等待操作</span>
          </div>
          <div class="message" id="toast"></div>
        </form>
      </section>

      <section class="tab-page" id="overviewPage">
        <div class="overview-grid" id="overviewGrid"></div>
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
  </main>
`;

const siteInput = document.querySelector<HTMLInputElement>("#site")!;
const nameInput = document.querySelector<HTMLInputElement>("#name")!;
const passwordInput = document.querySelector<HTMLInputElement>("#password")!;
const configForm = document.querySelector<HTMLFormElement>("#configForm")!;
const collectButton = document.querySelector<HTMLButtonElement>("#collectButton")!;
const submitButton = document.querySelector<HTMLButtonElement>("#submitButton")!;
const helpButton = document.querySelector<HTMLButtonElement>("#helpButton")!;
const collectState = document.querySelector<HTMLElement>("#collectState")!;
const submitState = document.querySelector<HTMLElement>("#submitState")!;
const toast = document.querySelector<HTMLElement>("#toast")!;
const overviewGrid = document.querySelector<HTMLElement>("#overviewGrid")!;
const detailMenu = document.querySelector<HTMLElement>("#detailMenu")!;
const detailContent = document.querySelector<HTMLElement>("#detailContent")!;
const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>(".tab"));
const pages = Array.from(document.querySelectorAll<HTMLElement>(".tab-page"));

let snapshot: DeviceSnapshot | null = null;
let activeDetail = "cpu";

const detailItems = [
  { key: "cpu", title: "处理器", desc: "CPU 信息" },
  { key: "memory", title: "内存", desc: "内存条与容量" },
  { key: "diskLayout", title: "硬盘", desc: "磁盘与分区" },
  { key: "graphics", title: "显卡/显示器", desc: "显示设备" },
  { key: "baseboard", title: "主板", desc: "主板信息" },
  { key: "bios", title: "BIOS", desc: "固件信息" },
  { key: "os", title: "系统", desc: "操作系统" },
  { key: "net", title: "网卡", desc: "网络信息" },
  { key: "uuid", title: "UUID", desc: "唯一标识" },
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
  const message = String(error);
  if (message.includes("invoke")) {
    return "桌面采集服务未连接，请在软件窗口中操作。";
  }
  return message;
};

const getConfig = (): AgentConfig => ({
  site: siteInput.value.trim(),
  name: nameInput.value.trim(),
  password: passwordInput.value,
});

const setBusy = (busy: boolean) => {
  collectButton.disabled = busy;
  submitButton.disabled = busy;
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
  const graphics = asRecord(data.graphics);
  const firstDisplay = asRecord(asArray(graphics.displays)[0]);
  const firstController = asRecord(asArray(graphics.controllers)[0]);
  const firstNet = primaryNetwork(data.net);
  const memoryType = firstText(data, ["memory.0.type", "memLayout.0.type"], "");
  const memorySize = formatBytes(sumSizes(data.memory) || sumSizes(data.memLayout) || asRecord(data.mem).total);

  return [
    { label: "姓名", value: nameInput.value.trim() || "未设定" },
    { label: "设备编号", value: snapshot?.stable_device_id_v2 || firstText(data, ["uuid.hardware"]) },
    {
      label: "处理器",
      value: [cpu.manufacturer, cpu.brand].filter(Boolean).join(" ") || "未采集",
    },
    { label: "内存", value: [memoryType, memorySize].filter(Boolean).join(" ") },
    { label: "硬盘", value: formatBytes(sumSizes(data.diskLayout)) },
    {
      label: "显卡",
      value:
        [firstController.vendor, firstController.model].filter(Boolean).join(" ") ||
        "未采集",
    },
    {
      label: "主板",
      value: [baseboard.manufacturer, baseboard.model].filter(Boolean).join(" ") || "未采集",
    },
    {
      label: "系统",
      value: [os.distro, os.release].filter(Boolean).join(" ") || "未采集",
    },
    {
      label: "显示器",
      value:
        [
          firstDisplay.model,
          firstDisplay.resolution ||
            (firstDisplay.resolutionX && `${firstDisplay.resolutionX}x${firstDisplay.resolutionY}`),
        ]
          .filter(Boolean)
          .join(" ") || "未采集",
    },
    {
      label: "网卡",
      value:
        [firstNet.ifaceName || firstNet.iface, firstNet.mac].filter(Boolean).join(" ") ||
        "未采集",
    },
  ];
};

const renderOverview = () => {
  overviewGrid.innerHTML = overviewRows()
    .map(
      (item) => `
        <article class="summary-tile">
          <span>${item.label}</span>
          <strong>${item.value}</strong>
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
  renderDetail();
};

const renderConfig = (config: AgentConfig) => {
  siteInput.value = config.site || "";
  nameInput.value = config.name || "";
  passwordInput.value = config.password || "";
  renderOverview();
};

const loadConfig = async () => {
  const config = await invoke<AgentConfig>("get_saved_config");
  renderConfig(config);
};

const saveConfig = async () => {
  const config = getConfig();
  if (!config.site || !config.name || !config.password) {
    setToast("请填写姓名、上传授权码和接口地址。", "error");
    return false;
  }

  await invoke("save_config", { config });
  renderOverview();
  return true;
};

const collect = async () => {
  setBusy(true);
  setToast("");
  collectState.textContent = "采集中";
  try {
    snapshot = await invoke<DeviceSnapshot>("collect_device_snapshot");
    collectState.textContent = "已采集";
    renderAll();
  } catch (error) {
    collectState.textContent = "采集失败";
    setToast(errorMessage(error), "error");
  } finally {
    setBusy(false);
  }
};

configForm.addEventListener("submit", (event) => {
  event.preventDefault();
});

collectButton.addEventListener("click", collect);

submitButton.addEventListener("click", async () => {
  if (!snapshot) {
    await collect();
  }
  if (!snapshot) {
    return;
  }

  setBusy(true);
  setToast("");
  submitState.textContent = "提交中";
  try {
    const saved = await saveConfig();
    if (!saved) {
      submitState.textContent = "等待操作";
      return;
    }
    await invoke<unknown>("submit_device_data", { config: getConfig() });
    submitState.textContent = "提交成功";
    setToast("设备信息已提交。", "ok");
  } catch (error) {
    submitState.textContent = "提交失败";
    setToast(errorMessage(error), "error");
  } finally {
    setBusy(false);
  }
});

helpButton.addEventListener("click", () => {
  alert("遇上问题请联系管理员");
});

tabs.forEach((button) => {
  button.addEventListener("click", () => switchTab((button.dataset.tab ?? "settings") as TabId));
});

nameInput.addEventListener("input", renderOverview);

renderAll();
loadConfig()
  .then(collect)
  .catch((error) => setToast(errorMessage(error), "error"));
