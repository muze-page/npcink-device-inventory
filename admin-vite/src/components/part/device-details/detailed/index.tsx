/**
 * 设备详情 - 详细信息
 */

/**
 * 设备详情 - 设备详细信息，TODO:电池信息
 */

import { Tabs } from "antd";
import { Computer } from "@/store/interface";

import Cpu from "@/components/part/device-details/detailed/show/cpu";
import Memory from "@/components/part/device-details/detailed/show/memory";
import Graphics from "@/components/part/device-details/detailed/show/graphics";
import Baseboard from "@/components/part/device-details/detailed/show/baseboard";
import Monitor from "@/components/part/device-details/detailed/show/monitor";
import Disk from "@/components/part/device-details/detailed/show/disk";
import Net from "@/components/part/device-details/detailed/show/net";
import Bios from "@/components/part/device-details/detailed/show/bios";
import Chassis from "@/components/part/device-details/detailed/show/chassis";
import Os from "@/components/part/device-details/detailed/show/os";
import System from "@/components/part/device-details/detailed/show/system";
import Uuid from "@/components/part/device-details/detailed/show/uuid";

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
    { key: "6", label: "硬盘", children: <Disk data={data.diskLayout} /> },
    { key: "7", label: "网卡", children: <Net data={data.net} /> },
    { key: "8", label: "BIOS", children: <Bios data={data.bios} /> },
    { key: "9", label: "机箱", children: <Chassis data={data.chassis} /> },
    { key: "10", label: "OS", children: <Os data={data.os} /> },
    { key: "11", label: "系统", children: <System data={data.system} /> },
    { key: "12", label: "UUID", children: <Uuid data={data.uuid} /> },
  ];

  return (
    <>
      <Tabs defaultActiveKey="1" items={tabs} />
    </>
  );
};

export default App;
