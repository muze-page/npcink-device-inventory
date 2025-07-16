/**
 *自定义设备类型
 */
import { useState } from "react";
import DataList from "@/components/style/dataList";
//拿到自定义设备数据类型
import { StyleDevice } from "@/store/interface";
//拿到演示数据
import DemoData from "@/store/demoStyleData";
//拿到弹窗
import Drawer from "@/components/style/drawer/index";

const App: React.FC = () => {
  //共享弹窗状态
  const [active, setActive] = useState(false);
  //修改弹窗状态
  const changeActive = () => {
    setActive(!active);
  };

  //当前选中弹窗的数据
  const [drawerData, setDrawerData] = useState({} as StyleDevice);

  //当前点击选中的数组index
  const [arrIndex, setArrIndex] = useState(0);
  
  return (
    <>
      自定义设备类型
      {/**开始循环 */}
      {DemoData.map((tab, index) => (
        <DataList
          key={tab.id}
          data={tab}
          onActive={() => changeActive()}
          onDrawerData={() => (setDrawerData(tab), setArrIndex(index))}
        />
      ))}
      {/**弹窗 */}
      <Drawer
        data={drawerData}
        active={active}
        onActive={() => changeActive()}
      />
    </>
  );
};
export default App;
