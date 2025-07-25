/**
 * 主页
 */
import React from "react";
import { Tabs } from "antd";
import type { TabsProps } from "antd";
import Check from "@/components/check/index";
import Details from "@/components/pcList/index";
import ChangeList from "@/components/changeList/index";
import Config from "@/components/config/index";
import Style from "@/components/styleList/index";

const items: TabsProps["items"] = [
  {
    key: "1",
    label: `设备详情`,
    children: <Details />,
  },

  {
    key: "5",
    label: `自定义设备`,
    children: <Style />,
  },

  {
    key: "2",
    label: `硬件盘点`,
    children: <Check />,
  },
  {
    key: "3",
    label: `变更记录`,
    children: <ChangeList />,
  },
  {
    key: "4",
    label: `设置`,
    children: <Config />,
  },
];

const App: React.FC = () => <Tabs defaultActiveKey="1" items={items} />;

export default App;
