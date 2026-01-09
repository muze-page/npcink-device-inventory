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
停止下发 option：dataLocal 中移除 option，仅下发必要 REST 地址与 nonce；涉及 dema-admin-menu.php、index.tsx
优先级 P2（稳态与规范）

补充审计日志：记录操作人、IP、字段变更，失败日志脱敏；涉及 table-pc.php、table-style.php
完成数据一致性校验：字段长度/枚举/范围限制，避免脏数据入库；涉及 table-pc.php、table-style.php
为了继续推进，请你先确定这两点：

公开接口鉴权选哪种方式？（Application Password / HMAC / Token）
/query 是否需要对外完全开放，还是仅限管理端/内网？
你给出选择后，我就按选项把改动拆到具体文件逐步落地。

## Phase 0 性能基线报告（v1.0）

### 1) 范围与入口

- 管理端入口：`admin/partials/dema-admin-menu.php` 注入 React 管理端
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
  - POST `/wp-admin/admin-ajax.php?action=dema_get_rest_nonce`

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
结合当前模块（插件 api.php、前端 axios.tsx、客户端 seting.vue），给你一份安全 + 性能整改清单，按优先级排序：

安全整改（高优先）

把“共享口令”升级为“设备级令牌 / HMAC 签名”：请求里带 timestamp + nonce + signature，服务端校验并防重放。现在的单一密码一旦泄露，所有设备全失守。改动点主要在 api.php + seting.vue。
禁止 query 参数传密码，只允许 header/body；为兼容旧客户端可做“开关+告警”。现在 public_permissions_check 接受多来源，容易被日志泄露。
增加失败次数限制（IP + UUID 维度），用 transient 做限流/锁定；失败太多直接 429。改动点 api.php。
CORS 从 * 改为白名单（站点域名/设置项），并显式允许 x-npcink-password 与 content-type。当前 Access-Control-Allow-Origin: * 风险较高。
生产环境关闭 WP_DEBUG 并限制 debug.log 访问（否则凭据/路径会暴露）。
性能整改（高优先）

给 npcink_device_pc 增加索引（至少 uuid 唯一索引 + number + name + state + department），查询和统计会快很多。可在 class-dema-activator.php 里用 index_exists 动态补。
公共查询接口不要 SELECT *，建议做“基础信息 + 详情分开”或加 detail=1 才返回完整 data。改动点 api.php 的 query_data。
为公共查询加短时缓存（按查询 key + 最后更新时间生成 ETag / transient），减轻数据库压力。你已经在管理端用 rest_response_with_cache 了，可以复用逻辑。
减少上传数据体积：InsPackage 只上传必要字段或压缩（若服务器支持）。当前 body 约 10KB 起步，规模化会有压力。