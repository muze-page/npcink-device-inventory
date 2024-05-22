/**
 * 设备详情
 */
import { useContext } from "react";
import { AppContext } from "@/store/setingContext";
import { Tooltip, Skeleton } from "antd";
import { MysqlDeviceChangeMeat } from "@/store/interface";
import { device_status } from "@/store/dataReplace";
import Mac from "@/assets/mac.png";
import Win from "@/assets/windows_ico.png";
import { findOsTypeObj, findBValue } from "@/store/tool";

interface Props {
  data: MysqlDeviceChangeMeat;
  onActive: () => void; //修改状态
  onDrawerData: () => void; //保存值
}
const App: React.FC<Props> = ({ data, onActive, onDrawerData }) => {
  //拿到隐藏姓名状态
  const { isName } = useContext(AppContext);

  //点击打开弹窗
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
  const osTypeObj = findOsTypeObj(osTypeArray, data);

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
          <img key={osTypeObj?.id} src={osTypeObj?.image} className="h-10" />
        </div>

        {/**底部数据 */}
        <div className="p-4 text-xs text-zinc-500  bg-white rounded whitespace-nowrap min-h-[190px]">
          {/*姓名*/}
          <p className="text-sm font-bold text-zinc-800 leading-8 m-0  ">
            {/** <div className={isName ? "" : "hideName"}> */}
            {isName ? (
              data.name ?? "暂无"
            ) : (
              <Skeleton.Input active={true} size={"small"} />
            )}

            {/** </div> */}
          </p>

          {/*型号*/}
          <p className="mt-2 w-full truncate">{data.meat.model ?? "暂无"}</p>
          {/*配置信息*/}
          <p className="mt-2">
            {data.meat.cpu} / {data.meat.memory} G /{" "}
            {data.meat.disk > 1024
              ? (data.meat.disk / 1024).toFixed(2) + " T"
              : data.meat.disk + " G"}
          </p>
          {/*编号*/}
          <p className="grid gap-y-2 items-center  mt-2">
            <Tooltip title={"设备编号：" + data.number}>
              <span>编号 ： {data.number}</span>
            </Tooltip>

            <Tooltip title={"当前部门：" + data.department}>
              <span>部门：{data.department}</span>
            </Tooltip>
            <Tooltip title={"当前状态：" + deviceStatus + "中"}>
              <span>状态：{deviceStatus}</span>
            </Tooltip>
          </p>
        </div>
      </div>
    </>
  );
};

export default App;
