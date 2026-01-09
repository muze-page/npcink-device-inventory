/**
 * 设备详情 - 详细信息
 */

/**
 * 设备详情 - 设备详细信息，TODO:电池信息
 */

import { Tabs } from "antd";
import { Computer } from "@/type/index";

import Cpu from "@/pages/show/cpu";
import Memory from "@/pages/show/memory";
import Graphics from "@/pages/show/graphics";
import Baseboard from "@/pages/show/baseboard";
import Monitor from "@/pages/show/monitor";
import Disk from "@/pages/show/disk";
import Net from "@/pages/show/net";
import Bios from "@/pages/show/bios";
import Chassis from "@/pages/show/chassis";
import Os from "@/pages/show/os";
import System from "@/pages/show/system";
import Uuid from "@/pages/show/uuid";

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
      <Tabs
        defaultActiveKey="1"
        items={tabs}
        tabPosition="top"
        className="device-tabs"
      />
    </>
  );
};

export default App;
