/**
 * 主板
 */

import TabList from "@/pages/check/block/tabList";
import { sum_brand, replaceKeyValues } from "@/store/tool";
import { replaceBaseboard } from "@/store/dataReplace";
import { ComputerBaseboard, TableData } from "@/type/index";

const meat = {
  thData: ["型号", "数量（个）"], //表头
  bgColor: "from-green-100 to-green-200 bg-green-50", //颜色
};

interface Props {
  data: ComputerBaseboard[];
}
const App: React.FC<Props> = ({ data }) => {
  //统计次数，输出数组对象
  const arr = sum_brand(data, "manufacturer");

  //关键词替换
  const Data = replaceKeyValues(arr, "type", replaceBaseboard) as TableData[];

  //合并同类项

  const tableData: TableData[] = Data.reduce(
    (acc: TableData[], curr: TableData) => {
      const existingObj = acc.find((obj) => obj.type === curr.type);
      if (existingObj) {
        existingObj.sum += curr.sum;
      } else {
        acc.push({ type: curr.type, sum: curr.sum });
      }
      return acc;
    },
    []
  );

  //从大到小，按数量排序
  tableData.sort((a, b) => b.sum - a.sum);

  return (
    <>
      <TabList meat={meat} tableData={tableData} />
    </>
  );
};

export default App;
