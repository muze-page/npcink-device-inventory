# Plugin Check DB Cache And Escaping Follow-up

日期：2026-07-03

本文记录 `v2.7.1` 发布后保留的非阻断 Plugin Check 改进项。它不是发布阻断问题；`v2.7.1` 已完成 SVN 与 GitHub Release 发布。后续处理时应保持范围收敛，只修复自定义表查询的缓存与动态 SQL 片段说明问题，不引入新的业务功能。

## 处理状态

2026-07-03 已做代码级处理：

- `includes/v3/repositories/class-npcink-device-inventory-observation-repository.php` 的 observation 读取路径已加入短 TTL 对象缓存。
- `create()` 写入成功后会递增 observation list cache version，避免列表缓存继续使用旧结果。
- `list_all()` 已从动态 `$where_sql` 改为静态查询分支，用户输入仍只进入 prepared 参数。
- 自定义表 direct query 与动态 WHERE 的 PHPCS 注释已缩小到必要查询块。
- `includes/v3/repositories/class-npcink-device-inventory-event-repository.php` 的事件列表读取已加入短 TTL 对象缓存，`list_all()` 已改为静态 SQL 条件，避免动态 `$where_sql`。
- `includes/v3/repositories/class-npcink-device-inventory-identity-repository.php` 的 identity 匹配与资产 identity 列表已加入短 TTL 对象缓存，写入后递增缓存版本。
- `includes/v3/repositories/class-npcink-device-inventory-asset-repository.php` 的资产详情与资产列表读取已加入短 TTL 对象缓存，create/update 后递增缓存版本。
- `includes/v3/repositories/class-npcink-device-inventory-asset-repository.php` 的资产列表筛选已从动态 `$where_sql` 改为固定 SQL 条件模板，避免动态 SQL 片段与 placeholder 数量误报。
- 剩余自定义表 direct query 提示已按查询块补充 scoped PHPCS 说明；读取路径有对象缓存，写入路径会递增对应 repository 的 cache version。

已通过：

```bash
php -l includes/v3/repositories/class-npcink-device-inventory-observation-repository.php
php -l includes/v3/repositories/class-npcink-device-inventory-event-repository.php
php -l includes/v3/repositories/class-npcink-device-inventory-identity-repository.php
php -l includes/v3/repositories/class-npcink-device-inventory-asset-repository.php
composer phpcs
composer phpstan
npm run build:release
npm run check:release
```

GitHub Actions 复核：

```text
preview.yml / package=plugin
run: 28665658777
status: success
head: f0f1f39d27c27162d7087f89d81e7cf6c2a4dc44
```

复核结论：

- `28664546344` 是上一轮复核，用于定位剩余项：asset repository 的动态 `$where_sql` / placeholder warning 以及自定义表 direct query 提示。
- `28665658777` 已完成本轮 official preview 复核，`plugin-check-results.txt` 输出 `Success: Checks complete. No errors found.`。
- 插件代码层面的 Plugin Check warnings 已清零。
- GitHub annotations 仅剩 `.github` 的 Node.js 20 action deprecation warning，来源是 `actions/checkout@v4`、`actions/setup-node@v4`、`actions/upload-artifact@v4` 被 GitHub runner 强制跑在 Node.js 24 上，不是插件代码问题。

如果后续 GitHub Actions 继续显示 warning，应优先确认是否仍为 `.github` action runtime deprecation；不要把该 CI 平台提示误判为 Plugin Check 代码 warning。

## 触发来源

GitHub Release 工作流 `v2.7.1 Build release packages` 中，`WordPress plugin zip` job 通过，但 Plugin Check 对以下文件给出 warning：

```text
includes/v3/repositories/class-npcink-device-inventory-observation-repository.php
```

主要提示：

- `list_all()` 中 `$where_sql` 被拼接进 prepared SQL，检测器标记为未转义动态 SQL 片段。
- `find_by_id()`、`list_for_asset()`、`list_all()` 中的自定义表读取被标记为 direct database call without caching。
- 这些 warning 来自自定义库存表查询路径，不是 WordPress 核心表误用，也不是未授权访问问题。

## 当前判断

这是发布后的代码质量改进项，不影响当前版本安装和使用：

- 表名通过插件内部表名方法取得，并使用 `%i` 占位符。
- 用户输入值已通过 `sanitize_key()`、`sanitize_text_field()`、`$wpdb->esc_like()` 和 `$wpdb->prepare()` 处理。
- `$where_sql` 的来源是内部固定片段数组，不直接接收用户输入。
- Plugin Check 对动态 SQL 片段无法证明其来源安全，因此仍会提示。

需要改进的重点不是扩大功能，而是让 SQL 片段构造更显式、缓存策略更清楚，并减少后续审核解释成本。

## 建议范围

优先处理 observation repository：

```text
includes/v3/repositories/class-npcink-device-inventory-observation-repository.php
```

可以在同一批次评估 event repository 是否存在同构写法：

```text
includes/v3/repositories/class-npcink-device-inventory-event-repository.php
```

如果 event repository 的模式一致，建议用同一套 helper 收口；如果差异较大，则先只处理 observation repository，避免扩大改动面。

## 建议实现

### 1. 收口动态 WHERE 构造

将 `list_all()` 中的动态筛选构造抽成私有 helper，返回结构化结果：

```text
array(
  'sql' => 'WHERE ...',
  'params' => array(...),
)
```

要求：

- SQL 片段只能来自方法内部固定模板。
- 参数数组只放值，不混放 SQL 关键字。
- `source` 使用 `sanitize_key()`。
- `search` 使用 `sanitize_text_field()` + `$wpdb->esc_like()`。
- 在 helper 上方保留简短注释，说明 SQL 片段是 allow-listed internal fragments。

### 2. 为读取路径增加对象缓存

为只读查询增加 `wp_cache_get()` / `wp_cache_set()`：

- cache group：`npcink_device_inventory_observations`
- `find_by_id()` key：`observation:{id}`
- `list_for_asset()` key：包含 `asset_id`、`page`、`page_size`
- `list_all()` key：包含 sanitized args、`page`、`pageSize`

缓存时间建议短 TTL，例如 `MINUTE_IN_SECONDS`，避免后台列表频繁查询，同时降低实时性风险。

### 3. 写入后清理相关缓存

`create()` 插入 observation 后，需要清理或递增缓存版本：

- 简单做法：使用一个 cache version key，如 `observations:list_version`。
- list 类 cache key 包含 version。
- `create()` 成功后递增 version，避免旧列表继续展示。
- `find_by_id()` 可以直接 set 新记录缓存，或依赖首次读取回填。

不要在每次写入后全站 `wp_cache_flush()`。

### 4. PHPCS / Plugin Check 注释要精确

如果 Plugin Check 仍对插件自有表 direct query 报 warning，可以使用最小范围注释：

```php
// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery -- Plugin-owned inventory table query with prepared values and object-cache wrapper.
```

要求：

- 注释贴近必要代码，不要整文件禁用。
- 不要掩盖真正未 prepare 的用户输入。
- 如果缓存已覆盖查询，避免继续禁用 `NoCaching`。

## 验收标准

完成该项时至少执行：

```bash
composer phpcs
composer phpstan
npm run build:release
npm run check:release
```

如果有可用 WordPress 环境，再执行：

```bash
wp plugin check /path/to/release/npcink-device-inventory --format=json
```

通过标准：

- observation 列表、资产详情自动记录分页和搜索行为不变。
- `composer phpcs` 和 `composer phpstan` 通过。
- 发布包检查通过。
- Plugin Check 中 observation repository 的 `$where_sql` warning 消失，或只剩下有明确 scoped 注释说明的自定义表 direct query warning。

## 非目标

- 不重构整个 v3 repository 层。
- 不改变 REST 响应格式。
- 不改变自定义表结构。
- 不增加后台 UI 功能。
- 不把短 TTL 缓存扩展成复杂持久缓存依赖。
