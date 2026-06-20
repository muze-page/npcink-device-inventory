/**
 * 设置
 */
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusCircleFilled } from "@ant-design/icons";

import { defaultOption, Site, sqlTableName } from "@/utils/index";
import {
  addPublicSearchPage,
  applyPcMigrationPhase1,
  generateClientToken,
  getClientTokens,
  precheckPcMigrationPhase1,
  revokeClientToken,
  saveSQLData,
} from "@/services/index";

import ImportExport from "@/pages/config/importExport";
import ExportPcExcel from "@/pages/config/exportPcExcel";
import type { ClientTokenSummary, OptionType } from "@/type/index";
import Header from "@/components/tabHeader";

const { Text, Paragraph } = Typography;

const App: React.FC = () => {
  const [option, setOption] = useState<OptionType>({
    ...defaultOption,
    password: defaultOption.password ? "已设定" : defaultOption.password,
  });
  const [tokens, setTokens] = useState<ClientTokenSummary[]>(
    defaultOption.client_tokens || []
  );
  const [tokenName, setTokenName] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");
  const [generatingToken, setGeneratingToken] = useState(false);
  const [migratingPc, setMigratingPc] = useState(false);
  const [migrationReport, setMigrationReport] = useState<any>(null);
  const [publicSearch, setPublicSearch] = useState(
    defaultOption.public_search_route || "public-search-page"
  );
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue(option);
  }, [option, form]);

  useEffect(() => {
    getClientTokens()
      .then((res) => setTokens(res.items || []))
      .catch(() => null);
  }, []);

  const postData = async (values: OptionType) => {
    const payload = {
      ...option,
      ...values,
      public_search_route: values.public_search_route || publicSearch,
    };
    const res = await saveSQLData(payload);
    if (res?.success) {
      setOption(payload);
    }
  };

  const addPage = async () => {
    if (publicSearch.trim() === "") {
      return message.error("请输入公共查询页面路由地址");
    }
    const res = await addPublicSearchPage(publicSearch);
    if (res?.success) {
      const newOption = {
        ...option,
        public_search_route: publicSearch,
      };
      setOption(newOption);
      form.setFieldsValue({ public_search_route: publicSearch });
      await postData(newOption);
    }
  };

  const generateUploadToken = async () => {
    setGeneratingToken(true);
    try {
      const res = await generateClientToken(tokenName.trim() || undefined);
      setGeneratedToken(res.token);
      setTokens(res.items || (res.item ? [res.item, ...tokens] : tokens));
      setTokenName("");
      message.success("上传授权码已生成");
    } finally {
      setGeneratingToken(false);
    }
  };

  const copyGeneratedToken = async () => {
    if (!generatedToken) return;
    try {
      await navigator.clipboard.writeText(generatedToken);
      message.success("已复制上传授权码");
    } catch {
      message.error("复制失败，请手动选择授权码复制");
    }
  };

  const confirmRevokeToken = (item: ClientTokenSummary) => {
    Modal.confirm({
      title: "停用上传授权码",
      content: `确定停用“${item.name || item.preview}”吗？已安装的上传软件将无法继续使用这个授权码提交数据。`,
      okText: "停用",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await revokeClientToken(item.id);
        setTokens(res.items || []);
      },
    });
  };

  const precheckMigration = async () => {
    setMigratingPc(true);
    try {
      const res = await precheckPcMigrationPhase1();
      setMigrationReport(res);
      message.success("迁移预检完成");
    } finally {
      setMigratingPc(false);
    }
  };

  const applyMigration = () => {
    Modal.confirm({
      title: "转换旧电脑数据",
      content:
        "将旧 Electron 数据转换成 v2 新结构，并把设备 UUID 切换为 stable_device_id_v2。建议先导出备份。",
      okText: "开始转换",
      cancelText: "取消",
      onOk: async () => {
        setMigratingPc(true);
        try {
          const res = await applyPcMigrationPhase1();
          setMigrationReport(res);
          message.success("旧电脑数据已转换为 v2 新结构");
        } finally {
          setMigratingPc(false);
        }
      },
    });
  };

  const tokenColumns: ColumnsType<ClientTokenSummary> = [
    {
      title: "名称",
      dataIndex: "name",
      render: (value: string) => value || "上传授权码",
    },
    {
      title: "授权码",
      dataIndex: "preview",
      render: (value: string) => <Text code>{value || "已生成"}</Text>,
    },
    {
      title: "状态",
      dataIndex: "enabled",
      width: 90,
      render: (enabled: boolean) =>
        enabled ? <Tag color="green">启用</Tag> : <Tag>已停用</Tag>,
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      width: 170,
      render: (value: string) => value || "-",
    },
    {
      title: "最后使用",
      dataIndex: "last_used_at",
      width: 170,
      render: (value: string) => value || "未使用",
    },
    {
      title: "操作",
      width: 90,
      render: (_, item) => (
        <Button
          danger
          size="small"
          htmlType="button"
          disabled={!item.enabled}
          onClick={() => confirmRevokeToken(item)}
        >
          停用
        </Button>
      ),
    },
  ];

  const uploadAuthPanel = (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Alert
        type="info"
        showIcon
        message="新版上传只使用上传授权码"
        description="上传软件提交数据时会自动生成 HMAC 签名。后台不会保存完整授权码，生成后请立即复制到上传软件。"
      />
      <Space.Compact style={{ width: "100%", maxWidth: 520 }}>
        <Input
          value={tokenName}
          placeholder="授权码名称，例如：前台 MacBook / 张三电脑"
          onChange={(event) => setTokenName(event.target.value)}
        />
        <Button
          type="primary"
          htmlType="button"
          className="bg-[#1677ff]"
          loading={generatingToken}
          onClick={generateUploadToken}
        >
          生成授权码
        </Button>
      </Space.Compact>
      {generatedToken ? (
        <Alert
          type="warning"
          showIcon
          message="请现在复制"
          description={
            <Space direction="vertical" style={{ width: "100%" }}>
              <Paragraph copyable={{ text: generatedToken }} style={{ margin: 0 }}>
                <Text code>{generatedToken}</Text>
              </Paragraph>
              <Button htmlType="button" onClick={copyGeneratedToken}>
                复制授权码
              </Button>
            </Space>
          }
        />
      ) : null}
      <Table
        rowKey="id"
        size="middle"
        columns={tokenColumns}
        dataSource={tokens}
        pagination={false}
        locale={{ emptyText: "还没有上传授权码" }}
      />
    </Space>
  );

  const assetPanel = (
    <>
      <Form.Item
        label="折旧年限"
        name="depreciation_year"
        extra="例如三年共 36 个月，36 个月后折旧完毕。"
      >
        <InputNumber addonAfter="月" style={{ width: 140 }} />
      </Form.Item>
      <Form.Item
        label="残值率"
        name="residual_value_rate"
        extra="例如 5%，用了三年后，最少也值采购价的 5%。"
      >
        <InputNumber addonAfter="%" style={{ width: 140 }} />
      </Form.Item>
    </>
  );

  const publicQueryPanel = (
    <>
      <Form.Item
        label="查询密码"
        name="password"
        rules={[{ required: true, message: "请输入公共查询密码" }]}
        extra="仅用于公共查询页面，不再用于新版上传软件。"
      >
        <Input.Password style={{ maxWidth: 360 }} />
      </Form.Item>
      <Form.Item
        label="公共查询页面"
        extra={
          <>
            公共查询页面地址：
            <pre>{Site + "/" + publicSearch}</pre>
          </>
        }
      >
        <Space.Compact style={{ width: "100%", maxWidth: 460 }}>
          <Input
            value={publicSearch}
            placeholder="填写页面路由"
            onChange={(event) => {
              setPublicSearch(event.target.value);
              form.setFieldsValue({ public_search_route: event.target.value });
            }}
          />
          <Button
            htmlType="button"
            icon={<PlusCircleFilled />}
            onClick={addPage}
          >
            添加页面
          </Button>
        </Space.Compact>
      </Form.Item>
    </>
  );

  const importExportPanel = (
    <>
      <Form.Item label="电脑设备数据" className="mt-4">
        <ImportExport name={sqlTableName.pcData} />
      </Form.Item>
      <Form.Item label="自定义设备数据">
        <ImportExport name={sqlTableName.styleData} />
      </Form.Item>
      <Form.Item label="手动变更数据">
        <ImportExport name={sqlTableName.changeManualData} />
      </Form.Item>
      <Form.Item label="自动变更数据">
        <ImportExport name={sqlTableName.changeAutoData} />
      </Form.Item>
      <Form.Item label="Excel 导出">
        <ExportPcExcel />
      </Form.Item>
    </>
  );

  const dangerPanel = (
    <>
      <Form.Item
        label="删除插件数据"
        name="delete_mysql"
        valuePropName="checked"
        extra="删除插件的同时，删除数据库和设置信息。"
      >
        <Switch />
      </Form.Item>
      <Form.Item label="旧数据迁移">
        <Space direction="vertical" style={{ width: "100%" }}>
          <Alert
            type="warning"
            showIcon
            message="一次性转换旧电脑数据"
            description="导入旧数据后执行一次。转换后设备数据会写成 v2 新结构，列表和详情不再读取旧字段。"
          />
          <Space>
            <Button htmlType="button" loading={migratingPc} onClick={precheckMigration}>
              预检
            </Button>
            <Button
              htmlType="button"
              type="primary"
              className="bg-[#1677ff]"
              loading={migratingPc}
              onClick={applyMigration}
            >
              转换为新结构
            </Button>
          </Space>
          {migrationReport ? (
            <Alert
              type="info"
              showIcon
              message={`扫描 ${migrationReport.summary?.scanned || 0} 条，已转换 ${migrationReport.updated || 0} 条，跳过 ${migrationReport.skipped || 0} 条`}
              description={`ready: ${migrationReport.summary?.ready || 0}，already_migrated: ${migrationReport.summary?.already_migrated || 0}，needs_review: ${migrationReport.summary?.needs_review || 0}，blocked: ${migrationReport.summary?.blocked || 0}`}
            />
          ) : null}
        </Space>
      </Form.Item>
      <Form.Item name="public_search_route" hidden>
        <Input />
      </Form.Item>
    </>
  );

  return (
    <div className="pb-6 px-5">
      <Header title="设置" />
      <Form
        form={form}
        onFinish={postData}
        labelCol={{ span: 5 }}
        wrapperCol={{ span: 19 }}
        style={{ maxWidth: 980 }}
        initialValues={option}
        autoComplete="off"
      >
        <Tabs
          items={[
            {
              key: "upload",
              label: "上传授权",
              children: uploadAuthPanel,
            },
            {
              key: "asset",
              label: "资产参数",
              children: assetPanel,
            },
            {
              key: "public",
              label: "公共查询",
              children: publicQueryPanel,
            },
            {
              key: "data",
              label: "导入导出",
              children: importExportPanel,
            },
            {
              key: "danger",
              label: "危险操作",
              children: dangerPanel,
            },
          ]}
        />
        <Form.Item wrapperCol={{ offset: 5, span: 19 }}>
          <Button type="primary" htmlType="submit" className="bg-[#1677ff]">
            保存设置
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default App;
