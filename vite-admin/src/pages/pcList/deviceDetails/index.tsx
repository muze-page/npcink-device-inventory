/**
 * 设备详情 - 展开
 */
import { useContext, useState, lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { Tabs, Spin } from "antd";
import type { TabsProps } from "antd";

const Info = lazy(() => import("@/pages/pcList/deviceDetails/TabInfo"));
const Change = lazy(() => import("@/pages/pcList/deviceDetails/TabChange"));
const Seting = lazy(() => import("@/pages/pcList/deviceDetails/TabSeting"));
const Detailed = lazy(
  () => import("@/pages/pcList/deviceDetails/TabDetailed")
);
const ChangeAutoRecord = lazy(() => import("@/components/autoChangeRecord"));

//公共方法
import { DevieContext } from "@/context/DeviceContext";

const App: React.FC = () => {
  //获取数据
  //拿到父组件传入的删除方法
  const { drawerData, detailLoading } = useContext(DevieContext);
  const [autoRecordRefreshKey, setAutoRecordRefreshKey] = useState(0);

  const refreshAutoRecord = () => {
    setAutoRecordRefreshKey((prev) => prev + 1);
  };

  const renderLazy = (node: ReactNode) => (
    <Suspense
      fallback={
        <div className="py-6 text-center">
          <Spin />
        </div>
      }
    >
      {node}
    </Suspense>
  );

  //Tab 栏
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: <span>硬件信息</span>,
      children: renderLazy(
        <Info
          data={drawerData.data}
          time={drawerData.created_at}
          loading={detailLoading}
        />
      ),
    },

    {
      key: "2",
      label: <span>详细信息</span>,
      children: renderLazy(
        <Detailed data={drawerData.data} loading={detailLoading} />
      ),
    },
    {
      key: "3",
      label: <span>手动记录</span>,
      children: renderLazy(<Change uuid={drawerData.uuid} />),
    },
    {
      key: "4",
      label: <span>自动记录</span>,
      children: renderLazy(
        <ChangeAutoRecord
          uuid={drawerData.uuid}
          recordHint="自动记录字段：姓名、状态、编号、部门、IP、采购价、二手价（仅记录这些字段）"
          refreshKey={autoRecordRefreshKey}
        />
      ),
    },
    {
      key: "5",
      label: <span>设置</span>,
      children: renderLazy(<Seting onSaved={refreshAutoRecord} />),
    },
  ];
  return <Tabs defaultActiveKey="1" items={items} />;
};

export default App;
