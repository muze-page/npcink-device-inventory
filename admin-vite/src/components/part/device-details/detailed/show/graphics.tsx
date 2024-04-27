/**
 * 设备详情 - 显卡
 * https://systeminformation.io/graphics.html
 */
import { Table } from "antd";
import { ComputerControllers } from "@/store/interface";
import { columnsTable } from "@/store/dataReplace";
import { judge_bool, removeEmpty } from "@/store/tool";
interface Props {
  data: ComputerControllers[];
}
const App: React.FC<Props> = ({ data }) => {
  const formattedData = (item: ComputerControllers) => {
    const arr = [
      { key: "1", label: "供应商", value: item.vendor },
      { key: "2", label: "型号", value: item.model },
      { key: "3", label: "总线", value: item.bus },
      {
        key: "4",
        label: "显存",
        value: item.memoryTotal ? item.memoryTotal / 1024 + "GB" : "",
      },
      { key: "5", label: "动态分配", value: judge_bool(item.vramDynamic) },
      { key: "6", label: "GPU内核", value: item.cores },
      { key: "7", label: "设备标识", value: item.deviceId },
      { key: "8", label: "外部GPU", value: judge_bool(item.external) },
      { key: "9", label: "金属版本", value: item.metalVersion },
      { key: "10", label: "供应商编号", value: item.vendorId },
    ];
    return removeEmpty(arr);
  };

  return (
    <>
      {data.map((item, index) => {
        return (
          <div key={index}>
            <p className="font-black my-2 text-xl">显卡 - {index + 1}</p>
            <Table dataSource={formattedData(item)} columns={columnsTable} />
          </div>
        );
      })}
    </>
  );
};

export default App;
