/**
 * 自定义设备信息展出弹窗
 */
import { Drawer, Tabs, Card } from "antd";
import type { TabsProps } from "antd";
import { StyleDevice } from "@/store/interface";
//设备状态
import { device_status } from "@/store/dataReplace";
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
      children: <Info deviceData={data.data} />,
    },
    {
      key: "2",
      label: `信息修改`,
      children: <Seting data={data} onActive={onActive} />,
    },
    {
      key: "3",
      label: `变更记录`,
      children: <ChangeRecord />,
    },
  ];

  //准备设备状态
  const statusLabel = device_status.find(
    (item) => item.value === data.state
  )?.label;
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
        <Card title="设备信息" extra={""} style={{ width: 600, marginTop: 20 }}>
          <p>
            <b>设备使用：</b>
            {data.name}
          </p>
          <p>
            <b>设备用途：</b>
            {data.purpose}
          </p>
          <p>
            <b>设备状态：</b>
            {statusLabel}
          </p>
        </Card>

        <Tabs defaultActiveKey="1" items={items} />
      </Drawer>
    </>
  );
};

export default App;
