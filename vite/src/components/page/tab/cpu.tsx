/**
 * CPU
 */

import TabList from "@/components/block/tabList";

//表头
const thData = ["品牌", "数量（个）"];

//数据
const tableData = [
  {
    type: "Intel",
    sum: 0,
  },
  {
    type: "AMD",
    sum: 0,
  },
  {
    type: "Apple",
    sum: 0,
  },
  {
    type: "其他",
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
