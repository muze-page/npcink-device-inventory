/**
 * 设备详情 - 详细信息
 */

/**
 * 设备详情 - 设备详细信息，TODO:电池信息
 */

import { Tabs, Empty } from "antd";
import { Computer } from "@/type/index";

import Cpu from "@/pages/pcList/deviceDetails/detailed/cpu";
import Memory from "@/pages/pcList/deviceDetails/detailed/memory";
import Graphics from "@/pages/pcList/deviceDetails/detailed/graphics";
import Baseboard from "@/pages/pcList/deviceDetails/detailed/baseboard";
import Monitor from "@/pages/pcList/deviceDetails/detailed/monitor";
import Disk from "@/pages/pcList/deviceDetails/detailed/disk";
import Net from "@/pages/pcList/deviceDetails/detailed/net";
import Bios from "@/pages/pcList/deviceDetails/detailed/bios";
import Chassis from "@/pages/pcList/deviceDetails/detailed/chassis";
import Os from "@/pages/pcList/deviceDetails/detailed/os";
import System from "@/pages/pcList/deviceDetails/detailed/system";
import Uuid from "@/pages/pcList/deviceDetails/detailed/uuid";

interface Props {
  data?: Computer;
  loading?: boolean;
}
const App: React.FC<Props> = ({ data, loading }) => {
  if (!data || loading) {
    return <Empty description="设备详情加载中" />;
  }
  //准备组件

  const tabs = [
    { key: "1", label: "处理器", children: <Cpu data={data.cpu} /> },
    {
      key: "2",
      label: "内存",
      children:
        data.memLayout && data.memLayout.length > 0 ? (
          <Memory data={data.memLayout} />
        ) : (
          <Empty />
        ),
    },
    {
      key: "3",
      label: "显卡",
      children:
        data.graphics.controllers && data.graphics.controllers.length > 0 ? (
          <Graphics data={data.graphics.controllers} />
        ) : (
          <Empty />
        ),
    },
    {
      key: "4",
      label: "显示器",
      children:
        data.graphics.displays && data.graphics.displays.length > 0 ? (
          <Monitor data={data.graphics.displays} />
        ) : (
          <Empty />
        ),
    },
    { key: "5", label: "主板", children: <Baseboard data={data.baseboard} /> },
    {
      key: "6",
      label: "硬盘",
      children:
        data.diskLayout && data.diskLayout.length > 0 ? (
          <Disk data={data.diskLayout} />
        ) : (
          <Empty />
        ),
    },
    {
      key: "7",
      label: "网卡",
      children:
        data.net && data.net.length > 0 ? <Net data={data.net} /> : <Empty />,
    },
    { key: "8", label: "BIOS", children: <Bios data={data.bios} /> },
    { key: "9", label: "机箱", children: <Chassis data={data.chassis} /> },
    { key: "10", label: "OS", children: <Os data={data.os} /> },
    { key: "11", label: "系统", children: <System data={data.system} /> },
    { key: "12", label: "UUID", children: <Uuid data={data.uuid} /> },
  ];

  return (
    <>
      <Tabs defaultActiveKey="1" items={tabs} tabPosition="left" />
    </>
  );
};

export default App;
