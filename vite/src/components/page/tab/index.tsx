/**
 * 资产盘点
 */
import { useState, useContext } from "react";
import DataContext from "@/store/dataContext";
import { Computer } from "@/store/interface";
import Baseboard from "@/components/page/tab/baseboard";
import Cpu from "@/components/page/tab/cpu";
import Disk from "@/components/page/tab/disk";
import Memory from "@/components/page/tab/memory";


//将数组对象中对象的指定的键值取出，组成新数组
const deviceArrData = (dataArrays: Computer[], key: keyof Computer) => {
  const cpuArray = dataArrays.flatMap((obj) => obj[key]);
  return cpuArray as object[];
};

const App: React.FC = () => {
  //拿到数据
  const data = useContext(DataContext);

  //收集最新数据并输出数组
  interface DataArray {
    dataNew: Computer;
  }
  const collectDataNew = (dataArrays: DataArray[]): Computer[] => {
    const newData = dataArrays.map((obj: { dataNew: Computer }) => obj.dataNew);
    return newData;
  };

  //处理数据
  const combinedData = collectDataNew(data);
 

  //获取CPU数组
  const cpuArrData = deviceArrData(combinedData, "cpu");

  //获取硬盘数组
  const diskArrData = deviceArrData(combinedData, "diskLayout");
  

  //获取内存数组
  const memoryArrData = deviceArrData(combinedData, "memLayout");

  //获取主板数组
  const baseboardArrData = deviceArrData(combinedData, "baseboard");

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

  //控制切换
  const [activeTab, setActiveTab] = useState(0);

  //点击切换
  const handleTabClick = (index: number) => {
    setActiveTab(index);
  };

  return (
    <>
      <div className="h-[625px] relative bg-white py-6 px-5 rounded-r border-rose-600 max-w-3xl">
        {/**标题 */}
        <div className="flex justify-between items-center">
          <div className="text-base font-black flex items-center text-zinc-900">
            硬件资产盘点
          </div>
        </div>
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

/**
 * 表头
 * @returns
 */
interface Props {
  items: {
    key: string;
    label: string;
    sum: number;
    color: string;
    activeColor: string;
    children: React.ReactElement;
  }[];
  handleTabClick: Function;
  activeTab: number;
}

const TabHeader: React.FC<Props> = ({ items, handleTabClick, activeTab }) => {
  return (
    <div className="flex items-center mt-3">
      {items.map((tab, index) => (
        <div
          className={`w-calc-1/4 first:ml-0 ml-4 cursor-pointer relative h-[6em] rounded px-5 py-4  bg-gradient-to-br   w-full ${tab.color}`}
          key={index}
          onClick={() => handleTabClick(index)}
        >
          {/**className={`tab ${index === activeTab ? "active" : ""}`} */}
          <div className="text-xs font-normal text-zinc-900">{tab.label}</div>
          <div className="text-2xl font-normal text-zinc-900">{tab.sum}</div>
          {/*下横线*/}
          {index === activeTab && (
            <div
              className={`w-full h-[2px] rounded-sm  absolute bottom-0 left-0 z-10 ${tab.activeColor}`}
            ></div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * 广告内容
 * @returns
 */
const Ad = () => {
  return (
    <div className="w-[calc(100%-48px)] absolute left-6 bottom-6 h-[76px] px-6 py-4 flex items-center justify-between mt-6 bg-orange-50">
      {/**第一部分 */}
      <div>
        <div className="text-sm font-normal leading-[22px] text-amber-950">
          专业定制
        </div>
        <div className="text-xs font-normal leading-[22px] text-amber-950">
          为您添加个性化数据大盘，针对性提升运维效率。
        </div>
      </div>
      {/**第二部分 */}
      <div className="w-[104px] h-8 leading-8 rounded-sm bg-orange-300 text-xs font-normal text-center text-amber-950 cursor-pointer ">
        <a
          href="https://www.npc.ink/"
          target="_blank"
          className="text-amber-950"
        >
          {" "}
          选择专业
        </a>
      </div>
    </div>
  );
};

export default App;
