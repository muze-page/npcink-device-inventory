/**
 * 硬盘
 */

import TabList from "@/pages/check/block/tabList";
import { TableData } from "@/type/index";

const meat = {
  thData: ["型号", "数量（块）"], //表头
  bgColor: "bg-orange-50", //颜色
};

interface Props {
  tableData: TableData[];
}
const App: React.FC<Props> = ({ tableData }) => {
  //顺序
  const sortOrder = ["128G", "256G", "512G", "1T", "2T", "4T"];

  //按容量大小排序
  const sortedData = [...tableData].sort((a, b) => {
    return sortOrder.indexOf(a.type) - sortOrder.indexOf(b.type);
  });

  return (
    <>
      <TabList meat={meat} tableData={sortedData} />
    </>
  );
};

export default App;
