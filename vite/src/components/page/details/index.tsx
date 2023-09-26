/**
 * 详情
 */
import { useContext, useState } from "react";

import DataContext from "@/store/dataContext";
import { StateContext } from "@/store/dataContext";
import DetailsList from "@/components/page/details/detailsList";
import Drawer from "@/components/page/details/drawer";
import {
  Computer,
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
  const data = useContext(DataContext);

  //处理后的数据
  const updatedDataArray = updateOSType(data);

  //共享状态
  const [state, setState] = useState({
    drawer: false,
    data: [] as Computer[],
  });

  //更改状态值
  type State = {
    drawer: boolean;
    data: Computer[]; // 这里根据你的状态对象的结构来定义具体的类型
  };

  const updateState = (key: keyof State, value: State[keyof State]): void => {
    setState((prevState: State) => ({
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
