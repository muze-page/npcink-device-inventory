# 发布阶段总结与下一阶段计划

日期：2026-06-21

本文档归纳 `Npcink Device Inventory` 当前 WordPress.org 发布准备工作的完成状态，并明确下一阶段重点。结论是：发布前资料准备已经完成，下一阶段应进入正式提交与审核跟进，不建议继续大改功能代码。

## 当前结论

当前阶段不是项目结束，而是首发提交前的准备阶段已经收口。

建议状态：

```text
发布包冻结 -> 提交 WordPress.org -> 等待审核 -> 按审核意见小范围修正 -> 审核通过后进入 SVN 发布
```

除非 WordPress.org Plugin Review Team 反馈问题，否则不建议继续做大功能、重构后台 UI 或调整接口协议。原因是每次改动都会导致 zip hash、截图、验证记录和审核资料重新变化，增加提交前的不确定性。

## 已完成事项

### 1. WordPress.org 插件包

已准备上传包：

```text
sj/npcink-device-inventory.zip
```

包信息：

- 插件 slug：`npcink-device-inventory`
- 插件版本：`2.7.0`
- zip 根目录：`npcink-device-inventory/`
- SHA-256：`f94739d08938e1f1ee89dad0aaa36c25b652cc4a0b2493bdc8cfcae77bf527c8`

主要处理：

- 完成 `README.txt` 的 WordPress.org 标准内容。
- 保持 Stable tag 与主插件版本一致。
- 包内包含前端构建产物、React/TypeScript 源码和构建配置。
- 包内排除 `node_modules`、`.env`、`.map`、`.DS_Store`、桌面端源码和提交资料目录。
- 包名已统一为 `npcink-device-inventory.zip`。

### 2. Plugin Check 与技术验证

已完成验证：

```bash
npm run build --prefix vite-admin
npm run build --prefix vite-search
composer phpcs
composer phpstan
npm run build:release
cp release/npcink-device-inventory.zip sj/npcink-device-inventory.zip
npm run check:release
wp --path='/Users/muze/Local Sites/npcink-device-inventory/app/public' plugin check /Users/muze/gitee/npcink-device-inventory/release/npcink-device-inventory
```

结果：

```text
Plugin Check / PCP: No errors found
phpcs: passed
phpstan: passed
vite-admin build: passed
vite-search build: passed
```

本地 REST 冒烟验证也已确认未签名公共查询和上传请求返回 `403`。

### 3. GPL、商标和素材风险处理

已处理不确定来源或商标风险较高的素材：

- 平台图片
- 支付图片
- OS/device 图片
- 未使用 SVG 图标
- 默认 Vite 图标

后台相关展示改为文本标签，降低 GPL 和商标审核风险。

### 4. 截图、Logo、Banner

WordPress.org 展示资产已准备在：

```text
sj/assets/
```

包含：

- `banner-772x250.png`
- `banner-1544x500.png`
- `icon-128x128.png`
- `icon-256x256.png`
- `screenshot-1.png`
- `screenshot-2.png`
- `screenshot-3.png`
- `screenshot-4.png`
- `screenshot-5.png`

这些图片不应放进插件 zip。审核通过并获得 SVN 仓库后，应提交到 SVN 顶层 `assets/` 目录。

### 5. 中英文资料与 i18n

语言策略已收敛为首发只维护英文和简体中文。

已完成：

- 英文插件目录文案：`sj/listing-copy.md`
- 简体中文插件目录文案：`sj/listing-copy-zh_CN.md`
- 中英文翻译资料：`sj/i18n/`
- 后台入口层 i18n 覆盖
- React 后台顶层标签中英覆盖
- 公共查询页创建标题和 fallback 文案 gettext 覆盖
- `languages/npcink-device-inventory.pot` 已重新生成

当前不建议一次性做八国语言。首发阶段保持英文和中文更容易审核、维护和同步。

### 6. 桌面上传软件资料

桌面上传软件已单独整理说明：

```text
sj/desktop-uploader-release-notes.md
```

结论：

- 桌面上传软件是可选配套工具。
- 不包含在 WordPress 插件 zip 中。
- 上传使用 WordPress 后台生成的客户端授权码和 HMAC 签名。
- 数据提交到用户自己的 WordPress 站点，不上传到第三方服务。

### 7. 新用户快速开始

已新增：

```text
sj/new-user-quick-start.md
```

覆盖内容：

- 插件安装
- 基础设置
- 手动录入设备
- 桌面上传软件使用方式
- 公共查询页
- 导入导出
- 日常维护建议
- 首次上线检查清单

## 当前提交资料目录

核心文件：

- `sj/npcink-device-inventory.zip`：准备上传的插件包。
- `sj/submission-form-copy.md`：WordPress.org 提交表单可复制文案。
- `sj/review-notes-for-plugin-team.md`：给审核团队的英文说明。
- `sj/review-response-templates.md`：审核追问时的回复模板。
- `sj/wordpress-org-upload-checklist.md`：上传前检查清单。
- `sj/technical-verification-record.md`：技术验证记录。
- `sj/package-manifest.json`：包 hash 和验证结果记录。
- `sj/assets/`：插件目录展示图。
- `sj/new-user-quick-start.md`：新用户快速开始。
- `sj/desktop-uploader-release-notes.md`：桌面上传软件发布说明。

## 下一阶段建议

### P0：正式提交 WordPress.org

1. 登录 WordPress.org 账号。
2. 打开插件提交页：

```text
https://wordpress.org/plugins/developers/add/
```

3. 上传：

```text
sj/npcink-device-inventory.zip
```

4. 使用：

```text
sj/submission-form-copy.md
```

中的英文简介填写提交说明。

5. 提交后关注 WordPress.org 账号邮箱。

### P1：审核跟进

如果审核团队追问，优先参考：

```text
sj/review-response-templates.md
sj/review-notes-for-plugin-team.md
```

重点解释：

- 为什么使用自定义数据库表。
- 前端构建产物对应源码已随包提供。
- 公共查询和上传接口需要 client token + HMAC。
- 插件正常运行不调用第三方服务。
- GPL/商标风险素材已经移除。

### P2：审核通过后的 SVN 发布

审核通过后，WordPress.org 会分配 SVN 仓库。

发布时：

- 插件代码放到 `trunk/`。
- 当前版本打 tag 到 `tags/2.7.0/`。
- 展示图片放到 SVN 顶层 `assets/`。
- 不要把 zip 文件提交到 SVN。
- 不要把展示图片放进 `trunk/assets/`。

### P3：发布后检查

发布后检查：

- 插件页标题、描述、FAQ、截图是否正常。
- 下载 zip 是否可安装。
- 后台页面是否可打开。
- 公共查询页是否正常加载。
- 未签名查询和上传请求是否仍返回 `403`。
- `README.txt`、截图和版本号是否同步。

## 暂缓事项

以下事项建议等首发审核通过后再做：

- 八国语言扩展。
- 大规模后台 UI 重构。
- 深度前端全量 i18n。
- 桌面上传软件正式二进制发布渠道。
- 新功能开发或接口协议调整。

原因：这些事项会增加审核前变量，不利于当前首发提交。

## 当前行动建议

现在最合适的动作是提交 `sj/npcink-device-inventory.zip`，进入 WordPress.org 审核流程。

在审核反馈回来之前，应把当前包和资料视为冻结版本。需要改动时，只围绕审核反馈做最小必要修正，并重新跑构建、PCP、包 hash 和资料同步。
