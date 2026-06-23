/**
 * 主页
 */
import React from "react";
import { Tabs } from "antd";
import type { TabsProps } from "antd";
import Check from "@/pages/check/index";
import Details from "@/pages/pcList/index";
import ChangeList from "@/pages/changeList/index";
import Config from "@/pages/config/index";
import Style from "@/pages/styleList/index";
import { AdminText } from "@/utils/index";

const items: TabsProps["items"] = [
  {
    key: "sbxq",
    label: AdminText.computer_devices,
    children: <Details />,
  },

  {
    key: "style",
    label: AdminText.custom_devices,
    children: <Style />,
  },
  {
    key: "bgjl",
    label: AdminText.change_records,
    children: <ChangeList />,
  },
  {
    key: "yjpd",
    label: AdminText.hardware_audit,
    children: <Check />,
  },
  {
    key: "sz",
    label: AdminText.settings,
    children: <Config />,
  },
];

const App: React.FC = () => {
  //获取电脑设备分类

  return <Tabs defaultActiveKey="sbxq" items={items} />;
};

export default App;
