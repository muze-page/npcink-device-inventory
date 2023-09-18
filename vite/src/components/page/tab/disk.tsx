/**
 * 硬盘
 */

import TabList from "@/components/block/tabList";
import { sum_order } from "@/store/tool";
//表头
const thData = ["型号", "数量（块）"];

interface Props {
  data: any;
}
const App: React.FC<Props> = ({ data }) => {
  const thresholds = {
    "128G": 128,
    "256G": 256,
    "512G": 512,
    "1T": 1024,
    "2T": 2048,
  };

  const arr = sum_order(data, thresholds);

  return (
    <>
      <TabList thData={thData} tableData={arr} />
    </>
  );
};

export default App;
