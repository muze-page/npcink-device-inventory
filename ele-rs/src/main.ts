import { invoke } from "@tauri-apps/api/core";
import "./style.css";

type AgentConfig = {
  site: string;
  name: string;
  password: string;
};

type DeviceSnapshot = {
  data: unknown;
  legacy_id: string;
};

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("missing #app");
}

app.innerHTML = `
  <main class="shell">
    <aside class="sidebar">
      <section class="brand">
        <h1>Magick Device Agent</h1>
        <p>Rust 采集器，提交到新版 v2 设备接口。</p>
      </section>
      <section class="status-list">
        <div class="status-row">
          <span>Legacy ID</span>
          <strong id="legacyId">尚未采集</strong>
        </div>
        <div class="status-row">
          <span>接口</span>
          <strong id="endpointState">未配置</strong>
        </div>
        <div class="status-row">
          <span>提交状态</span>
          <strong id="submitState">等待操作</strong>
        </div>
      </section>
    </aside>
    <section class="content">
      <header class="toolbar">
        <div>
          <h2>设备采集与上传</h2>
          <p>先采集预览，再提交。提交默认使用 /device-post-data-v2。</p>
        </div>
        <div class="actions">
          <button class="button" id="collectButton">采集</button>
          <button class="button primary" id="submitButton">提交</button>
        </div>
      </header>

      <section class="main-grid">
        <section class="panel">
          <h3>连接配置</h3>
          <form class="form" id="configForm">
            <div class="field">
              <label for="site">v2 接口地址</label>
              <input id="site" name="site" placeholder="https://example.com/wp-json/npcink/v1/device-post-data-v2" />
              <div class="hint">旧接口只用于回退测试，新客户端默认提交 v2。</div>
            </div>
            <div class="field">
              <label for="name">使用人</label>
              <input id="name" name="name" placeholder="例如：张三" />
            </div>
            <div class="field">
              <label for="password">上传密码</label>
              <input id="password" name="password" type="password" placeholder="后台设置里的客户端上传密码" />
            </div>
            <button class="button" type="submit">保存配置</button>
            <div class="toast" id="toast"></div>
          </form>
        </section>

        <section class="panel preview-panel">
          <div class="preview-head">
            <h3>采集预览</h3>
            <span class="hint" id="previewState">未采集</span>
          </div>
          <pre class="preview" id="preview">{}</pre>
        </section>
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
const preview = document.querySelector<HTMLElement>("#preview")!;
const previewState = document.querySelector<HTMLElement>("#previewState")!;
const legacyId = document.querySelector<HTMLElement>("#legacyId")!;
const endpointState = document.querySelector<HTMLElement>("#endpointState")!;
const submitState = document.querySelector<HTMLElement>("#submitState")!;
const toast = document.querySelector<HTMLElement>("#toast")!;

let snapshot: DeviceSnapshot | null = null;

const setToast = (message: string, kind: "ok" | "error" | "" = "") => {
  toast.textContent = message;
  toast.className = `toast ${kind}`;
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

const renderConfig = (config: AgentConfig) => {
  siteInput.value = config.site || "";
  nameInput.value = config.name || "";
  passwordInput.value = config.password || "";
  endpointState.textContent = config.site || "未配置";
};

const loadConfig = async () => {
  const config = await invoke<AgentConfig>("get_saved_config");
  renderConfig(config);
};

const collect = async () => {
  setBusy(true);
  setToast("");
  previewState.textContent = "采集中";
  try {
    snapshot = await invoke<DeviceSnapshot>("collect_device_snapshot");
    legacyId.textContent = snapshot.legacy_id || "无法计算";
    preview.textContent = JSON.stringify(snapshot.data, null, 2);
    previewState.textContent = "已采集";
  } catch (error) {
    previewState.textContent = "采集失败";
    setToast(String(error), "error");
  } finally {
    setBusy(false);
  }
};

configForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const config = getConfig();
  if (!config.site || !config.name || !config.password) {
    setToast("请补全接口地址、使用人和上传密码。", "error");
    return;
  }

  setBusy(true);
  try {
    await invoke("save_config", { config });
    endpointState.textContent = config.site;
    setToast("配置已保存。", "ok");
  } catch (error) {
    setToast(String(error), "error");
  } finally {
    setBusy(false);
  }
});

collectButton.addEventListener("click", collect);

submitButton.addEventListener("click", async () => {
  const config = getConfig();
  if (!config.site || !config.name || !config.password) {
    setToast("请先保存完整配置。", "error");
    return;
  }

  setBusy(true);
  setToast("");
  submitState.textContent = "提交中";
  try {
    const result = await invoke<unknown>("submit_device_data", { config });
    submitState.textContent = "提交成功";
    setToast("设备数据已提交到 v2 接口。", "ok");
    preview.textContent = JSON.stringify(result, null, 2);
  } catch (error) {
    submitState.textContent = "提交失败";
    setToast(String(error), "error");
  } finally {
    setBusy(false);
  }
});

loadConfig().catch((error) => setToast(String(error), "error"));
