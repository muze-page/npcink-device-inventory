/**
 * 内存条
 */

import TabList from "@/components/block/tabList";

//表头
const thData = ["型号", "数量（条）"];

//数据
const tableData = [
  {
    type: "2G",
    sum: 0,
  },
  {
    type: "4G",
    sum: 0,
  },
  {
    type: "8G",
    sum: 0,
  },
  {
    type: "16G",
    sum: 0,
  },
  {
    type: "32G",
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
