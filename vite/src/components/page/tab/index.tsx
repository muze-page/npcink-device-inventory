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

//查硬盘
function sumData(arr: any[], type: string) {
  var sum = 0;

  for (var i = 0; i < arr.length; i++) {
    sum += arr[i][type].length;
  }

  return sum;
}

const App: React.FC = () => {
  //拿到数据
  const objData = useContext(DataContext);

  //整理数据
  const combinedData = combineData(
    objData.map((obj: { dataNew: any }) => JSON.parse(obj.dataNew))
  );
  //查硬盘数量

  console.log(combinedData);
  const items = [
    {
      key: "1",
      label: `CPU（个）`,
      sum: combinedData.length,
      children: <Cpu />,
    },
    {
      key: "2",
      label: `硬盘（块）`,
      sum: sumData(combinedData, "diskLayout"),
      children: <Disk />,
    },
    {
      key: "3",
      label: `内存（条）`,
      sum: sumData(combinedData, "memLayout"),
      children: <Memory />,
    },
    {
      key: "4",
      label: `主板（个）`,
      sum: combinedData.length,
      children: <Baseboard />,
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
      <div className="h-[625px] relative bg-white py-6 px-5 rounded-r border-rose-600">
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
              className="w-calc-1/4 first:ml-0 ml-4 cursor-pointer relative h-[6em] rounded px-5 py-4  bg-gradient-to-br from-blue-100 to-blue-400"
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
      </div>
      {/**
       * </div>
       * </div>
       */}
    </>
  );
};

export default App;
