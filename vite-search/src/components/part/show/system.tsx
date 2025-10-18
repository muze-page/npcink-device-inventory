/**
 * 设备详情 - 系统
 * https://systeminformation.io/system.html
 */
import { Table } from "antd";
import { ComputerSystem } from "@/type/index";
import { judge_bool, removeEmpty } from "@/utils/tool";
import { columnsTable } from "@/utils/replace";
interface Props {
  data: ComputerSystem;
}
const App: React.FC<Props> = ({ data }) => {
  const Items = [
    { label: "厂家", value: data.manufacturer },
    { label: "型号", value: data.model },
    { label: "版本", value: data.version },
    { label: "序列号", value: data.serial },
    { label: "货号", value: data.sku },
    { label: "虚拟机", value: judge_bool(data.virtual) },
    { label: "UUID", value: data.uuid },
    { label: "虚拟主机", value: judge_bool(data.virtualHost) },
    {
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
        pagination={{
          pageSize: 10,
          hideOnSinglePage: true,
        }}
      />
    </>
  );
};

export default App;
