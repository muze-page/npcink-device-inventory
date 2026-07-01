# ele Rust 第一阶段迁移说明

## 目标

先做 Rust 采集与上传底座。新客户端只面向 v2 上传契约，不承担旧数据兼容。第一阶段只证明三件事：

1. Rust 能稳定采集 Windows/macOS 硬件信息。
2. 输出 JSON 能被 WordPress v2 接口规范化为 `_npcink_device`、`asset`、`raw`。
3. `stable_device_id_v2` 能稳定标识同一台设备。

## 新版上传契约

新版 Rust 客户端主路径使用：

```text
POST /wp-json/npcink-device-inventory/v1/device-observations
body: 包含 `_npcink_device`、`asset`、`raw` 的 observation JSON 对象
```

新版客户端不再把明文密码放进请求体。后台生成“上传授权码”后，客户端自动使用
token + HMAC 请求头签名，普通用户只需要粘贴一次授权码。
`asset.upload.note` 只作为后台查看时的上传备注，不参与设备身份判断，也不会覆盖资产名称。

v2 服务端使用 `stable_device_id_v2` 作为数据库 `uuid`。同一台设备再次上传时
直接更新原记录，上传备注只写入 `asset.upload`，不会覆盖资产名称。

## 新增目录

```text
ele-rs/
  Cargo.toml
  src/
    main.rs
    upload.rs
    collector/
      mod.rs
      platform.rs
```

`ele-rs` 当前是 CLI 形态，后续可以被 Tauri UI 调用，也可以先单独发给少量电脑做采集对比。

## 验证流程

在装有 Rust 的机器上执行：

```bash
cd ele-rs
cargo run -- inspect --pretty > sample.json
```

把 `sample.json` 与已知设备样本对比，重点看：

- `uuid.hardware`
- `stable_device_id_v2`
- 主网卡 MAC/IP
- `cpu.brand`
- `mem.total`
- `diskLayout`
- `graphics`

确认无误后，再对测试站点执行：

```bash
cargo run -- submit \
  --site "https://example.com/wp-json/npcink-device-inventory/v1/device-observations" \
  --token "后台生成的上传授权码" \
  --note "测试设备"
```

## 上线策略

第一批只选 3-5 台测试机：

- 一台 Windows 台式机
- 一台 Windows 笔记本
- 一台 macOS Apple Silicon
- 如果有条件，再加一台 macOS Intel

每台都先跑 `inspect --pretty`，确认稳定设备标识、主网卡、内存、硬盘和显卡信息合理后再正式提交。

## 后续阶段

第二阶段继续完善 Tauri 图形界面，并按 `docs/device-data-v2-contract.md`
收敛新数据结构。

第三阶段已提前落地安全协议升级：新版上传走客户端授权码 + HMAC。
