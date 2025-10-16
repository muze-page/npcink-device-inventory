/**
 * 设备详情
 */
import { useContext } from "react";
import { DevieContext } from "@/context/DeviceContext";
import { Tooltip, Skeleton } from "antd";
import { MysqlDeviceChangeMeat } from "@/type/index";
import { device_status } from "@/store/dataReplace";
import Mac from "@/assets/mac.png";
import Win from "@/assets/windows_ico.png";
import { findOsTypeObj, findBValue } from "@/store/tool";

interface Props {
  data: MysqlDeviceChangeMeat; //设备数据
  onActive: () => void; //修改弹窗状态
  onDrawerData: () => void; //保存值
}
const App: React.FC<Props> = ({ data, onActive, onDrawerData }) => {
  //拿到隐藏姓名状态
  const { isName } = useContext(DevieContext);

  //点击打开弹窗并保存选中的值
  const showDrawer = () => {
    onActive(); //打开弹窗
    onDrawerData(); //保存值
  };

  //展示图片
  const osTypeArray = [
    { id: 1, name: "Mac", image: Mac },
    { id: 2, name: "Windows", image: Win },
  ];

  //当前设备状态
  const deviceStatus = findBValue(device_status, data.state);

  //找到需要的系统对象
  const osTypeObj = findOsTypeObj(osTypeArray, data.meat.ostype);

  return (
    <>
      {/**开始循环 */}
      <div
        className="
        cursor-pointer p-4 rounded w-52 h-72 mac
        hover:border-1 hover:border-blue-400"
        onClick={() => {
          showDrawer();
        }}
      >
        {/**顶部标志 */}
        <div>
          <img key={osTypeObj.name} src={osTypeObj.image} className="h-10" />
        </div>

        {/**底部数据 */}
        <div className="mt-4 text-xs text-zinc-500 rounded whitespace-nowrap min-h-[190px]">
          {/*姓名*/}
          <div className="text-sm font-bold text-zinc-800 leading-8 m-0  ">
            {/** <div className={isName ? "" : "hideName"}> */}
            {isName ? (
              data.name
            ) : (
              <Skeleton.Input active={true} size={"small"} />
            )}

            {/** </div> */}
          </div>

          {/*设备型号*/}
          <Tooltip
            title={"设备型号：" + data.meat.model}
            className="mt-2 w-full truncate"
          >
            {data.meat.model}
          </Tooltip>
          <br />
          {/*配置信息*/}
          <Tooltip title={"CPU  / 内存容量 / 硬盘容量"} className="mt-2">
            {data.meat.cpu} / {data.meat.memory} / {data.meat.disk}
          </Tooltip>

          {/*编号*/}
          <p className="grid gap-y-1 items-center  mt-2">
            <Tooltip title={"设备编号：" + data.number}>
              <span>
                <b>编号 ：</b> {data.number}
              </span>
            </Tooltip>

            <Tooltip title={"当前部门：" + data.department}>
              <span>
                <b>部门：</b>
                {data.department}
              </span>
            </Tooltip>
            <Tooltip title={"当前状态：" + deviceStatus}>
              <span>
                <b>状态：</b>
                {deviceStatus}
              </span>
            </Tooltip>
            <Tooltip title={"当前IP：" + data.ip}>
              <span>
                <b>IP：</b>
                {data.ip}
              </span>
            </Tooltip>
          </p>
        </div>
      </div>
    </>
  );
};

export default App;
