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

import TabHeader from "@/components/pcList/drawer/tabHeader";
import Info from "@/components/pcList/device-details/info";
import Change from "@/components/pcList/device-details/change";
import Seting from "@/components/pcList/device-details/seting";
import Detailed from "@/components/pcList/device-details/detailed/index";

import MacOs from "@/assets/macos.png";
import Win from "@/assets/windows_s.png";
import { findOsTypeObj } from "@/store/tool";

import {  OsTypeArray } from "@/store/interface";

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

  const osTypeArray = [
    { id: 1, name: "Mac", image: MacOs },
    { id: 2, name: "Windows", image: Win },
  ];

  //找到需要的系统对象
  const osTypeObj = findOsTypeObj(osTypeArray, drawerData);

  //实时更新数据
  const [realData, setAa] = useState({});

  const changeReal = (key: string, value: string) => {
    setAa((prevAa) => ({ ...prevAa, [key]: value }));
  };

  // 将 realData 和 changeReal 作为上下文的值
  const value = { realData, changeReal };

  return (
    <DeviceContext.Provider value={value}>
      {/**品牌标志 */}

      <div key={osTypeObj?.id} className="flex">
        {/**LOGO */}
        <Mark osType={osTypeObj!} />
        {/**详细内容 */}
        <TabHeader osType={osTypeObj!} data={drawerData} />
      </div>

      <Tabs defaultActiveKey="1" items={items} />
    </DeviceContext.Provider>
  );
};

export default App;
/**
 * 标识 - 不同的设备不同的背景色
 */

interface PropsMark {
  osType: OsTypeArray;
}
const Mark: React.FC<PropsMark> = ({ osType }) => (
  <div
    className={`rounded-l-[4px] py-[22px] px-[10px] 
${
  (osType.name === "Windows" && "bg-[#356dee]") ||
  (osType.name === "Mac" && "Mac_icon_background_color")
}
`}
  >
    <img src={osType.image} className="w-[110px] h-[110px]" />
  </div>
);
