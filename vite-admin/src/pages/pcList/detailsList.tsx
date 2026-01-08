/**
 * 设备详情
 */
import { useContext } from "react";
import { DevieContext } from "@/context/DeviceContext";
import { Tooltip, Skeleton, Space } from "antd";
import { MysqlDeviceChangeMeat } from "@/type/index";
import Mac from "@/assets/pc/mac.png";
import Win from "@/assets/pc/windows.png";
import { findOsTypeObj } from "@/utils/tool";

interface Props {
  data: MysqlDeviceChangeMeat; //设备数据
  onOpen: () => void; //打开弹窗
}
const App: React.FC<Props> = ({ data, onOpen }) => {
  //拿到公共值
  const { isName } = useContext(DevieContext);
  //点击打开弹窗并保存选中的值
  const showDrawer = () => {
    onOpen();
  };

  //展示图片
  const osTypeArray = [
    { id: 1, name: "Mac", image: Mac },
    { id: 2, name: "Windows", image: Win },
  ];

  //找到需要的系统对象
  const osTypeObj = findOsTypeObj(osTypeArray, data.meat.ostype);

  return (
    <>
      {/**开始循环 */}
      <div
        className="
        cursor-pointer p-4 rounded-xl w-52 h-72 mac 
        hover:border-1 hover:border-blue-400"
        onClick={() => {
          showDrawer();
        }}
      >
        {/**顶部标志 */}
        <div>
          <img key={osTypeObj.name} src={osTypeObj.image} className="h-10" />
        </div>

        {/**底部数据 */}
        <div className="text-xs text-zinc-500 rounded whitespace-nowrap min-h-[190px] overflow-hidden">
          {/*姓名*/}
          <div className="mt-2 text-sm font-bold text-zinc-800 leading-2 h-10 m-0 whitespace-normal break-words  ">
            {isName ? (
              data.name
            ) : (
              <Skeleton.Input active={true} size={"small"} />
            )}

            {/** </div> */}
          </div>

          <Space direction="vertical" size={0}>
            {/*设备型号*/}
            <Tooltip
              title={"主板型号：" + data.meat.motherboard}
              className="text-[10px]"
            >
              {data.meat.motherboard}
            </Tooltip>

            <Tooltip
              title={
                "CPU品牌 / 型号：" + data.meat.cpu + " / " + data.meat.cpuModel
              }
              className=" text-[10px]"
            >
              {data.meat.cpuModel}
            </Tooltip>

            <Tooltip
              title={"显卡型号：" + data.meat.graphics}
              className=" text-[10px]"
            >
              {data.meat.graphics}
            </Tooltip>
          </Space>
          <Space direction="vertical" size={"small"} className="flex mt-1">
            {/*配置信息*/}
            <Tooltip
              title={
                " 总内存容量 / 总硬盘容量：" +
                data.meat.memory +
                " / " +
                data.meat.disk
              }
            >
              <b>配置：</b>
              {data.meat.memory} / {data.meat.disk}
            </Tooltip>

            {/*编号*/}

            <Tooltip title={"设备编号：" + data.number}>
              <b>编号：</b> {data.number}
            </Tooltip>

            <Tooltip title={"当前状态：" + data.state}>
              <b>状态：</b>
              {data.state}
            </Tooltip>
            
            <Tooltip title={"当前部门：" + data.department}>
              <b>部门：</b>
              {data.department}
            </Tooltip>

            <Tooltip title={"当前IP：" + data.ip}>
              <b>IP：</b>
              {data.ip}
            </Tooltip>
          </Space>
        </div>
      </div>
    </>
  );
};

export default App;
