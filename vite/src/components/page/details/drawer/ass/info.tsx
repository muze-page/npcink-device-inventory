/**
 * 设备详情 - 详细信息
 */
import { Computer } from "@/store/interface";
interface Props {
  data: Computer;
}
const App: React.FC<Props> = ({ data }) => {
  console.log(data);
  //显示器
  const displayData = data.graphics.displays[0];

  const handleData = [
    {
      title: "计算机型号",
      data: data.system.manufacturer + data.system.model,
    },
    {
      title: "主板",
      data: data.baseboard.manufacturer + data.baseboard.model,
    },
    {
      title: "中央处理器(CPU)",
      data: data.cpu.brand,
    },
    {
      title: "主硬盘",
      data: data.diskLayout[0].name,
    },
    {
      title: "磁盘序列号",
      data: data.diskLayout[0].serialNum,
    },
    {
      title: "显卡",
      data: data.graphics.controllers[0].model,
    },
    {
      title: "内存",
      data: `
        ${data.memLayout[0].manufacturer} 
        
        ${data.memLayout[0].clockSpeed + " MHZ"}  
       
        ${data.memLayout[0].size / 1024 ** 3}  GB
        
      `,
    },
    {
      title: "网卡",
      data: data.net[0].ifaceName,
    },
    {
      title: "显示器",
      data: displayData.model,
      plug: `
      (${displayData.currentResX}x${displayData.currentResY}
        ${displayData.currentRefreshRate}
        ) 
     `,
    },
  ];
  interface itemType {
    title: string;
    data: string;
    plug?: string;
  }

  return (
    <>
      <div className="mt-1 flex justify-between items-center flex-wrap">
        {/**开始循环 */}
        {handleData.map((item: itemType, index: number) => (
          <div
            className={`
            mb-2 w-[49.6%] h-24 py-4 px-5 rounded border bg-gradient-to-r
            ${
              index % 4 === 0 || index % 4 === 3 || index % 4 === 4
                ? "bg_blue"
                : "bg_yellow"
            }
             `}
            key={index}
          >
            <p className="text-sm text-zinc-600">{item.title}</p>
            <p className="mt-1 text-base text-zinc-600">
              {item.data}
              {item.plug}
            </p>
          </div>
        ))}
      </div>
    </>
  );
};

export default App;
