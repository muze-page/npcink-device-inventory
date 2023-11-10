//详情展示内容

/**
 * 设备详情 - 设备详细信息
 */

import { Tabs } from "antd";
import { Computer } from "@/store/interface";

import Cpu from "@/components/block/detailed/show/cpu";
import Memory from "@/components/block/detailed/show/memory";



interface Props {
  data: Computer;
}
const App: React.FC<Props> = ({ data }) => {
 

  

  //准备组件
  const tabs = [
    { key: "1", label: "处理器", children: <Cpu data={data.cpu} /> },
    { key: "2", label: "内存", children: <Memory data={data.memLayout}/> }
  ];

  return (
    <>
      <Tabs defaultActiveKey="1" items={tabs} />
    </>
  );
};

export default App;
