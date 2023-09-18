/**
 * CPU
 */

import TabList from "@/components/block/tabList";

//表头
const thData = ["品牌", "数量（个）"];

const countManufacturers = (dataArrays: any[]) => {
  const counts: { [key: string]: number } = {};

  const processManufacturer = (manufacturer: string) => {
    if (counts.hasOwnProperty(manufacturer)) {
      counts[manufacturer]++;
    } else {
      counts[manufacturer] = 1;
    }
  };

  for (let i = 0; i < dataArrays.length; i++) {
    const manufacturer = dataArrays[i].manufacturer;

    processManufacturer(manufacturer);
  }

  return counts;
};

interface Props {
  data: any;
}
const App: React.FC<Props> = ({ data }) => {
  //分析CPU的品牌
  const typeData = countManufacturers(data);
  //对象转为数组
  const result = Object.entries(typeData).map(([type, sum]) => ({ type, sum }));

  return (
    <>
      <TabList thData={thData} tableData={result} />
    </>
  );
};

export default App;
