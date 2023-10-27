/**
 * 硬盘
 */

import TabList from "@/components/page/tab/block/tabList";
import { sum_order } from "@/store/tool";

import { ComputerDevice } from "@/store/interface";

const meat = {
  thData: ["型号", "数量（块）"], //表头
  bgColor: "from-orange-100 to-orange-200 bg-orange-50", //颜色
};

interface Props {
  data: ComputerDevice[];
}
const App: React.FC<Props> = ({ data }) => {
  
  const thresholds = {
    "128G": 128,
    "256G": 256,
    "512G": 512,
    "1T": 1024,
    "2T": 2048,
  };

  const tableData = sum_order(data, thresholds);

  return (
    <>
      <TabList meat={meat} tableData={tableData} />
    </>
  );
};

export default App;
