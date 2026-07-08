# WordPress.org Update Index Repair - 2026-07-08

## Summary

2026-07-08 复查线上站点时发现：WordPress.org 插件页和插件详情 API 已显示 `Npcink Device Inventory` 最新版本为 `2.7.8`，但线上站点仍停留在 `2.7.3`，插件列表没有自动更新提示。

问题不在站点是否开启自动更新，而在 WordPress.org 更新检查链路。当时 `plugin_information` API 和下载页已经指向 `2.7.8`，但 `update-check` API 对已安装 `2.7.3` 的站点仍返回 `no_update`，并且 `new_version` 停在 `2.7.2`。

## Impact

- 已安装 `2.7.3` 到 `2.7.7` 的站点不会收到 `2.7.8` 自动更新提示。
- 后台插件页即使显示“启用自动更新”，也不会执行更新，因为 WordPress Core 的更新队列依赖 `update-check` API。
- 手动安装 `https://downloads.wordpress.org/plugin/npcink-device-inventory.2.7.8.zip` 可以绕过这个问题。

## Evidence Before Repair

插件详情 API 已经正确：

```text
version=2.7.8
download=https://downloads.wordpress.org/plugin/npcink-device-inventory.2.7.8.zip
last_updated=2026-07-07 3:45am GMT
```

但更新检查接口仍然错误：

```text
installed 2.7.3 -> no_update
new_version=2.7.2
package=https://downloads.wordpress.org/plugin/npcink-device-inventory.2.7.2.zip
```

WordPress.org SVN tags 也不完整：

```text
2.6.1083
2.7.1
2.7.2
2.7.8
```

缺失：

```text
2.7.3
2.7.4
2.7.5
2.7.6
2.7.7
```

## Root Cause

发布流程曾经只把 `2.7.8` 推到了 WordPress.org SVN，历史 Git release tag `v2.7.3` 到 `v2.7.7` 没有对应的 WordPress.org SVN `tags/<version>/`。

这导致 WordPress.org 目录页能从当前 stable metadata 看到 `2.7.8`，但更新检查索引仍保留旧的 `2.7.2` 结果。结论是：不能只看插件公开页或 `plugin_information` API，必须单独验证 `update-check` API。

## Repair Actions

### 1. 补齐缺失 SVN tags

从 Git tag 导出 `v2.7.3` 到 `v2.7.7`，逐个构建对应版本的 `vite-admin/dist`，然后写入 WordPress.org SVN：

```text
/Users/muze/wporg-svn/npcink-device-inventory/tags/2.7.3
/Users/muze/wporg-svn/npcink-device-inventory/tags/2.7.4
/Users/muze/wporg-svn/npcink-device-inventory/tags/2.7.5
/Users/muze/wporg-svn/npcink-device-inventory/tags/2.7.6
/Users/muze/wporg-svn/npcink-device-inventory/tags/2.7.7
```

提交：

```text
r3599695 Add missing historical release tags 2.7.3-2.7.7
```

提交前校验：

```text
2.7.3: Version 2.7.3, Stable tag 2.7.3
2.7.4: Version 2.7.4, Stable tag 2.7.4
2.7.5: Version 2.7.5, Stable tag 2.7.5
2.7.6: Version 2.7.6, Stable tag 2.7.6
2.7.7: Version 2.7.7, Stable tag 2.7.7
```

同时确认没有提交：

```text
node_modules
.env
.DS_Store
__MACOSX
*.map
```

### 2. 刷新 `2.7.8` 发布元数据

补齐历史 tag 后，`plugin_information` 的版本列表刷新为完整版本，但 `update-check` 仍短暂停留在 `2.7.2`。为触发 WordPress.org 重新解析 stable metadata，对 SVN `trunk/README.txt` 和 `tags/2.7.8/README.txt` 做了一次小范围 changelog 元数据刷新。

提交：

```text
r3599700 Refresh 2.7.8 release metadata
```

## Final Verification

复查结果：

```text
plugin_information.version=2.7.8
plugin_information.download_link=https://downloads.wordpress.org/plugin/npcink-device-inventory.2.7.8.zip
plugin_information.versions=2.7.1,2.7.2,2.7.3,2.7.4,2.7.5,2.7.6,2.7.7,2.7.8
```

SVN tags 已完整：

```text
2.7.1
2.7.2
2.7.3
2.7.4
2.7.5
2.7.6
2.7.7
2.7.8
```

`update-check` 已恢复：

```text
installed 2.7.1 -> new_version 2.7.8
installed 2.7.2 -> new_version 2.7.8
installed 2.7.3 -> new_version 2.7.8
installed 2.7.7 -> new_version 2.7.8
```

下载包内容也正确：

```text
Plugin Name: Npcink Device Inventory
Version: 2.7.8
Stable tag: 2.7.8
```

公开插件页显示：

```text
Version 2.7.8
Download https://downloads.wordpress.org/plugin/npcink-device-inventory.2.7.8.zip
```

## Required Future Release Checks

每次 WordPress.org 发布后，不能只检查公开插件页。必须按下面顺序复查：

1. SVN tags 是否存在当前版本：

```bash
curl -fsSL 'https://plugins.svn.wordpress.org/npcink-device-inventory/tags/' | rg '2\\.7\\.'
```

2. 插件详情 API 是否显示当前 stable 版本：

```bash
curl -fsSL 'https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request%5Bslug%5D=npcink-device-inventory&request%5Bfields%5D%5Bversions%5D=1&request%5Bfields%5D%5Bsections%5D=0'
```

3. 更新检查 API 是否对上一版返回当前版本：

```bash
curl -fsSL 'https://api.wordpress.org/plugins/update-check/1.1/' \
  --data-urlencode 'plugins={"plugins":{"npcink-device-inventory/npcink-device-inventory.php":{"Name":"Npcink Device Inventory","PluginURI":"https://www.npc.ink/277900.html","Version":"2.7.7","Description":"","Author":"Npcink","AuthorURI":"https://www.npc.ink","TextDomain":"npcink-device-inventory","DomainPath":"/languages","Network":false,"RequiresWP":"6.5","RequiresPHP":"7.4"}},"active":["npcink-device-inventory/npcink-device-inventory.php"]}' \
  --data-urlencode 'all=true' \
  --data-urlencode 'locale=["zh_CN","en_US"]'
```

4. 下载包内版本头和 stable tag 是否一致：

```bash
curl -fsSL 'https://downloads.wordpress.org/plugin/npcink-device-inventory.2.7.8.zip' -o /tmp/npcink-device-inventory.zip
unzip -p /tmp/npcink-device-inventory.zip npcink-device-inventory/npcink-device-inventory.php | grep -E 'Plugin Name|Version:'
unzip -p /tmp/npcink-device-inventory.zip npcink-device-inventory/README.txt | grep -E '^Stable tag:'
```

如果 `plugin_information` 正确但 `update-check` 仍不推更新，优先检查：

- WordPress.org Release Confirmation 是否需要确认。
- 当前版本是否真的存在于 SVN `tags/<version>/`。
- `trunk/README.txt` 和 `tags/<version>/README.txt` 的 `Stable tag` 是否一致。
- 是否需要提交一次小范围 README metadata refresh 触发目录索引刷新。

## Operational Note For Affected Sites

如果站点本地还没有看到更新提示，先清理 WordPress 更新缓存：

```bash
wp transient delete update_plugins
wp plugin update npcink-device-inventory
```

或在后台进入“仪表盘 > 更新”点击“再次检查”。
