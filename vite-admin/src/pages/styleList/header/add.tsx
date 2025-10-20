//弹窗
/**
 * 自定义设备信息列表 - 顶部，信息录入弹窗
 */
import { Modal, Form } from "antd";
import AddForm from "@/pages/styleList/header/addForm";
interface Props {
  isModalOpen: boolean; //设备数据
  handleOk: () => void; //关闭弹窗
}
const App: React.FC<Props> = ({ isModalOpen, handleOk }) => {
  // 创建表单实例,给表单用
  const [form] = Form.useForm();

  // 自定义关闭逻辑
  const confirmCancel = () => {
    if (form.isFieldsTouched()) {
      // 表单有输入值，弹出确认框
      if (window.confirm("表单有未保存的内容，确定要关闭吗？")) {
        form.resetFields(); // 可选：清空表单值
        handleOk(); // 关闭弹窗
      }
    } else {
      // 表单无修改，直接关闭
      form.resetFields(); // 可选：清空表单值
      handleOk(); //关闭弹窗
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
        <AddForm form={form} handleOk={handleOk} />
      </Modal>
    </>
  );
};

export default App;
