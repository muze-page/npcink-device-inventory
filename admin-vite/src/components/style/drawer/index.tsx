/**
 * 自定义设备信息展出弹窗
 */
import { Drawer,Tabs } from "antd";
import type { TabsProps } from "antd";
import { StyleDevice } from "@/store/interface";
import Info from "@/components/style/drawer/data-info";
import ChangeRecord from "@/components/style/drawer/data-change-record";
import Seting from "@/components/style/drawer/data-seting";
interface Props {
  data: StyleDevice; //设备数据
  active: boolean; //弹窗状态
  onActive: () => void; //修改弹窗状态
}
const App: React.FC<Props> = ({ data, active, onActive }) => {
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: `设备详情`,
      children: <Info data={data.data} />,
    },

    {
      key: "2",
      label: `变更记录`,
      children: <ChangeRecord />,
    },
    {
      key: "3",
      label: `信息修改`,
      children: <Seting />,
    },
  ];
  return (
    <>
      <Drawer
        title="自定义资产详细信息"
        placement={"right"}
        onClose={onActive}
        open={active}
        width={"60%"}
        className="pt-9"
      >
        <Tabs defaultActiveKey="1" items={items} />
      </Drawer>
    </>
  );
};

export default App;
