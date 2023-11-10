/**
 * 设备详情 - 显卡
 */
import { Table } from "antd";
import { ComputerControllers } from "@/store/interface";
import { columnsTable } from "@/store/dataReplace";
import { bytesToMB } from "@/store/tool";
interface Props {
  data: ComputerControllers[];
}
const App: React.FC<Props> = ({ data }) => {
  const formattedData = (item: ComputerControllers) => {
    const arr = [
      { key: "1", label: "供应商", value: item.vendor },
      { key: "2", label: "型号", value: item.model },
      { key: "3", label: "总线", value: item.bus },
      { key: "4", label: "显存", value: bytesToMB(item.vram, "GB") },
      { key: "5", label: "动态分配", value: item.vramDynamic },
      { key: "6", label: "GPU内核", value: item.cores },
      { key: "7", label: "设备标识", value: item.deviceId },
      { key: "8", label: "外部GPU", value: item.external },
      { key: "9", label: "金属版本", value: item.metalVersion },
      { key: "10", label: "供应商编号", value: item.vendorId },
    ];
    return arr;
  };

  return (
    <>
      {data.map((item, index) => {
        return (
          <Table
            key={index}
            dataSource={formattedData(item)}
            columns={columnsTable}
          />
        );
      })}
    </>
  );
};

export default App;
