/**
 * 主板
 */

import TabList from "@/components/block/tabList";

//表头
const thData = ["型号", "数量（个）"];

//数据
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
];
const App: React.FC = () => {
  return (
    <>
      <TabList thData={thData} tableData={tableData} />
    </>
  );
};

export default App;
