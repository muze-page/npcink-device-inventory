/**
 * 设备详情 - UUID
 *
 */
import { Table } from "antd";
import { ComputerUuid } from "@/store/interface";
import { columnsTable } from "@/store/dataReplace";
interface Props {
  data: ComputerUuid;
}
const App: React.FC<Props> = ({ data }) => {
  console.log("UUID");
  console.log(data);

  const Items = [
    { key: "1", label: "系统", value: data.os },
    { key: "2", label: "硬件", value: data.hardware },
  ];

  return (
    <>
      <Table dataSource={Items} columns={columnsTable} />
    </>
  );
};

export default App;
