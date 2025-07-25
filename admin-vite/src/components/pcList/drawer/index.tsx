/**
 * 弹窗
 */

import { Drawer } from "antd";
import Property from "@/components/pcList/device-details";
import { MysqlDeviceChangeMeat } from "@/store/interface";
interface Props {
  data: MysqlDeviceChangeMeat;
  active: boolean;
  onActive: () => void;
}
const App: React.FC<Props> = ({ data, active, onActive }) => {
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
        <Property data={data} />
      </Drawer>
    </>
  );
};

export default App;
