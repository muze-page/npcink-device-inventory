/**
 * 设备详情 - 展开
 */
import { useState } from "react";
import { Tabs } from "antd";

import {
  CodepenOutlined,
  ApartmentOutlined,
  SettingOutlined,
  RadarChartOutlined,
} from "@ant-design/icons";

import type { TabsProps } from "antd";

import TabHeader from "@/components/part/drawer/tabHeader";
import Info from "@/components/part/device-details/info";
import Change from "@/components/part/device-details/change";
import Seting from "@/components/part/device-details/seting";
import Detailed from "@/components/part/device-details/detailed/index";

import MacOs from "@/assets/macos.png";
import Win from "@/assets/windows_s.png";
import { findOsTypeObj } from "@/store/tool";

import { MysqlDeviceChangeMeat, OsTypeArray } from "@/store/interface";

//公共方法
import { DeviceContext } from "@/store/setingContext";

interface Props {
  data: MysqlDeviceChangeMeat;
}
const App: React.FC<Props> = ({ data }) => {
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
      children: <Info data={data.data} time={data.time} />,
    },
    {
      key: "2",
      label: (
        <span>
          <ApartmentOutlined />
          变更记录
        </span>
      ),
      children: <Change uuid={data.uuid} />,
    },
    {
      key: "3",
      label: (
        <span>
          <RadarChartOutlined />
          详细信息
        </span>
      ),
      children: <Detailed data={data.data} />,
    },
    {
      key: "4",
      label: (
        <span>
          <SettingOutlined />
          设置
        </span>
      ),
      children: <Seting data={data} />,
    },
  ];

  const osTypeArray = [
    { id: 1, name: "Mac", image: MacOs },
    { id: 2, name: "Windows", image: Win },
  ];

  //找到需要的系统对象
  const osTypeObj = findOsTypeObj(osTypeArray, data);

  // 初始对象值
  const initialObject = {
    aa: {},
    ab: (key: string, value: string) => {
      // 如果 key 不存在于 obj.aa 中，则新增键值对
      // 更新或新增键值对
      setObj({ ...obj, aa: { ...obj.aa, [key]: value } });
    },
  };

  // 使用 useState 来定义对象和修改对象值的方法
  const [obj, setObj] = useState(initialObject);

  return (
    <DeviceContext.Provider value={obj}>
      {/**品牌标志 */}

      <div key={osTypeObj?.id} className="flex">
        {/**LOGO */}
        <Mark osType={osTypeObj!} />
        {/**详细内容 */}
        <TabHeader osType={osTypeObj!} data={data} />
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
