# Backup Restore And Release Packaging History

日期：2026-07-06

本文归纳 `v2.7.3` 发布之后，本地新增的 JSON 备份恢复工作流和发布打包流程调整。它承接 `docs/device-inventory-product-and-release-history-2026-07-04.md`，用于后续接手时快速理解当前后台数据迁移、备份恢复和发布包产出的边界。

## 总体结论

本轮主线是把“正式站点迁移数据”从人工导入动作收敛成插件后台可审计的 JSON 备份恢复流程，同时把 release zip 和 WordPress.org submission zip 的产出边界分开。

当前结论：

- JSON 备份恢复已经成为管理员工具中的正式迁移入口。
- 恢复流程采用先预览、再确认导入的方式。
- 导入策略是合并和更新，不会清空目标站点已有数据。
- 冲突会阻断正式导入，警告会展示给管理员判断。
- 上传授权码、公开查询访问码明文、公开查询启用状态、客户端上传基础 URL 不会从备份恢复，正式站点需要重新配置。
- 默认发布打包只产出 `release/npcink-device-inventory.zip`。
- WordPress.org 提交包 `sj/npcink-device-inventory.zip` 改为显式执行 submission 命令才产出。

## 本轮提交范围

本轮归档覆盖当前 `origin/master..HEAD` 的三个本地提交：

```text
b95f7eb Add JSON backup restore workflow
9907973 Default release packaging to release zip only
aca646c Harden backup restore and release packaging
```

这些提交共同完成：

- 后端新增 JSON 备份恢复 REST 控制器。
- 后台“数据工具”新增 JSON 备份导入交互。
- README 和插件 FAQ 补充恢复契约说明。
- 发布脚本默认只构建 release zip。
- submission zip 改为显式构建和检查。

## JSON 备份恢复契约

REST 入口：

```text
POST /wp-json/npcink-device-inventory/v1/backup-restore
```

基础约束：

- 权限要求：`manage_options`。
- 请求体需要提供 `backup` JSON 对象。
- 可选参数：`dryRun`。
- 备份 schema：`npcink-device-inventory/v3-admin-export`。
- 单次备份大小上限：`50 MB`。
- 单个 section 行数上限：`10000`。
- 支持 section：`settings`、`assets`、`identities`、`events`、`observations`。

返回摘要包含：

- `available`：备份中可用数量。
- `planned`：预览阶段计划处理数量。
- `imported`：正式导入数量。
- `skipped`：跳过数量。
- `conflicts`：阻断导入的问题。
- `warnings`：非阻断但需要管理员知晓的问题。

后台导入流程必须先走 dry run。预览没有冲突后，管理员勾选确认项，才允许执行正式导入。

## 合并与匹配策略

资产匹配规则：

- 资产必须有 `assetNumber`，缺失则跳过。
- 优先按 UUID 或资产编号匹配已有资产。
- UUID 和资产编号分别命中不同资产时视为冲突。
- 备份内重复 UUID 或重复资产编号会被识别并阻断或跳过。
- 缺失 UUID 的资产可在正式导入时生成新 UUID，预览阶段给出警告。

身份匹配规则：

- 设备身份以 `identity_type + identity_value` 去重。
- 备份内重复身份会跳过并产生警告。
- 如果同一个身份已经属于另一台资产，视为冲突。
- 这可以避免多次上传或迁移时把硬件身份错误绑定到不同资产。

采集快照与事件规则：

- `observations` 必须有有效 `observedAt`。
- `events` 必须有有效 `createdAt`。
- 缺失或无效时间不会用当前时间兜底，而是跳过并提示。
- 快照按资产、来源、schema 版本和采集时间去重。
- 事件按资产、来源、类型、消息和创建时间去重。

这个策略的重点是让迁移结果可解释，避免把脏数据静默写入正式站点。

## 设置与敏感配置

允许从备份恢复的设置：

- `publicQueryPageSlug`
- `observationRetentionDays`
- `assetNumberPrefix`
- `depreciationPeriodMonths`
- `defaultResidualRate`
- `countAvailableAssetsOnly`
- `deleteDataOnUninstall`

明确不恢复的设置：

- 上传授权码。
- 公开查询访问码明文。
- 公开查询启用状态。
- 客户端上传基础 URL。

原因是这些字段属于站点环境和安全边界，不应该因为从测试站或旧站导入备份而自动覆盖正式站配置。

## 安全与回滚

正式导入时，插件自有表写入会包在数据库事务中。

安全策略：

- 预览发现冲突时返回 `409`，不执行正式写入。
- 正式导入失败时回滚表写入。
- 如果本次已经导入设置，失败时恢复导入前的原设置。
- 导入成功后递增资产、身份、快照、事件相关缓存版本。
- 导入不会删除目标站点已有资产，也不会清空正式库。

这意味着 JSON 恢复更适合用于“测试站整理后导入正式站”或“同版本插件迁移归档”，不适合被误用成全量覆盖工具。

## 后台交互

后台“数据工具”现在提供 JSON 备份导入能力。

交互原则：

- 管理员可以选择文件或粘贴 JSON。
- 先点击预览，查看计划处理数量、冲突和警告。
- 有冲突时禁止正式导入。
- 没有冲突时，需要勾选确认项后才能导入。
- 导入成功后刷新数据，让后台列表和统计重新读取最新状态。

确认文案强调：管理员已经保留当前站点备份，并确认按预览计划合并或更新正式站点数据。

## 发布打包流程

打包命令已经拆分为日常 release 和 WordPress.org submission 两条路径。

默认 release：

```bash
npm run build:release
npm run check:release
```

结果：

- 生成 `release/npcink-device-inventory.zip`。
- 默认不保留或生成 `sj/npcink-device-inventory.zip`。

显式 submission：

```bash
npm run build:submission
npm run check:submission
```

结果：

- 生成 `release/npcink-device-inventory.zip`。
- 同步生成 `sj/npcink-device-inventory.zip`。
- 检查 release zip 和 submission zip 的哈希一致性。

这样做的收益：

- 避免日常构建留下陈旧的 `sj/` 提交包。
- 发布给用户和提交 WordPress.org 的动作边界更清楚。
- `check:release` 不再因为没有 submission zip 而误报失败。
- 真正要走 WordPress.org 提交时，仍能显式生成并校验提交包。

## 后续验证建议

正式发布或迁移前建议执行：

```bash
composer phpstan
composer phpcs
npm run build:release
npm run check:release
npm run build:submission
npm run check:submission
```

如果本轮还包含后台 UI 变更，补充执行：

```bash
cd vite-admin
npm run lint
npm run build
```

真实站点迁移时建议按以下顺序执行：

1. 在当前正式站先导出备份。
2. 在目标站导入前先执行 dry run。
3. 检查冲突和警告，确认没有身份错绑和资产编号冲突。
4. 正式导入。
5. 重新配置上传授权码、公开查询访问码、公开查询启用状态和客户端上传基础 URL。
6. 用上传软件测试一台已存在设备，确认能返回插件端姓名和编号。

## 接手提醒

本轮不是把 JSON 备份恢复做成“覆盖式还原”。当前产品的正确理解是：

- 备份恢复服务于迁移和合并。
- 资产主数据仍以插件端管理员维护为准。
- 上传软件继续负责采集和查看，不负责编辑资产主数据。
- 发布包默认面向 GitHub release，WordPress.org submission 需要显式触发。
