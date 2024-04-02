/**
 * 设备详情
 */
import { Tooltip } from "antd";
import { CodeOutlined, BuildFilled } from "@ant-design/icons";
import { MysqlDeviceChangeMeat } from "@/store/interface";
import { device_status } from "@/store/dataReplace";
import Mac from "@/assets/mac.png";
import Win from "@/assets/windows_ico.png";
import {findOsTypeObj} from "@/store/tool"

interface Props {
  data: MysqlDeviceChangeMeat;
  onActive: () => void; //修改状态
  onDrawerData: () => void; //保存值
}
const App: React.FC<Props> = ({ data, onActive, onDrawerData }) => {
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
  const deviceStatus =
    device_status.find((obj) => obj.value === data.state)?.label ?? "无状态";

  //找到需要的系统对象
  const osTypeObj = findOsTypeObj(osTypeArray,data);
  
  return (
    <>
      {/**开始循环 */}
      <div
        className="
        cursor-pointer p-[10px] rounded mr-[1.7%] mt-4 w-[23.7%] h-[272px] mac
        hover:border-1 hover:border-blue-400 
        [&:nth-child(4n)]:mr-0"
        onClick={() => {
          showDrawer();
        }}
      >
        {/**顶部标志 */}
        <div className="mt-2 mb-3 ml-3">
          <img key={osTypeObj?.id} src={osTypeObj?.image} className="h-10" />
        </div>

        {/**底部数据 */}
        <div className="p-4 text-xs text-zinc-500  bg-white rounded whitespace-nowrap">
          {/*姓名*/}
          <p className="text-sm font-bold text-zinc-800 leading-5 m-0 ">
            {data.name ?? "暂无"}
          </p>

          {/*型号*/}
          <p className="mt-3">{data.meat.model ?? "暂无"}</p>
          {/*配置信息*/}
          <p className="mt-2">
            {data.meat.cpu} / {data.meat.memory} G /{" "}
            {data.meat.disk > 1024
              ? (data.meat.disk / 1024).toFixed(2) + " T"
              : data.meat.disk + " G"}
          </p>
          {/*编号*/}
          <p className="flex items-center  mt-4">
            <Tooltip title={"设备编号：" + data.number}>
              <CodeOutlined /> ： {data.number}
            </Tooltip>
            <Tooltip title={"当前状态：" + deviceStatus+"中"}>
              <span className="ml-8">
                <BuildFilled />：{deviceStatus}
              </span>
            </Tooltip>
          </p>
          {/**状态信息 */}
          <div className="mt-4 flex items-center "></div>
        </div>
      </div>
    </>
  );
};

export default App;
