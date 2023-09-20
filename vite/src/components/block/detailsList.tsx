/**
 * 设备详情
 */
import Mac from "@/assets/mac.png";
import User from "@/assets/user.svg";
const App: React.FC = () => {
  return (
    <>
      {/**开始循环 */}
      <div className="cursor-pointer p-[10px] rounded mr-[1.7%] mt-4 w-[30.7%] h-[272px] mac">
        {/**顶部标志 */}
        <div className="mt-2 mb-3 ml-4">
          <img src={Mac} className="h-10" />
        </div>
        {/**底部数据 */}
        <div className="p-4 text-xs text-zinc-500  bg-white rounded whitespace-nowrap">
          {/*备注名*/}
          <p className="text-sm font-bold text-zinc-800 leading-5 m-0">
            大大怪
          </p>
          {/*设备型号*/}
          <p className="mt-3">Macmini9,1</p>
          {/*配置信息*/}
          <p className="mt-2">intel / 8 GB / 251 GB</p>
          {/*昵称*/}
          <p className="flex items-center mt-4">
            <img src={User} className="svg" />
            <span>Npcink</span>
          </p>
          {/*昵称*/}
        </div>
      </div>
    </>
  );
};

export default App;
