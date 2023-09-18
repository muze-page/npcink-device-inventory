/**
 * CPU
 */

import TabList from "@/components/block/tabList";

//表头
const thData = ["品牌", "数量（个）"];

const countManufacturers = (dataArrays: any[]) => {
  const counts: { [key: string]: number } = {};

  for (let i = 0; i < dataArrays.length; i++) {
    const manufacturer = dataArrays[i].manufacturer;
    console.log(manufacturer);

    if (manufacturer === "Apple") {
      if (counts.hasOwnProperty("Apple")) {
        counts["Apple"]++;
      } else {
        counts["Apple"] = 1;
      }
    } else if (manufacturer === "AMD") {
      if (counts.hasOwnProperty("AMD")) {
        counts["AMD"]++;
      } else {
        counts["AMD"] = 1;
      }
    }
  }

  return counts;
};

interface Props {
  data: any;
}
const App: React.FC<Props> = ({ data }) => {
  //分析CPU的品牌
  const typeData = countManufacturers(data);
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
      sum: typeData.Apple,
    },
    {
      type: "其他",
      sum: 0,
    },
  ];
  return (
    <>
      <TabList thData={thData} tableData={tableData} />
    </>
  );
};

export default App;
