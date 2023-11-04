/**
 * 设置
 */

import { Button, Form, Input, Switch, message } from "antd";
import { option, Site } from "@/store";
import { saveSQLData } from "@/store/axios";

import Export from "@/components/page/config/importChange";

type FieldType = {
  route?: string;
  password?: string;
  delete_mysql?: boolean;
};

const App: React.FC = () => {
  //提示信息
  const [messageApi, contextHolder] = message.useMessage();
  //成功
  const success = () => {
    messageApi.open({
      type: "success",
      content: "保存成功",
      style: {
        marginTop: "6vh",
      },
    });
  };

  //失败
  const warning = () => {
    messageApi.open({
      type: "warning",
      content: "保存失败",
      style: {
        marginTop: "6vh",
      },
    });
  };

  //保存选项动作
  const postData = async (optionObj: object) => {
    const state = saveSQLData(optionObj);
    if (await state) {
      success();
    } else {
      warning();
    }
  };

  //数据验证成功回调
  const onFinish = (values: any) => {
    console.log("Success:", values);
    postData(values); //保存选项
  };

  //数据验证失败回调
  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  const [form] = Form.useForm<{ route: string }>();
  const data = Form.useWatch("route", form);
  //拼接路由TODO:内容验证
  const routerMsg = () => {
    return Site + "/wp-json/npcink/v1/" + data;
  };

  return (
    <>
      {contextHolder}
      <Form
        name="basic"
        form={form}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        initialValues={option} //默认选项值
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item<FieldType>
          label="路由"
          name="route"
          rules={[{ required: true, message: "客户端传输数据时的地址" }]}
          extra={
            <>
              "客户端传输数据时的地址"
              <pre>{routerMsg()}</pre>
            </>
          }
        >
          <Input />
        </Form.Item>

        <Form.Item<FieldType>
          label="密码"
          name="password"
          rules={[{ required: true, message: "客户端传输数据时的验证码" }]}
          extra={"客户端传输数据时的验证码"}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item<FieldType>
          label="删除插件数据"
          name="delete_mysql"
          valuePropName="checked"
          extra={"删除插件用数据库和选项值"}
        >
          <Switch />
        </Form.Item>

        <Form.Item label="基础数据" extra={"方便数据迁移操作"}>
          <Export name="custom_table" />
        </Form.Item>
        <Form.Item label="变更数据" extra={"方便数据迁移操作"}>
          <Export name="custom_change" />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit" className=" bg-[#1677ff]">
            保存
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default App;
