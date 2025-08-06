/**
 * 设备详情 - 大概信息
 */
import { handleGraphics,formatDate } from "@/store/tool";
import { Computer } from "@/store/interface";
import { Dayjs } from "dayjs";
interface Props {
  data: Computer;
  time: Dayjs;
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

  //一个数组中有若干对象，对象中有多个属性，将指定的属性进行拼接，返回一个字符串
  const handleArrayData = (arr: any[], key: string) => {
    const value = arr.map((item) => item[key]).join("<br/>");
    return value;
  };

  const handleData = [
    {
      title: "中央处理器(CPU)型号",
      data: data.cpu.brand || "未找到 CPU 型号",
    },
    {
      title: "显卡型号",
      data: handleGraphics(data.graphics.controllers) || "未找到显卡",
    },
    {
      title: "计算机型号",
      data: data.system.manufacturer + " / " + data.system.model,
    },
    {
      title: "主板型号",
      data: data.baseboard.manufacturer + " / " + data.baseboard.model,
    },

    {
      title: "主硬盘",
      data: handleArrayData(data.diskLayout, "name") || "未找到硬盘",
    },

    {
      title: "内存信息",
      data: allMemory(data.memLayout) || "未找到内存",
    },
    {
      title: "网卡型号",
      data: handleArrayData(data.net, "ifaceName") || "未找到网卡",
    },
    {
      title: "显示器",
      data: displayData
        ? `${displayData.currentResX} x ${displayData.currentResY}
        （${displayData.currentRefreshRate} 赫兹）
        <br/><small>${displayData.model}</small> `
        : "不存在",
    },
    {
      title: "磁盘序列号",
      data: handleArrayData(data.diskLayout, "serialNum") || "未找到磁盘序列号",
    },
    {
      title: "添加时间",
      data: formatDate(time),
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
  return (
    <div
      dangerouslySetInnerHTML={{ __html: content }}
      className="w-full  line-clamp-2"
    />
  );
};

export default App;
