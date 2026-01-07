/**
 * 弹窗
 */

import { Modal } from "antd";
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
      <Modal
        title="电脑资产详情"
        open={active}
        onCancel={onActive}
        style={{ top: 50 }}
        width={"700px"}
        footer={null}
      >
        {/**标识栏 */}
        <TabHeader />
        {/**Tab栏 */}
        <Property />
        {/** 测试用 */}
        <PrintData data={data} title="打印当前设备信息" />
      </Modal>
    </>
  );
};

export default App;
