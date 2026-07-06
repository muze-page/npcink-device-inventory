# Admin Latest Sorting And macOS Uploader History

日期：2026-07-06

本文归纳本轮围绕后台资产列表、详情弹窗、上传软件 macOS 安装包和上传成功弹窗的连续优化。它承接 `docs/device-inventory-product-and-release-history-2026-07-04.md` 和 `docs/backup-restore-and-release-packaging-history-2026-07-06.md`，用于后续接手时快速理解为什么当前排序、首屏加载、平台视觉和 Mac 分发策略这样设计。

## 总体结论

本轮主线是把“设备最新上传/采集”变成后台默认工作口径，同时解决线上首屏和弹窗加载体验、搜索命中识别、macOS 设备视觉和上传软件隐私展示问题。

当前结论：

- 电脑资产默认按最新采集或最新上传靠前，而不是按旧导入顺序。
- 后台卡片、表格、详情和导出都展示“更新时间”，该时间来自上传软件采集时间，不支持后台手工填写。
- 资产详情弹窗打开时优先使用当前列表已有数据，避免线上打开弹窗先转圈。
- 资产列表使用本地缓存和后端首屏注入，刷新页面时减少空白等待。
- 搜索编号或姓名时，卡片和表格会高亮命中内容。
- macOS 设备在列表和详情中显示 Apple 图标，并使用黑色主视觉；Windows 设备继续使用蓝色和 Windows 图标。
- 上传软件 Mac 安装包已补齐 Tauri 图标配置，但正常分发仍需要 Apple Developer ID 签名和 Apple 公证。
- 上传软件“上传成功”弹窗不再展示使用人和部门，只保留编号和设备。

## 最新采集排序

用户反馈更新了 174 号设备后，列表排名没有靠前。根因是列表默认排序没有以最新采集快照为主，导致“上传软件刚采集”与“资产台账更新时间”在展示顺序上不一致。

本轮确定的排序口径：

- 默认排序字段为 `latestObserved`。
- 后端按 `latest_observed_at`、`updated_at`、`created_at` 的优先级排序。
- 174 号设备上传后，应排在默认电脑资产列表靠前位置。
- 前端默认 `sortBy` 与后端查询默认值保持一致。

为避免每次列表查询都通过子查询找最新快照，资产表新增最新快照冗余列：

- `latest_observation_id`
- `latest_observed_at`

新增快照写入后，后端会同步更新资产表中的最新快照字段。历史数据通过 schema revision 升级时回填。

## 更新时间展示

用户希望除购置日期外，能在适当位置展示更新时间；该时间不支持后台修改和填写，按上传软件时间来。

当前展示口径：

- 优先使用 `asset.latestObservation.observedAt`。
- 没有采集快照时回退到 `asset.updatedAt`。
- 卡片、表格、详情和导出都使用同一展示逻辑。
- 后台不提供更新时间输入框，避免管理员误以为可以手工维护。

这使“最新上传的软件时间”和后台看到的排序/展示保持一致。

## 首屏加载与弹窗加载

线上打开详情弹窗和刷新页面时会出现转圈，本地预览较流畅。原因主要是线上 REST 请求延迟更明显，而弹窗和首屏都依赖异步请求完成后再展示内容。

本轮已落实三层优化：

- 详情弹窗使用当前列表已持有的资产作为 `initialData`，打开时先显示已有详情，再后台刷新。
- 资产列表使用 `localStorage` 缓存默认查询结果，缓存有效期为 10 分钟。
- 后端在后台页面加载时注入默认首屏资产数据，前端默认参数匹配时直接使用注入数据。

后端首屏注入的默认参数：

```json
{
  "page": 1,
  "pageSize": 10,
  "search": "",
  "assetScope": "computer",
  "sortBy": "latestObserved"
}
```

实现边界：

- 首屏注入只服务默认电脑资产页。
- 用户筛选、搜索、分页和切换范围后仍通过 REST 请求获取最新结果。
- 加载状态改为只有在没有可展示资产时才显示整块 loading，避免已有数据被转圈遮住。

## 搜索高亮

用户主要通过编号或姓名查询，希望查到相关资料时突出显示命中内容。

当前规则：

- 关键词长度大于等于 2 时，命中的编号、名称、使用人、部门等字段会高亮。
- 单字符搜索只对资产编号精确匹配做高亮，避免列表中大量无意义命中。
- 卡片视图和表格视图共用高亮逻辑。
- 高亮使用黄色 `mark` 样式，不改变原字段内容。

这个规则保留了快速查编号的效率，同时避免单字姓名或单数字搜索造成视觉噪音。

## macOS 设备视觉

用户上传 Apple 电脑后，详情顶部仍显示 Windows 四格图标。根因是前端平台图标原来是写死的四个 `span`，不是根据上传数据判断。

当前平台视觉规则：

- `macOS`、`darwin`、`MacBook`、`iMac`、`Mac mini`、`Mac Studio`、`Apple M 系列` 识别为 macOS。
- macOS 设备显示 Apple 图标，平台文案规范为 `macOS`。
- macOS 详情顶部使用黑色渐变主背景。
- Windows 设备显示 Windows 图标，并保留蓝色主视觉。
- 未识别设备使用通用设备图标和灰色视觉。

列表卡片和详情弹窗都使用同一平台判断逻辑，避免列表和弹窗展示不一致。

## Mac 安装包问题

用户从 GitHub Release `v2.7.3` 下载 Mac DMG 后，出现图标缺失和“已损坏，无法打开”。

排查结果：

- Release 中的 `Npcink.Device.Agent_0.1.2_aarch64.dmg` SHA256 与 GitHub 记录一致。
- `hdiutil verify` 通过，说明 DMG 本身没有下载损坏。
- 旧 `.app` 内没有 `Contents/Resources/icon.icns`。
- 旧 `Info.plist` 没有 `CFBundleIconFile`。
- `.app` 是 arm64，只面向 M 系列 Mac。
- 旧包没有 Developer ID 正式签名，也没有 Apple notarization。
- `codesign` 和 `spctl` 校验失败，因此浏览器下载后被 Gatekeeper 拦截。

本轮已落实：

- `ele-rs/src-tauri/tauri.conf.json` 补充 `bundle.icon`。
- 新构建 `.app` 已包含 `Contents/Resources/icon.icns`。
- 新构建 `Info.plist` 已包含 `CFBundleIconFile = icon.icns`。
- 新构建 `aarch64.dmg` 通过 `hdiutil verify`。

尚未落实：

- Apple Developer ID 签名。
- Apple notarization。
- `stapler` 绑定公证票据。

正式让用户下载后正常打开，不能依赖 `xattr -dr com.apple.quarantine`。浏览器下载的软件仍会带 quarantine，正确做法是让 Gatekeeper 能验证签名和公证。

正式分发建议：

- 使用付费 Apple Developer Program。
- 生成 `Developer ID Application` 证书。
- 在 GitHub Actions 中导入证书、签名、提交 Apple 公证并 staple。
- 只构建 M 系列包时继续使用 `aarch64-apple-darwin`。

不建议使用第三方共享证书。免费 Apple 账号无法完成 Developer ID 公证；第三方证书会导致签名主体不一致、证书吊销风险、后续发版依赖第三方和信任边界混乱。

## 上传成功弹窗隐私收敛

用户希望上传软件弹窗中不要展示使用人信息，只显示编号和设备。

当前弹窗文案：

```text
上传成功
已关联到现有资产

编号：...
设备：...
```

已移除：

- 使用人。
- 部门。

这样做的原因：

- 上传结果弹窗只是确认上传到了哪台设备。
- 编号和设备型号足以确认关联关系。
- 使用人和部门属于后台管理信息，不适合在普通用户端弹窗和截图里暴露。
- 上传软件仍然可以接收后端资产信息，但弹窗路径不再解析和展示使用人、部门。

## 线上部署与备份

本轮后台 UI 和首屏加载相关改动已部署到线上站点 `https://www.mqzj.top/`。

线上变更前已做备份：

- 首屏数据和 schema 优化部署备份：`/root/npcink-device-inventory-backups/20260706143758/`
- 平台视觉前端资源部署备份：`/root/npcink-device-inventory-backups/20260706151028/`

部署中发现 MySQL `ON UPDATE` 会在 backfill 时误刷新 `updated_at`。已通过在回填和快照更新 SQL 中显式设置 `updated_at = updated_at` 规避，并从备份 JSON 恢复线上资产原 `updated_at`。

线上验证过：

- schema revision 为 `20260706_latest_observed`。
- 最新快照字段和索引存在。
- 174 号设备最新采集时间保持为 `2026-07-06 05:47:13`。
- 默认首屏资产第一条为 174。
- 后端注入的默认首屏参数与前端默认查询参数一致。

## 本地验证

本轮已执行过的关键验证：

```bash
php -l admin/partials/npcink-device-inventory-admin-menu.php
php -l includes/class-npcink-device-inventory-activator.php
php -l includes/class-npcink-device-inventory.php
php -l includes/v3/repositories/class-npcink-device-inventory-asset-repository.php
php -l includes/v3/repositories/class-npcink-device-inventory-observation-repository.php
php -l includes/v3/rest/class-npcink-device-inventory-assets-controller.php
cd vite-admin && npm run build
npm run check:backup-restore
cd ele-rs && npm run build
cd ele-rs && npm run tauri:build
hdiutil verify "ele-rs/src-tauri/target/release/bundle/dmg/Npcink Device Agent_0.1.2_aarch64.dmg"
```

## 接手提醒

后续如果继续发布新版本，建议先处理 macOS 签名和公证，否则即使图标已修复，用户下载 Mac DMG 仍可能看到“已损坏，无法打开”。

`v2.7.4` 的 GitHub Release 会产出 WordPress 插件 zip、Windows 安装包和 Mac DMG。Mac DMG 仅供内部测试，当前未签名、未公证；后续正式面向普通 Mac 用户分发前，需要补 Apple Developer ID 签名和 notarization。

后续如果继续优化后台性能，不要把所有 REST 请求都改成首屏注入。当前只对默认资产列表做注入是合理边界；筛选、分页、搜索仍应保持 REST 查询，避免页面初始 HTML 变重。

后续如果继续调整上传成功弹窗，应保持“普通用户端少展示管理字段”的边界。资产使用人、部门、状态、匹配细节属于后台管理界面，不应回流到上传软件成功弹窗中。
