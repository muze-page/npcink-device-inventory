# Release And Dependency Upgrade Summary

日期：2026-07-04

本文归纳本轮 WordPress 插件端正式投入使用、打包发布、Plugin Check warning 清理、上传软件安装包命名、GitHub Actions 平台提示处理，以及最终依赖升级的历史结论。它用于后续接手时快速判断当前版本是否还能继续清理，或应进入发布/分发流程。

## 总体结论

本轮可以到此为止。

当前 `master` 已推送到 GitHub，发布预览 CI 全部通过，WordPress 插件包、Windows 安装包和 macOS DMG 均已产出并校验。项目自身的 Plugin Check warning、npm audit 漏洞、GitHub Actions Node.js 20 / macOS runner 平台提醒、以及可控的 npm `allow-scripts` warning 均已处理。

剩余 warning 来自上游 Plugin Check action 内部依赖和 `wp-env` 默认提示，不在本项目代码或依赖树内，不建议作为当前发布阻断项继续追。

## 已确认的产品与发布口径

- WordPress 插件目录和上传包保持英文名称：`npcink-device-inventory`。
- 桌面上传软件安装包保持英文名称，避免中文安装路径和安装器兼容性风险。
- Windows 安装包名称：`Npcink Device Agent_0.1.0_x64-setup.exe`。
- macOS 安装包名称：`Npcink Device Agent_0.1.0_aarch64.dmg`。
- GitHub 是当前主要代码与 CI 发布入口；SVN 发布只面向 WordPress.org 插件目录流程。

## 正式投入使用前的验证

正式投入使用前要求在数据库可用的干净 WordPress 环境完成三项验证：

- 插件启用。
- 后台页面冒烟。
- REST 权限校验。

这三项已按发布前检查落实。后续如果更换 WordPress 主版本、PHP 主版本、权限模型或 REST route，需要重新执行同样的三项检查。

## Plugin Check 与 WordPress.org 审核清理

本轮已经完成插件代码层面的 Plugin Check warning 清理：

- 自定义表查询增加短 TTL 对象缓存。
- 写入路径递增缓存版本，避免列表缓存继续使用旧结果。
- 动态 SQL 条件改成固定 SQL 条件模板或静态查询分支。
- 用户输入继续只进入 prepared 参数。
- PHPCS 注释缩小到必要查询块，不做整文件屏蔽。

最终 Plugin Check 结果：

```text
Success: Checks complete. No errors found.
```

当前剩余 CI warning 不是插件代码 warning，而是上游 action 内部日志：

- `npm warn deprecated glob@10.5.0`
- `npm warn allow-scripts fs-ext-extra-prebuilt@2.2.7`
- `wp-env starts both development and tests environments by default`

这些来自 Plugin Check action 内部安装过程。除非后续替换或 fork 上游 action，否则不应继续在本项目内修。

## GitHub Actions 平台提示处理

用户反馈过 GitHub Actions 平台提示：

- Node.js 20 deprecation。
- macOS runner 迁移提醒。

本轮已升级 release/preview 工作流相关 action：

- checkout/setup-node/upload-artifact 使用新版 action。
- macOS runner 改为明确 runner，避免 `macos-latest` 迁移提示。

最终 preview CI 日志中未再出现 `Node.js 20` 或 `macos-latest` 平台提醒。

## 依赖升级

### `vite-admin/`

后台前端已升级构建与 lint 工具链：

- Vite 升级到 8.x。
- React Vite 插件升级到 6.x。
- ESLint 升级到 flat config。
- `typescript-eslint` 统一到 flat config 推荐接入方式。
- 移除旧 `@typescript-eslint/parser` / `@typescript-eslint/eslint-plugin` 配置入口。
- 移除未使用的 `less-loader`。
- 移除 Vite 8 已弃用的 `build.minify: "esbuild"` 配置写法。
- 将生产环境 `console.error` 收到 `import.meta.env.DEV` 分支内。
- 为已审查的安装脚本补充 `allowScripts`：

```json
"allowScripts": {
  "esbuild@0.28.1": true
}
```

### `ele-rs/`

桌面端已升级构建工具链：

- `@tauri-apps/cli` 升级到 `2.11.4`。
- Vite 升级到 8.x。
- `build.minify` 改为布尔值，避免 Vite 8 对字符串 `"esbuild"` 的弃用提示。
- 为 macOS optional dependency 的已审查安装脚本补充 `allowScripts`：

```json
"allowScripts": {
  "fsevents@2.3.3": true
}
```

项目自身 `allow-scripts` warning 已清理完成；后续如果 npm 11 又提示新的项目内安装脚本，必须先确认包来源和用途，再加入 `allowScripts`。

## 本地验证

本轮依赖升级和发布包检查已通过：

```bash
cd vite-admin
npm run lint
npm run build
npm audit --json

cd ../ele-rs
npm run build
npm audit --json

cd ..
npm run build:release
npm run check:release
```

验证结论：

- `vite-admin` lint/build 通过。
- `vite-admin` audit 为 0 vulnerabilities。
- `ele-rs` build 通过。
- `ele-rs` audit 为 0 vulnerabilities。
- release package readiness 通过。
- 本地 `release/npcink-device-inventory.zip` 与 `sj/npcink-device-inventory.zip` 哈希一致。

本地最终 release zip SHA256：

```text
538a47f2893cf56cd515ac4d96d0a6e2f90003c237e65a1832de7f6f84acf284
```

## GitHub Actions 验证

最终完整 preview CI：

```text
workflow: Build preview packages
run: 28692596058
url: https://github.com/muze-page/npcink-device-inventory/actions/runs/28692596058
head: 826251bbdd716191068caf76df9af94e8c67d537
status: success
```

三个 job 均成功：

- WordPress plugin zip：成功，用时 3m28s。
- Desktop agent macOS：成功，用时 4m21s。
- Desktop agent Windows：成功，用时 17m54s。

最终 artifacts SHA256：

```text
6e8b07f3838159630322f47218a18f285a57c12bfbae4fda12d026a165486c05  npcink-device-inventory.zip
15b64ed45db70fb4597fa208f6dfb55229555b117b4731b0c509a4960df62923  Npcink Device Agent_0.1.0_x64-setup.exe
5bb0b828116056e911a2767ce29355a3a485bbbc5100e018d73815de7808b64e  Npcink Device Agent_0.1.0_aarch64.dmg
```

## 相关提交

本轮关键提交：

```text
826251b Approve reviewed npm install scripts
a6db4b7 Upgrade desktop build tooling dependencies
c1f1e8c Upgrade frontend build tooling dependencies
c9d3b77 Update release workflow tooling
2c5f14e Prepare release 2.7.2
2120223 Address Plugin Check repository warnings
```

## 后续边界

当前不建议继续扩大技术清理范围。下一步应进入正式发布/分发流程，或只处理真实安装、上传、后台使用中暴露的问题。

如果后续再次看到 warning，应先分类：

- 插件代码或项目依赖 warning：按本项目代码处理。
- GitHub Actions 平台 runtime warning：优先升级 workflow action 或 runner。
- Plugin Check action 内部依赖 warning：记录为上游 action 问题，不作为项目发布阻断。

## 非目标

- 不 fork Plugin Check action 来清理其内部依赖 warning。
- 不为了清理上游 `wp-env` 默认提示而扩大本项目 CI 结构。
- 不继续改动安装包产品名；安装包和安装路径继续保持英文。
- 不在当前发布前继续引入新功能。
