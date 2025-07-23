/**
 * 添加数据的输入表单
 */
import { useContext } from "react";
import { StyleContext } from "@/components/style/styleContext";
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
import type { FormProps, FormInstance } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { addStyleDeviceData } from "@/axios";
import { device_status } from "@/store/dataReplace";
import { StyleDevice } from "@/store/interface";
//当前表格的数据类型
type FormType = {
  name: string; //使用人
  purpose: string; //用途
  state: string; //设备状态
  title: string; //设备名称
  number: number; //设备名称
  total: number; //单价
  platform: string; //平台
  shop_name: string; //店铺名称
  link: string; //购买链接
  order_time: Dayjs; //下单时间
  order: string; //订单号
  pay_method: string; //支付方式
  purchaser: string; //采购人
};

const onFinishFailed: FormProps<FormType>["onFinishFailed"] = (errorInfo) => {
  console.log("Failed:", errorInfo);
};

//准备选项默认值
const defaultValue: FormType = {
  name: "",
  purpose: "",
  state: "apply",
  title: "",
  number: 0,
  total: 0,
  platform: "",
  shop_name: "",
  link: "",
  order_time: dayjs("2025-07-01"),
  order: "",
  pay_method: "",
  purchaser: "",
  //name: "张三",
  //purpose: "测试用途",
  //state: "apply",
  //title: "华为路由器",
  //number: 2,
  //total: 2300,
  //platform: "淘宝",
  //shop_name: "华为路由器专卖店",
  //link: "https://www.taobao.com",
  //order_time: dayjs("2025-04-05"),
  //order: "tbasdf65616",
  //pay_method: "支付宝",
  //purchaser: "王五",
};

// 在文件顶部添加 props 类型定义
type AddFormProps = {
  onSubmit: (values: StyleDevice) => void; //上传成功后关闭弹窗
  form?: FormInstance; // 支持传入 form 实例
};
const App = ({ onSubmit, form }: AddFormProps) => {
  //拿到添加设备的回调函数
  const { handleAddDevice } = useContext(StyleContext);
  //提交拿到的值
  const onFinish: FormProps<FormType>["onFinish"] = async (values) => {
    //添加弹窗提示，确定提交则继续，不提交则取消
    if (!window.confirm("已检查好数据，并确定提交吗？")) {
      return;
    }
    //将设备信息存入data,方便后续存入数据库
    const data = {
      name: values.name,
      purpose: values.purpose,
      state: values.state,
      data: {
        title: values.title,
        number: values.number,
        total: values.total,
        platform: values.platform,
        shop_name: values.shop_name,
        link: values.link,
        order_time: values.order_time,
        order: values.order,
        pay_method: values.pay_method,
        purchaser: values.purchaser,
      },
    };

    // 发送POST请求
    const state = await addStyleDeviceData(data);

    //成功添加则清除输入框
    if (state) {
      alert("添加成功");
      form?.resetFields(); // 清除表单输入
      onSubmit(data); // 调用上传成功的回调函数
      handleAddDevice(data); // 调用添加设备的回调函数
    } else {
      alert("添加失败");
    }
    console.log("成功，表单原始值:", values);
    console.log("整理后的设备信息：", data);
  };

  return (
    <Form
      form={form}
      name="basic"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      initialValues={defaultValue}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
    >
      <Form.Item<FormType> label="使用人：" name="name">
        <Input placeholder="使用此设备的人员，部门或位置" />
      </Form.Item>

      <Form.Item<FormType> label="设备状态：" name="state">
        <Radio.Group options={device_status} />
      </Form.Item>

      <Form.Item<FormType> label="店铺名称" name="shop_name">
        <Input />
      </Form.Item>
      <Form.Item<FormType> label="设备名称：" name="title">
        <Input />
      </Form.Item>
      <Form.Item<FormType> label="购买链接：" name="link">
        <Input />
      </Form.Item>

      <Form.Item<FormType> label="设备单号" name="order">
        <Input />
      </Form.Item>
      <Form.Item<FormType> label="设备用途：" name="purpose">
        <Input placeholder="此设备的使用用途" />
      </Form.Item>
      <Row>
        <Col span={12}>
          <Form.Item<FormType> label="设备数量" name="number">
            <InputNumber addonAfter="个" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item<FormType> label="采购价格" name="total">
            <InputNumber addonAfter="¥" />
          </Form.Item>
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <Form.Item<FormType> label="采购平台" name="platform">
            <Input placeholder="淘宝、京东、拼多多等 " />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item<FormType> label="付款时间" name="order_time">
            <DatePicker />
          </Form.Item>
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <Form.Item<FormType> label="支付方式" name="pay_method">
            <Input placeholder="微信、支付宝、银联等" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item<FormType> label="采购人员" name="purchaser">
            <Input placeholder="付款购买此设备人的姓名" />
          </Form.Item>
        </Col>
      </Row>

      <Row justify="end">
        <Form.Item>
          <Button type="primary" htmlType="submit">
            提交
          </Button>
        </Form.Item>
      </Row>
    </Form>
  );
};

export default App;
