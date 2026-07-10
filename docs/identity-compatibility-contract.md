# 设备身份兼容契约

## 状态

已接受。适用于 V3 资产模型中的上传匹配、历史数据审计和重复风险展示。

## 问题

V1 使用 `MD5(硬件 UUID + 第一张网卡 MAC)`。早期 V3 上传则优先使用单个硬件 UUID；部分设备的 SMBIOS UUID 被厂商、克隆镜像或旧采集数据复用时，这会把不同机器错误视为同一身份。

## 身份层级

- `device_uuid_v1`：当前唯一的自动匹配主键。服务端从最新采集的主板厂商、型号、序列号及硬件 UUID 重新计算 `SHA-256` 指纹；主板序列号必须有效，且还需硬件 UUID 或厂商+型号辅助。更换主板就是新电脑。
- `stable_device_id_v3`、`stable_device_id_v2`：旧上传兼容身份。只有无法计算 `device_uuid_v1` 的旧快照才会参与回退匹配。
- `legacy_device_id_v1`：V1 的 `MD5(硬件 UUID + 第一张网卡 MAC)` 兼容线索。保存用于审计和迁移对照，不作为新数据的自动主键。
- `hardware_uuid`、`system_uuid`、MAC、其他序列号：证据，不是新的唯一设备定义。它们可能被固件、克隆镜像或替换件复用。

## 上传决策

1. 服务端能重算 `device_uuid_v1`：仅按它匹配；未命中即创建新资产，不再回落到历史单信号 UUID。因此主板更换不会归入旧电脑。
2. 服务端不能重算主板指纹：保留历史 V3/V2/V1 兼容路径与 UUID/MAC 冲突护栏，保障旧客户端继续上传。
3. 任何路径都不自动合并两条既有资产记录。

这使客户端上传不中断，同时把“可能误合并”转换为可审计、可人工处理的历史身份冲突。

## 只读审计接口

`GET /wp-json/npcink-device-inventory/v1/analysis/identity-audit?page=1&pageSize=20`

仅管理员可访问。接口读取每台未删除资产的最新采集快照，返回：

- `uuid_mac_conflict`：硬件 UUID 相同、主 MAC 不同；属于历史/固件身份冲突，不是重复设备。
- `same_composite_identity`：硬件 UUID 与主 MAC 都相同；才是可进一步核查的重复设备候选。
- 汇总中的 `insufficientIdentityAssets`：缺少 UUID 或 MAC，不能作自动身份结论。

该接口和管理端“身份兼容审计”窗口均为只读，不修改资产、身份或历史采集记录。

## 数据梳理接口

`GET /wp-json/npcink-device-inventory/v1/analysis/device-identity-reconciliation?page=1&pageSize=50`

仅管理员可访问。按每台未删除资产的最新采集快照计算候选 `device_uuid_v1`，并返回 `ready`、`already`、`collision`、`insufficient`。`collision` 和 `insufficient` 永远不写入。

`POST /wp-json/npcink-device-inventory/v1/analysis/device-identity-reconciliation`

请求体必须为 `{ "confirm": true }`。服务端会重新计算预览，只为 `ready` 的一对一候选写入身份表，并记录 `identity_reconciled` 事件；不改 `npcink_assets.uuid`，不自动合并、覆盖或删除任何资产。
