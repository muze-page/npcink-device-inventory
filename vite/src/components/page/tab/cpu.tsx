/**
 * CPU
 */

import TabList from "@/components/block/tabList";
import { sum_brand } from "@/store/tool";
//表头
const thData = ["品牌", "数量（个）"];

interface Props {
  data: any;
}
const App: React.FC<Props> = ({ data }) => {
  //分析CPU的品牌
  const typeData = sum_brand(data, "manufacturer");

  return (
    <>
      <TabList thData={thData} tableData={typeData} />
    </>
  );
};

export default App;
