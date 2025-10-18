/**
 * 设备详情 - UUID
 *
 */
import { Table } from "antd";
import { ComputerUuid } from "@/type/index";
import { columnsTable } from "@/utils/replace";
import { removeEmpty } from "@/utils/tool";
interface Props {
  data: ComputerUuid;
}
const App: React.FC<Props> = ({ data }) => {
  const Items = [
    { label: "系统", value: data.os },
    { label: "硬件", value: data.hardware },
    { label: "MAC", value: data.macs.join("\n") },
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
