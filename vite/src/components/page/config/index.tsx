/**
 * 设置
 */
import axios from "axios";
import { Space, Button, Form, Input, message } from "antd";
import { dataMySql, option, Ajaxurl, Site } from "@/store";
import { importSQLData } from "@/store/axios";
import { useState } from "react";

type FieldType = {
  route?: string;
  password?: string;
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
    const params = new URLSearchParams();
    params.append("action", "save_object_option");
    params.append("object_data", JSON.stringify(optionObj));
    try {
      const response = await axios.post(Ajaxurl, params);

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

  const [form] = Form.useForm<{ route: string }>();
  const data = Form.useWatch("route", form);
  //拼接路由TODO:内容验证
  const routerMsg = () => {
    return Site + "/wp-json/npcink/v1/" + data;
  };

  //导入数据

  const [jsonContent, setJsonContent] = useState(null);
  //选中数据
  const handleFileChange = (event: any) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const content = e.target.result;
      const jsonData = JSON.parse(content);
      setJsonContent(jsonData);//保存数据
      
    };
    reader.readAsText(file);
  };

  //保存到数据库
  const importData = () => {
    const jsonData = jsonContent;
    const jsonString = JSON.stringify(jsonData);
    importSQLData(jsonString);
  };

  //导出数据
  const downloadData = () => {
    const jsonData = dataMySql;
    const jsonString = JSON.stringify(jsonData);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "硬件管理数据-导出文件.json";
    link.click();

    // 等待一段时间后释放 URL 对象
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
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
        <Form.Item label="数据管理" extra={"方便数据迁移操作"}>
          <Space>
            <input type="file" accept=".json" onChange={handleFileChange} />
            <Button type="text" onClick={importData}>
              导入
            </Button>
            <Button type="text" onClick={downloadData}>
              导出
            </Button>
          </Space>
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
