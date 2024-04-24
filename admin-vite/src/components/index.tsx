/**
 * 主页
 */
import React from "react";
import { Tabs } from "antd";
import type { TabsProps } from "antd";
import Tab from "@/components/tab/index";
import Details from "@/components/details/index";
import Config from "@/components/config/index";

const items: TabsProps["items"] = [
  {
    key: "1",
    label: `设备详情`,
    children: <Details />,
  },
  {
    key: "2",
    label: `硬件盘点`,
    children: <Tab />,
  },
  {
    key: "3",
    label: `设置`,
    children: <Config />,
  },
];

const App: React.FC = () => <Tabs defaultActiveKey="1" items={items} />;

export default App;
