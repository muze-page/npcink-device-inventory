# Desktop Updater Release History

日期：2026-07-06

本文归纳本轮围绕桌面上传软件更新能力、GitHub Release 发布、Mac/Windows 安装包、仓库可见性和更新入口的排障与决策。它补充 `docs/github-release.md`，用于后续接手时快速理解为什么当前桌面端更新流程这样设计。

## 总体结论

本轮主线是把桌面上传软件从“只能人工下载安装”推进到“通过 GitHub Release 提供更新清单和签名更新包”。

当前结论：

- GitHub Release 流程已经可以产出 WordPress 插件 zip、Mac DMG、Mac updater 包、Windows NSIS 安装包、`latest.json` 和 `latest-desktop.json`。
- Tauri updater 已接入，使用 `latest.json` 和签名文件做自动更新校验。
- 手动下载兜底使用 `latest-desktop.json`，用于展示最新版本和安装包下载地址。
- GitHub 仓库必须公开，桌面客户端才能无登录读取 Release 资产；私有仓库会导致普通 HTTP 请求返回 `404`。
- 当前 Mac DMG 仍用于内部测试，未做 Apple Developer ID 签名和公证，正式外部分发前必须补证书流程。
- 旧的本地构建版 `0.1.2` 虽然版本号相同，但不等于 GitHub Release `v2.7.5` 的正式 `0.1.2` 包；只有正式 `v2.7.5` 包包含更新入口。
- 桌面端更新入口保留在设置页，并新增到原生顶部菜单。

## 发布与版本

本轮完成了两次关键发布：

- `v2.7.5`：首次具备桌面更新基础能力的发布。
- `v2.7.6`：将桌面端从 `0.1.2` 升到 `0.1.3`，用于验证 `0.1.2 -> 0.1.3` 更新路径。

`v2.7.6` Release 资产包括：

- `latest.json`
- `latest-desktop.json`
- `npcink-device-inventory.zip`
- `Npcink.Device.Agent.app.tar.gz`
- `Npcink.Device.Agent.app.tar.gz.sig`
- `Npcink.Device.Agent_0.1.3_aarch64.dmg`
- `Npcink.Device.Agent_0.1.3_x64-setup.exe`
- `Npcink.Device.Agent_0.1.3_x64-setup.exe.sig`
- `plugin-check-results.txt`

验证结果：

- `latest.json` 版本为 `0.1.3`。
- 平台包含 `darwin-aarch64` 和 `windows-x86_64`。
- Mac updater 包解压后 `CFBundleShortVersionString` 为 `0.1.3`。
- Mac DMG 和 Windows 安装包均由 release workflow 产出。

## 更新清单与资产 URL

GitHub Release 资产通过 `gh release create` 上传后，文件名中的空格会变成点号。例如：

```text
Npcink Device Agent.app.tar.gz
```

会成为：

```text
Npcink.Device.Agent.app.tar.gz
```

因此 `scripts/build-desktop-update-manifests.mjs` 中的 Release 资产 URL 生成逻辑必须把空格替换为点号。否则 `latest.json` 中的 URL 会指向不存在的资产，导致更新器下载失败。

当前清单规则：

- `latest.json` 给 Tauri updater 使用，包含签名和平台更新包。
- `latest-desktop.json` 给前端手动检查使用，包含人可读的下载地址。
- 两个清单都不能包含 `%20` 形式的空格资产 URL。

## 仓库公开要求

在仓库为 private 时，浏览器登录态可以访问 Release，但桌面客户端和无登录 `curl` 访问会返回 `404`。这会导致：

- `latest.json` 读不到。
- updater 包读不到。
- 自动更新无法工作。

本轮已将 GitHub 仓库设置为 public。用户随后在浏览器中打开 `latest.json` 后触发自动下载，确认公开访问生效。

注意：

- 不要在桌面客户端内置 GitHub Token。
- 如果未来仓库需要重新私有化，更新清单和安装包必须迁移到公开可访问地址，例如 `https://www.mqzj.top/npcink-updates/desktop/latest.json`。

## 正式包与本地包差异

排障时发现 `/Applications/Npcink Device Agent.app` 中的本机 `0.1.2` 没有“软件更新”卡片。进一步对比二进制 hash 后确认：

- 本机原有 `0.1.2` 是早期本地构建包。
- GitHub Release `v2.7.5` 的 `0.1.2` 是正式更新测试包。
- 两者版本号相同，但内容不同。

正式 `v2.7.5` 包覆盖安装后，设置页出现“软件更新 / 检查更新”入口。

本次临时测试曾备份原有本地 App：

```text
/tmp/Npcink Device Agent.backup.20260706211830.app
```

该路径只是当次机器上的临时备份记录，不是项目交付物。

## 更新入口设计

用户反馈设置页中不容易发现更新入口，并建议放到顶部菜单。当前设计：

- macOS：放在 `Npcink Device Agent > 检查更新...`。
- Windows/Linux：放在 `帮助 > 检查更新...`。
- 设置页继续保留“软件更新”卡片。

菜单项触发流程：

1. Rust 原生菜单捕获 `check_for_updates`。
2. 后端发出 `desktop-check-update` 前端事件。
3. 前端切到 `settings` 页。
4. 复用 `checkDesktopUpdate()` 检查更新。
5. 检测到新版本后，仍在设置页展示“下载安装并重启”按钮和安装进度。

这样做的原因：

- 顶部菜单符合 Mac 和 Windows 用户习惯。
- 设置页保留完整状态和进度，不需要新建一个更新弹窗。
- 更新检测逻辑仍只有一套，避免菜单入口和设置页入口行为分叉。

## macOS 签名与公证

当前 Mac DMG 可以用于内部测试，但没有 Apple Developer ID 签名和 Apple 公证。用户已确认当前阶段仍产出 Mac DMG，用于内部流程测试；后续正式使用时再补证书发布。

需要区分两种签名：

- Tauri updater 签名：验证更新包来自本项目，保护更新链路。
- Apple Developer ID 签名和公证：让 macOS Gatekeeper 正常放行，避免用户手动执行 `xattr -dr com.apple.quarantine`。

Tauri updater 签名不能替代 Apple Developer ID 签名和公证。

## 验证记录

本轮关键验证包括：

```bash
npm run build
cargo check
npm run build:release
npm run check:release
```

发布流程中 GitHub Actions 也完成：

- WordPress plugin zip job 成功。
- macOS desktop job 成功。
- Windows desktop job 成功。
- GitHub Release job 成功。

本地网络验证时，终端没有走系统代理，直接 `curl` GitHub Release 下载地址会超时。设置 `HTTP_PROXY` 和 `HTTPS_PROXY` 为系统代理后，`latest.json`、Mac updater 包和 Mac DMG 均返回 `200`。

## 后续注意事项

- 每次发布桌面更新前，要确认 `latest.json` 和 `latest-desktop.json` 中的版本号、平台和下载 URL。
- 不要复用相同桌面版本号发布不同内容的包；否则会复现“同为 0.1.2 但内容不同”的排障成本。
- 私有仓库不适合作为桌面自动更新源。
- 正式外部分发 Mac 包前，必须补 Apple Developer ID 签名和公证。
- 后续若要验证更新链路，应先确认本机安装的是上一版正式 Release 包，而不是本地构建包。
