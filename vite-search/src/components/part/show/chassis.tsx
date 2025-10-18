/**
 * 设备详情 - 机箱
 *https://systeminformation.io/system.html
 */
import { Table } from "antd";
import { ComputerChassis } from "@/type/index";
import { columnsTable } from "@/utils/dataReplace";
import { removeEmpty } from "@/utils/tool";
interface Props {
  data: ComputerChassis;
}
const App: React.FC<Props> = ({ data }) => {
  const Items = [
    { label: "厂家", value: data.manufacturer },
    { label: "型号", value: data.model },
    { label: "类型", value: data.type },
    { label: "版本", value: data.version },
    { label: "序号", value: data.serial },
    { label: "资产标签", value: data.assetTag },
    { label: "货号", value: data.sku },
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
