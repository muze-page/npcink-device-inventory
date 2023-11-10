/**
 * 设备详情 - 机箱
 *
 */
import { Table } from "antd";
import { ComputerChassis } from "@/store/interface";
import { columnsTable } from "@/store/dataReplace";
interface Props {
  data: ComputerChassis;
}
const App: React.FC<Props> = ({ data }) => {
  console.log("机箱");
  console.log(data);
  const Items = [
    { key: "1", label: "厂家", value: data.manufacturer },
    { key: "2", label: "型号", value: data.model },
    { key: "3", label: "类型", value: data.type },
    { key: "4", label: "版本", value: data.version },
    { key: "5", label: "序号", value: data.serial },
    { key: "6", label: "资产标签", value: data.assetTag },
    { key: "7", label: "货号", value: data.sku },
  ];

  return (
    <>
      <Table dataSource={Items} columns={columnsTable} />
    </>
  );
};

export default App;
