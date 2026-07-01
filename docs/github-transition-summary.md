# GitHub 迁移与历史清理总结

## 当前状态

日期：2026-06-21

项目后续以 GitHub 为主要管理入口。本地仓库当前默认 remote：

```text
origin  https://github.com/muze-page/npcink-device-inventory.git
```

Gitee remote 已从当前 checkout 移除。当前分支是 `master`，并已跟踪
`origin/master`。

GitHub 上已确认的最新提交：

```text
8b13905 Remove legacy compatibility paths
```

## 近期提交脉络

这一轮清理按几个独立提交推进：

- `330591d chore: rename project to Npcink Device Inventory`
  - 将项目从旧 Magick/DEMA 命名迁移到 `Npcink Device Inventory`。
  - 统一 WordPress 插件和桌面采集器的产品命名。
- `6a7b7d8 Clean up legacy DEMA naming`
  - 清理项目自有代码和文档里的 `DEMA / Dema / dema` 内部命名。
- `a56358b Remove legacy uploader and harden cleanup paths`
  - 移除旧上传器路径，并收紧清理逻辑。
- `310cee8 Harden public lookup and export paths`
  - 收紧公开查询和导出路径，降低默认暴露面。
- `8b13905 Remove legacy compatibility paths`
  - 移除剩余活跃兼容路径，并同步文档到当前基线。

## 当前技术基线

项目现在只保留 v2 设备流程作为活跃路径：

- 设备上传使用 `POST /wp-json/npcink-device-inventory/v1/device-post-data-v2`。
- 设备上传和公开查询都使用后台生成的客户端授权码，并通过 HMAC 签名请求。
- 公开查询不再接受旧共享查询密码，也不再接受 `x-npcink-password` fallback。
- 设备身份以 `stable_device_id_v2` 为准。
- 设备 JSON 存储结构以 `_npcink_device`、`asset`、`raw` 为核心。
- Rust/Tauri 采集器位于 `ele-rs/`，是当前上传客户端代码基线。
- WordPress 插件发布包只包含插件运行文件和已构建 Web 资源，不包含桌面端源码、文档、本地缓存、`node_modules` 或 Rust 构建产物。

## 已移除的历史包袱

本轮明确移除的历史兼容内容包括：

- 旧 Magick/DEMA 产品命名。
- 当前操作文档中对旧 Electron/Vue 上传器的指引。
- 旧 v1 上传回调 `submit_data_callback`。
- 旧更新辅助函数 `check_Data_Change`。
- 公共路由的旧共享密码校验。
- 公开查询的 `x-npcink-password` fallback。
- 后台 phase1 PC 迁移 REST 入口、服务逻辑和 UI。
- v2 上传响应和存储 JSON 中的 `legacy_uuid` 诊断元数据。
- Rust 采集器中的旧 `legacy_device_id` 逻辑。
- 仅服务旧设备号逻辑的 `md5` 依赖。
- 前端和桌面端中把授权码称为 `password` 的配置字段语义。

后续如果还看到旧词，应该优先判断它是不是明确的历史记录。当前允许存在的旧内容应只出现在 `docs/modernization-history.md` 这类历史文档中，不能再作为活跃运行路径或操作指引。

## 验证基线

在切换 GitHub remote 前，最新清理已通过以下验证：

- `composer validate --strict`
- `composer run phpcs`
- `composer run phpstan`
- PHP `-l` 全量语法扫描
- `npm run build` in `vite-admin/`
- `npm run build` in `vite-search/`
- `cargo test` in `ele-rs/`
- `npm run build` in `ele-rs/`
- `cargo clippy -- -D warnings` in `ele-rs/src-tauri/`
- `.github/scripts/package-wordpress-plugin.sh`

随后 `master` 已推送到 GitHub，并确认 `HEAD` 与 `origin/master` 同步。

## GitHub 后续管理口径

后续默认使用 GitHub：

```bash
git remote -v
git status -sb
git push origin master
```

发布 tag 也推到 `origin`：

```bash
git tag v0.1.0
git push origin v0.1.0
```

预览包和正式发布包继续使用 GitHub Actions，具体流程见
`docs/github-release.md`。

## 后续建议

兼容清理已经不是主线。下一轮更值得关注：

- GitHub Actions 的分支、tag、artifact 保留策略。
- 是否继续使用 `master`，还是迁移默认分支到 `main`。
- 上传 token 与只读公开查询 token 是否拆分。
- 为公开和管理端 REST 参数补 schema。
- 桌面端安装包在更大范围分发前补签名和 notarization。
