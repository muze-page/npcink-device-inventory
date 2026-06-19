# Magick Device Agent

第一阶段 Rust 迁移客户端，目标是替代 Electron 主进程里的 `systeminformation.getStaticData()`，并上传到 WordPress v2 接口。

现代化后的 v2 数据契约见 `../docs/device-data-v2-contract.md`。服务端会把采集
输入规范化为 `_magick_device`、`asset`、`raw`，后台列表、统计和导出读取
`asset` 数据。

## 为什么先做这个

新客户端会输出用于生成 `stable_device_id_v2` 的硬件身份信号：

```json
{
  "uuid": {
    "hardware": "...",
    "macs": ["..."]
  },
  "net": []
}
```

并附加 `collector` 元数据，便于后台识别新客户端来源。旧数据后续导出后一次性迁移，不在新客户端里兼容。

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
cargo run -- submit --site "https://example.com/wp-json/npcink/v1/device-post-data-v2" --name "张三" --token "后台生成的上传授权码"
cargo run -- submit-legacy --site "https://example.com/wp-json/npcink/v1/device-post-data" --name "张三" --password "上传密码"
```

`submit` 使用 v2 接口 body：

```json
{
  "name": "...",
  "data": {}
}
```

v2 上传会自动附加 HMAC 请求头，用户只需要在桌面端填写后台生成的上传授权码。

`submit-legacy` 保留旧接口 body：

```json
{
  "name": "...",
  "password": "...",
  "site": "...",
  "data": "{...兼容旧客户端的 JSON 字符串...}"
}
```

## 阶段边界

- 不替换已有 Electron 包。
- v2 使用后台生成的上传授权码和 HMAC 签名；旧密码仅作为兼容回退。
- 先验证 Windows/macOS 采集字段是否足以支撑新 `asset` 结构。

## 桌面客户端结构

```text
ele-rs/
  src/                  # 共享 Rust 采集库 + CLI
  src-tauri/            # Tauri 桌面外壳
  src/main.ts           # 桌面 UI
  src/style.css         # 桌面 UI 样式
```

桌面 UI 当前提供：

- v2 接口地址、使用人、上传密码配置
- 本机硬件采集预览
- stable device id 展示
- 提交到 `/device-post-data-v2`

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
