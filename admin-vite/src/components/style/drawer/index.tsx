/**
 * 自定义设备信息展出弹窗
 */
import { Drawer, Tabs, Card } from "antd";
import type { TabsProps } from "antd";
import { StyleDevice } from "@/store/interface";
import Info from "@/components/style/drawer/data-info";
import ChangeRecord from "@/components/style/drawer/data-change-record";
import Seting from "@/components/style/drawer/data-seting";
interface Props {
  data: StyleDevice; //设备数据
  active: boolean; //弹窗状态
  onActive: () => void; //修改弹窗状态
  onDelete: (uuid: string) => void; //根据指定UUID删除设备
}
const App: React.FC<Props> = ({ data, active, onActive, onDelete }) => {
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: `设备详情`,
      children: <Info deviceData={data.data} />,
    },

    {
      key: "2",
      label: `变更记录`,
      children: <ChangeRecord />,
    },
    {
      key: "3",
      label: `信息修改`,
      children: <Seting data={data} onDelete={onDelete} onActive={onActive} />,
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
        <Card title="设备信息" extra={""} style={{ width: 600, marginTop: 20 }}>
          <p>
            <b>使用人：</b>
            {data.name}
          </p>
          <p>
            <b>用途：</b>
            {data.purpose}
          </p>
          <p>
            <b>设备状态：</b>
            {data.state}
          </p>
        </Card>

        <Tabs defaultActiveKey="1" items={items} />
      </Drawer>
    </>
  );
};

export default App;
