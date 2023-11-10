/**
 * 设备详情 - 显示器
 */
import { Table } from "antd";
import { ComputerDishplays } from "@/store/interface";
import { columnsTable } from "@/store/dataReplace";
import { judge_bool } from "@/store/tool";
interface Props {
  data: ComputerDishplays[];
}
const App: React.FC<Props> = ({ data }) => {
  const formattedData = (item: ComputerDishplays) => {
    const arr = [
      { key: "1", label: "供应商", value: item.vendor },
      { key: "2", label: "供应商编号", value: item.vendorId },
      { key: "3", label: "型号", value: item.model },
      { key: "4", label: "生产年份", value: item.productionYear },
      { key: "5", label: "序列号", value: item.serial },
      { key: "6", label: "显示ID", value: item.displayId },
      { key: "7", label: "主显示器", value: judge_bool(item.main) },
      { key: "8", label: "内置显示器", value: judge_bool(item.builtin) },
      { key: "9", label: "链接类型", value: item.connection },
      { key: "10", label: "尺寸", value: `${item.sizeX} x ${item.sizeY} 毫米` },
      { key: "11", label: "颜色深度（位）", value: `${item.pixelDepth} 位` },
      {
        key: "12",
        label: "分辨率",
        value: `${item.resolutionX} x ${item.resolutionY} 像素`,
      },
      {
        key: "13",
        label: "位置",
        value: `(${item.positionX}, ${item.positionY})`,
      },
      { key: "14", label: "刷新率", value: `${item.currentRefreshRate} 赫兹` },
      { key: "15", label: "设备名称", value: item.deviceName },
    ];
    return arr;
  };

  return (
    <>
      {data.map((item, index) => {
        return (
          <>
            <div key={index}>
              <p className="font-black my-2 text-xl">显示器 - {index+1}</p>
              <Table dataSource={formattedData(item)} columns={columnsTable} />
            </div>
          </>
        );
      })}
    </>
  );
};

export default App;
