/**
 * 设备详情 - BIOS
 * https://systeminformation.io/system.html
 */
import { Table } from "antd";
import { ComputerBios } from "@/type/index";
import { columnsTable } from "@/utils/replace";
import { removeEmpty } from "@/utils/tool";
interface Props {
  data: ComputerBios;
}
const App: React.FC<Props> = ({ data }) => {
  // BIOS信息的数组
  const Items = [
    { label: "供应商", value: data.vendor },
    { label: "版本", value: data.version },
    { label: "发布日期", value: data.releaseDate },
    { label: "校订", value: data.revision },
    { label: "语言", value: data.langage },
    { label: "特征", value: data.features },
    { label: "序列号", value: data.serial },
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
