# Magick Device Agent

第一阶段 Rust 迁移客户端，目标是替代 Electron 主进程里的 `systeminformation.getStaticData()`，但暂时保持 WordPress 上传接口兼容。

## 为什么先做这个

当前线上已有 100 多台电脑数据，服务端使用以下规则计算电脑设备 UUID：

```text
md5(data.uuid.hardware + data.uuid.macs[0])
```

所以第一阶段不能随意更换数据结构或主键规则。这个 Agent 会继续输出：

```json
{
  "uuid": {
    "hardware": "...",
    "macs": ["..."]
  },
  "net": []
}
```

并额外附加 `collector` 元数据，便于后台识别新客户端来源。

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
cargo run -- legacy-id
cargo run -- submit --site "https://example.com/wp-json/npcink/v1/device-post-data-v2" --name "张三" --password "9527"
cargo run -- submit-legacy --site "https://example.com/wp-json/npcink/v1/device-post-data" --name "张三" --password "9527"
```

`submit` 使用 v2 接口 body：

```json
{
  "name": "...",
  "password": "...",
  "data": {}
}
```

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

- 不修改 WordPress 插件数据库主键。
- 不替换已有 Electron 包。
- v2 先沿用现有上传密码鉴权，HMAC/设备令牌留到下一阶段。
- 先验证 Windows/macOS 采集字段是否足以更新现有设备。

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
- legacy ID 展示
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
