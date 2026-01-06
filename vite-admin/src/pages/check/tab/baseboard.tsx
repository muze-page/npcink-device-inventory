/**
 * 主板
 */

import TabList from "@/pages/check/block/tabList";
import { replaceKeyValues } from "@/utils/tool";
import { replaceBaseboard } from "@/utils/replace";
import { TableData } from "@/type/index";

const meat = {
  thData: ["型号", "数量（个）"], //表头
  bgColor: "bg-green-50", //颜色
};

interface Props {
  tableData: TableData[];
}
const App: React.FC<Props> = ({ tableData }) => {
  //关键词替换
  const Data = replaceKeyValues(
    tableData,
    "type",
    replaceBaseboard
  ) as TableData[];

  //合并同类项

  const mergedData: TableData[] = Data.reduce(
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
  mergedData.sort((a, b) => b.sum - a.sum);

  return (
    <>
      <TabList meat={meat} tableData={mergedData} />
    </>
  );
};

export default App;
