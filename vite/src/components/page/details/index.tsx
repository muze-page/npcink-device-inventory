/**
 * 详情
 */
import { useState } from "react";

import { dataMySql } from "@/store";
import DetailsList from "@/components/page/details/detailsList";
import Header from "@/components/page/details/header";
import Drawer from "@/components/page/details/drawer";
import {
  MysqlDeviceChangeMeat,
  MysqlDeviceChange,
  ComputerRam,
  ComputerDevice,
} from "@/store/interface";

import { AppContext } from "@/store/setingContext";
//收集指定数据

type DataType = ComputerRam | ComputerDevice;

const calculateTotalSize = (dataArrays: DataType[]) => {
  const totalSize = dataArrays.reduce((sum: number, obj: { size: number }) => {
    return sum + obj.size;
  }, 0);
  return totalSize / (1024 * 1024 * 1024); // 将字节转换为GB
};

const updateOSType = (
  dataArrays: MysqlDeviceChange[]
): MysqlDeviceChangeMeat[] => {
  const updatedData = dataArrays.map((obj: MysqlDeviceChange) => {
    const parsedData = obj.dataNew; //拿到对象
    const memory = calculateTotalSize(parsedData.memLayout); //内存数组
    const disk = calculateTotalSize(parsedData.diskLayout); //硬盘数组
    //整理添加的信息
    const meat = {
      ostype: parsedData.os.distro, //系统版本
      cpu: parsedData.cpu.manufacturer, //CPU
      model: parsedData.system.model, //型号
      memory: Math.floor(memory), //GB 取整
      disk: Math.floor(disk), //GB 取整
    };
    return { ...obj, meat };
  });
  //移除多余数组
  //const updatedData = updatedData.map((obj) => {
  //  const { dataNew,dataOld, ...rest } = obj;
  //  return rest;
  //});
  return updatedData;
};

const App: React.FC = () => {
  //拿到数据
  const data = dataMySql;

  //处理后的数据
  const updatedDataArray = updateOSType(data);

  //共享弹窗状态
  const [active, setActive] = useState(false);

  //修改弹窗状态
  const changeActive = () => {
    setActive(!active);
  };

  //共享参数
  const [drawerData, setDrawerData] = useState({} as MysqlDeviceChangeMeat);

  //共享筛选参数
  const [screenData, setScreenData] = useState(updatedDataArray);

  //当前点击选中的数组index
  const [arrIndex, setArrIndex] = useState(0);

  //修改当前选中的设备状态
  const handleTypeUpdate = (newType: string) => {
    const updatedData = [...screenData];
    updatedData[arrIndex].is_enabled = newType;
    setScreenData(updatedData);
  };

  //删除当前选中的设备
  const deltArrData = () => {
    const data = [...screenData];
    data.splice(arrIndex, 1); // 删除第二个元素
    setScreenData(data);
  };

  return (
    <AppContext.Provider value={{ handleTypeUpdate,deltArrData }}>
      <Header data={updatedDataArray} onSet={setScreenData} />
      <div className="mt-1 flex content-start items-center flex-wrap w-full">
        {/**开始循环 */}
        {screenData.map((tab, index) => (
          <DetailsList
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
    </AppContext.Provider>
  );
};

export default App;
