/**
 * 主板
 */

import TabList from "@/components/block/tabList";
import { sum_brand, replaceType } from "@/store/tool";
import { replaceBaseboard } from "@/store/dataReplace";

const meat = {
  thData: ["型号", "数量（个）"], //表头
  bgColor: "from-green-100 to-green-200 bg-green-50", //颜色
};

interface Props {
  data: any;
}
const App: React.FC<Props> = ({ data }) => {
  //替换列表
  console.log(data);

  const arr = sum_brand(data, "manufacturer");
  const tableData = replaceType(arr, replaceBaseboard);
  return (
    <>
      <TabList meat={meat} tableData={tableData} />
    </>
  );
};

export default App;
//数据
/**
 
const tableData = [
  {
    type: "Intel",
    sum: 0,
  },
  {
    type: "戴尔",
    sum: 0,
  },
  {
    type: "惠普",
    sum: 0,
  },
  {
    type: "联想",
    sum: 0,
  },
  {
    type: "AMD",
    sum: 0,
  },
  {
    type: "华硕",
    sum: 0,
  },
  {
    type: "Apple",
    sum: 0,
  },
  {
    type: "微星",
    sum: 0,
  },
  {
    type: "ROG玩家国度",
    sum: 0,
  },
  {
    type: "七彩虹",
    sum: 0,
  },
  {
    type: "华擎",
    sum: 0,
  },
  {
    type: "技嘉",
    sum: 0,
  },
  {
    type: "铭瑄",
    sum: 0,
  },
  {
    type: "昂达",
    sum: 0,
  },
  {
    type: "梅捷",
    sum: 0,
  },
];
* 
 */
