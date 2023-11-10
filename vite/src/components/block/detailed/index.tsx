//详情展示内容

/**
 * 设备详情 - 设备详细信息
 */

import { Tabs } from "antd";
import { Computer } from "@/store/interface";

import Cpu from "@/components/block/detailed/show/cpu";
import Memory from "@/components/block/detailed/show/memory";
import Graphics from "@/components/block/detailed/show/graphics";
import Baseboard from "@/components/block/detailed/show/baseboard";
import Monitor from "@/components/block/detailed/show/monitor";
interface Props {
  data: Computer;
}
const App: React.FC<Props> = ({ data }) => {
  //准备组件
  const tabs = [
    { key: "1", label: "处理器", children: <Cpu data={data.cpu} /> },
    { key: "2", label: "内存", children: <Memory data={data.memLayout} /> },
    {
      key: "3",
      label: "显卡",
      children: <Graphics data={data.graphics.controllers} />,
    },
    {
      key: "4",
      label: "显示器",
      children: <Monitor data={data.graphics.displays} />,
    },
    { key: "5", label: "主板", children: <Baseboard data={data.baseboard} /> },
  ];

  return (
    <>
      <Tabs defaultActiveKey="1" items={tabs} />
    </>
  );
};

export default App;
