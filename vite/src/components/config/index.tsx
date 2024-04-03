/**
 * 设置
 */
import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  Switch,
  Select,
  InputNumber,
  message,
} from "antd";
import { option, Site } from "@/store";
import { saveSQLData } from "@/store/axios";

import ImportExport from "@/components/config/importExport";

const App: React.FC = () => {
  /*form 变量用于操作表单实例，

而 formData 状态变量用于存储表单数据。

*/

  const [form] = Form.useForm();

  const [formData, setFormData] = useState(null);

  // 当 option 发生变化时更新表单的默认值

  useEffect(() => {
    form.setFieldsValue(option);
  }, [option, form]);

  //保存选项动作
  const postData = async (optionObj: object) => {
    const state = saveSQLData(optionObj);
    if (await state) {
      message.success("保存成功");
    } else {
      message.error("保存失败");
    }
  };

  //数据验证成功回调
  const onFinish = (values: any) => {
    //console.log("Success:", values);
    postData(values); //保存选项
    console.log("Received values:", values);

    setFormData(values); // 将表单数据存储在状态中
  };

  //数据验证失败回调
  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  const RouteData = Form.useWatch("route", form);
  //拼接路由TODO:内容验证
  const routerMsg = () => {
    return Site + "/wp-json/npcink/v1/" + RouteData;
  };

  //下拉筛选 - 准备筛选数据
  const getSelectData = () => {
    const arr = option.department;
    const obj = arr.map((str) => ({
      value: str,
      label: str,
    }));
    return obj;
  };
  //下拉筛选
  const handleChange = (value: string) => {
    console.log(`选中 ${value}`);
  };

  //数字输入
  const onChange = (value: 10 | 1 | 3 | null) => {
    console.log("changed", value);
  };

  return (
    <>
      <Form
        form={form}
        onFinish={onFinish}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
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
              "客户端传输数据时的地址"
              <pre>{routerMsg()}</pre>
            </>
          }
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[{ required: true, message: "客户端传输数据时的验证码" }]}
          extra={"客户端传输数据时的验证码"}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label="删除插件数据"
          name="delete_mysql"
          valuePropName="checked"
          extra={"删除插件的同时，删除数据库和设置"}
        >
          <Switch className=" bg-[#e3eaf2]" />
        </Form.Item>

        <Form.Item label="基础数据" extra={"方便数据迁移操作"}>
          <ImportExport name="custom_table" />
        </Form.Item>
        <Form.Item label="变更数据" extra={"方便数据迁移操作"}>
          <ImportExport name="custom_change" />
        </Form.Item>

        <Form.Item label="添加部门" style={{ width: "100%" }}>
          <Input style={{ width: "70%" }} />
          <Button style={{ width: "30%" }}>添加</Button>
        </Form.Item>
        <Form.Item label="删除部门" name="department">
          <Select
            defaultValue="默认"
            style={{ width: "70%" }}
            onChange={handleChange}
            options={getSelectData()}
          />
          <Button style={{ width: "30%" }}>删除</Button>
        </Form.Item>
        <Form.Item
          label="设备数量"
          name="device_show_number"
          extra={"设备详情页展示的数量，默认 8"}
        >
          <InputNumber min={1} max={10} defaultValue={3} onChange={onChange} />
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
