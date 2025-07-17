/**
 * 添加数据的输入表单
 */

import React from "react";
import type { FormProps } from "antd";
import { Button, Radio, Form, Input } from "antd";
import { device_status } from "@/store/dataReplace";
import { StyleDevice, StyleDeviceData } from "@/store/interface";
const onFinish: FormProps<StyleDevice>["onFinish"] = (values) => {
  console.log("Success:", values);
};

const onFinishFailed: FormProps<StyleDevice>["onFinishFailed"] = (
  errorInfo
) => {
  console.log("Failed:", errorInfo);
};

//状态选项 device_status

const App: React.FC = () => (
  <Form
    name="basic"
    labelCol={{ span: 8 }}
    wrapperCol={{ span: 16 }}
    style={{ maxWidth: 600 }}
    initialValues={{ remember: true }}
    onFinish={onFinish}
    onFinishFailed={onFinishFailed}
    autoComplete="off"
  >
    <Form.Item<StyleDevice> label="使用人：" name="name">
      <Input />
    </Form.Item>
    <Form.Item<StyleDevice> label="用途：" name="purpose">
      <Input />
    </Form.Item>
    <Form.Item<StyleDevice> label="状态：" name="state">
      <Radio.Group options={device_status} defaultValue="Apple" />
    </Form.Item>
    <Form.Item<StyleDeviceData> label="设备名称：" name="title">
      <Input />
    </Form.Item>
    <Form.Item<StyleDeviceData> label="设备数量" name="number">
      <Input />
    </Form.Item>
    <Form.Item<StyleDeviceData> label="价格" name="total">
      <Input />
    </Form.Item>
    <Form.Item<StyleDeviceData> label="平台" name="platform">
      <Input />
    </Form.Item>
    <Form.Item<StyleDeviceData> label="店铺名称" name="shop_name">
      <Input />
    </Form.Item>
    <Form.Item<StyleDeviceData> label="购买链接：" name="link">
      <Input />
    </Form.Item>
    <Form.Item<StyleDeviceData> label="下单时间" name="order_time">
      <Input />
    </Form.Item>
    <Form.Item<StyleDeviceData> label="订单号" name="order">
      <Input />
    </Form.Item>
    <Form.Item<StyleDeviceData> label="支付方式" name="pay_method">
      <Input />
    </Form.Item>
    <Form.Item<StyleDeviceData> label="采购人" name="purchaser">
      <Input />
    </Form.Item>
    <Form.Item label={null}>
      <Button type="primary" htmlType="submit">
        提交
      </Button>
    </Form.Item>
  </Form>
);

export default App;
