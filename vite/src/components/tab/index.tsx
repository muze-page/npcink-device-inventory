/**
 * 资产盘点
 */
import { useState } from "react";
import { dataMySql } from "@/store";
import {
  Computer,
  ComputerCpu,
  ComputerBaseboard,
  ComputerRam,
  ComputerDevice,
} from "@/store/interface";

import Ad from "@/components/tab/block/ad";
import TabHeader from "@/components/tab/block/tableHeader";

import Baseboard from "@/components/tab/baseboard";
import Cpu from "@/components/tab/cpu";
import Disk from "@/components/tab/disk";
import Memory from "@/components/tab/memory";
import Header from "@/components/part/header";

//收集最新数据并输出数组
interface DataArray {
  data: Computer;
}
const collectDataNew = (dataArrays: DataArray[]): Computer[] => {
  return dataArrays.map((obj: { data: Computer }) => obj.data);
};

//将数组对象中对象的指定的键值取出，组成新数组
const deviceArrData = (dataArrays: Computer[], key: keyof Computer) => {
  return dataArrays.flatMap((obj) => obj[key]);
};

const App: React.FC = () => {
  //收集最新数据组成数组
  const combinedData = collectDataNew(dataMySql);

  //获取CPU数组
  const cpuArrData = deviceArrData(combinedData, "cpu") as ComputerCpu[];

  //获取硬盘数组
  const diskArrData = deviceArrData(
    combinedData,
    "diskLayout"
  ) as ComputerDevice[];

  //获取内存数组
  const memoryArrData = deviceArrData(
    combinedData,
    "memLayout"
  ) as ComputerRam[];

  //获取主板数组
  const baseboardArrData = deviceArrData(
    combinedData,
    "baseboard"
  ) as ComputerBaseboard[];

  //表头内容
  const items = [
    {
      key: "1",
      label: `CPU（个）`,
      sum: combinedData.length,
      color: "from-blue-100 to-blue-200",
      activeColor: "bg-blue-400",
      children: <Cpu data={cpuArrData} />,
    },
    {
      key: "2",
      label: `硬盘（块）`,
      sum: diskArrData.length,
      color: "from-orange-100 to-orange-200",
      activeColor: "bg-orange-400",
      children: <Disk data={diskArrData} />,
    },
    {
      key: "3",
      label: `内存（条）`,
      sum: memoryArrData.length,
      color: "from-red-100 to-red-200",
      activeColor: "bg-red-400",
      children: <Memory data={memoryArrData} />,
    },
    {
      key: "4",
      label: `主板（个）`,
      sum: combinedData.length,
      color: "from-green-100 to-green-200",
      activeColor: "bg-green-400",
      children: <Baseboard data={baseboardArrData} />,
    },
  ];

  //切换表格
  const [activeTab, setActiveTab] = useState(0);

  //点击切换方法
  const handleTabClick = (index: number) => {
    setActiveTab(index);
  };

  return (
    <>
      <div className="h-[625px] relative bg-white pb-6 px-5 rounded-r border-rose-600 max-w-3xl">
        {/**标题 */}
       <Header title="资产盘点" />
        {/**表头 */}
        <TabHeader
          items={items}
          handleTabClick={handleTabClick}
          activeTab={activeTab}
        />

        <div className="relative mt-4 h-80">
          {/**
             *  <div className="relative">
            <div className="flex flex-col h-full">
             */}

          <div className="relative rounded-none box-border w-full min-h-0">
            {/**表体内容 */}
            <div className="content">{items[activeTab].children}</div>
          </div>
        </div>
        {/**广告内容 */}
        <Ad />
      </div>
      {/**
       * </div>
       * </div>
       */}
    </>
  );
};

export default App;
