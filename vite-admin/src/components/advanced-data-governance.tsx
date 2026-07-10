import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Checkbox, Empty, Modal, Space, Table, Tag, Typography, message } from "antd";
import {
  applyDeviceIdentityReconciliation,
  getDeviceIdentityReconciliation,
  getIdentityAudit,
} from "@/services/v3";
import type { DeviceIdentityReconciliationItem, IdentityAuditGroup } from "@/type/v3";
import { useState } from "react";

const { Text } = Typography;

export const IdentityAuditModal = ({
  open,
  onClose,
  onSelectAsset,
}: {
  open: boolean;
  onClose: () => void;
  onSelectAsset: (uuid: string) => void;
}) => {
  const identityAuditQuery = useQuery(["v3-analysis-identity-audit"], getIdentityAudit, {
    enabled: open,
    staleTime: 30_000,
  });

  return (
    <Modal
      title="身份兼容审计"
      open={open}
      footer={<Button onClick={onClose}>关闭</Button>}
      width={980}
      onCancel={onClose}
    >
      <Space direction="vertical" size={14} style={{ width: "100%" }}>
        <Alert
          type="info"
          showIcon
          message="只读审计：UUID 相同但主 MAC 不同的资产不会自动合并。"
          description="审计只读取每台资产的最新采集快照；不会修改资产、身份或历史采集记录。"
        />
        <Space wrap>
          <Tag>已审计 {identityAuditQuery.data?.summary.auditedAssets ?? "-"} 台</Tag>
          <Tag color="orange">UUID / MAC 冲突 {identityAuditQuery.data?.summary.uuidMacConflictGroups ?? "-"} 组</Tag>
          <Tag color="red">同组合身份 {identityAuditQuery.data?.summary.sameCompositeGroups ?? "-"} 组</Tag>
          <Tag>身份资料不足 {identityAuditQuery.data?.summary.insufficientIdentityAssets ?? "-"} 台</Tag>
        </Space>
        <Table<IdentityAuditGroup>
          rowKey="groupKey"
          size="small"
          loading={identityAuditQuery.isLoading || identityAuditQuery.isFetching}
          dataSource={identityAuditQuery.data?.groups || []}
          pagination={false}
          scroll={{ x: 900 }}
          columns={[
            {
              title: "结果",
              width: 128,
              render: (_, group) => (
                <Tag color={group.classification === "uuid_mac_conflict" ? "orange" : "red"}>
                  {group.classification === "uuid_mac_conflict" ? "历史标识冲突" : "同组合身份"}
                </Tag>
              ),
            },
            { title: "硬件 UUID", dataIndex: "hardwareUuid", width: 280 },
            {
              title: "资产 / 主 MAC",
              width: 380,
              render: (_, group) => (
                <Space direction="vertical" size={2}>
                  {group.assets.map((asset) => (
                    <Space key={asset.uuid} size={4} wrap>
                      <Button type="link" size="small" className="npcink-v3-link" onClick={() => onSelectAsset(asset.uuid)}>
                        {asset.assetNumber || asset.name || asset.uuid}
                      </Button>
                      <Text type="secondary">{asset.primaryMac || "未采集 MAC"}</Text>
                    </Space>
                  ))}
                </Space>
              ),
            },
            {
              title: "规模",
              width: 110,
              render: (_, group) => `${group.assetCount} 台 / ${group.distinctMacCount} 个 MAC`,
            },
          ]}
          locale={{ emptyText: <Empty description="未发现身份冲突组" /> }}
        />
      </Space>
    </Modal>
  );
};

const reconciliationStatus = (status: DeviceIdentityReconciliationItem["status"]) => {
  const labels = {
    ready: { color: "green", label: "可写入" },
    already: { color: "blue", label: "已统一" },
    collision: { color: "red", label: "需人工核查" },
    insufficient: { color: "orange", label: "采集信息不足" },
  } as const;
  return labels[status];
};

const reconciliationReason = (reason: string) => {
  const labels: Record<string, string> = {
    missing_baseboard_serial: "缺少有效的主板序列号",
    insufficient_board_signals: "缺少主板厂商/型号或硬件 UUID",
    same_device_uuid_in_multiple_assets: "多个资产算出同一设备 UUID，不自动合并",
    device_uuid_owned_by_another_asset: "该设备 UUID 已属于另一资产，不自动覆盖",
    already_reconciled: "已写入当前设备 UUID",
  };
  return labels[reason] || reason || "-";
};

export const DeviceIdentityReconciliationModal = ({
  open,
  onClose,
  onApplied,
}: {
  open: boolean;
  onClose: () => void;
  onApplied: () => void;
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const reconciliationQuery = useQuery(
    ["v3-device-identity-reconciliation", page],
    () => getDeviceIdentityReconciliation(page),
    { enabled: open }
  );
  const applyMutation = useMutation(applyDeviceIdentityReconciliation, {
    onSuccess: (result) => {
      message.success(`已写入 ${result.written} 台设备的统一 UUID`);
      setConfirmed(false);
      queryClient.invalidateQueries(["v3-device-identity-reconciliation"]);
      onApplied();
    },
  });
  const summary = reconciliationQuery.data?.summary;

  return (
    <Modal
      title="设备身份梳理"
      open={open}
      width={1060}
      onCancel={onClose}
      footer={(
        <Space>
          <Button onClick={onClose}>关闭</Button>
          <Button
            type="primary"
            loading={applyMutation.isLoading}
            disabled={!confirmed || !summary?.ready}
            onClick={() => applyMutation.mutate()}
          >
            确认写入 {summary?.ready || 0} 台
          </Button>
        </Space>
      )}
    >
      <Space direction="vertical" size={14} style={{ width: "100%" }}>
        <Alert
          type="info"
          showIcon
          message="主板决定设备身份；更换主板即视为新电脑。"
          description="系统从最新采集快照重新计算 device_uuid_v1，只写入唯一、无冲突的结果；不会删除旧标识，也不会自动合并、覆盖或删除资产。"
        />
        <Space wrap>
          <Tag>已扫描 {summary?.auditedAssets ?? "-"} 台</Tag>
          <Tag color="green">可写入 {summary?.ready ?? "-"}</Tag>
          <Tag color="blue">已统一 {summary?.already ?? "-"}</Tag>
          <Tag color="red">需核查 {summary?.collisions ?? "-"}</Tag>
          <Tag color="orange">信息不足 {summary?.insufficient ?? "-"}</Tag>
        </Space>
        <Table<DeviceIdentityReconciliationItem>
          rowKey="assetUuid"
          size="small"
          loading={reconciliationQuery.isLoading || reconciliationQuery.isFetching}
          dataSource={reconciliationQuery.data?.items || []}
          pagination={{
            current: page,
            pageSize: reconciliationQuery.data?.pagination.pageSize || 50,
            total: reconciliationQuery.data?.pagination.totalItems || 0,
            showSizeChanger: false,
            onChange: setPage,
          }}
          scroll={{ x: 920, y: 360 }}
          columns={[
            {
              title: "结果",
              width: 130,
              render: (_, item) => {
                const status = reconciliationStatus(item.status);
                return <Tag color={status.color}>{status.label}</Tag>;
              },
            },
            {
              title: "资产",
              width: 210,
              render: (_, item) => (
                <Space direction="vertical" size={1}>
                  <Text strong>{item.assetNumber || item.name || item.assetUuid}</Text>
                  <Text type="secondary">{item.department || "未分配部门"}</Text>
                </Space>
              ),
            },
            { title: "新的设备 UUID", dataIndex: "deviceUuid", width: 300, render: (value: string) => value || "-" },
            { title: "说明", width: 240, render: (_, item) => reconciliationReason(item.reason) },
          ]}
        />
        <Checkbox checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}>
          我已导出当前 JSON 备份，并确认只写入可唯一确定的设备 UUID
        </Checkbox>
      </Space>
    </Modal>
  );
};
