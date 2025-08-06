/**
 * 添加数据的输入表单
 */
import { useContext } from "react";
import { StyleContext } from "@/components/styleList/styleContext";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Col,
  Row,
  DatePicker,
  Select,
} from "antd";
import type { FormProps, FormInstance } from "antd";
import dayjs from "dayjs";
import { addStyleDeviceData } from "@/axios";

import {
  device_status,
  stylePlatform,
  stylePayType,
} from "@/store/dataReplace";
import { devStatus } from "@/store/tool";

//准备采购平台,付款方式
import { StyleDeviceData } from "@/store/interface";

//准备输入框
const { TextArea } = Input;

//当前表格的数据类型
type FormType = StyleDeviceData & {
  name: string; //使用人
  purpose: string; //用途
  state: "apply" | "idie" | "fault" | "scrap"; //设备状态
};

const onFinishFailed: FormProps<FormType>["onFinishFailed"] = (errorInfo) => {
  console.log("Failed:", errorInfo);
};

//准备选项默认值
const defaultValue: FormType = {
  name: "",
  purpose: "",
  state: "apply", //设备状态
  title: "",
  number: 1,
  total: 0,
  platform: "TaoBao",
  shop_name: "",
  link: "",
  order_time: dayjs(), //当天日期
  order: "",
  pay_method: "Alipay",
  purchaser: "",
};

// 在文件顶部添加 props 类型定义
type AddFormProps = {
  handleOk: () => void; //关闭弹窗
  form?: FormInstance; // 支持传入 form 实例
};

const App = ({ form, handleOk }: AddFormProps) => {
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
    /**
     * 请求成功后，获取返回的UUID、ID和time,加入到data中
     */

    //成功添加则清除输入框
    if (state) {
      alert("添加成功");
      console.log("返回的值：");
      console.dir(state);
      form?.resetFields(); // 清除表单输入
      handleOk(); // 关闭弹窗
      handleAddDevice(data); // 调用添加设备的回调函数
    } else {
      alert("添加失败");
    }
    //console.log("成功，表单原始值:", values);
    //console.log("整理后的设备信息：", data);
  };

  //一键填充数据，测试用
  const fillTestData = () => {
    form?.setFieldsValue({
      name: "张三",
      purpose: "测试用途",
      state: "apply",
      title: "华为路由器",
      number: 2,
      total: 2300,
      platform: "TaoBao",
      shop_name: "华为路由器专卖店",
      link: "https://www.taobao.com",
      order_time: dayjs(),
      order: "tbasdf65616",
      pay_method: "zfb",
      purchaser: "王五",
    });
  };

  return (
    <Form
      form={form}
      name="basic"
      labelCol={{ span: 7 }}
      wrapperCol={{ span: 17 }}
      style={{ maxWidth: 600 }}
      initialValues={defaultValue}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
    >
      <Form.Item<FormType>
        label="店铺名称"
        name="shop_name"
        rules={[{ required: true, message: "请填写此信息" }]}
      >
        <Input allowClear />
      </Form.Item>
      <Form.Item<FormType>
        label="订单单号"
        name="order"
        rules={[{ required: true, message: "请填写此信息" }]}
      >
        <Input allowClear />
      </Form.Item>
      <Form.Item<FormType>
        label="设备名称："
        name="title"
        rules={[{ required: true, message: "请填写此信息" }]}
      >
        <Input allowClear />
      </Form.Item>

      <Form.Item<FormType>
        label="设备用途："
        name="purpose"
        rules={[{ required: true, message: "请填写此信息" }]}
      >
        <Input allowClear />
      </Form.Item>
      <Form.Item<FormType>
        label="购买链接："
        name="link"
        rules={[{ required: true, message: "请填写此信息" }]}
      >
        <TextArea rows={2} allowClear />
      </Form.Item>
      <Row>
        <Col span={8}>
          <Form.Item<FormType>
            label="数量"
            name="number"
            rules={[{ required: true, message: "请填写此信息" }]}
          >
            <InputNumber addonAfter="个" style={{ width: 122 }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item<FormType>
            label="价格"
            name="total"
            rules={[{ required: true, message: "请填写此信息" }]}
          >
            <InputNumber addonAfter="¥" style={{ width: 122 }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item<FormType>
            label="时间"
            name="order_time"
            rules={[{ required: true, message: "请填写此信息" }]}
          >
            <DatePicker />
          </Form.Item>
        </Col>
      </Row>

      <Row>
        <Col span={8}>
          <Form.Item<FormType>
            label="采购"
            name="platform"
            rules={[{ required: true, message: "请填写此信息" }]}
          >
            <Select options={stylePlatform} style={{ width: 122 }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item<FormType>
            label="支付"
            name="pay_method"
            rules={[{ required: true, message: "请填写此信息" }]}
          >
            <Select options={stylePayType} style={{ width: 122 }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item<FormType>
            label="状态："
            name="state"
            rules={[{ required: true, message: "请填写此信息" }]}
          >
            <Select options={device_status} style={{ width: 122 }} />
          </Form.Item>
        </Col>
      </Row>

      <Row>
        <Col span={12}>
          <Form.Item<FormType>
            label="使用人："
            name="name"
            rules={[{ required: true, message: "请填写此信息" }]}
          >
            <Input allowClear placeholder="人员，部门或位置" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item<FormType>
            label="采购人"
            name="purchaser"
            rules={[{ required: true, message: "请填写此信息" }]}
          >
            <Input allowClear placeholder="负责购买此设备的人" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          提交
        </Button>
        {devStatus && (
          <Button
            type="default"
            onClick={fillTestData}
            style={{ marginLeft: 8 }}
          >
            填充测试数据
          </Button>
        )}
      </Form.Item>
    </Form>
  );
};

export default App;
