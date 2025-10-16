/**
 * 设备详情 - 显示器
 * https://systeminformation.io/graphics.html
 */
import { Table } from "antd";
import { ComputerDishplays } from "@/type/index";
import { columnsTable } from "@/store/dataReplace";
import { judge_bool, removeEmpty } from "@/store/tool";
interface Props {
  data: ComputerDishplays[];
}
const App: React.FC<Props> = ({ data }) => {
  const formattedData = (item: ComputerDishplays) => {
    const arr = [
      { label: "型号", value: item.model },
      { label: "生产年份", value: item.productionYear },
      {
        label: "分辨率",
        value: `${item.resolutionX} x ${item.resolutionY} 像素`,
      },
      {
        label: "当前像素水平",
        value: `${item.currentResX} x ${item.currentResY} 像素`,
      },
      { label: "刷新率", value: `${item.currentRefreshRate} 赫兹` },
      { label: "主显示器", value: judge_bool(item.main) },
      { label: "内置显示器", value: judge_bool(item.builtin) },
      { label: "供应商", value: item.vendor },
      { label: "供应商编号", value: item.vendorId },

      { label: "显示ID", value: item.displayId },

      { label: "链接方式", value: item.connection },
      { label: "尺寸", value: `${item.sizeX} x ${item.sizeY} 毫米` },
      { label: "颜色深度（位）", value: `${item.pixelDepth} 位` },

      {
        label: "位置",
        value: `(${item.positionX}, ${item.positionY})`,
      },

      { label: "设备名称", value: item.deviceName },
      { label: "序列号", value: item.serial },
    ];
    return removeEmpty(arr);
  };

  return (
    <>
      {data.map((item, index) => {
        return (
          <div key={index}>
            <p className="font-black my-2 text-xl">
              {data.length === 1 ? "显示器" : `显示器 - ${index + 1}`}
            </p>
            <Table
              dataSource={formattedData(item)}
              columns={columnsTable}
              size="small"
              pagination={{
                pageSize: 10,
                hideOnSinglePage: true,
              }}
            />
          </div>
        );
      })}
    </>
  );
};

export default App;
