/**
 * 内存条
 */

import TabList from "@/components/block/tabList";
import { sum_order } from "@/store/tool";

//表头
const thData = ["型号", "数量（条）"];

interface Props {
  data: any;
}
const App: React.FC<Props> = ({ data }) => {
  console.log(data);
  const thresholds = {
    "2G": 2,
    "4G": 4,
    "8G": 8,
    "16G": 16,
    "32G": 32,
  };

  const arr = sum_order(data, thresholds);

  return (
    <>
      <TabList thData={thData} tableData={arr} />
    </>
  );
};

export default App;
