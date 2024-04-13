//弹窗内容头部
import { useContext } from "react";
import { MysqlDeviceChangeMeat, OsTypeArray } from "@/store/interface";
import { device_status } from "@/store/dataReplace";
import { findBValue } from "@/store/tool";
import { DeviceContext } from "@/store/setingContext";
interface Props {
  osType: OsTypeArray; //系统信息，因为后续，设备信息可能要根据设置进行修改，系统一般不会变，这里单独用比较好。
  data: MysqlDeviceChangeMeat; //设备信息
}

const App: React.FC<Props> = ({ osType, data }) => {
  const { aa } = useContext(DeviceContext);
  console.log("头部接收到的值");
  console.log(aa);
  //准备一个设置值，若设置值为空，则使用传来的数据
  //若设置值存在，则使用传来的设置值
  //const updataData = {
  //  name: "张志胜", //姓名
  //  number: "1126", //编号
  //  state: "apply", //状态
  //  department: "默认", //部门
  //};

  //当前设备状态
  const deviceStatus = findBValue(device_status, aa.state ?? data.state);
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
          {aa.name ?? data.name ?? "没有姓名"}
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
          编号：{aa.number ?? data.number ?? "没有编号"}
        </div>

        <div className="flex items-center ml-8 m-0">
          状态：
          {deviceStatus}
        </div>
        <div className="flex items-center ml-8 m-0">
          部门：
          {aa.department ?? data.department ?? "未定"}
        </div>
      </div>
    </div>
  );
};

export default App;
