/**
 * 设置
 */
import { useEffect, useState } from "react";
import { Button, Form, Input, Switch, InputNumber, message, Alert, Space } from "antd";
import { PlusCircleFilled } from "@ant-design/icons";

import { defaultOption, Site, sqlTableName } from "@/utils/index";
import { saveSQLData, addPublicSearchPage, generateClientToken } from "@/services/index";

import ImportExport from "@/pages/config/importExport";
import ExportPcExcel from "@/pages/config/exportPcExcel";
import { OptionType } from "@/type/index";
import Header from "@/components/tabHeader";

const App: React.FC = () => {
  //传来的默认选项
  const [option, setOption] = useState<OptionType>(defaultOption);
  const [generatedToken, setGeneratedToken] = useState("");
  const [generatingToken, setGeneratingToken] = useState(false);

  //若密码有值，则设为已设定，后端不会更新密码
  useEffect(() => {
    if (option.password) {
      setOption((prevOption) => ({
        ...prevOption,
        password: "已设定",
      }));
    }
  }, [option.password]); // 仅在 option.password 发生变化时执行

  /**
   * form 变量用于操作表单实例，
   * 而 formData 状态变量用于存储表单数据。

   */
  const [form] = Form.useForm();

  //TODO:最开始，没有设置选项咋办？
  // 当 option 发生变化时更新表单的默认值
  useEffect(() => {
    form.setFieldsValue(option);
  }, [option, form]);

  //保存选项动作
  const postData = async (optionObj: object) => {
    try {
      return await saveSQLData(optionObj);
    } catch {
      return null;
    }
  };

  //数据验证成功回调
  const onFinish = (values: OptionType) => {
    //判断
    postData(values); //保存选项
    //console.log("Received values:", values);
  };

  //数据验证失败回调
  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  //拼接路由TODO:内容验证
  const RouteData = Form.useWatch("route", form);

  const routerMsg = () => {
    return Site + "/wp-json/npcink/v1/" + RouteData;
  };

  //公共查询页面
  const [publicSearch, setPublicSearch] = useState(""); // 公共查询输入框的值

  //添加页面
  const addPage = async () => {
    //检查输入框是否为空
    if (publicSearch.trim() === "") {
      return message.error("请输入公共查询页面路由地址");
    }
    try {
      const res = await addPublicSearchPage(publicSearch); //添加页面
      if (res?.success) {
        const newOption = {
          ...option,
          public_search_route: publicSearch,
        };
        setOption(newOption); //设定值
        postData(newOption); //保存选项
      }
    } catch {}
  };

  const generateUploadToken = async () => {
    setGeneratingToken(true);
    try {
      const res = await generateClientToken();
      setGeneratedToken(res.token);
      setOption((prev) => ({
        ...prev,
        has_client_token: true,
        client_token_id: res.token_id,
        client_token_preview: res.preview,
        client_token_created_at: res.created_at,
      }));
      message.success("上传授权码已生成");
    } catch {
      // axios interceptor will show a friendly error.
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

  //拼接公共搜索路由
  const routerSearch = () => {
    return Site + "/" + publicSearch;
  };

  // 在组件加载时设置输入框的默认值
  useEffect(() => {
    // 检查默认选项中是否有公共查询页面的默认值
    if (option.public_search_route) {
      // 如果有，默认值为默认选项中的值
      setPublicSearch(option.public_search_route);
    } else {
      // 否则，设置一个默认的默认值
      setPublicSearch("public_search_route");
    }
  }, [option]);

  return (
    <>
      <div className="pb-6 px-5">
        <Header title="设置" />
        <Form
          form={form}
          onFinish={onFinish}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          style={{ maxWidth: 600 }}
          initialValues={option} //默认选项值
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item
            label="路由"
            name="route"
            rules={[{ required: true, message: "客户端传输数据时的地址" }]}
            extra={
              <>
                客户端数据传输地址：
                <pre>{routerMsg()}</pre>
              </>
            }
          >
            <Input style={{ width: "300px" }} />
          </Form.Item>

          <Form.Item
            label="兼容密码"
            name="password"
            rules={[{ required: true, message: "客户端传输数据时的密码" }]}
            extra={"仅用于旧上传端和公共查询兼容。新版上传软件请使用下方上传授权码。"}
          >
            <Input style={{ width: "300px" }} />
          </Form.Item>

          <Form.Item
            label="上传授权码"
            extra={
              option.has_client_token
                ? `当前授权码：${option.client_token_preview || option.client_token_id || "已生成"}${
                    option.client_token_created_at ? `，生成时间：${option.client_token_created_at}` : ""
                  }`
                : "尚未生成。生成后复制到新版上传软件，软件会自动完成 HMAC 签名。"
            }
          >
            <Space direction="vertical" style={{ width: "100%", maxWidth: 460 }}>
              <Space>
                <Button onClick={generateUploadToken} loading={generatingToken}>
                  {option.has_client_token ? "重置授权码" : "生成授权码"}
                </Button>
                {generatedToken && (
                  <Button onClick={copyGeneratedToken}>
                    复制授权码
                  </Button>
                )}
              </Space>
              {generatedToken && (
                <Input.TextArea
                  value={generatedToken}
                  readOnly
                  autoSize
                  style={{ fontFamily: "monospace" }}
                />
              )}
              {generatedToken && (
                <Alert
                  type="warning"
                  showIcon
                  message="请现在复制"
                  description="上传授权码只在生成后显示一次。重置后，旧上传授权码会失效。"
                />
              )}
            </Space>
          </Form.Item>
          <Form.Item
            label="删除插件数据"
            name="delete_mysql"
            valuePropName="checked"
            extra={"删除插件的同时，删除数据库和设置信息"}
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label="折旧年限"
            name="depreciation_year"
            extra={"例如三年共36个月，36个月后折旧完毕，用回本了"}
          >
            <InputNumber addonAfter="月" style={{ width: "120px" }} />
          </Form.Item>
          <Form.Item
            label="残值率"
            name="residual_value_rate"
            extra={"例如 5% ，用了三年后，最少也值采购价的 5% "}
          >
            <InputNumber addonAfter="%" style={{ width: "120px" }} />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 2, span: 22 }}>
            <Button type="primary" htmlType="submit" className=" bg-[#1677ff]">
              保存
            </Button>
          </Form.Item>

          <Header title="其他设置" />

          <Form.Item
            label="公共查询页面"
            name="public_search_route"
            extra={
              <>
                公共查询页面地址：
                <pre>{routerSearch()}</pre>
              </>
            }
          >
            <div>
              <Input
                style={{ width: "180px" }}
                value={publicSearch}
                placeholder="填写页面路由"
                onChange={(e) => setPublicSearch(e.target.value)}
              />
              <Button
                icon={<PlusCircleFilled />}
                style={{ width: "90px", marginLeft: "30px" }}
                onClick={addPage}
              >
                添加
              </Button>
            </div>
          </Form.Item>

          <Header title="导入导出" />

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

          <Header title="Excel 导出" />

          <Form.Item label="电脑设备数据">
            <ExportPcExcel />
          </Form.Item>

          <Header title="迁移" />

          <Form.Item
            label="旧数据迁移"
            extra={"等新版数据结构稳定后，通过导出文件一次性离线迁移旧数据。"}
          >
            <Alert
              type="info"
              showIcon
              message="迁移暂未启用"
              description="当前只接收和展示 v2 新数据。旧数据迁移不会在后台直接执行，后续确认数据结构后再导出、转换、验证并导入。"
            />
          </Form.Item>
        </Form>
      </div>
    </>
  );
};

export default App;
