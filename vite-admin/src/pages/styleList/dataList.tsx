/**
 * 自定义设备详情
 *  {JSON.stringify(data, null, 2)}
 */
import { useContext } from "react";
import { Checkbox, Tooltip, Skeleton, Space } from "antd";

//跨组件提供方法
import { StyleContext } from "@/context/StyleContext";

//准备类型
import { StyleDevice } from "@/type/index";

//准备采购平台类型
import { formatDate, formatNumber } from "@/utils/tool";

interface Props {
  data: StyleDevice; //拿到自定义设备数据
  onActive: () => void; //修改状态
  onDrawerData: () => void; //保存值
  selectable?: boolean; //批量选择模式
  selected?: boolean; //是否已选中
  onSelect?: () => void; //选中切换
}
const App: React.FC<Props> = ({
  data,
  onActive,
  onDrawerData,
  selectable = false,
  selected = false,
  onSelect,
}) => {
  //拿到是否隐藏姓名的状态
  const { isName } = useContext(StyleContext);
  const title = data.data?.title || "未命名设备";
  const total = data.data?.total ?? 0;

  //点击打开弹窗或切换选中状态
  const handleCardClick = () => {
    if (selectable) {
      onSelect?.();
      return;
    }
    onActive(); //打开弹窗
    onDrawerData(); //保存值
  };

  return (
    <>
      {/**开始展示设备信息 */}
      <div
        className={`relative cursor-pointer p-4 rounded-xl w-52 h-72 mac hover:border-1 hover:border-blue-400 ${
          selectable && selected ? "ring-2 ring-blue-400" : ""
        }`}
        onClick={handleCardClick}
      >
        {selectable ? (
          <div
            className="absolute top-2 right-2 z-10"
            onClick={(event) => event.stopPropagation()}
          >
            <Checkbox checked={selected} onChange={() => onSelect?.()} />
          </div>
        ) : null}
        {/**底部数据 */}
        <div className="text-xs text-zinc-500  rounded whitespace-nowrap min-h-[190px]  overflow-hidden">
          {/*设备名称*/}
          <p className="text-sm font-bold text-zinc-800 leading-2 h-10 m-0 whitespace-normal break-words">
            <Tooltip title={"设备名称：" + title}>
              {title}
            </Tooltip>
          </p>
          <Space direction="vertical" size={"small"} className="mt-2">
            {/*设备编号*/}

            <Tooltip title={"设备编号：" + data.number}>
              <b>编号：</b>
              {isName ? (
                data.number
              ) : (
                <Skeleton.Input active={true} size={"small"} className="!h-4" />
              )}
            </Tooltip>

            {/*设备分类*/}

            <Tooltip title={"设备分类：" + data.category}>
              <b>分类：</b>
              {isName ? (
                data.category
              ) : (
                <Skeleton.Input active={true} size={"small"} className="!h-4" />
              )}
            </Tooltip>

            {/*使用人*/}

            <Tooltip title={"使用人或位置：" + data.name}>
              <b>使用：</b>
              {isName ? (
                data.name
              ) : (
                <Skeleton.Input active={true} size={"small"} className="!h-4" />
              )}
            </Tooltip>

            {/*设备价格*/}
            <Tooltip title={"设备价格：" + formatNumber(total)}>
              <b>价格：</b>
              {formatNumber(total)} 元
            </Tooltip>
            {/*状态*/}
            <Tooltip title={"设备状态：" + data.state}>
              <b>状态：</b>
              {data.state}
            </Tooltip>

            {/*时间*/}

            <Tooltip title={"设备记录时间：" + formatDate(data.created_at)}>
              <span>
                <b>时间：</b> {formatDate(data.created_at)}
              </span>
            </Tooltip>
          </Space>
        </div>
      </div>
    </>
  );
};

export default App;
