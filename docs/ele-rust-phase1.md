# ele Rust 第一阶段迁移说明

## 目标

在不破坏现有线上 100 多台电脑数据的前提下，先做 Rust 采集与上传底座。第一阶段只证明三件事：

1. Rust 能稳定采集 Windows/macOS 硬件信息。
2. 输出 JSON 能被现有 WordPress 接口识别。
3. `uuid.hardware + uuid.macs[0]` 计算出的 legacy ID 能尽量匹配旧 Electron 客户端。

## 不变的生产契约

当前服务端 `admin/partials/interface/api.php` 继续保留旧上传逻辑：

```text
POST /wp-json/npcink/v1/device-post-data
name: 使用人
password: 上传密码
data: JSON 字符串
```

服务端继续使用：

```text
md5(data.uuid.hardware + data.uuid.macs[0])
```

作为设备唯一标识。第一阶段不能修改这个规则，否则历史设备可能被插入成重复设备。

新版 Rust 客户端主路径使用：

```text
POST /wp-json/npcink/v1/device-post-data-v2
name: 使用人
password: 上传密码
data: 设备 JSON 对象
```

v2 服务端会先用旧 `legacy_uuid` 匹配历史设备，匹配不到时再用 `stable_device_id_v2` 兜底匹配。

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
cargo run -- legacy-id
```

把 `sample.json` 与旧 Electron 客户端生成的数据对比，重点看：

- `uuid.hardware`
- `uuid.macs[0]`
- `net[0].ip4`
- `net[].default`
- `cpu.brand`
- `mem.total`
- `diskLayout`
- `graphics`

确认无误后，再对测试站点执行：

```bash
cargo run -- submit \
  --site "https://example.com/wp-json/npcink/v1/device-post-data-v2" \
  --name "测试设备" \
  --password "上传密码"
```

## 上线策略

第一批只选 3-5 台测试机：

- 一台 Windows 台式机
- 一台 Windows 笔记本
- 一台 macOS Apple Silicon
- 如果有条件，再加一台 macOS Intel

每台都先跑 `legacy-id`，和线上已有记录的 `uuid` 对上后再正式提交。对不上时不要上传，先保存 `sample.json` 排查网卡顺序或硬件 UUID 差异。

## 后台迁移接口

后台迁移按钮应先调用预检：

```text
GET /wp-json/npcink/v1/admin/pc-migration/phase1
```

用户确认后再调用执行：

```text
POST /wp-json/npcink/v1/admin/pc-migration/phase1
{
  "confirm": true
}
```

迁移执行只写回每条电脑设备 `data` JSON 中的 `_magick_device` 元数据，不改数据库 `uuid` 列，不删除旧字段。

## 后续阶段

第二阶段再做 Tauri 图形界面，复用现有 Vue 的设置、概览、详情页。

第三阶段再做安全协议升级，把共享密码改成设备级 token 或 HMAC，但旧接口需要保留兼容期。
