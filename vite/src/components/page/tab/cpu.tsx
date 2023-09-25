/**
 * CPU
 */

import TabList from "@/components/block/tabList";
import { sum_brand } from "@/store/tool";
import { ComputerCpu } from "@/store/interface";
const meat = {
  thData: ["品牌", "数量（个）"], //表头
  bgColor: "from-blue-100 to-blue-200 bg-blue-50", //颜色
};

interface Props {
  data:  ComputerCpu[];
}
const App: React.FC<Props> = ({ data }) => {
  //分析CPU的品牌
  const tableData = sum_brand(data, "manufacturer");

  return (
    <>
      <TabList meat={meat} tableData={tableData} />
    </>
  );
};

export default App;
