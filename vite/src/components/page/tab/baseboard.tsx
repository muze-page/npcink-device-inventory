/**
 * 主板
 */
import { useContext } from "react";
import DataContext from "@/store/dataContext";
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
  const optionObj = useContext(DataContext);
  return (
    <>
      <h2>主板</h2>
      <pre>{JSON.stringify(optionObj, null, 2)}</pre>
      <TabList thData={thData} tableData={tableData} />
    </>
  );
};

export default App;
