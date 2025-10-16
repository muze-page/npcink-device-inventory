/**
 * 设备详情 - 显卡
 * https://systeminformation.io/graphics.html
 */
import { Table } from "antd";
import { ComputerControllers } from "@/type/index";
import { columnsTable } from "@/store/dataReplace";
import { judge_bool, removeEmpty } from "@/store/tool";
interface Props {
  data: ComputerControllers[];
}
const App: React.FC<Props> = ({ data }) => {
  const formattedData = (item: ComputerControllers) => {
    const arr = [
      { key: "2", label: "型号", value: item.model },
      {
        key: "4",
        label: "显存",
        value: item.vram ? (item.vram / 1024).toFixed(0) + "GB" : "",
      },
      { key: "11", label: "显卡ID", value: item.subDeviceId },
      { key: "1", label: "供应商", value: item.vendor },
      { key: "3", label: "总线", value: item.bus },
      { key: "5", label: "动态分配", value: judge_bool(item.vramDynamic) },
      { key: "6", label: "GPU内核", value: item.cores },
      { key: "7", label: "设备标识", value: item.deviceId },
      { key: "8", label: "外部GPU", value: judge_bool(item.external) },
      { key: "9", label: "API Metal 版本", value: item.metalVersion },
      { key: "10", label: "供应商编号", value: item.vendorId },
    ];
    return removeEmpty(arr);
  };

  return (
    <>
      {data.map((item, index) => {
        return (
          <div key={index}>
            <p className="font-black my-2 text-xl">
              {data.length === 1 ? "显卡" : `显卡 - ${index + 1}`}
            </p>
            <Table
              dataSource={formattedData(item)}
              columns={columnsTable}
              size="small"
            />
          </div>
        );
      })}
    </>
  );
};

export default App;
