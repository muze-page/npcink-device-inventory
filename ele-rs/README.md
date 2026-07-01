# Npcink Device Agent

Rust/Tauri 设备采集与上传客户端，负责采集本机硬件事实并提交到 WordPress 插件 v3 资产模型。

客户端上传到：

```text
POST /wp-json/npcink-device-inventory/v1/device-observations
```

上传 body 使用 v3 observation 合同：

```json
{
  "observation": {
    "_npcink_device": {
      "schema_version": 3,
      "stable_device_id_v2": "...",
      "collector": {}
    },
    "asset": {
      "identity": {},
      "upload": {},
      "summary": {},
      "hardware": {}
    },
    "raw": {}
  }
}
```

请求必须携带后台生成的完整授权码对应的 HMAC 头。完整授权码形如：

```text
mda_<token-id>_<token-secret>
```

## 命令

桌面客户端：

```bash
npm install
npm run build
npm run tauri:dev
npm run tauri:build
```

运行时导入：

1. 在 WordPress 后台客户端接入弹窗中点击“复制上传配置”。
2. 打开桌面客户端，点击“导入上传配置”。
3. 粘贴复制到的 JSON 并导入。

导入后会预填站点地址和完整授权码，用户仍可填写本次上传备注。

预设打包：

```bash
cp src-tauri/agent-preset.example.json src-tauri/agent-preset.local.json
# 将 WordPress 后台“复制上传配置”得到的 JSON 粘贴进 agent-preset.local.json
npm run tauri:build
```

`src-tauri/agent-preset.local.json` 会在构建时嵌入安装包。安装后的客户端会隐藏站点地址和授权码，只保留“上传备注”给使用者填写。

打包产物位置：

```text
src-tauri/target/release/bundle/nsis/*.exe
src-tauri/target/release/bundle/dmg/*.dmg
```

命令行采集器：

```bash
cargo run -- inspect --pretty
cargo run -- stable-id
cargo run -- submit --site "https://example.com" --token "后台生成的完整授权码" --note "张三"
```

`--site` 可以填写站点首页、`/wp-json`、`/wp-json/npcink-device-inventory/v1` 或完整 `/device-observations` endpoint；客户端会自动归一化到设备上传接口。

## 桌面客户端结构

```text
ele-rs/
  src/                  # 共享 Rust 采集库 + CLI
  src-tauri/            # Tauri 桌面外壳
  src/main.ts           # 桌面 UI
  src/style.css         # 桌面 UI 样式
```

桌面 UI 当前提供：

- 上传备注配置；预设打包时隐藏站点地址和完整授权码
- 本机硬件采集预览
- stable device id 展示
- 提交到 `/device-observations`

## 本地环境

打包和运行 Tauri 需要先安装 Rust：

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

安装后重新打开终端，再执行：

```bash
cd ele-rs
npm run tauri:dev
```

## 待验证样本

- Windows 台式机
- Windows 笔记本
- macOS Intel
- macOS Apple Silicon
- 同时存在 Wi-Fi、有线网、虚拟网卡的机器
