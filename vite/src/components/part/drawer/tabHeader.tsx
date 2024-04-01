//弹窗内容头部
import { MysqlDeviceChangeMeat, PropBgColor } from "@/store/interface";
import { device_status } from "@/store/dataReplace";
//import User from "@/assets/user.svg";

interface Props {
  osType: PropBgColor;
  data: MysqlDeviceChangeMeat;
}

const App: React.FC<Props> = ({ osType, data }) => {
  //当前设备状态
  const deviceStatus =
    device_status.find((obj) => obj.value === data.state)?.label ?? "无状态";
  return (
    <div
      className={`pt-6 pr-[17px] pb-6 pl-[23px] text-white text-sm flex-1 
  ${
    (osType.name === "Windows" && "Windows_content_background_color") ||
    (osType.name === "mac" && "Mac_content_background_color")
  }
  
  `}
    >
      {/**姓名 */}
      <div className="flex justify-between">
        <div className="flex items-center text-lg">
          {data.name ?? "没有姓名"}
        </div>
      </div>
      {/**操作系统 */}
      <p className="mt-2">{data.meat.model}</p>
      {/*大概配置信息 */}
      <p>
        {data.meat.cpu} / {data.meat.memory} G /{" "}
        {data.meat.disk > 1024
          ? (data.meat.disk / 1024).toFixed(2) + " T"
          : data.meat.disk + " G"}
      </p>

      {/**编号 状态 */}
      <div className="mt-5 flex items-center">
        <div className="flex items-center">
          编号：{data.number ?? "没有编号"}
        </div>

        <div className="flex items-center ml-8 m-0">
          状态：
          {deviceStatus}
        </div>
      </div>
    </div>
  );
};

export default App;
