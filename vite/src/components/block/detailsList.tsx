/**
 * 设备详情
 */
import { useState, useContext } from "react";
import { StateData } from "@/store/dataContext";
import Mac from "@/assets/mac.png";
import Win from "@/assets/windows_ico.png";
import User from "@/assets/user.svg";

interface Props {
  data: {
    id: number;
    name: string;
    styleName: string;
    styleNumber: string;
    meat: {
      ostype: string;
      cpu: string;
      model: string;
      memory: string;
      disk: string;
    };
  };
}
const App: React.FC<Props> = ({ data }) => {
  //拿到数据
  const state = useContext(StateData);

  //点击打开弹窗
  const showDrawer = () => {
    state.drawer = true; //打开弹窗
    state.id = data.id; //传递唯一ID
    console.log(state);
  };

  return (
    <>
      {/**开始循环 */}
      <div
        className="cursor-pointer p-[10px] rounded mr-[1.7%] mt-4 w-[30.7%] h-[272px] mac"
        onClick={showDrawer}
      >
        {/**顶部标志 */}
        {data.meat.ostype.includes("mac") && (
          <div className="mt-2 mb-3 ml-3">
            <img src={Mac} className="h-10" />
          </div>
        )}

        {data.meat.ostype.includes("Windows") && (
          <div className="mt-2 mb-3 ml-3">
            <img src={Win} className="h-10" />
          </div>
        )}

        {/**底部数据 */}
        <div className="p-4 text-xs text-zinc-500  bg-white rounded whitespace-nowrap">
          {/*备注名*/}
          <p className="text-sm font-bold text-zinc-800 leading-5 m-0">
            {data.styleName ?? "暂无"}
          </p>
          {/*设备型号*/}
          <p className="mt-3">{data.meat.model}</p>
          {/*配置信息*/}
          <p className="mt-2">
            {data.meat.cpu} / {data.meat.memory}GB / {data.meat.disk}GB
          </p>
          {/*昵称*/}
          <p className="flex items-center mt-4">
            <img src={User} className="svg" />
            <span>{data.name ?? "暂无"}</span>
          </p>
          {/*昵称*/}
        </div>
      </div>
    </>
  );
};

export default App;
