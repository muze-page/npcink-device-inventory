/**
 * 内存条
 */

import TabList from "@/components/tab/block/tabList";
import { sum_order } from "@/store/tool";
import { ComputerRam } from "@/store/interface";

const meat = {
  thData: ["型号", "数量（条）"], //表头
  bgColor: "from-red-100 to-red-200 bg-red-50", //颜色
};

//内存替换列表TODO:优化，有内存的，将相关内存统计在一起
const replaceMemory = {
  "2G": 2,
  "4G": 4,
  "8G": 8,
  "16G": 16,
  "32G": 32,
  "64G": 64,
  "128G": 128,
};

interface Props {
  data: ComputerRam[];
}
const App: React.FC<Props> = ({ data }) => {
  //统计次数，输出数组对象
  const tableData = sum_order(data, replaceMemory);

  //顺序
  const sortOrder = ["2G", "4G", "8G", "16G", "32G", "64G"];

  //按容量大小排序
  tableData.sort((a, b) => {
    return sortOrder.indexOf(a.type) - sortOrder.indexOf(b.type);
  });

  return (
    <>
      <TabList meat={meat} tableData={tableData} />
    </>
  );
};

export default App;
