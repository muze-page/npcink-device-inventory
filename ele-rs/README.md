# Npcink Device Agent

Rust/Tauri 设备采集与上传客户端，负责采集本机硬件事实并提交到 WordPress 插件 v3 资产模型。

客户端上传到：

```text
POST /wp-json/npcink/v1/device-observations
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

命令行采集器：

```bash
cargo run -- inspect --pretty
cargo run -- stable-id
cargo run -- submit --site "https://example.com" --token "后台生成的完整授权码" --note "张三"
```

`--site` 可以填写站点首页、`/wp-json`、`/wp-json/npcink/v1` 或完整 `/device-observations` endpoint；客户端会自动归一化到 v3 上传接口。

## 桌面客户端结构

```text
ele-rs/
  src/                  # 共享 Rust 采集库 + CLI
  src-tauri/            # Tauri 桌面外壳
  src/main.ts           # 桌面 UI
  src/style.css         # 桌面 UI 样式
```

桌面 UI 当前提供：

- 站点地址、上传备注、完整授权码配置
- 本机硬件采集预览
- stable device id 展示
- 提交到 v3 `/device-observations`

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
