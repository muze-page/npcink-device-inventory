/**
 * 硬盘
 */

import TabList from "@/components/block/tabList";

//表头
const thData = ["型号", "数量（块）"];

interface Props {
  data: any;
}
const App: React.FC<Props> = ({ data }) => {
  const thresholds: Record<string, number> = {
    "128G": 128,
    "256G": 256,
    "512G": 512,
    "1T": 1024,
    "2T": 2048,
  };

  const arr: { type: string; sum: number }[] = [];

  data.forEach((obj: { size: number }) => {
    const sizeInGB = obj.size / (1024 * 1024 * 1024); // 将 size 从字节转换为 GB

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

  return (
    <>
      <TabList thData={thData} tableData={arr} />
    </>
  );
};

export default App;
