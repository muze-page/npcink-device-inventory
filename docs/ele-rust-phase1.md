# ele Rust 第一阶段迁移说明

## 目标

先做 Rust 采集与上传底座。旧数据不在新客户端里兼容，等新结构稳定后一次性迁移。第一阶段只证明三件事：

1. Rust 能稳定采集 Windows/macOS 硬件信息。
2. 输出 JSON 能被 WordPress v2 接口规范化为 `_magick_device`、`asset`、`raw`。
3. `stable_device_id_v2` 能稳定标识同一台设备。

## 新版上传契约

旧上传接口仍可留作历史包使用：

```text
POST /wp-json/npcink/v1/device-post-data
name: 使用人
password: 上传密码
data: JSON 字符串
```

新版 Rust 客户端主路径使用：

```text
POST /wp-json/npcink/v1/device-post-data-v2
name: 使用人
data: 设备 JSON 对象
```

新版客户端不再把上传密码放进请求体。后台生成“上传授权码”后，客户端自动使用
token + HMAC 请求头签名，普通用户只需要粘贴一次授权码。

v2 服务端使用 `stable_device_id_v2` 作为数据库 `uuid`，并只存规范化后的
`_magick_device`、`asset`、`raw` 三层结构。

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

把 `sample.json` 与旧 Electron 客户端生成的数据对比，重点看：

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
  --site "https://example.com/wp-json/npcink/v1/device-post-data-v2" \
  --name "测试设备" \
  --token "后台生成的上传授权码"
```

## 上线策略

第一批只选 3-5 台测试机：

- 一台 Windows 台式机
- 一台 Windows 笔记本
- 一台 macOS Apple Silicon
- 如果有条件，再加一台 macOS Intel

每台都先跑 `inspect --pretty`，确认稳定设备标识、主网卡、内存、硬盘和显卡信息合理后再正式提交。

## 旧数据迁移

旧数据迁移不在这个阶段执行，后台迁移按钮和 phase1 接口已禁用。等 v2
新结构稳定后，导出旧数据、离线生成 `asset`，验证后再导入。

## 后续阶段

第二阶段继续完善 Tauri 图形界面，并按 `docs/device-data-v2-contract.md`
收敛新数据结构。旧的 systeminformation 兼容字段只作为采集输入，不作为长期后台统计口径。

第三阶段已提前落地安全协议升级：新版上传走客户端授权码 + HMAC，旧接口保留兼容期。
