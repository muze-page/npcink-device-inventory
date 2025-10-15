/**
 * 设备详情 - UUID
 *
 */
import { Table } from "antd";
import { ComputerUuid } from "@/type/index";
import { columnsTable } from "@/store/dataReplace";
import { removeEmpty } from "@/store/tool";
interface Props {
  data: ComputerUuid;
}
const App: React.FC<Props> = ({ data }) => {
  const Items = [
    { key: "1", label: "系统", value: data.os },
    { key: "2", label: "硬件", value: data.hardware },
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
