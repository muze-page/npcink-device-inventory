/**
 * 自定义设备信息列表 - 顶部
 */
import { useState } from "react";
import { Space, Button } from "antd";
import Add from "@/components/style/header/add";
//引入头部模块
import Header from "@/block/tab-header";

const App: React.FC = () => {
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
        <Add isModalOpen={isModalOpen} handleOk={handleOk} />
      </div>
    </>
  );
};

export default App;
