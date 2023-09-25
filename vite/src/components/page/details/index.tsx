/**
 * 详情
 */
import { useContext, useState } from "react";

import DataContext from "@/store/dataContext";
import { StateContext } from "@/store/dataContext";
import DetailsList from "@/components/page/details/detailsList";
import Drawer from "@/components/page/details/drawer";
import {
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

const updateOSType = (dataArrays: MysqlDeviceChange[]) => {
  const updatedData = dataArrays.map((obj: MysqlDeviceChange) => {
    const parsedData = obj.dataNew; //拿到对象

    const ostype = parsedData.os.distro; //系统版本
    const model = parsedData.system.model; //型号
    const cpu = parsedData.cpu.manufacturer; //CPU

    const memoryData = parsedData.memLayout; //内存数组
    const memory = calculateTotalSize(memoryData);

    const diskData = parsedData.diskLayout; //硬盘数组
    const disk = calculateTotalSize(diskData);

    //整理添加的信息
    const meat = {
      ostype: ostype,
      cpu: cpu,
      model: model,
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
  const data = useContext(DataContext);
 

  //处理后的数据
  const updatedDataArray = updateOSType(data);
  console.log(updatedDataArray);
  //共享状态
  const [state, setState] = useState({
    drawer: false,
    data: [],
  });

  //更改状态值
  const updateState = (key: any, value: any) => {
    setState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  return (
    <>
      <StateContext.Provider value={{ state, updateState }}>
        <div className="mt-1 flex content-start items-center flex-wrap w-full">
          {/**开始循环 */}
          {updatedDataArray.map((tab, _index) => (
            <DetailsList key={tab.id} data={tab} />
          ))}
        </div>
        {/**弹窗 */}
        <Drawer />
      </StateContext.Provider>
    </>
  );
};

export default App;
