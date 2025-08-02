/**
 * 自定义设备信息展出弹窗
 */
import { useContext } from "react";
import { Drawer, Tabs, Card, Skeleton } from "antd";
import type { TabsProps } from "antd";
//跨组件提供方法
import { StyleContext } from "@/components/styleList/styleContext";
import { StyleDevice } from "@/store/interface";
import Info from "@/components/styleList/drawer/data-info";
import ChangeRecord from "@/components/styleList/drawer/data-change-record";
import Seting from "@/components/styleList/drawer/data-seting";
import { statusLabel } from "@/store/tool";
//调试打印
import PrintData from "@/block/printData";
interface Props {
  data: StyleDevice; //设备数据
  active: boolean; //弹窗状态
  onActive: () => void; //修改弹窗状态
}
const App: React.FC<Props> = ({ data, active, onActive }) => {
  //拿到是否隐藏姓名的状态
  const { isName } = useContext(StyleContext);

  //准备 Tab 栏
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: `设备详情`,
      children: <Info deviceData={data.data} />,
    },
    {
      key: "2",
      label: `信息修改`,
      children: <Seting onActive={onActive} />,
    },
    {
      key: "3",
      label: `变更记录`,
      children: <ChangeRecord />,
    },
  ];

  return (
    <>
      <Drawer
        title="自定义资产详细信息"
        placement={"right"}
        onClose={onActive}
        open={active}
        width={"500px"}
        size="large"
        className="pt-9"
      >
        <Card title="设备信息" extra={""} style={{ width: 600 }}>
          <p>
            <b>设备使用：</b>
            {isName ? (
              data.name
            ) : (
              <Skeleton.Input active={true} size={"small"} />
            )}
          </p>
          <p>
            <b>设备状态：</b>
            {statusLabel(data.state)}
          </p>
          <p>
            <b>设备用途：</b>
            {data.purpose}
          </p>
        </Card>

        <Tabs defaultActiveKey="1" items={items} />
        <PrintData title="打印当前设备信息" data={data} />
      </Drawer>
    </>
  );
};

export default App;
