/**
 * 自定义设备类型
 */
import { useState } from "react";

import DataList from "@/components/style/dataList";

//拿到自定义设备数据类型
import { StyleDevice } from "@/store/interface";

//跨组件提供方法
import { StyleContext } from "@/components/style/styleContext";

//拿到弹窗
import Drawer from "@/components/style/drawer/index";

//拿到顶部
import Header from "@/components/style/header";

//拿到通过接口传来的数据
import { dataStyle } from "@/store/index";

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
  const [_arrIndex, setArrIndex] = useState(0);

  //在设备展示列表和删除设备两个组件间同步设备数据（添加、删除设备后更新设备列表）
  const [devices, setDevices] = useState<StyleDevice[]>(dataStyle);

  //添加自定义设备
  const handleAddDevice = (device: StyleDevice) => {
    setDevices((prev) => [...prev, device]);
  };
  //删除指定UUID的设备
  const handleDeleteData = (uuid: string) => {
    setDevices((prev) => prev.filter((d) => d.uuid !== uuid));
  };

  //修改自定义设备数据
  const handleUpdateData = (uuid: string, device: StyleDevice) => {
    setDevices((prev) => prev.map((d) => (d.uuid === uuid ? device : d)));
  };

  return (
    <StyleContext.Provider
      value={{drawerData,setDrawerData, handleAddDevice, handleDeleteData, handleUpdateData }}
    >
      <div className="pb-6 px-5">
        <Header />
        <div className="flex content-start items-center flex-wrap w-full">
          {/**开始循环 */}
          {devices.map((tab, index) => (
            <DataList
              key={tab.id}
              data={tab}
              onActive={() => changeActive()}
              onDrawerData={() => (setDrawerData(tab), setArrIndex(index))}
            />
          ))}
        </div>
        {/**弹窗 */}
        <Drawer
          data={drawerData}
          active={active}
          onActive={() => changeActive()}
        />
      </div>
    </StyleContext.Provider>
  );
};
export default App;
