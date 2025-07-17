//弹窗
/**
 * 自定义设备信息列表 - 顶部，信息录入弹窗
 */
import { Modal } from "antd";
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
        title="Basic Modal"
        closable={{ "aria-label": "Custom Close Button" }}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <AddForm />
      </Modal>
    </>
  );
};

export default App;
