/**
 * 弹窗
 */

import { Modal, Spin } from "antd";
import { lazy, Suspense } from "react";
import { MysqlDeviceChangeMeat } from "@/type/index";

const Property = lazy(() => import("@/pages/pcList/deviceDetails"));
const TabHeader = lazy(() => import("@/pages/pcList/drawer/tabHeader"));
const PrintData = lazy(() => import("@/components/printData"));
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
        <Suspense
          fallback={
            <div className="py-6 text-center">
              <Spin />
            </div>
          }
        >
          {/**标识栏 */}
          <TabHeader />
          {/**Tab栏 */}
          <Property />
          {/** 测试用 */}
          <PrintData data={data} title="打印当前设备信息" />
        </Suspense>
      </Modal>
    </>
  );
};

export default App;
