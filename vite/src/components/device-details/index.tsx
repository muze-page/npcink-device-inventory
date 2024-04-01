/**
 * 设备详情 - 展开
 */
import { Tabs } from "antd";

import {
  CodepenOutlined,
  ApartmentOutlined,
  SettingOutlined,
  RadarChartOutlined,
} from "@ant-design/icons";

import type { TabsProps } from "antd";

import Msg from "@/components/page/details/drawer/proHeader";
import Info from "@/components/device-details/info";
import Change from "@/components/device-details/change";
import Seting from "@/components/device-details/seting";
import Detailed from "@/components/device-details/detailed/index";

import MacOs from "@/assets/macos.png";
import Win from "@/assets/windows_s.png";

import { MysqlDeviceChangeMeat, PropBgColor } from "@/store/interface";

interface Props {
  data: MysqlDeviceChangeMeat;
}
const App: React.FC<Props> = ({ data }) => {
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: (
        <span>
          <CodepenOutlined />
          硬件信息
        </span>
      ),
      children: <Info data={data.data} />,
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

  const osTypes = [
    { id: 1, name: "mac", image: MacOs },
    { id: 2, name: "Windows", image: Win },
  ];

  return (
    <>
      {/**品牌标志 */}
      {osTypes
        .filter((osType) => data.meat.ostype.includes(osType.name))
        .map((osType) => (
          <div key={osType.id} className="flex">
            {/**LOGO */}
            <Mark osType={osType} />
            {/**详细内容 */}
            <Msg osType={osType} data={data} />
          </div>
        ))}

      <Tabs defaultActiveKey="1" items={items} />
    </>
  );
};

export default App;
/**
 * 标识 - 不同的设备不同的背景色
 */

interface PropsMark {
  osType: PropBgColor;
}
const Mark: React.FC<PropsMark> = ({ osType }) => (
  <div
    className={`rounded-l-[4px] py-[22px] px-[10px] 
${
  (osType.name === "Windows" && "bg-[#356dee]") ||
  (osType.name === "mac" && "Mac_icon_background_color")
}
`}
  >
    <img src={osType.image} className="w-[110px] h-[110px]" />
  </div>
);
