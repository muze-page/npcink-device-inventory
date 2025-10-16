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
    { label: "系统", value: data.os },
    { label: "硬件", value: data.hardware },
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
