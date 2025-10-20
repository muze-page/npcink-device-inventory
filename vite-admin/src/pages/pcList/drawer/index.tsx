/**
 * 弹窗
 */

import { Drawer } from "antd";
import { MysqlDeviceChangeMeat } from "@/type/index";
import Property from "@/pages/pcList/deviceDetails";
import TabHeader from "@/pages/pcList/drawer/tabHeader";
import PrintData from "@/components/printData";
interface Props {
  active: boolean; //弹窗状态
  onActive: () => void; //关闭弹窗的回调函数
  data: MysqlDeviceChangeMeat; //传来的设备信息
}
const App: React.FC<Props> = ({ active, onActive, data }) => {
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
        {/**标识栏 */}
        <TabHeader />
        {/**Tab栏 */}
        <Property />
        {/** 测试用 */}
        <PrintData data={data} title="打印当前设备信息" />
      </Drawer>
    </>
  );
};

export default App;
