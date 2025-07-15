/**
 * 自定义设备详情
 *  {JSON.stringify(data, null, 2)}
 */

import { Tooltip, Skeleton } from "antd";
import { StyleDevice } from "@/store/interface";

import Mac from "@/assets/mac.png";

interface Props {
  data: StyleDevice;
  //onActive: () => void; //修改状态
  //onDrawerData: () => void; //保存值
}
const App: React.FC<Props> = ({ data }) => {
  //拿到隐藏姓名状态
  //const { isName } = useContext(AppContext);
  const isName = true; //

  //点击打开弹窗
  const showDrawer = () => {
    // onActive(); //打开弹窗
    // onDrawerData(); //保存值
  };

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
          <img src={Mac} className="h-10" />
        </div>

        {/**底部数据 */}
        <div className="p-4 text-xs text-zinc-500  bg-white rounded whitespace-nowrap min-h-[190px]">
          {/*姓名*/}
          <p className="text-sm font-bold text-zinc-800 leading-8 m-0  ">
            {/** <div className={isName ? "" : "hideName"}> */}
            {isName ? (
              data.name ? (
                data.name
              ) : (
                "暂无"
              )
            ) : (
              <Skeleton.Input active={true} size={"small"} />
            )}

            {/** </div> */}

            <pre className="bg-gray-100 rounded p-2 mt-2 text-xs overflow-x-auto">
             
            </pre>
          </p>

          {/*状态*/}
          <p className="mt-2 w-full truncate">{data.state}666</p>
          {/*使用人*/}
          <p className="mt-2">{data.name}</p>
          {/*时间*/}
          <p className="grid gap-y-1 items-center  mt-2">
            <Tooltip title={"时间：" + data.time}>
              <span>时间 ： {data.time}</span>
            </Tooltip>
          </p>
        </div>
      </div>
    </>
  );
};

export default App;
