/**
 * 弹窗
 */

import { Drawer } from "antd";
import Property from "@/components/pcList/device-details";
interface Props {
  active: boolean;//弹窗状态
  onActive: () => void;//关闭弹窗的回调函数
}
const App: React.FC<Props> = ({ active, onActive }) => {
  return (
    <>
      <Drawer
        title="资产详细信息"
        placement={"right"}
        onClose={onActive}
        open={active}
        width={"800px"}
        className="pt-9"
      >
        <Property />
      </Drawer>
    </>
  );
};

export default App;
