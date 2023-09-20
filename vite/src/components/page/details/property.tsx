/**
 * 设备详情 - 展开
 */
import MacOs from "@/assets/macos.png";
import User from "@/assets/user.svg";
const App: React.FC = () => {
  return (
    <>
      {/**品牌标志 */}
      <div className="flex">
        {/**LOGO */}
        <div className="rounded-l-[4px] py-[22px] px-[10px] Mac_icon_background_color">
          <img src={MacOs} className="w-[110px] h-[110px]" />
        </div>
        {/**详细内容 */}
        <div className="pt-6 pr-[17px] pb-6 pl-[23px] text-white text-sm flex-1 Mac_content_background_color">
          {/**备注 */}
          <div className="flex justify-between">
            <p className="flex items-center text-lg">Npcink</p>
          </div>
          {/**操作系统 */}
          <p className="mt-2">Macmini9,1</p>
          {/**大概配置 */}
          <p> intel / 8 GB / 251 GB </p>
          {/**昵称 */}
          <div className="mt-5 flex items-center">
            <p className="flex items-center">
              <img src={User} className="svg svgReversal" />
              <span>大大怪</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
