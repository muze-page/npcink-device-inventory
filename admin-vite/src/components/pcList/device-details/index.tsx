/**
 * 设备详情 - 展开
 */
import { useState, useContext } from "react";
import { Tabs } from "antd";

import {
  CodepenOutlined,
  ApartmentOutlined,
  SettingOutlined,
  RadarChartOutlined,
} from "@ant-design/icons";

import type { TabsProps } from "antd";
import Info from "@/components/pcList/device-details/TabInfo";
import Change from "@/components/pcList/device-details/TabChange";
import Seting from "@/components/pcList/device-details/TabSeting";
import Detailed from "@/components/pcList/device-details/TabDetailed";

//公共方法
import { AppContext, DeviceContext } from "@/components/pcList/Context";

const App: React.FC = () => {
  //获取数据
  //拿到父组件传入的删除方法
  const { drawerData } = useContext(AppContext);

  //Tab 栏
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: (
        <span>
          <CodepenOutlined />
          硬件信息
        </span>
      ),
      children: <Info data={drawerData.data} time={drawerData.time} />,
    },

    {
      key: "2",
      label: (
        <span>
          <RadarChartOutlined />
          详细信息
        </span>
      ),
      children: <Detailed data={drawerData.data} />,
    },
    {
      key: "3",
      label: (
        <span>
          <ApartmentOutlined />
          变更记录
        </span>
      ),
      children: <Change uuid={drawerData.uuid} />,
    },
    {
      key: "4",
      label: (
        <span>
          <SettingOutlined />
          设置
        </span>
      ),
      children: <Seting/>,
    },
  ];



  //实时更新数据
  const [realData, setAa] = useState({});

  const changeReal = (key: string, value: string) => {
    setAa((prevAa) => ({ ...prevAa, [key]: value }));
  };

  // 将 realData 和 changeReal 作为上下文的值
  const value = { realData, changeReal };

  return (
    <DeviceContext.Provider value={value}>
      <Tabs defaultActiveKey="1" items={items} />
    </DeviceContext.Provider>
  );
};

export default App;

