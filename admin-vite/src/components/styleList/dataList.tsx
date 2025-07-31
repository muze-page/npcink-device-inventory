/**
 * 自定义设备详情
 *  {JSON.stringify(data, null, 2)}
 */
import { useContext } from "react";
import { Tooltip, Skeleton } from "antd";

//时间处理
import dayjs from "dayjs";

//跨组件提供方法
import { StyleContext } from "@/components/styleList/styleContext";
import { StyleDevice } from "@/store/interface";
import Mac from "@/assets/mac.png";

//调试打印
import PrintData from "@/block/printData";

//工具函数
import { statusLabel } from "@/store/tool";
interface Props {
  data: StyleDevice;
  onActive: () => void; //修改状态
  onDrawerData: () => void; //保存值
}
const App: React.FC<Props> = ({ data, onActive, onDrawerData }) => {
  //拿到是否隐藏姓名的状态
  const { isName } = useContext(StyleContext);

  //点击打开弹窗
  const showDrawer = () => {
    onActive(); //打开弹窗
    onDrawerData(); //保存值
  };

  return (
    <>
      {/**开始展示设备信息 */}
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
          <img src={Mac} className="h-10" />
        </div>

        {/**底部数据 */}
        <div className="p-4 text-xs text-zinc-500  bg-white rounded whitespace-nowrap min-h-[190px]">
          {/*设备名称*/}
          <p className="text-sm font-bold text-zinc-800 leading-8 m-0 ">
            {data.data.title}
          </p>
          {/*使用人*/}
          <p className="mt-2">
            使用人：
            {isName ? (
              data.name
            ) : (
              <Skeleton.Input active={true} size={"small"} />
            )}
          </p>
          {/*设备价格*/}
          <p className="mt-2">价格：{data.data.total}</p>
          {/*状态*/}
          <p className="mt-2 w-full truncate">
            状态：{statusLabel(data.state)}
          </p>

          {/*时间*/}
          <p className="grid gap-y-1 items-center  mt-2">
            <Tooltip title={"时间：" + data.time}>
              <span>时间 ： {dayjs(data.time).format("YY-MM-DD")}</span>
            </Tooltip>
          </p>
          <PrintData title="打印当前设备信息" data={data} />
        </div>
      </div>
    </>
  );
};

export default App;
