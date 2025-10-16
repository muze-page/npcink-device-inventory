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
    key: "sbxq",
    label: `电脑设备`,
    children: <Details />,
  },

  {
    key: "style",
    label: `自定义设备`,
    children: <Style />,
  },

  {
    key: "yjpd",
    label: `硬件盘点`,
    children: <Check />,
  },
  {
    key: "sz",
    label: `设置`,
    children: <Config />,
  },
  {
    key: "bgjl",
    label: `电脑变更`,
    children: <ChangeList />,
  },
];

const App: React.FC = () => {
  //获取电脑设备分类

  return <Tabs defaultActiveKey="sbxq" items={items} />;
};

export default App;
