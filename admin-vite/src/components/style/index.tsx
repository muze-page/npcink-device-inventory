/**
 *自定义设备类型
 */
import { useState } from "react";

import DataList from "@/components/style/dataList";

//拿到自定义设备数据类型
import { StyleDevice } from "@/store/interface";

//拿到弹窗
import Drawer from "@/components/style/drawer/index";

//拿到顶部
import Header from "@/components/style/header";

//测试数据传输
import AxiosStyleDeviceData from "@/components/demo/axiosStyleDeviceData";

//拿到通过接口传来的数据
import {dataStyle} from "@/store/index"

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

  //在设备展示列表和删除设备两个组件间同步UUID数据
  const [devices, setDevices] = useState<StyleDevice[]>(dataStyle);

  //删除指定UUID的设备
  const handleDrawerData = (uuid: string) => {
    setDevices(prev => prev.filter(d => d.uuid !== uuid));
  }

  return (
    <>
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
          onDelete={handleDrawerData}
        />
      </div>
      <AxiosStyleDeviceData />
    </>
  );
};
export default App;
