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
interface Props {
  data: any;
}
const App: React.FC<Props> = ({ data }) => {
  console.log(data);
  const objects = [
    { size: 1024 },
    { size: 524288 },
    { size: 134217728 },
    { size: 268435456 },
    { size: 536870912 },
    { size: 968435400 },
  ];

  const thresholds = {
    "128G": 128,
    "256G": 256,
    "512G": 512,
    "1T": 1024,
    "2T": 2048,
  };

  const arr = [];

  objects.forEach((obj) => {
    const sizeInGB = obj.size / (1024 * 1024); // 将 size 从字节转换为 GB

    for (const type in thresholds) {
      if (sizeInGB < thresholds[type]) {
        const index = arr.findIndex((item) => item.type === type);
        if (index !== -1) {
          arr[index].sum += 1;
        } else {
          arr.push({ type, sum: 1 });
        }
        break;
      }
    }
  });

  console.log(arr);

  return (
    <>
      <TabList thData={thData} tableData={tableData} />
    </>
  );
};

export default App;
