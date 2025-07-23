/**
 * 自定义设备信息列表 - 顶部
 */
import { useState } from "react";
import { Space, Button } from "antd";
import Add from "@/components/style/header/add";
import { StyleDevice } from "@/store/interface";
//引入头部模块
import Header from "@/components/block/tab-header";

interface Props {
  onAddDevice: (device: StyleDevice) => void; // 添加设备的回调函数
}
const App: React.FC<Props> = ({ onAddDevice }) => {
  //信息录入弹窗状态
  const [isModalOpen, setIsModalOpen] = useState(false);

  //展示
  const showModal = () => {
    setIsModalOpen(true);
  };

  //隐藏
  const handleOk = () => {
    setIsModalOpen(false);
  };

  //取消
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  return (
    <>
      <div className="flex justify-between items-center">
        <Header title="自定义资产信息" />
        <Space size={"middle"} wrap className="mb-4">
          <Button type="primary" onClick={showModal}>
            添加
          </Button>

          <div>状态：</div>
          <div>搜索：</div>
        </Space>
        <Add
          isModalOpen={isModalOpen}
          handleOk={handleOk}
          handleCancel={handleCancel}
          onAddDevice={onAddDevice} // 传递添加设备的回调函数
        />
      </div>
    </>
  );
};

export default App;
