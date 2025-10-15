/**
 * 主页
 */
import React, { useEffect, useState } from "react";
import { Tabs } from "antd";
import type { TabsProps } from "antd";
import { AppContext } from "@/context/AppContext";
import { DataItemArr } from "@/type/index";

//自定义产品分类获取方法
import { getStyleDeviceCategory } from "@/axios/index";

import Check from "@/components/check/index";
import Details from "@/components/pcList/index";
import ChangeList from "@/components/changeList/index";
import Config from "@/components/config/index";
import Style from "@/components/styleList/index";

const items: TabsProps["items"] = [
  {
    key: "sbxq",
    label: `设备详情`,
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
    key: "bgjl",
    label: `变更记录`,
    children: <ChangeList />,
  },
  {
    key: "sz",
    label: `设置`,
    children: <Config />,
  },
];

const App: React.FC = () => {
  //获取电脑设备分类
  //获取自定义设备分类
  const [styleCategoryOption, setStyleCategoryOption] = useState<DataItemArr[]>(
    [{ label: "", value: "" }]
  );

  //获取设备分类数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await getStyleDeviceCategory();
        if (Array.isArray(categories)) {
          setStyleCategoryOption(categories);
        }
      } catch (error) {
        console.error("获取设备分类失败:", error);
      }
    };

    fetchCategories();
  }, []);
  return (
    <AppContext.Provider value={{ styleCategoryOption }}>
      <Tabs defaultActiveKey="sbxq" items={items} />
    </AppContext.Provider>
  );
};

export default App;
