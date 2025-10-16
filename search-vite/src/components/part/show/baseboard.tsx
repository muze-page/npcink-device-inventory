/**
 * 设备详情 - 主板
 * https://systeminformation.io/system.html
 */
import { Table } from "antd";
import { ComputerBaseboard } from "@/type/index";
import { formatBytes, removeEmpty } from "@/store/tool";
import { columnsTable } from "@/store/dataReplace";
interface Props {
  data: ComputerBaseboard;
}
const App: React.FC<Props> = ({ data }) => {
  // 主板信息的数组
  const Items = [
    { label: "制造商", value: data.manufacturer },
    { label: "型号", value: data.model },
    { label: "版本", value: data.version },
    { label: "序列号", value: data.serial },
    { label: "资产标签", value: data.assetTag },
    { label: "最大内存", value: formatBytes(data.memMax, "GB") },
    { label: "内存插槽", value: data.memslots },
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
