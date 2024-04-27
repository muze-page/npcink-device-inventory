/**
 * 设备详情 - 机箱
 *https://systeminformation.io/system.html
 */
import { Table } from "antd";
import { ComputerChassis } from "@/store/interface";
import { columnsTable } from "@/store/dataReplace";
import { removeEmpty } from "@/store/tool";
interface Props {
  data: ComputerChassis;
}
const App: React.FC<Props> = ({ data }) => {

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
      <Table dataSource={removeEmpty(Items)} columns={columnsTable} />
    </>
  );
};

export default App;
