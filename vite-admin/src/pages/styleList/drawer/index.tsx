/**
 * 自定义设备信息展出弹窗
 */
import { Drawer, Tabs } from "antd";
import type { TabsProps } from "antd";
//跨组件提供方法
import { StyleDevice } from "@/type/index";
import Info from "@/pages/styleList/drawer/info";
import ChangeAutoRecord from "@/components/autoChangeRecord.tsx";
import Seting from "@/pages/styleList/drawer/seting";

//调试打印
import PrintData from "@/components/printData";
interface Props {
  data: StyleDevice; //设备数据
  active: boolean; //弹窗状态
  onActive: () => void; //修改弹窗状态
}
const App: React.FC<Props> = ({ data, active, onActive }) => {

  //准备 Tab 栏
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: `自动记录`,
      children: <ChangeAutoRecord uuid={data.uuid} />,
    },
    {
      key: "2",
      label: `信息修改`,
      children: <Seting onActive={onActive} />,
    },
  ];

  return (
    <>
      <Drawer
        title="自定义资产详细信息"
        placement={"right"}
        onClose={onActive}
        open={active}
        width={"600px"}
        size="large"
        className="pt-9"
      >
        <Info data={data} />
        <Tabs defaultActiveKey="1" items={items} />
        <PrintData title="打印当前设备信息" data={data} />
      </Drawer>
    </>
  );
};

export default App;
