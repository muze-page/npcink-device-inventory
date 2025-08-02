//弹窗内容头部
import { useContext } from "react";
import { Skeleton, Space, Tooltip } from "antd";
import { OsTypeArray } from "@/store/interface";
import { device_status } from "@/store/dataReplace";
import { findBValue } from "@/store/tool";
import { AppContext } from "@/components/pcList/Context";
import PrintData from "@/block/printData";
import MacOs from "@/assets/macos.png";
import Win from "@/assets/windows_s.png";
import { findOsTypeObj } from "@/store/tool";

const App: React.FC = ({}) => {
  //获取数据，拿到隐藏姓名状态
  const { drawerData, isName } = useContext(AppContext);

  //当前设备状态
  const deviceStatus = findBValue(
    device_status,
    drawerData.state ?? drawerData.state
  );

  //标识 - 不同的设备不同的图片
  const osTypeArray = [
    { id: 1, name: "Mac", image: MacOs },
    { id: 2, name: "Windows", image: Win },
  ];

  //找到需要的系统对象
  const osTypeObj = findOsTypeObj(osTypeArray, drawerData);

  //准备样式
  const styleClassName = `${
    (osTypeObj.name === "Windows" && "Windows_content_background_color") ||
    (osTypeObj.name === "Mac" && "Mac_content_background_color")
  }`;

  return (
    <>
      {/**品牌标志 */}
      {/**LOGO */}
      <div className="flex">
        {/**标识 */}
        <Mark osType={osTypeObj} />
        {/**内容 */}
        <div
          className={`pt-6 pr-[17px] pb-6 pl-[23px] text-white text-sm flex-1 ${styleClassName}`}
        >
          {/**姓名 */}
          <div className="flex justify-between">
            <div className="flex items-center text-lg">
              {isName ? (
                drawerData.name
              ) : (
                <Skeleton.Input active={true} size={"small"} />
              )}
            </div>
          </div>
          {/**
           * 操作系统
           *   <p className="mt-2">{drawerData.meat.model}</p>
           */}

          {/*大概配置信息 */}
          <ul>
            <li className="mt-2">
              <Tooltip title="CPU 厂家 / 内存容量 / 硬盘容量">
                {drawerData.meat.cpu} / {drawerData.meat.memory} /{" "}
                {drawerData.meat.disk}
              </Tooltip>
            </li>
            <li className="mt-2">
              <Space size={"large"} align="baseline">
                <span>
                  部门：
                  {drawerData.department ?? drawerData.department ?? "未定"}
                </span>
                <span>状态：{deviceStatus}</span>
                <span>
                  编号：{drawerData.number ?? drawerData.number ?? "没有编号"}
                </span>
              </Space>
            </li>
          </ul>
        </div>
      </div>
      {/** 测试用 */}
      <PrintData data={drawerData} title="打印当前设备信息" />
    </>
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
