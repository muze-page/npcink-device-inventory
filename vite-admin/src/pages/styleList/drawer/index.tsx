/**
 * 自定义设备信息展出弹窗
 */
import { Modal, Tabs, Spin } from "antd";
import { useState, lazy, Suspense } from "react";
import type { TabsProps } from "antd";
//跨组件提供方法
import { StyleDevice } from "@/type/index";
const Info = lazy(() => import("@/pages/styleList/drawer/info"));
const ChangeAutoRecord = lazy(() => import("@/components/autoChangeRecord"));
const Seting = lazy(() => import("@/pages/styleList/drawer/seting"));

//调试打印
const PrintData = lazy(() => import("@/components/printData"));
interface Props {
  data: StyleDevice; //设备数据
  active: boolean; //弹窗状态
  onActive: () => void; //修改弹窗状态
}
const App: React.FC<Props> = ({ data, active, onActive }) => {
  const [autoRecordRefreshKey, setAutoRecordRefreshKey] = useState(0);

  const refreshAutoRecord = () => {
    setAutoRecordRefreshKey((prev) => prev + 1);
  };

  //准备 Tab 栏
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: `设备信息`,
      children: <Info data={data} />,
    },
    {
      key: "2",
      label: `自动记录`,
      children: (
        <ChangeAutoRecord
          uuid={data.uuid}
          recordHint="自动记录字段：使用人、编号、用途、状态（仅记录这些字段）"
          refreshKey={autoRecordRefreshKey}
        />
      ),
    },
    {
      key: "3",
      label: `信息修改`,
      children: <Seting onActive={onActive} onSaved={refreshAutoRecord} />,
    },
  ];

  return (
    <>
      <Modal
        title="自定义资产详情"
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
          <Tabs defaultActiveKey="1" items={items} />
          <PrintData title="打印当前设备信息" data={data} />
        </Suspense>
      </Modal>
    </>
  );
};

export default App;
