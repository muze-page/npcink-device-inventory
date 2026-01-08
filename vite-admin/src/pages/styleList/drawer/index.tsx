/**
 * 自定义设备信息展出弹窗
 */
import { Modal, Tabs, Spin } from "antd";
import { useState, lazy, Suspense, useContext, useEffect } from "react";
import type { TabsProps } from "antd";
import { useQuery } from "@tanstack/react-query";
//跨组件提供方法
import { StyleDevice } from "@/type/index";
import { StyleContext } from "@/context/StyleContext";
import { getStyleDetail } from "@/services/index";
import { queryKeys } from "@/services/queryKeys";
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
  const { drawerData, setDrawerData } = useContext(StyleContext);
  const [autoRecordRefreshKey, setAutoRecordRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("1");

  const refreshAutoRecord = () => {
    setAutoRecordRefreshKey((prev) => prev + 1);
  };

  const detailTarget = drawerData.uuid ? drawerData : data;
  useEffect(() => {
    if (detailTarget.uuid) {
      setActiveTab("1");
    }
  }, [detailTarget.uuid]);
  const shouldLoadFull = activeTab === "1" || activeTab === "3";

  const fullDetailQuery = useQuery({
    queryKey: queryKeys.styleDetailFull(detailTarget.uuid || ""),
    queryFn: () => getStyleDetail(detailTarget.uuid, "full"),
    enabled: active && shouldLoadFull && Boolean(detailTarget.uuid),
  });

  useEffect(() => {
    if (fullDetailQuery.data) {
      setDrawerData((prev) => ({ ...prev, ...fullDetailQuery.data }));
    }
  }, [fullDetailQuery.data, setDrawerData]);

  //准备 Tab 栏
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: `设备信息`,
      children: <Info data={detailTarget} loading={fullDetailQuery.isFetching} />,
    },
    {
      key: "2",
      label: `自动记录`,
      children: (
        <ChangeAutoRecord
          uuid={detailTarget.uuid}
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
        width={"800px"}
        footer={null}
      >
        <Suspense
          fallback={
            <div className="py-6 text-center">
              <Spin />
            </div>
          }
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={items}
          />
          <PrintData title="打印当前设备信息" data={detailTarget} />
        </Suspense>
      </Modal>
    </>
  );
};

export default App;
