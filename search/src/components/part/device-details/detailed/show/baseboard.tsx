/**
 * 设备详情 - 主板
 * https://systeminformation.io/system.html
 */
import { Table } from "antd";
import { ComputerBaseboard } from "@/store/interface";
import { bytesToMB } from "@/store/tool";
import { columnsTable } from "@/store/dataReplace";
interface Props {
  data: ComputerBaseboard;
}
const App: React.FC<Props> = ({ data }) => {
  
  // CPU信息的数组
  const Items = [
    { key: "1", label: "制造商", value: data.manufacturer },
    { key: "2", label: "型号", value: data.model },
    { key: "3", label: "版本", value: data.version },
    { key: "4", label: "序列号", value: data.serial },
    { key: "5", label: "资产标签", value: data.assetTag },
    { key: "6", label: "最大内存", value: bytesToMB(data.memMax, "GB") },
    { key: "7", label: "内存插槽", value: data.memslots },
  ];

  return (
    <>
      <Table dataSource={Items} columns={columnsTable} />
    </>
  );
};

export default App;
