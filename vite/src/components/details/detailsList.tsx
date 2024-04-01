/**
 * 设备详情
 */
import { Tooltip } from "antd";
import Mac from "@/assets/mac.png";
import Win from "@/assets/windows_ico.png";
import User from "@/assets/user.svg";
import { MysqlDeviceChangeMeat } from "@/store/interface";

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
  const osTypes = [
    { id: 1, name: "mac", image: Mac },
    { id: 2, name: "Windows", image: Win },
  ];

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
          {osTypes
            .filter((osType) => data.meat.ostype.includes(osType.name))
            .map((osType) => (
              <img key={osType.id} src={osType.image} className="h-10" />
            ))}
        </div>

        {/**底部数据 */}
        <div className="p-4 text-xs text-zinc-500  bg-white rounded whitespace-nowrap">
          {/*姓名*/}
          <p className="text-sm font-bold text-zinc-800 leading-5 m-0">
            {data.name ?? "暂无备注"}
          </p>
          <span>编号：{data.number}</span>
          {/*型号*/}
          <p className="mt-3">
            {data.meat.model === "" ? "暂无" : data.meat.model}
          </p>
          {/*配置信息*/}
          <p className="mt-2">
            {data.meat.cpu} / {data.meat.memory} G /{" "}
            {data.meat.disk > 1024
              ? (data.meat.disk / 1024).toFixed(2) + " T"
              : data.meat.disk + " G"}
          </p>
          {/*昵称*/}
          <p className="flex items-center mt-4">
            <img src={User} className="svg" />
            <span className="whitespace-nowrap overflow-hidden text-ellipsis">
              {data.name ?? "暂无"}
            </span>
          </p>
          {/**状态信息 */}
          <div className="mt-4 flex items-center ">
            {data.state == "1" ? (
              <>
                <Tooltip title="当前状态：正常">
                  <div className="rounded-full w-2 h-2 bg-green-500"></div>
                </Tooltip>
              </>
            ) : (
              <>
                <Tooltip title="当前状态：停用">
                  <div className="rounded-full w-2 h-2 bg-neutral-300"></div>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
