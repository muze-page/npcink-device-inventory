/**
 * 内存条
 */

import TabList from "@/components/block/tabList";
import { sum_order } from "@/store/tool";

const meat = {
  thData: ["型号", "数量（条）"], //表头
  bgColor: "from-red-100 to-red-200 bg-red-50", //颜色
};

//替换列表
const thresholds = {
  "2G": 2,
  "4G": 4,
  "8G": 8,
  "16G": 16,
  "32G": 32,
};

interface Props {
  data: any;
}
const App: React.FC<Props> = ({ data }) => {
  console.log(data);


  const tableData = sum_order(data, thresholds);
  console.log(tableData);

  return (
    <>
      <TabList meat={meat} tableData={tableData} />
    </>
  );
};

export default App;
