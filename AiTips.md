我有一个 PHP 和 React 构建的设备管理项目，是 WordPress 上的插件。可以管理电脑设备，添加自定义设备，查看数据大盘和数据的导入导出功能。 现在，我需要对这个项目进行专家级别现代化的优化改造，请提供检查清单和优化的提示词

# 项目架构

下面是按优先级划分的专业整改清单（结合你当前代码结构与实际文件位置）：

P0 立即修复（安全阻断）

给所有 wp*ajax*\* 接口加 current_user_can + check_ajax_referer（涉及 seting.php table-pc.php table-style.php table-manual.php table-auto.php）
REST 接口改为强鉴权：移除 permission_callback => \_\_return_true、禁止明文密码 GET、增加 HMAC/Token 或 Application Password；限制 CORS（涉及 api.php）
停止向前端下发敏感配置与全量数据：不要下发 option（含密码哈希）与全量设备列表，改为最小配置+API 拉取（涉及 dema-admin-menu.php search-page.php index.tsx）
解决 XSS 风险：移除 dangerouslySetInnerHTML 或使用白名单净化（涉及 TabInfo.tsx）
JSON 输入处理改为 wp_unslash + json_decode + wp_json_encode，避免 sanitize_text_field 破坏 JSON；加长度/结构校验（涉及 api.php table-style.php table-pc.php）
加入基础限流与失败锁定（IP/设备维度，Transients 即可）防暴力尝试（涉及 api.php）
P1 短期优化（2–4 周）

管理端数据加载改为分页 API：列表/详情懒加载，减少首屏 wp_localize_script 体积（涉及 dema-admin-menu.php index.tsx）
数据库索引与查询优化：给 record_uuid/changed_at 加索引，消除 N+1（JOIN/批量查询）（涉及 class-dema-activator.php table-auto.php table-manual.php）
前端性能：updateOSType 做 useMemo 或后端预处理；列表虚拟化；搜索防抖（涉及 index.tsx pc.ts）
导入/导出强化：JSON schema 校验、大小限制、事务插入、失败回滚（涉及 seting.php）
审计与追踪：记录操作人、IP、时间、字段变更；失败日志脱敏（涉及 table-pc.php table-style.php）
数据一致性：限制字段长度、数值范围与枚举值，避免脏数据进入（涉及 table-pc.php table-style.php）
P2 中期架构（1–2 个月）

统一 API 层：从 admin-ajax.php 迁移到 WP REST，统一鉴权与权限矩阵
安全策略：CSP/安全响应头、HTTPS 强制、登录与 API 访问审计
数据模型演进：将高频字段拆分/冗余、JSON 字段生成列与索引
运维治理：慢查询监控、异常告警、备份与恢复演练
测试体系：接口鉴权测试、XSS/CSRF 回归、性能基准测试
验收标准（建议）

所有写接口必须通过能力校验 + nonce 或 token，未授权访问全部返回 403
前端不再接收到密码/敏感配置与全量设备数据
XSS 漏洞点不再使用 dangerouslySetInnerHTML 或已完成严格净化
列表数据改为分页加载，首屏 payload 明显下降且渲染时间降低
自动/手动变更记录查询无 N+1，数据库索引覆盖查询路径
如果你希望我按优先级落地整改，可以选：

先做 P0 安全补丁（鉴权/nonce/敏感信息下发/XSS）
直接做 P0+P1 组合包
我先给出分阶段实施方案与代码改动清单

# 性能优化

从性能与现代化角度看，当前瓶颈主要在“全量数据下发 + 前端全量搜索/渲染 + 后端查询模式”。下面是可落地的优化建议清单（按优先级）：

数据加载：移除管理端全量 wp_localize_script 下发，改为分页 API（列表/详情分离、字段精简），涉及 dema-admin-menu.php 和 index.tsx
搜索与筛选：把模糊搜索（Fuse）迁到服务端或加 debounce/useDeferredValue，避免每次输入全量计算，涉及 index.tsx
列表渲染：数据量大时使用虚拟列表（react-window/react-virtualized）+ 按需加载详情
计算与解析：updateOSType/JSON 解析只在数据变更时运行（useMemo/worker），避免每次 render 重算，涉及 index.tsx index.tsx
DB 查询：列表用字段选择替代 SELECT \*，变更记录用 JOIN/批量查询；给 record_uuid/changed_at 加索引，涉及 table-auto.php table-manual.php class-dema-activator.php
缓存策略：分类选项/统计用 Transient 或对象缓存；接口返回 ETag/Last-Modified 做客户端缓存
架构现代化：统一 API 客户端（React Query/SWR），统一错误/加载态；引入 zod 做运行时校验；详情 tab 代码分割与懒加载
构建与运行：Vite 分包、gzip/brotli；生产移除 console；引入慢查询/性能监控（Query Monitor/日志）
如果你要落地，我可以从「分页 API + 前端改造」开始，或先做「DB 索引 + 查询优化」。你希望我先做哪块？

分页 API + 前端数据流改造
DB 索引与查询优化
全面梳理并做分阶段实施计划

## 分阶段计划

下面是面向“性能 + 现代化”的分阶段实施计划（按依赖顺序排列），每阶段都标注了主要产出与涉及的关键文件，方便你直接落地。

Phase Plan

Phase 0（1–2 天）基线与指标：确认数据规模、首屏 payload、渲染耗时、查询次数；产出性能基线报告和目标阈值，涉及 dema-admin-menu.php、index.tsx
Phase 1（3–5 天）API 与数据流重构：新增 REST 列表/详情/分类接口（分页、筛选、排序、字段精简），移除全量 dataLocal 下发；产出新接口文档与兼容层，涉及 api.php、dema-admin-menu.php、index.tsx
Phase 2（3–5 天）前端现代化数据层：引入 React Query/SWR，列表分页加载、详情按需拉取、搜索防抖；替换全量 Fuse 搜索；产出稳定的数据缓存与失效策略，涉及 index.tsx
Phase 3（2–4 天）数据库与查询优化：新增索引（record_uuid、changed_at 等），改为 JOIN/批量查询消除 N+1，必要时为 JSON 字段生成列；产出 SQL 变更脚本与性能对比，涉及 class-dema-activator.php、table-auto.php、table-manual.php
Phase 4（1–2 天）构建与渲染优化：Vite 分包、Tab 懒加载、移除 dev 日志、静态资源压缩；产出更小包体与更快首屏，涉及 vite-admin 构建配置与页面入口
Phase 5（2–3 天）性能验收与回归：添加性能预算、回归用数据集、简单压测脚本；产出验收报告与回滚方案
Definition of Done / KPI

管理端首屏 payload 明显下降（目标：从“全量数据”降到“分页首屏 + 分类”）
列表渲染与搜索在 2k+ 设备下仍保持流畅（目标：输入延迟 < 100ms）
自动/手动记录查询无明显 N+1（目标：查询条数稳定、耗时线性）
详情页为按需加载，不影响列表首屏
所有变更均可通过灰度开关回退
Dependencies / Decisions Needed

预计设备数量级与并发范围（100/1k/1w 规模会影响分页与索引策略）
是否允许服务端搜索（若允许，前端 Fuse 可完全替换）
是否接受 REST 替代 admin-ajax（推荐）
是否需要保留“全量导出”能力（会影响接口设计与缓存策略）
如果你同意，我可以把 Phase 1 + Phase 2 拆成具体任务清单（按文件到函数级别），并给出改动顺序与预估工时。
你希望我先产出哪一块的详细实施清单？

Phase 1（API 与数据流）
Phase 2（前端数据层与性能）
Phase 3（数据库与查询优化）




按我们前面的分阶段规划，下一步建议重点落在这几块（按优先级）：

1) 完整迁移 admin‑ajax → REST（减少耦合、统一鉴权与提示）

设置保存/导入导出/变更记录/公共搜索页创建，都改 REST
统一走 manage_options + REST nonce
前端统一使用 restInstance，提示完全由全局拦截器接管
2) 变更记录接口做分页与筛选

目前自动/手动记录是全量查询，4096 设备时会明显拖慢
新增分页参数：page / per_page / search / record_uuid / table_name / column_name
前端表格用分页 + 服务端搜索，避免全量加载
3) 数据库索引/查询优化（4096 设备 + 并发 20）

PC 表建议补索引：(number), (state), (department), (created_at), (updated_at)
Style 表对 JSON 字段可用生成列 + 索引（platform/pay_method）
变更表：record_uuid、changed_at 建索引
4) 导入导出升级

支持大数据分页导出
导入增加校验报告（成功/失败条数）
可选：CSV 导出（更适合大数据）
5) 前端性能

列表按需字段渲染、虚拟滚动（如果列表 > 200）
详情页只请求所需字段（减少 data JSON 解析）