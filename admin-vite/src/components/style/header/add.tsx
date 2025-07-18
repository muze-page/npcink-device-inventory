//弹窗
/**
 * 自定义设备信息列表 - 顶部，信息录入弹窗
 */
import { Modal, Button } from "antd";
import AddForm from "@/components/style/header/add-form";
interface Props {
  isModalOpen: boolean; //设备数据
  handleOk: () => void; //弹窗状态
  handleCancel: () => void; //修改弹窗状态
}
const App: React.FC<Props> = ({ isModalOpen, handleOk, handleCancel }) => {
  return (
    <>
      <Modal
        title="采购信息录入"
        closable={{ "aria-label": "自定义关闭按钮" }}
        width={600}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleOk}>
            提交
          </Button>,
        ]}
      >
        <AddForm />
      </Modal>
    </>
  );
};

export default App;
