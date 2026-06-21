# Npcink Device Agent

第一阶段 Rust 迁移客户端，目标是替代 Electron 主进程里的 `systeminformation.getStaticData()`，并上传到 WordPress v2 接口。

现代化后的 v2 数据契约见 `../docs/device-data-v2-contract.md`。服务端会把采集
输入规范化为 `_npcink_device`、`asset`、`raw`，后台列表、统计和导出读取
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

并附加 `collector` 元数据，便于后台识别新客户端来源。新客户端不兼容旧结构。

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
cargo run -- submit --site "https://example.com/wp-json/npcink/v1/device-post-data-v2" --token "后台生成的上传授权码" --note "张三"
```

`submit` 使用 v2 接口 body：

```json
{
  "name": "上传备注，可选",
  "data": {}
}
```

v2 上传会自动附加 HMAC 请求头，用户只需要在桌面端填写后台生成的上传授权码。`name` 只作为后台备注，方便识别当前电脑可能是谁在用，不参与设备合并判断。

## 阶段边界

- 不替换已有 Electron 包。
- v2 使用后台生成的上传授权码和 HMAC 签名。
- 同一台设备再次上传时按 `stable_device_id_v2` 更新原记录，不新增重复设备。
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

- v2 接口地址、上传备注、上传授权码配置
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
