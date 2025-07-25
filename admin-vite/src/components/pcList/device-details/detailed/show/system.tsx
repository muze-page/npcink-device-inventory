/**
 * 设备详情 - 系统
 * https://systeminformation.io/system.html
 */
import { Table } from "antd";
import { ComputerSystem } from "@/store/interface";
import { judge_bool, removeEmpty } from "@/store/tool";
import { columnsTable } from "@/store/dataReplace";
interface Props {
  data: ComputerSystem;
}
const App: React.FC<Props> = ({ data }) => {
  const Items = [
    { key: "1", label: "厂家", value: data.manufacturer },
    { key: "2", label: "型号", value: data.model },
    { key: "3", label: "版本", value: data.version },
    { key: "4", label: "序列号", value: data.serial },
    { key: "5", label: "货号", value: data.sku },
    { key: "6", label: "虚拟机", value: judge_bool(data.virtual) },
    { key: "7", label: "UUID", value: data.uuid },
    { key: "8", label: "虚拟主机", value: judge_bool(data.virtualHost) },
    {
      key: "9",
      label: "raspberry",
      value: data.raspberry ? JSON.stringify(data.raspberry) : "",
    },
  ];

  return (
    <>
      <Table
        dataSource={removeEmpty(Items)}
        columns={columnsTable}
        size="small"
      />
    </>
  );
};

export default App;
