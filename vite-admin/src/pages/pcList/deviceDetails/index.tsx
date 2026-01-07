/**
 * 设备详情 - 展开
 */
import { useContext, useState } from "react";
import { Tabs } from "antd";
import type { TabsProps } from "antd";

//准备四个菜单模块
import Info from "@/pages/pcList/deviceDetails/TabInfo";
import Change from "@/pages/pcList/deviceDetails/TabChange";
import Seting from "@/pages/pcList/deviceDetails/TabSeting";
import Detailed from "@/pages/pcList/deviceDetails/TabDetailed";
import ChangeAutoRecord from "@/components/autoChangeRecord";

//公共方法
import { DevieContext } from "@/context/DeviceContext";

const App: React.FC = () => {
  //获取数据
  //拿到父组件传入的删除方法
  const { drawerData } = useContext(DevieContext);
  const [autoRecordRefreshKey, setAutoRecordRefreshKey] = useState(0);

  const refreshAutoRecord = () => {
    setAutoRecordRefreshKey((prev) => prev + 1);
  };

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
      label: <span>手动记录</span>,
      children: <Change uuid={drawerData.uuid} />,
    },
    {
      key: "4",
      label: <span>自动记录</span>,
      children: (
        <ChangeAutoRecord
          uuid={drawerData.uuid}
          recordHint="自动记录字段：姓名、状态、编号、部门、IP、采购价、二手价（仅记录这些字段）"
          refreshKey={autoRecordRefreshKey}
        />
      ),
    },
    {
      key: "5",
      label: <span>设置</span>,
      children: <Seting onSaved={refreshAutoRecord} />,
    },
  ];
  return <Tabs defaultActiveKey="1" items={items} />;
};

export default App;
