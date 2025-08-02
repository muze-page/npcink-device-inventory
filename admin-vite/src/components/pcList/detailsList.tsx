/**
 * 设备详情
 */
import { useContext } from "react";
import { AppContext } from "@/components/pcList/Context";
import { Tooltip, Skeleton } from "antd";
import { MysqlDeviceChangeMeat } from "@/store/interface";
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
  const { isName } = useContext(AppContext);

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
        cursor-pointer p-[10px] rounded mr-[2%] mb-4 w-[18.4%] h-[290px] mac
        hover:border-1 hover:border-blue-400 
        [&:nth-child(5n)]:mr-0"
        onClick={() => {
          showDrawer();
        }}
      >
        {/**顶部标志 */}
        <div className="mt-2 mb-3 ml-3">
          <img key={osTypeObj.name} src={osTypeObj.image} className="h-10" />
        </div>

        {/**底部数据 */}
        <div className="p-4 text-xs text-zinc-500   rounded whitespace-nowrap min-h-[190px]">
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
          <Tooltip title={"设备型号：" + data.meat.model} className="mt-2 w-full truncate">
            {data.meat.model}
          </Tooltip>
          <br/>
          {/*配置信息*/}
          <Tooltip title={"CPU  / 内存容量 / 硬盘容量"} className="mt-2">
            {data.meat.cpu} / {data.meat.memory} / {data.meat.disk}
          </Tooltip>

          {/*编号*/}
          <p className="grid gap-y-1 items-center  mt-2">
            <Tooltip title={"设备编号：" + data.number}>
              <span>编号 ： {data.number}</span>
            </Tooltip>

            <Tooltip title={"当前部门：" + data.department}>
              <span>部门：{data.department}</span>
            </Tooltip>
            <Tooltip title={"当前状态：" + deviceStatus}>
              <span>状态：{deviceStatus}</span>
            </Tooltip>
            <Tooltip title={"当前IP：" + data.ip}>
              <span>IP：{data.ip}</span>
            </Tooltip>
          </p>
        </div>
      </div>
    </>
  );
};

export default App;
