/**
 * 详情
 */
import { useState } from "react";

import { dataMySql } from "@/store";
import DetailsList from "@/components/page/details/detailsList";
import Drawer from "@/components/page/details/drawer";
import {
  MysqlDeviceChangeMeat,
  MysqlDeviceChange,
  ComputerRam,
  ComputerDevice,
} from "@/store/interface";

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

  //共享状态
  const [active, setActive] = useState(false);
  //修改状态
  const changeActive = () => {
    setActive(!active);
  };

  //共享参数
  const [drawerData, setDrawerData] = useState({} as MysqlDeviceChangeMeat);

  //修改状态

  return (
    <>
      <div className="mt-1 flex content-start items-center flex-wrap w-full">
        {/**开始循环 */}
        {updatedDataArray.map((tab, _index) => (
          <DetailsList
            key={tab.id}
            data={tab}
            onActive={() => changeActive()}
            onDrawerData={() => setDrawerData(tab)}
          />
        ))}
      </div>
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
