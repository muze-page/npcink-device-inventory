/**
 * 硬盘
 */

import TabList from "@/components/block/tabList";

//表头
const thData = ["型号", "数量（块）"];

//数据
const tableData = [
  {
    type: "128G",
    sum: 0,
  },
  {
    type: "256G",
    sum: 0,
  },
  {
    type: "512G",
    sum: 0,
  },
  {
    type: "1T",
    sum: 0,
  },
  {
    type: "2T",
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
