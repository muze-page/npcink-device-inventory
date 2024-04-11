//添加修改记录
import { Form, Input, Button, message } from "antd";
import { addChangeData } from "@/store/axios";
import { ComputerChangeReturn } from "@/store/interface";
interface ACDProps {
  uuid: string; //UUID
}
const AddChangeData: React.FC<ACDProps> = ({ uuid }) => {
  //多行输入
  const { TextArea } = Input;

  //表单数据
  const [form] = Form.useForm();

  /**
   * 说明：提交表单且数据验证成功后回调事件
   * 在 onFinish 回调函数中，通过调用
   * setFormData 函数将表单数据存储在 formData 状态变量中，
   * 以便在组件中进行进一步处理或展示。
   * */

  const onFinish = async (values: ComputerChangeReturn) => {
    //检查数据是否符合需求，不符合则弹窗
    if (
      typeof values.user !== "string" ||
      typeof values.type !== "string" ||
      typeof values.msg !== "string" ||
      !values.user.trim() ||
      !values.type.trim() ||
      !values.msg.trim()
    ) {
      message.error("请填写完整信息");
      return;
    }
    console.log("Received values:", values);

    // 发送POST请求
    const state = await addChangeData(uuid, values);
    
    //成功添加则清除输入框
    if (state) {
      form.resetFields();
    }
  };

  return (
    <>
      <h2 className="mb-4 text-base font-bold text-[#333]">添加记录：</h2>
      <Form
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 12 }}
        form={form}
        onFinish={onFinish}
      >
        <Form.Item
          label="变更人"
          name={"user"}
          rules={[{ required: true, message: "请输入用户名" }]}
        >
          <Input placeholder="操作变更同事的名字" />
        </Form.Item>
        <Form.Item
          label="变更项目"
          name={"type"}
          rules={[{ required: true, message: "请选择类型" }]}
        >
          <Input placeholder="变更的项目，例如硬盘、内存条等" />
        </Form.Item>
        <Form.Item
          label="变更说明"
          name="msg"
          rules={[{ required: true, message: "请输入变更内容" }]}
        >
          <TextArea placeholder="变更内容详情" />
        </Form.Item>

        <Form.Item>
          <Button htmlType="submit">添加</Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default AddChangeData;
