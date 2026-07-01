# 技术验证记录

日期：2026-06-21

## 包信息

- 文件：`sj/npcink-device-inventory.zip`
- 原始生成文件：`release/npcink-device-inventory.zip`
- SHA-256：`f94739d08938e1f1ee89dad0aaa36c25b652cc4a0b2493bdc8cfcae77bf527c8`
- zip 根目录：`npcink-device-inventory/`
- zip 条目数：212
- 未压缩大小：3313053 bytes
- 压缩大小：1015772 bytes

## 构建检查

通过：

```bash
npm run build --prefix vite-admin
npm run build --prefix vite-search
```

## PHP 检查

通过：

```bash
composer phpcs
composer phpstan
```

## 打包

通过：

```bash
npm run build:release
cp release/npcink-device-inventory.zip sj/npcink-device-inventory.zip
npm run check:release
```

输出：

```text
/Users/muze/gitee/npcink-device-inventory/release/npcink-device-inventory.zip
```

## Plugin Check / PCP

通过：

```bash
wp --path='/Users/muze/Local Sites/npcink-device-inventory/app/public' plugin check /Users/muze/gitee/npcink-device-inventory/release/npcink-device-inventory --format=json
```

结果：

```text
0 ERROR
0 WARNING
```

## i18n 与截图

已完成：

- 后台菜单标题、加载文案、插件列表 Settings 链接使用 gettext 字符串。
- 后台 React 顶层标签通过 `npcinkDeviceInventoryData.labels` 覆盖英文和简体中文。
- 公共查询页自动创建标题和 fallback 文案使用 gettext 字符串。
- `languages/npcink-device-inventory.pot` 已重新生成。
- `README.txt` 已增加 `== Screenshots ==` 区块。
- `sj/assets/screenshot-1.png` 到 `sj/assets/screenshot-5.png` 已生成并记录到 `sj/assets/assets-manifest.json`。

## 本地冒烟

通过：

```bash
wp --path='/Users/muze/Local Sites/npcink-device-inventory/app/public' plugin deactivate npcink-device-inventory
wp --path='/Users/muze/Local Sites/npcink-device-inventory/app/public' plugin activate npcink-device-inventory
```

REST 未签名请求检查：

```text
GET /wp-json/npcink-device-inventory/v1/query?data=test -> 403
POST /wp-json/npcink-device-inventory/v1/device-post-data-v2 -> 403
```

## 包内容扫描

确认未发现：

- `README.md`
- `README.en.md`
- image assets with common raster/vector extensions
- `.map`
- `node_modules`
- `ele-rs`
- `.env`
- `.DS_Store`
- removed platform/payment image filenames
- old version string `2601083`
- brand-specific demo text previously identified
- hardcoded `localhost:10048`
- unreachable GitHub source URL in `README.txt`

## 最终判断

`sj/npcink-device-inventory.zip` 是当前准备提交到 WordPress.org 插件目录的候选包。
