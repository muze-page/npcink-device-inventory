/**
 * 详情
 */
import { useContext } from "react";

import DataContext from "@/store/dataContext";
import DetailsList from "@/components/block/detailsList";
import Drawer from "@/components/page/details/drawer";



const App: React.FC = () => {
  //拿到数据
  const data = useContext(DataContext);



  //收集指定数据
  const calculateTotalSize = (dataArrays: any) => {
    const totalSize = dataArrays.reduce(
      (sum: number, obj: { size: number }) => {
        return sum + obj.size;
      },
      0
    );

    const sizeInGB = totalSize / (1024 * 1024 * 1024); // 将字节转换为GB

    return sizeInGB;
  };

  //处理数据
  const updateOSType = (dataArrays: any) => {
    const updatedData = dataArrays.map(
      (obj: { dataNew: any; ostype?: any }) => {
        const parsedData = obj.dataNew;
        const ostype = parsedData.os.distro; //系统版本

        const model = parsedData.system.model; //型号

        const cpu = parsedData.cpu.manufacturer; //CPU
        const memoryData = parsedData.memLayout; //内存数组
        const memory = calculateTotalSize(memoryData);

        const diskData = parsedData.diskLayout; //内存数组
        const disk = calculateTotalSize(diskData);

        const meat = {
          ostype: ostype,
          cpu: cpu,
          model: model,
          memory: Math.floor(memory), //GB 取整
          disk: Math.floor(disk), //GB 取整
        };
        //内存总容量
        //获取内存数组

        //硬盘总容量
        return { ...obj, meat };
      }
    );
    //移除多余数组
    //const updatedData = updatedData.map((obj) => {
    //  const { dataNew,dataOld, ...rest } = obj;
    //  return rest;
    //});

    return updatedData;
  };

  //处理后的数据
  const updatedDataArray = updateOSType(data);

  console.log(updatedDataArray);
  //整理，需要，设备类型，Apple 还是Windows，
  /**
   * 昵称
   * 系统的 system model
   * 芯片品牌 内存大小 硬盘大小
   * 备注名
   */



  return (
    <>
      <div className="mt-1 flex content-start items-center flex-wrap w-[728px]">
        {/**开始循环 */}
        {updatedDataArray.map((tab: any, _index: any) => (
          <DetailsList key={tab.id} data={tab} />
        ))}
      </div>
      {/**弹窗 */}
      <Drawer />
    </>
  );
};

export default App;
