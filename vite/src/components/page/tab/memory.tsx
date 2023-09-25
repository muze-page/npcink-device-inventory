/**
 * 内存条
 */

import TabList from "@/components/block/tabList";
import { sum_order } from "@/store/tool";
import { ComputerRam } from "@/store/interface";

const meat = {
  thData: ["型号", "数量（条）"], //表头
  bgColor: "from-red-100 to-red-200 bg-red-50", //颜色
};

//内存替换列表
const replaceMemory = {
  "2G": 2,
  "4G": 4,
  "8G": 8,
  "16G": 16,
  "32G": 32,
};

interface Props {
  data: ComputerRam[];
}
const App: React.FC<Props> = ({ data }) => {
  console.log(data);
  //进行处理
  const tableData = sum_order(data, replaceMemory);

  return (
    <>
      <TabList meat={meat} tableData={tableData} />
    </>
  );
};

export default App;
