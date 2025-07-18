/**
 * 添加数据的输入表单
 */

import React from "react";
import type { FormProps } from "antd";
import {
  Button,
  Radio,
  Form,
  Input,
  InputNumber,
  Col,
  Row,
  DatePicker,
} from "antd";
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

//准备选项默认值
const defaultValue: StyleDevice = {
  //id: "9527",
  name: "1",
  purpose: "2",
  state: "apply",
  //time: "3",
  uuid: "4",
  data: {
    title: "5",
    number: 6,
    total: 7,
    platform: "8",
    shop_name: "9",
    link: "10",
    order_time: "11",
    order: "12",
    pay_method: "13",
    purchaser: "14",
  },
};

const App: React.FC = () => (
  <Form
    name="basic"
    labelCol={{ span: 8 }}
    wrapperCol={{ span: 16 }}
    style={{ maxWidth: 600 }}
    initialValues={defaultValue}
    onFinish={onFinish}
    onFinishFailed={onFinishFailed}
    autoComplete="off"
  >
    <Form.Item<StyleDevice> label="使用人：" name="name">
      <Input placeholder="使用此设备的人员，部门或位置" />
    </Form.Item>

    <Form.Item<StyleDevice> label="设备状态：" name="state">
      <Radio.Group options={device_status} defaultValue="apply" />
    </Form.Item>

    <Form.Item<StyleDeviceData> label="店铺名称" name="shop_name">
      <Input />
    </Form.Item>
    <Form.Item<StyleDeviceData> label="设备名称：" name="title">
      <Input />
    </Form.Item>
    <Form.Item<StyleDeviceData> label="购买链接：" name="link">
      <Input />
    </Form.Item>

    <Form.Item<StyleDeviceData> label="设备单号" name="order">
      <Input />
    </Form.Item>
    <Form.Item<StyleDevice> label="设备用途：" name="purpose">
      <Input placeholder="此设备的使用用途" />
    </Form.Item>
    <Row>
      <Col span={12}>
        <Form.Item<StyleDeviceData> label="设备数量" name="number">
          <InputNumber addonAfter="个" defaultValue={1} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item<StyleDeviceData> label="采购价格" name="total">
          <InputNumber addonAfter="¥" defaultValue={1} />
        </Form.Item>
      </Col>
    </Row>
    <Row>
      <Col span={12}>
        <Form.Item<StyleDeviceData> label="采购平台" name="platform">
          <Input placeholder="淘宝、京东、拼多多等 " />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item<StyleDeviceData> label="付款时间" name="order_time">
          <DatePicker />
        </Form.Item>
      </Col>
    </Row>
    <Row>
      <Col span={12}>
        <Form.Item<StyleDeviceData> label="支付方式" name="pay_method">
          <Input placeholder="微信、支付宝、银联等" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item<StyleDeviceData> label="采购人员" name="purchaser">
          <Input placeholder="付款购买此设备人的姓名" />
        </Form.Item>
      </Col>
    </Row>

   
<Form.Item label={null}>
      <Button type="primary" htmlType="submit">
        提交
      </Button>
    </Form.Item>
  
  </Form>
);

export default App;
