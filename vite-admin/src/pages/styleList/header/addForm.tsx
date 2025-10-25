/**
 * 添加数据的输入表单
 */
import { useContext } from "react";
import { StyleContext } from "@/context/StyleContext";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Col,
  Row,
  DatePicker,
} from "antd";
import type { FormProps, FormInstance } from "antd";
import dayjs from "dayjs";
import { addStyleDeviceData } from "@/services/index";
import { devStatus } from "@/utils/tool";

//准备采购平台,付款方式
import { StyleDeviceData } from "@/type/index";
//选择输入框
import SelectInput from "@/components/selectInput";

//准备输入框
//const { TextArea } = Input;

//当前表格的数据类型
type FormType = StyleDeviceData & {
  name: string; //使用人
  purpose: string; //用途
  state: "apply" | "idie" | "fault" | "scrap" | "repair"; //设备状态
  number: string; //编号
  category: string; //分类
};

const onFinishFailed: FormProps<FormType>["onFinishFailed"] = (errorInfo) => {
  console.log("Failed:", errorInfo);
};

//准备选项默认值
const defaultValue: FormType = {
  name: "",
  number: "", //编号
  category: "", //分类设备类别
  purpose: "",
  state: "apply", //设备状态
  title: "",
  numbers: 1, // 设备数量
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
  const { handleAddDevice, styleCategoryOption } = useContext(StyleContext);
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
      number: values.number,
      category: values.category,
      data: {
        title: values.title,
        numbers: values.numbers,
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
    if (state.success) {
      form?.resetFields(); // 清除表单输入
      handleOk(); // 关闭弹窗
      if (state.deviceData) {
        //准备载入的值
        const deviceData = {
          uuid: state.deviceData.uuid, //不变的值
          id: state.deviceData.id, //不变的值
          created_at: state.deviceData.created_at, //不变的值
          ...data,
        };
        handleAddDevice(deviceData); // 调用添加设备的回调函数
      }
    } else {
      alert("添加自定义设备失败");
      console.log("失败原因:", state);
    }
    //console.log("成功，表单原始值:", values);
    //console.log("整理后的设备信息：", data);
  };

  //一键填充数据，测试用
  const fillTestData = () => {
    const data: FormType = {
      name: "张三",
      number: "number",
      category: "测试分类",
      purpose: "测试用途",
      state: "apply",
      title: "华为路由器",
      numbers: 2,
      total: 2300,
      platform: "TaoBao",
      shop_name: "华为路由器专卖店",
      link: "https://www.taobao.com",
      order_time: dayjs(),
      order: "tbasdf65616",
      pay_method: "Alipay",
      purchaser: "王五",
    };
    form?.setFieldsValue(data);
  };

  return (
    <Form
      form={form}
      name="basic"
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      initialValues={defaultValue}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
    >
      <h5 className="text-sm font-bold">设备信息</h5>
      <Form.Item<FormType>
        label="设备名称："
        name="title"
        rules={[{ required: true, message: "请填写设备名称" }]}
      >
        <Input allowClear />
      </Form.Item>
      <Form.Item<FormType>
        label="设备用途："
        name="purpose"
        rules={[{ required: true, message: "请填写用途" }]}
      >
        <Input allowClear />
      </Form.Item>

      <Row>
        <Col span={12}>
          <Form.Item<FormType>
            label="数量"
            name="numbers"
            rules={[{ required: true, message: "请填写采购数量" }]}
          >
            <InputNumber
              min={1}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              addonAfter="个"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item<FormType>
            label="总计"
            name="total"
            rules={[{ required: true, message: "请填写采购金额" }]}
          >
            <InputNumber
              min={0}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              addonAfter="¥"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row>
        <Col span={12}>
          <Form.Item<FormType>
            label="状态："
            name="state"
            rules={[{ required: true, message: "请填写设备状态" }]}
          >
            <SelectInput
              options={styleCategoryOption.states}
              defaultValue=""
              onChange={(value) => form?.setFieldsValue({ states: value })}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item<FormType>
            label="分类"
            name="category"
            rules={[{ required: true, message: "请填写设备分类" }]}
          >
            <SelectInput
              options={styleCategoryOption.categories}
              defaultValue=""
              onChange={(value) => form?.setFieldsValue({ category: value })}
            />
          </Form.Item>
        </Col>
      </Row>

      <h5 className="text-sm font-bold">采购信息</h5>

      <Form.Item<FormType>
        label="采购人员"
        name="purchaser"
        rules={[{ required: true, message: "请填写采购人信息" }]}
      >
        <Input allowClear placeholder="负责购买此设备的人" />
      </Form.Item>

      <Form.Item<FormType>
        label="设备编号"
        name="number"
        rules={[{ required: true, message: "请填写设备编号" }]}
        style={{ width: "100%" }}
      >
        <Input />
      </Form.Item>
      <Form.Item<FormType>
        label="使用人员"
        name="name"
        rules={[{ required: true, message: "请填写使用人信息" }]}
      >
        <Input allowClear placeholder="人员，部门或位置" />
      </Form.Item>

      <h5 className="text-sm font-bold">订单信息</h5>

      <Form.Item<FormType>
        label="店铺名称"
        name="shop_name"
        rules={[{ required: true, message: "请填写店铺名称" }]}
      >
        <Input allowClear />
      </Form.Item>
      <Form.Item<FormType>
        label="商品链接："
        name="link"
        rules={[{ required: true, message: "请填写商品链接" }]}
      >
        <Input allowClear />
      </Form.Item>

      <Row>
        <Col span={12}>
          <Form.Item<FormType>
            label="单号"
            name="order"
            rules={[{ required: true, message: "请填写订单单号" }]}
          >
            <Input allowClear style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item<FormType>
            label="时间"
            name="order_time"
            rules={[{ required: true, message: "请选择购买时间" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <Form.Item<FormType>
            label="平台"
            name="platform"
            rules={[{ required: true, message: "请选择采购平台" }]}
          >
            <SelectInput
              options={styleCategoryOption.platforms}
              defaultValue=""
              onChange={(value) => form?.setFieldsValue({ platform: value })}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item<FormType>
            label="支付"
            name="pay_method"
            rules={[{ required: true, message: "请选择支付方式" }]}
          >
            
            <SelectInput
              options={styleCategoryOption.pay_methods}
              defaultValue=""
              onChange={(value) => form?.setFieldsValue({ pay_method: value })}
            />
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
