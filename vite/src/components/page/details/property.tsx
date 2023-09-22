/**
 * 设备详情 - 展开
 */
import { Tabs } from "antd";
import { CodepenOutlined, ApartmentOutlined } from "@ant-design/icons";
import type { TabsProps } from "antd";
import Info from "@/components/page/details/block/info";
import Change from "@/components/page/details/block/change";
import MacOs from "@/assets/macos.png";
import Win from "@/assets/windows_s.png";
import User from "@/assets/user.svg";

interface Props {
  data: any;
}
const App: React.FC<Props> = ({ data }) => {
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: (
        <span>
          <CodepenOutlined />
          硬件信息
        </span>
      ),
      children: <Info data={data.dataNew}/>,
    },
    {
      key: "2",
      label: (
        <span>
          <ApartmentOutlined />
          变更记录
        </span>
      ),
      children: <Change data={data}/>,
    },
  ];

  //找状态
  const stateWinOs = data.meat.ostype.includes("Windows");
  const stateMacOs = data.meat.ostype.includes("mac");
  return (
    <>
      {/**品牌标志 */}
      <div className="flex">
        {/**LOGO */}
        {/**顶部标志 */}

        <div
          className={`rounded-l-[4px] py-[22px] px-[10px] 
          ${
            (stateWinOs && "bg-[#356dee]") ||
            (stateMacOs && "Mac_icon_background_color")
          }
          `}
        >
          <img
            src={(stateWinOs && Win) || (stateMacOs && MacOs)}
            className="w-[110px] h-[110px]"
          />
        </div>

        {/**详细内容 */}
        <div
          className={`pt-6 pr-[17px] pb-6 pl-[23px] text-white text-sm flex-1 
        ${
          (stateWinOs && "Windows_content_background_color") ||
          (stateMacOs && "Mac_content_background_color")
        }
       
        `}
        >
          {/**备注 */}
          <div className="flex justify-between">
            <p className="flex items-center text-lg">
              {data.styleName ?? "暂无"}
            </p>
          </div>
          {/**操作系统 */}
          <p className="mt-2">{data.meat.model}</p>
          {/*大概配置信息 */}
          <p>
            {data.meat.cpu} / {data.meat.memory}GB / {data.meat.disk}GB
          </p>
          {/**昵称 */}
          <div className="mt-5 flex items-center">
            <p className="flex items-center">
              <img src={User} className="svg svgReversal" />
              <span>{data.name ?? "暂无"}</span>
            </p>
          </div>
        </div>
      </div>
      <Tabs defaultActiveKey="1" items={items} />
    </>
  );
};

export default App;
