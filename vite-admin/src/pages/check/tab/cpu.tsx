/**
 * CPU
 */

import TabList from "@/pages/check/block/tabList";
import { TableData } from "@/type/index";

const meat = {
  thData: ["品牌", "数量（个）"], //表头
  bgColor: "bg-blue-50", //颜色
};

interface Props {
  tableData: TableData[];
}
const App: React.FC<Props> = ({ tableData }) => {
  //从大到小，按数量排序
  const sortedData = [...tableData].sort((a, b) => b.sum - a.sum);

  return (
    <>
      <TabList meat={meat} tableData={sortedData} />
    </>
  );
};

export default App;
