/**
 * 变更记录表
 */

import React, { useState } from "react";
import { Space, Button } from "antd";
import Change from "@/pages/changeList/change";
import Auto from "@/pages/changeList/auto";

const App: React.FC = () => {
  //隐藏姓名
  const [isActive, setIsActive] = useState(false);
  //数据来源切换
  const [dataSctive, setDataActive] = useState(true); //默认为电脑变更
  //切换姓名
  const toggleStyle = () => {
    setIsActive((prevIsActive) => !prevIsActive);
  };

  //切换数据来源
  const toggleData = () => {
    setDataActive((prevIsActive) => !prevIsActive);
  };

  //我需要使用active来显示不同的组件

  return (
    <>
      <Space className="mb-4">
        <Button onClick={toggleData}>
          {dataSctive ? "手动" : "自动"}变更数据
        </Button>
        <Button onClick={toggleStyle}>{isActive ? "展示" : "隐藏"}姓名</Button>
      </Space>
      {dataSctive ? (
        <Change isActive={isActive} />
      ) : (
        <Auto isActive={isActive} />
      )}
    </>
  );
};

export default App;
