/**
 * CPU
 */

import TabList from "@/pages/check/block/tabList";
import { sum_brand } from "@/store/tool";
import { ComputerCpu } from "@/type/index";

const meat = {
  thData: ["品牌", "数量（个）"], //表头
  bgColor: "from-blue-100 to-blue-200 bg-blue-50", //颜色
};

interface Props {
  data: ComputerCpu[];
}
const App: React.FC<Props> = ({ data }) => {
  //统计次数，输出数组对象
  const tableData = sum_brand(data, "manufacturer");

  //从大到小，按数量排序
  tableData.sort((a, b) => b.sum - a.sum);

  return (
    <>
      <TabList meat={meat} tableData={tableData} />
    </>
  );
};

export default App;
