/**
 * 自定义设备详情
 *  {JSON.stringify(data, null, 2)}
 */
import { useContext } from "react";
import { Tooltip, Skeleton, Space } from "antd";

//跨组件提供方法
import { StyleContext } from "@/components/styleList/styleContext";

//准备类型
import { StyleDevice } from "@/store/interface";

//准备采购平台类型
import { findOsTypeObj, formatDate } from "@/store/tool";

//准备采购平台列表和支付平台列表
import { platformArray, payArray } from "@/store/dataReplace";

//工具函数
import { statusLabel } from "@/store/tool";
interface Props {
  data: StyleDevice; //拿到自定义设备数据
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

  //找到需要的平台对象、付款方式对象
  const platformObj = findOsTypeObj(platformArray, data.data.platform);

  const payFormObj = findOsTypeObj(payArray, data.data.pay_method);

  return (
    <>
      {/**开始展示设备信息 */}
      <div
        className="
        cursor-pointer p-4 rounded  w-52 h-72 mac
        hover:border-1 hover:border-blue-400 "
        onClick={() => {
          showDrawer();
        }}
      >
        {/**顶部标志 */}

        <Space className="flex justify-between">
          <Tooltip title={"采购平台：" + platformObj.name}>
            <img
              key={platformObj.name}
              src={platformObj.image}
              className="h-10"
            />
          </Tooltip>

          <Tooltip title={"付款方式：" + payFormObj.name}>
            <img
              key={payFormObj.name}
              src={payFormObj.image}
              className="h-10"
            />
          </Tooltip>
        </Space>

        {/**底部数据 */}
        <div className="text-xs text-zinc-500  rounded whitespace-nowrap min-h-[190px] mt-4">
          {/*设备名称*/}
          <p className="text-sm font-bold text-zinc-800 leading-8 m-0 ">
            <Tooltip title={"设备名称：" + data.data.title}>
              {data.data.title}
            </Tooltip>
          </p>
          {/*设备编号*/}
          <p className="mt-2">
            <Tooltip title={"设备编号：" + data.number}>
              <b> 设备编号：</b>
              {isName ? (
                data.number
              ) : (
                <Skeleton.Input active={true} size={"small"} className="!h-4" />
              )}
            </Tooltip>
          </p>
          {/*设备分类*/}
          <p className="mt-2">
            <Tooltip title={"设备分类：" + data.category}>
              <b> 设备分类：</b>
              {isName ? (
                data.category
              ) : (
                <Skeleton.Input active={true} size={"small"} className="!h-4" />
              )}
            </Tooltip>
          </p>
          {/*使用人*/}
          <p className="mt-2">
            <Tooltip title={"使用人：" + data.name}>
              <b> 使用人：</b>
              {isName ? (
                data.name
              ) : (
                <Skeleton.Input active={true} size={"small"} className="!h-4" />
              )}
            </Tooltip>
          </p>
          {/*设备价格*/}
          <p className="mt-2">
            <b>价格：</b>
            {data.data.total}
          </p>
          {/*状态*/}
          <p className="mt-2 w-full truncate">
            <b>状态：</b>
            {statusLabel(data.state)}
          </p>

          {/*时间*/}
          <p className="grid gap-y-1 items-center  mt-2">
            <Tooltip title={"设备采购时间：" + formatDate(data.created_at)}>
              <span>
                <b>时间：</b> {formatDate(data.created_at)}
              </span>
            </Tooltip>
          </p>
        </div>
      </div>
    </>
  );
};

export default App;
