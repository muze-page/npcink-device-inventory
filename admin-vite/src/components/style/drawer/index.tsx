/**
 * 自定义设备信息展出弹窗
 */

import { Drawer } from "antd";
import DateShow from "@/components/style/drawer/dataShow";
import { StyleDevice } from "@/store/interface";
interface Props {
  data: StyleDevice;//设备数据
  active: boolean;//弹窗状态
  onActive: () => void;//修改弹窗状态
}
const App: React.FC<Props> = ({ data, active, onActive }) => {
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
        <DateShow data={data} />
      </Drawer>
    </>
  );
};

export default App;
