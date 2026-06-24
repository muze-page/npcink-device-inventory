import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Collapse,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import {
  archiveAsset,
  createAsset,
  createClientToken,
  deleteClientToken,
  getAsset,
  getAssetEvents,
  getAssetIdentities,
  getAssetObservations,
  getAssets,
  getSettings,
  updateAsset,
} from "@/services/v3";
import type {
  Asset,
  AssetEvent,
  AssetIdentity,
  AssetInput,
  AssetObservation,
  ClientToken,
  CreatedClientToken,
  JsonRecord,
} from "@/type/v3";

const { Text, Title } = Typography;

const ASSET_TYPES = [
  { label: "电脑", value: "pc" },
  { label: "通用电脑", value: "computer" },
  { label: "网络设备", value: "network" },
  { label: "办公设备", value: "office" },
  { label: "自定义", value: "custom" },
];

const STATUS_OPTIONS = [
  { label: "在用", value: "active" },
  { label: "停用", value: "inactive" },
  { label: "维护", value: "maintenance" },
  { label: "退役", value: "retired" },
  { label: "已归档", value: "deleted" },
];

const statusColor: Record<string, string> = {
  active: "green",
  inactive: "default",
  maintenance: "orange",
  retired: "blue",
  deleted: "red",
};

const statusLabel = (value: string) =>
  STATUS_OPTIONS.find((item) => item.value === value)?.label || value || "-";

const assetTypeLabel = (value: string) =>
  ASSET_TYPES.find((item) => item.value === value)?.label || value || "-";

const formatDate = (value?: string) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("zh-CN", { hour12: false });
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const compactJson = (value: JsonRecord) => {
  const entries = Object.entries(value || {});
  if (entries.length === 0) {
    return "-";
  }
  return entries
    .slice(0, 6)
    .map(([key, item]) => `${key}: ${String(item)}`)
    .join("；");
};

const fieldText = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "-";
  }
  if (typeof value === "boolean") {
    return value ? "是" : "否";
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
};

const renderJsonBlock = (value: unknown) => (
  <pre className="npcink-v3-json">
    {JSON.stringify(value || {}, null, 2)}
  </pre>
);

const getRecord = (value: unknown): JsonRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};

const latestObservationSummary = (observations: AssetObservation[]) =>
  getRecord(observations[0]?.summary);

const hardwareSections = (hardware: JsonRecord) =>
  Object.entries(hardware || {}).filter(([, value]) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (value && typeof value === "object") {
      return Object.keys(value).length > 0;
    }
    return value !== null && value !== undefined && value !== "";
  });

const detailItems = (asset?: Asset) => {
  if (!asset) {
    return [];
  }
  return [
    { key: "number", label: "资产编号", children: asset.assetNumber || "-" },
    { key: "type", label: "资产类型", children: assetTypeLabel(asset.assetType) },
    { key: "owner", label: "使用人", children: asset.ownerName || "-" },
    { key: "department", label: "部门", children: asset.department || "-" },
    { key: "category", label: "分类", children: asset.category || "-" },
    {
      key: "status",
      label: "状态",
      children: (
        <Tag color={statusColor[asset.status] || "default"}>
          {statusLabel(asset.status)}
        </Tag>
      ),
    },
    { key: "purchase", label: "购置价值", children: formatMoney(asset.purchasePrice) },
    { key: "residual", label: "残值", children: formatMoney(asset.residualValue) },
    { key: "updated", label: "更新时间", children: formatDate(asset.updatedAt) },
    {
      key: "legacy",
      label: "旧数据来源",
      children: fieldText(getRecord(asset.metadata.legacy).source_table),
    },
    {
      key: "legacyUuid",
      label: "旧UUID",
      children: fieldText(getRecord(asset.metadata.legacy).uuid),
    },
  ];
};

interface AssetFormModalProps {
  asset: Asset | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AssetInput) => Promise<void>;
}

type AssetFormValues = Omit<AssetInput, "metadata">;

const AssetFormModal = ({ asset, open, onClose, onSubmit }: AssetFormModalProps) => {
  const [form] = Form.useForm<AssetFormValues>();

  useEffect(() => {
    if (!open) {
      return;
    }
    form.setFieldsValue({
      assetType: asset?.assetType || "custom",
      assetNumber: asset?.assetNumber || "",
      name: asset?.name || "",
      ownerName: asset?.ownerName || "",
      department: asset?.department || "",
      category: asset?.category || "",
      status: asset?.status || "active",
      purchasePrice: asset?.purchasePrice || 0,
      residualValue: asset?.residualValue || 0,
    });
  }, [asset, form, open]);

  return (
    <Modal
      title={asset ? "编辑资产" : "新增资产"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      destroyOnClose
      width={640}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => onSubmit(values)}
        preserve={false}
      >
        <Form.Item name="name" label="资产名称" rules={[{ required: true }]}>
          <Input placeholder="例如：财务部工作站" />
        </Form.Item>
        <Space.Compact block>
          <Form.Item name="assetNumber" label="资产编号" className="npcink-v3-half">
            <Input placeholder="留空自动生成" />
          </Form.Item>
          <Form.Item name="assetType" label="资产类型" className="npcink-v3-half">
            <Select options={ASSET_TYPES} />
          </Form.Item>
        </Space.Compact>
        <Space.Compact block>
          <Form.Item name="ownerName" label="使用人" className="npcink-v3-half">
            <Input />
          </Form.Item>
          <Form.Item name="department" label="部门" className="npcink-v3-half">
            <Input />
          </Form.Item>
        </Space.Compact>
        <Space.Compact block>
          <Form.Item name="category" label="分类" className="npcink-v3-half">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态" className="npcink-v3-half">
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
        </Space.Compact>
        <Space.Compact block>
          <Form.Item name="purchasePrice" label="购置价值" className="npcink-v3-half">
            <InputNumber min={0} precision={2} className="npcink-v3-number" />
          </Form.Item>
          <Form.Item name="residualValue" label="残值" className="npcink-v3-half">
            <InputNumber min={0} precision={2} className="npcink-v3-number" />
          </Form.Item>
        </Space.Compact>
      </Form>
    </Modal>
  );
};

interface TokenModalProps {
  open: boolean;
  onClose: () => void;
}

const TokenModal = ({ open, onClose }: TokenModalProps) => {
  const [form] = Form.useForm<{ name: string }>();
  const [createdToken, setCreatedToken] = useState<CreatedClientToken | null>(null);
  const queryClient = useQueryClient();
  const settingsQuery = useQuery(["v3-settings"], getSettings, { enabled: open });
  const createMutation = useMutation(createClientToken, {
    onSuccess: (token) => {
      setCreatedToken(token);
      form.resetFields();
      queryClient.invalidateQueries(["v3-settings"]);
      message.success("令牌已创建，请立即保存完整授权码");
    },
  });
  const deleteMutation = useMutation(deleteClientToken, {
    onSuccess: () => {
      queryClient.invalidateQueries(["v3-settings"]);
      message.success("令牌已删除");
    },
  });

  const tokens = settingsQuery.data?.clientTokens || [];

  const columns: ColumnsType<ClientToken> = [
    { title: "名称", dataIndex: "name" },
    { title: "Token ID", dataIndex: "id", width: 160 },
    {
      title: "状态",
      dataIndex: "enabled",
      width: 88,
      render: (enabled: boolean) => (
        <Tag color={enabled ? "green" : "default"}>{enabled ? "启用" : "停用"}</Tag>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      width: 180,
      render: formatDate,
    },
    {
      title: "操作",
      width: 88,
      render: (_, token) => (
        <Button
          size="small"
          danger
          onClick={() =>
            Modal.confirm({
              title: "删除客户端令牌？",
              content: `Token ID: ${token.id}`,
              okText: "删除",
              okButtonProps: { danger: true },
              cancelText: "取消",
              onOk: () => deleteMutation.mutateAsync(token.id),
            })
          }
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title="采集客户端令牌"
      open={open}
      onCancel={onClose}
      footer={null}
      width={820}
      destroyOnClose
    >
      <Form
        form={form}
        layout="inline"
        className="npcink-v3-token-form"
        onFinish={({ name }) => createMutation.mutate(name)}
      >
        <Form.Item name="name" rules={[{ required: true, message: "请输入令牌名称" }]}>
          <Input placeholder="例如：财务部采集客户端" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={createMutation.isLoading}>
          创建令牌
        </Button>
      </Form>
      {createdToken ? (
        <Alert
          className="npcink-v3-secret"
          type="warning"
          showIcon
          message="完整授权码只显示一次"
          description={
            <Text copyable code>
              {`mda_${createdToken.id}_${createdToken.secret}`}
            </Text>
          }
        />
      ) : null}
      <Table
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={tokens}
        loading={settingsQuery.isLoading}
        pagination={false}
      />
    </Modal>
  );
};

interface DetailDrawerProps {
  uuid: string | null;
  open: boolean;
  onClose: () => void;
  onEdit: (asset: Asset) => void;
  onArchive: (asset: Asset) => void;
}

const DetailDrawer = ({ uuid, open, onClose, onEdit, onArchive }: DetailDrawerProps) => {
  const enabled = Boolean(uuid && open);
  const assetQuery = useQuery(["v3-asset", uuid], () => getAsset(uuid || ""), {
    enabled,
  });
  const identitiesQuery = useQuery(
    ["v3-asset-identities", uuid],
    () => getAssetIdentities(uuid || ""),
    { enabled }
  );
  const observationsQuery = useQuery(
    ["v3-asset-observations", uuid],
    () => getAssetObservations(uuid || "", 1, 20),
    { enabled }
  );
  const eventsQuery = useQuery(
    ["v3-asset-events", uuid],
    () => getAssetEvents(uuid || "", 1, 30),
    { enabled }
  );

  const asset = assetQuery.data || null;
  const observations = observationsQuery.data?.data || [];
  const events = eventsQuery.data?.data || [];
  const latestSummary = latestObservationSummary(observations);
  const latestHardware = getRecord(observations[0]?.hardware);

  const identityColumns: ColumnsType<AssetIdentity> = [
    { title: "类型", dataIndex: "identityType", width: 130 },
    { title: "值", dataIndex: "identityValue" },
    {
      title: "主标识",
      dataIndex: "isPrimary",
      width: 90,
      render: (isPrimary: boolean) => (isPrimary ? <Tag color="blue">主</Tag> : "-"),
    },
    {
      title: "置信度",
      dataIndex: "confidence",
      width: 92,
      render: (value: number) => `${Number(value).toFixed(0)}%`,
    },
    { title: "来源", dataIndex: "source", width: 100 },
  ];

  const observationColumns: ColumnsType<AssetObservation> = [
    { title: "来源", dataIndex: "source", width: 100 },
    { title: "采集时间", dataIndex: "observedAt", width: 180, render: formatDate },
    { title: "接收时间", dataIndex: "receivedAt", width: 180, render: formatDate },
    {
      title: "摘要",
      dataIndex: "summary",
      render: (summary: JsonRecord) => (
        <Space direction="vertical" size={2}>
          <Text>{fieldText(summary.device_model || summary.hostname)}</Text>
          <Text type="secondary">{compactJson(summary)}</Text>
        </Space>
      ),
    },
  ];

  const eventColumns: ColumnsType<AssetEvent> = [
    { title: "时间", dataIndex: "createdAt", width: 180, render: formatDate },
    { title: "来源", dataIndex: "eventSource", width: 100 },
    { title: "类型", dataIndex: "eventType", width: 140 },
    { title: "字段", dataIndex: "fieldName", width: 120, render: fieldText },
    {
      title: "说明",
      render: (_, event) => (
        <Space direction="vertical" size={2}>
          <Text>{event.message || "-"}</Text>
          {event.oldValue || event.newValue ? (
            <Text type="secondary">
              {fieldText(event.oldValue)} -&gt; {fieldText(event.newValue)}
            </Text>
          ) : null}
          {event.actorName ? <Text type="secondary">操作人：{event.actorName}</Text> : null}
        </Space>
      ),
    },
  ];

  return (
    <Drawer
      title={asset?.name || "资产详情"}
      open={open}
      onClose={onClose}
      width={1040}
      extra={
        asset ? (
          <Space>
            <Button onClick={() => onEdit(asset)}>编辑</Button>
            <Button danger onClick={() => onArchive(asset)}>
              归档
            </Button>
          </Space>
        ) : null
      }
    >
      {assetQuery.isLoading ? (
        <Table loading pagination={false} showHeader={false} />
      ) : asset ? (
        <Tabs
          defaultActiveKey="overview"
          items={[
            {
              key: "overview",
              label: "概览",
              children: (
                <Space direction="vertical" size={14} className="npcink-v3-detail-stack">
                  <Descriptions
                    bordered
                    size="small"
                    column={2}
                    items={detailItems(asset)}
                  />
                  <Descriptions
                    bordered
                    size="small"
                    column={2}
                    title="最新采集摘要"
                    items={[
                      {
                        key: "deviceModel",
                        label: "设备型号",
                        children: fieldText(latestSummary.device_model),
                      },
                      {
                        key: "hostname",
                        label: "主机名",
                        children: fieldText(latestSummary.hostname),
                      },
                      {
                        key: "os",
                        label: "系统",
                        children: fieldText(latestSummary.os_label),
                      },
                      {
                        key: "cpu",
                        label: "CPU",
                        children: fieldText(latestSummary.cpu),
                      },
                      {
                        key: "ip",
                        label: "IP",
                        children: fieldText(latestSummary.primary_ip),
                      },
                      {
                        key: "observedAt",
                        label: "采集时间",
                        children: formatDate(observations[0]?.observedAt),
                      },
                    ]}
                  />
                  <Collapse
                    size="small"
                    items={[
                      {
                        key: "hardware",
                        label: `硬件明细 ${hardwareSections(latestHardware).length}`,
                        children: renderJsonBlock(latestHardware),
                      },
                      {
                        key: "metadata",
                        label: "资产扩展信息",
                        children: renderJsonBlock(asset.metadata),
                      },
                    ]}
                  />
                </Space>
              ),
            },
            {
              key: "identities",
              label: `身份 ${identitiesQuery.data?.length || 0}`,
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  columns={identityColumns}
                  dataSource={identitiesQuery.data || []}
                  loading={identitiesQuery.isLoading}
                  pagination={false}
                />
              ),
            },
            {
              key: "observations",
              label: `采集 ${observationsQuery.data?.pagination.totalItems || 0}`,
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  columns={observationColumns}
                  dataSource={observations}
                  loading={observationsQuery.isLoading}
                  pagination={false}
                  expandable={{
                    expandedRowRender: (observation) => (
                      <Collapse
                        size="small"
                        items={[
                          {
                            key: "hardware",
                            label: "硬件明细",
                            children: renderJsonBlock(observation.hardware),
                          },
                          {
                            key: "raw",
                            label: "原始数据",
                            children: renderJsonBlock(observation.raw),
                          },
                        ]}
                      />
                    ),
                  }}
                />
              ),
            },
            {
              key: "events",
              label: `事件 ${eventsQuery.data?.pagination.totalItems || 0}`,
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  columns={eventColumns}
                  dataSource={events}
                  loading={eventsQuery.isLoading}
                  pagination={false}
                  expandable={{
                    expandedRowRender: (event) => renderJsonBlock(event.payload),
                  }}
                />
              ),
            },
          ]}
        />
      ) : (
        <Empty description="未找到资产" />
      )}
    </Drawer>
  );
};

const AssetWorkspace = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [assetType, setAssetType] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);

  const queryParams = useMemo(
    () => ({ page, pageSize, search, assetType, status }),
    [assetType, page, pageSize, search, status]
  );
  const assetsQuery = useQuery(["v3-assets", queryParams], () => getAssets(queryParams), {
    keepPreviousData: true,
  });

  const createMutation = useMutation(createAsset, {
    onSuccess: (asset) => {
      setAssetModalOpen(false);
      setEditingAsset(null);
      setSelectedUuid(asset.uuid);
      queryClient.invalidateQueries(["v3-assets"]);
      message.success("资产已创建");
    },
  });
  const updateMutation = useMutation(
    ({ uuid, input }: { uuid: string; input: AssetInput }) => updateAsset(uuid, input),
    {
      onSuccess: (asset) => {
        setAssetModalOpen(false);
        setEditingAsset(null);
        setSelectedUuid(asset.uuid);
        queryClient.invalidateQueries(["v3-assets"]);
        queryClient.invalidateQueries(["v3-asset", asset.uuid]);
        queryClient.invalidateQueries(["v3-asset-events", asset.uuid]);
        message.success("资产已更新");
      },
    }
  );
  const archiveMutation = useMutation(archiveAsset, {
    onSuccess: (asset) => {
      queryClient.invalidateQueries(["v3-assets"]);
      queryClient.invalidateQueries(["v3-asset", asset.uuid]);
      queryClient.invalidateQueries(["v3-asset-events", asset.uuid]);
      message.success("资产已归档");
    },
  });

  const assets = assetsQuery.data?.data || [];
  const pagination = assetsQuery.data?.pagination;

  const columns: ColumnsType<Asset> = [
    {
      title: "资产编号",
      dataIndex: "assetNumber",
      width: 170,
      render: (value: string) => <Text code>{value || "-"}</Text>,
    },
    {
      title: "资产名称",
      dataIndex: "name",
      render: (value: string, asset) => (
        <Button type="link" className="npcink-v3-link" onClick={() => setSelectedUuid(asset.uuid)}>
          {value || "未命名资产"}
        </Button>
      ),
    },
    {
      title: "类型",
      dataIndex: "assetType",
      width: 120,
      render: assetTypeLabel,
    },
    { title: "使用人", dataIndex: "ownerName", width: 120, render: (value) => value || "-" },
    { title: "部门", dataIndex: "department", width: 140, render: (value) => value || "-" },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (value: string) => (
        <Tag color={statusColor[value] || "default"}>{statusLabel(value)}</Tag>
      ),
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      width: 180,
      render: formatDate,
    },
  ];

  const submitAsset = async (values: AssetInput) => {
    if (editingAsset) {
      await updateMutation.mutateAsync({ uuid: editingAsset.uuid, input: values });
      return;
    }
    await createMutation.mutateAsync(values);
  };

  const openCreateModal = () => {
    setEditingAsset(null);
    setAssetModalOpen(true);
  };

  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetModalOpen(true);
  };

  const confirmArchive = (asset: Asset) => {
    Modal.confirm({
      title: "归档这台资产？",
      content: `${asset.assetNumber || asset.uuid} 将被标记为已归档，不会物理删除。`,
      okText: "归档",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: () => archiveMutation.mutateAsync(asset.uuid),
    });
  };

  const handleTableChange = (nextPagination: TablePaginationConfig) => {
    setPage(nextPagination.current || 1);
    setPageSize(nextPagination.pageSize || 20);
  };

  return (
    <div className="npcink-v3-app">
      <div className="npcink-v3-header">
        <div>
          <Title level={2}>资产台账</Title>
          <Text type="secondary">以资产为中心管理人工登记、客户端采集、身份匹配和变更事件。</Text>
        </div>
        <Space>
          <Button onClick={() => setTokenModalOpen(true)}>客户端令牌</Button>
          <Button type="primary" onClick={openCreateModal}>
            新增资产
          </Button>
        </Space>
      </div>

      <div className="npcink-v3-toolbar">
        <Input.Search
          allowClear
          placeholder="搜索编号、名称、使用人、部门"
          onSearch={(value) => {
            setPage(1);
            setSearch(value);
          }}
          className="npcink-v3-search"
        />
        <Select
          allowClear
          placeholder="资产类型"
          options={ASSET_TYPES}
          value={assetType}
          onChange={(value) => {
            setPage(1);
            setAssetType(value);
          }}
          className="npcink-v3-filter"
        />
        <Select
          allowClear
          placeholder="状态"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(value) => {
            setPage(1);
            setStatus(value);
          }}
          className="npcink-v3-filter"
        />
      </div>

      <Table
        rowKey="uuid"
        size="middle"
        columns={columns}
        dataSource={assets}
        loading={assetsQuery.isLoading || assetsQuery.isFetching}
        onChange={handleTableChange}
        onRow={(asset) => ({
          onDoubleClick: () => setSelectedUuid(asset.uuid),
        })}
        pagination={{
          current: page,
          pageSize,
          total: pagination?.totalItems || 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条资产`,
        }}
        locale={{ emptyText: <Empty description="暂无资产" /> }}
      />

      <DetailDrawer
        uuid={selectedUuid}
        open={Boolean(selectedUuid)}
        onClose={() => setSelectedUuid(null)}
        onEdit={openEditModal}
        onArchive={confirmArchive}
      />
      <AssetFormModal
        asset={editingAsset}
        open={assetModalOpen}
        onClose={() => setAssetModalOpen(false)}
        onSubmit={submitAsset}
      />
      <TokenModal open={tokenModalOpen} onClose={() => setTokenModalOpen(false)} />
    </div>
  );
};

export default AssetWorkspace;
