/**
 *自定义设备类型
 */
import React from "react";
import DataList from "@/components/style/dataList";
//拿到演示数据
import DemoData from "@/store/demoStyleData";
const App: React.FC = () => {
  return (
    <>
      自定义设备类型
      {/**开始循环 */}
      {DemoData.map((tab, index) => (
        <DataList key={tab.id} data={tab} />
      ))}
    </>
  );
};
export default App;
