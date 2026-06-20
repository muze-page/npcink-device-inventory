我有一个 PHP 和 React 构建的设备管理项目，是 WordPress 上的插件。可以管理电脑设备，添加自定义设备，查看数据大盘和数据的导入导出功能。 现在，我需要对这个项目进行专家级别现代化的优化改造，请提供检查清单和优化的提示词

# 项目架构

下一步建议聚焦“对外接口安全 + 前端输出安全 + 输入校验三件事”，这是影响面最大、回报最高的改进组合。下面按优先级给出可落地方案与对应位置。

优先级 P0（建议立刻做）

公开 REST 强鉴权：把 /query、/submit-data 从 \_\_return_true 改为强鉴权，替换明文密码 GET；推荐方式：
Application Password（最快落地、WordPress 原生）
HMAC（设备侧签名，服务端校验，适合客户端固定设备）
Token + 过期机制（服务端下发、前端持有）
涉及 api.php
限制 CORS：仅允许白名单域名访问公开接口，拒绝 \*；涉及 api.php
XSS 修复：移除/净化 dangerouslySetInnerHTML，改用白名单净化（如 wp_kses 或前端 DOMPurify）；涉及 TabInfo.tsx
优先级 P1（安全加固 + 可靠性）

JSON 输入统一处理：wp_unslash + json_decode + wp_json_encode + 长度/结构校验，避免 sanitize_text_field 破坏 JSON；涉及 api.php、table-\*.php
加基础限流：对 /query 和 /submit-data 做 IP/设备维度的失败锁定（Transient），降低爆破风险；涉及 api.php
停止下发 option：dataLocal 中移除 option，仅下发必要 REST 地址与 nonce；涉及 npcink-device-manage-admin-menu.php、index.tsx
优先级 P2（稳态与规范）

补充审计日志：记录操作人、IP、字段变更，失败日志脱敏；涉及 table-pc.php、table-style.php
完成数据一致性校验：字段长度/枚举/范围限制，避免脏数据入库；涉及 table-pc.php、table-style.php
为了继续推进，请你先确定这两点：

公开接口鉴权选哪种方式？（Application Password / HMAC / Token）
/query 是否需要对外完全开放，还是仅限管理端/内网？
你给出选择后，我就按选项把改动拆到具体文件逐步落地。

## Phase 0 性能基线报告（v1.0）

### 1) 范围与入口

- 管理端入口：`admin/partials/npcink-device-manage-admin-menu.php` 注入 React 管理端
- 默认首屏 Tab：电脑设备（`vite-admin/src/pages/index.tsx`）

### 2) 构建快照

- 统计来源：`vite-admin/dist`（本地快照时间：2025-01-07 17:37）
- 说明：WP 管理端只 enqueue `index.js/index.css`，依赖包由 ESM 按需拉取

### 3) 首屏静态资源（实际请求）

单位：raw / gzip

- index.js：49.1 KB / 17.6 KB
- vendor.js：67.7 KB / 21.5 KB
- antd.js：887.6 KB / 276.7 KB
- react.js：139.4 KB / 44.7 KB
- axios.js：35.2 KB / 14.2 KB
- dayjs.js：15.9 KB / 6.3 KB
- index.css：14.0 KB / 3.4 KB

首屏合计：1.18 MB raw / 384.3 KB gz

### 4) 全量静态资源（含懒加载块）

- JS/CSS 合计：1.22 MB raw / 401.6 KB gz

### 5) 首屏 API 请求（默认 Tab）

- 生产：2 次
  - GET `/admin/pc?fields=summary`
  - GET `/admin/pc-categories`
- 开发：+1 次
  - POST `/wp-admin/admin-ajax.php?action=npcink_device_manage_get_rest_nonce`

### 6) 各页面初始 API 请求

- 电脑设备：2 次（列表 + 分类）
- 自定义设备：2 次（列表 + 分类）
- 变更记录：1 次（手动列表），切换到自动再 +1
- 资产盘点：1 次（`/admin/pc-summary`）
- 设置：0 次（初始值来自 `dataLocal`）

### 7) 数据规模（当前样例）

- Demo 数据：PC ~63 条、Style ~12 条（`vite-admin/src/utils/demoData.ts` / `demoStyleData.ts`）

### 8) 待补测项（上线前必须补齐）

- 数据库规模（SQL）
  - `SELECT COUNT(*) FROM wp_npcink_device_pc;`
  - `SELECT COUNT(*) FROM wp_npcink_device_style;`
  - `SELECT COUNT(*) FROM wp_npcink_device_manual;`
  - `SELECT COUNT(*) FROM wp_npcink_device_auto;`
- 首屏渲染耗时：FCP/TTI/JS 执行耗时
- 核心接口时延与返回体大小：`/admin/pc`、`/admin/pc-categories`、`/admin/pc-summary`

### 9) 建议基线阈值（目标）

- 首屏 JS/CSS 传输（gz）：≤ 450 KB（当前 384.3 KB）
- `/admin/pc` P95：≤ 300 ms
- 首屏渲染（数据返回后）：≤ 300–500 ms
- 单页内 API 请求数：≤ 3（当前默认为 2）


# 下一步整改意见
当前已完成的安全与性能收敛：

- 设备上传 `/device-post-data-v2` 已使用后台授权码、timestamp、nonce、body hash 与 HMAC 签名，并使用 transient 防重放。
- 公开查询 `/query` 已支持后台授权码 HMAC 查询签名；旧查询密码仍作为兼容路径，只允许通过 header/body/raw body，不再从 URL query 参数读取。
- 公共接口失败次数已按 IP + UUID/route 做 transient 限流，超过阈值返回 429。
- 公共查询默认只返回基础列，只有 `detail=1` 时才返回完整 `data`。
- 管理端导出默认使用表级列白名单，完整备份需要显式 `detail=1`。
- `npcink_device_pc`、`npcink_device_style`、变更记录表已补齐常用索引。

后续仍建议处理：

- 将后台授权码拆分为上传 token 与只读查询 token，避免公开查询页复用上传授权范围。
- 为公开查询增加可配置的强制 HMAC 开关，在确认旧查询页/旧流程迁移完成后禁用旧查询密码。
- 增加 REST 参数 schema，明确 `data/detail/page/per_page/format` 等参数的校验与默认值。
- 如站点层或服务器层存在自定义 CORS，请将 `Access-Control-Allow-Origin` 改为站点白名单，并显式允许 `x-npcink-password`、`x-npcink-device-*` 与 `content-type`。
- 生产环境关闭 `WP_DEBUG` 并限制 `debug.log` 访问，避免凭据、路径和请求错误详情泄露。
