/**
 * 设备详情 - BIOS
 * https://systeminformation.io/system.html
 */
import { Table } from "antd";
import { ComputerBios } from "@/store/interface";
import { columnsTable } from "@/store/dataReplace";
import { removeEmpty } from "@/store/tool";
interface Props {
  data: ComputerBios;
}
const App: React.FC<Props> = ({ data }) => {
  // BIOS信息的数组
  const Items = [
    { key: "1", label: "供应商", value: data.vendor },
    { key: "2", label: "版本", value: data.version },
    { key: "3", label: "发布日期", value: data.releaseDate },
    { key: "4", label: "校订", value: data.revision },
    { key: "5", label: "语言", value: data.langage },
    { key: "6", label: "特征", value: data.features },
    { key: "7", label: "序列号", value: data.serial },
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
