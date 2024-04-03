/**
 * 设备详情 - 大概信息
 */
import { Computer } from "@/store/interface";
interface Props {
  data: Computer;
  time: string;
}
const App: React.FC<Props> = ({ data, time }) => {
  //显示器
  const displayData = data.graphics.displays[0];

  //全部内存条
  interface MemoryInfo {
    manufacturer: string;
    clockSpeed: number;
    size: number;
  }

  const displayMemoryInfo = (memoryInfo: MemoryInfo): string => {
    return `
    
    <div class="text-xs">制造商: ${memoryInfo.manufacturer}
  频率: ${memoryInfo.clockSpeed} MHz
  大小: ${memoryInfo.size / 1024 ** 3} GB </div>`;
  };

  const allMemory = (arr: MemoryInfo[]): string => {
    let result = "";
    for (const memory of arr) {
      result += displayMemoryInfo(memory);
    }
    return result;
  };

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
      title: "显卡",
      data: data.graphics.controllers[0].model,
    },
    {
      title: "内存",
      data: allMemory(data.memLayout),
    },
    {
      title: "网卡",
      data: data.net[0].ifaceName,
    },
    {
      title: "显示器",
      data:
        displayData.model +
        `(${displayData.currentResX}x${displayData.currentResY}
        ${displayData.currentRefreshRate}
        ) `,
    },
    {
      title: "磁盘序列号",
      data: data.diskLayout[0].serialNum,
    },
    {
      title: "添加时间",
      data: time,
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
            <div className="text-sm text-zinc-600">{item.title}</div>
            <div className="mt-1 text-base text-zinc-600">
              <HTMLDisplay content={item.data} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

//展示html内容
interface PropsHtml {
  content: string;
}

const HTMLDisplay: React.FC<PropsHtml> = ({ content }) => {
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
};

export default App;
