/**
 * 设置
 */
import axios from "axios";
import { Button, Form, Input, message } from "antd";
import { dataAjaxurl } from "@/store/dataContext";
import { option } from "@/store/dataContext";

type FieldType = {
  route?: string;
  password?: string;
};

const App: React.FC = () => {
  //提示信息
  const [messageApi, contextHolder] = message.useMessage();
  const success = () => {
    messageApi.open({
      type: "success",
      content: "保存成功",
      style: {
        marginTop: "6vh",
      },
    });
  };
  const warning = () => {
    messageApi.open({
      type: "warning",
      content: "保存失败",
      style: {
        marginTop: "6vh",
      },
    });
  };

  //提交动作
  const postData = async (optionObj: object) => {
    const params = new URLSearchParams();
    params.append("action", "save_object_option");
    params.append("object_data", JSON.stringify(optionObj));
    try {
      const response = await axios.post(dataAjaxurl, params);

      if (response.status === 200) {
        //保存成功
        console.log(response);

        success();
      } else {
        console.error("保存设置选项时出错：" + response.data);

        warning();
      }
    } catch (error: any) {
      console.error("保存设置选项时出错：" + error.message);
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

  return (
    <>
      {contextHolder}
      <Form
        name="basic"
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
          extra={"客户端传输数据时的地址"}
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

        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit">
            保存
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default App;
