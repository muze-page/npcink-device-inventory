/**
 * 设备详情 - 展开
 */
import { useContext } from "react";
import { Tabs } from "antd";
import type { TabsProps } from "antd";

//准备四个菜单模块
import Info from "@/components/pcList/device-details/TabInfo";
import Change from "@/components/pcList/device-details/TabChange";
import Seting from "@/components/pcList/device-details/TabSeting";
import Detailed from "@/components/pcList/device-details/TabDetailed";
import ChangeAutoRecord from "@/block/change-auto-record";

//公共方法
import { DevieContext } from "@/context/DeviceContext";

const App: React.FC = () => {
  //获取数据
  //拿到父组件传入的删除方法
  const { drawerData } = useContext(DevieContext);

  //Tab 栏
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: <span>硬件信息</span>, 
      children: <Info data={drawerData.data} time={drawerData.created_at} />,
    },

    {
      key: "2",
      label: <span>详细信息</span>,
      children: <Detailed data={drawerData.data} />,
    },
    {
      key: "3",
      label: <span>变更记录</span>,
      children: <Change uuid={drawerData.uuid} />,
    },
    {
      key: "4",
      label: <span>自动记录</span>,
      children: <ChangeAutoRecord uuid={drawerData.uuid} />,
    },
    {
      key: "5",
      label: <span>设置</span>,
      children: <Seting />,
    },
  ];
  return <Tabs defaultActiveKey="1" items={items} />;
};

export default App;
