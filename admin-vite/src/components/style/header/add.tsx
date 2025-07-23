//弹窗
/**
 * 自定义设备信息列表 - 顶部，信息录入弹窗
 */
import { Modal, Form } from "antd";
import AddForm from "@/components/style/header/add-form";
import { StyleDevice } from "@/store/interface";
interface Props {
  isModalOpen: boolean; //设备数据
  handleOk: () => void; //弹窗状态
  handleCancel: () => void; //修改弹窗状态
  onAddDevice: (device: StyleDevice) => void; // 添加设备的回调函数
}
const App: React.FC<Props> = ({ isModalOpen, handleOk, handleCancel,onAddDevice }) => {
  const [form] = Form.useForm(); // 创建表单实例,给表单用
  const handleSubmit = (values: StyleDevice) => {
    // 在这里进行数据上传或调用接口
    console.log("准备上传:", values);

    // 上传成功后关闭弹窗
    handleCancel();
  };

  // 自定义关闭逻辑
  const confirmCancel = () => {
    if (form.isFieldsTouched()) {
      // 表单有输入值，弹出确认框
      Modal.confirm({
        title: "确认关闭",
        content: "表单有未保存的内容，确定要关闭吗？",
        onOk: () => {
          form.resetFields(); // 可选：清空表单值
          handleCancel(); // 关闭弹窗
        },
      });
    } else {
      // 表单无修改，直接关闭
      form.resetFields(); // 可选：清空表单值
      handleCancel();
    }
  };
  return (
    <>
      <Modal
        title="采购信息录入"
        closable={{ "aria-label": "自定义关闭按钮" }}
        width={600}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={confirmCancel} // 使用自定义关闭逻辑
        footer={null}
      >
        <AddForm onSubmit={handleSubmit} form={form} onAddDevice={onAddDevice} />
      </Modal>
    </>
  );
};

export default App;
