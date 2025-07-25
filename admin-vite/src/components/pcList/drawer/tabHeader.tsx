//弹窗内容头部
import { useContext } from "react";
import {Skeleton} from "antd";
import { MysqlDeviceChangeMeat, OsTypeArray } from "@/store/interface";
import { device_status } from "@/store/dataReplace";
import { findBValue } from "@/store/tool";
import { DeviceContext, AppContext } from "@/store/setingContext";
interface Props {
  osType: OsTypeArray; //系统信息，因为后续，设备信息可能要根据设置进行修改，系统一般不会变，这里单独用比较好。
  data: MysqlDeviceChangeMeat; //设备信息
}

const App: React.FC<Props> = ({ osType, data }) => {
  const { realData } = useContext(DeviceContext);

  //拿到隐藏姓名状态
  const { isName } = useContext(AppContext);

  //当前设备状态
  const deviceStatus = findBValue(device_status, realData.state ?? data.state);
  return (
    <div
      className={`pt-6 pr-[17px] pb-6 pl-[23px] text-white text-sm flex-1 
  ${
    (osType.name === "Windows" && "Windows_content_background_color") ||
    (osType.name === "Mac" && "Mac_content_background_color")
  }
  
  `}
    >
      {/**姓名 */}
      <div className="flex justify-between">
        <div className="flex items-center text-lg">
          
          {isName ? (
              realData.name ?? data.name ?? "暂无姓名"
            ) : (
              <Skeleton.Input active={true} size={"small"} />
            )}

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
          编号：{realData.number ?? data.number ?? "没有编号"}
        </div>

        <div className="flex items-center ml-8 m-0">
          状态：
          {deviceStatus}
        </div>
        <div className="flex items-center ml-8 m-0">
          部门：
          {realData.department ?? data.department ?? "未定"}
        </div>
      </div>
    </div>
  );
};

export default App;
