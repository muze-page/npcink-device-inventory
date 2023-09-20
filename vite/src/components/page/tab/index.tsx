/**
 * 资产盘点
 */
import { useState, useContext } from "react";
import DataContext from "@/store/dataContext";
import Baseboard from "@/components/page/tab/baseboard";
import Cpu from "@/components/page/tab/cpu";
import Disk from "@/components/page/tab/disk";
import Memory from "@/components/page/tab/memory";

const combineData = (dataArrays: any) => {
  // 使用 Array.concat() 将多个数组合并为一个
  const combined = [].concat(...dataArrays);
  return combined;
};

//查指定数据的个数
function sumData(arr: any[], type: string) {
  var sum = 0;

  for (var i = 0; i < arr.length; i++) {
    sum += arr[i][type].length;
  }

  return sum;
}

//获取指定设备的数据数组
const deviceArrData = (dataArrays: any[], key: string) => {
  const cpuArray = dataArrays.flatMap((obj) => obj[key]);
  return cpuArray;
};

const App: React.FC = () => {
  //拿到数据
  const objData = useContext(DataContext);

  //整理数据
  const combinedData = combineData(
    objData.map((obj: { dataNew: any }) => JSON.parse(obj.dataNew))
  );
  console.log(combinedData);

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
      clor: "from-blue-100 to-blue-400",
      children: <Cpu data={cpuArrData} />,
    },
    {
      key: "2",
      label: `硬盘（块）`,
      sum: sumData(combinedData, "diskLayout"),
      clor: "from-orange-100 to-orange-200",
      children: <Disk data={diskArrData} />,
    },
    {
      key: "3",
      label: `内存（条）`,
      sum: sumData(combinedData, "memLayout"),
      clor: "from-red-100 to-red-200",
      children: <Memory data={memoryArrData} />,
    },
    {
      key: "4",
      label: `主板（个）`,
      sum: combinedData.length,
      clor: "from-green-100 to-green-200",
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
        {/**tab */}
        <div className="flex items-center mt-3">
          {items.map((tab, index) => (
            <div
              className={`w-calc-1/4 first:ml-0 ml-4 cursor-pointer relative h-[6em] rounded px-5 py-4  bg-gradient-to-br   w-full ${tab.clor}`}
              key={index}
              onClick={() => handleTabClick(index)}
            >
              {/**className={`tab ${index === activeTab ? "active" : ""}`} */}
              <div className="text-xs font-normal text-zinc-900">
                {tab.label}
              </div>
              <div className="text-2xl font-normal text-zinc-900">
                {tab.sum}
              </div>
            </div>
          ))}
        </div>

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
        <div className="w-[calc(100%-48px)] absolute left-6 bottom-6 h-[76px] px-6 py-4 flex items-center justify-between mt-6 bg-orange-50">
          {/**第一部分 */}
          <div>
            <div className="text-sm font-normal leading-[22px] text-amber-950">
              专业上门运维
            </div>
            <div className="text-xs font-normal leading-[22px] text-amber-950">
              360与生态伙伴旗下的专业安全与运维专家，为您提供远程支持或上门服务
            </div>
          </div>
          {/**第二部分 */}
          <div className="w-[104px] h-8 leading-8 rounded-sm bg-orange-300 text-xs font-normal text-center text-amber-950 cursor-pointer ">
            选择专业服务
          </div>
        </div>
      </div>
      {/**
       * </div>
       * </div>
       */}
    </>
  );
};

export default App;
