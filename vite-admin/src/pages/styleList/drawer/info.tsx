/**
 * 自定义设备信息展示
 */
import { useContext } from "react";
import { Card, Skeleton, Empty } from "antd";
import { StyleDevice } from "@/type/index";

//跨组件提供方法
import { StyleContext } from "@/context/StyleContext";

import { formatDate, formatNumber } from "@/utils/tool";

interface Props {
  data: StyleDevice;
}

const App: React.FC<Props> = ({ data }) => {
  const deviceData = data.data;
  //拿到是否隐藏姓名的状态
  const { isName, detailLoading } = useContext(StyleContext);

  if (detailLoading || !deviceData) {
    return <Empty description="设备详情加载中" />;
  }

  return (
    <>
      <Card
        title={deviceData.title || "未命名设备"}
        extra={
          deviceData.link ? (
            <a
              href={deviceData.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#1890ff" }}
            >
              {deviceData.shop_name || "查看链接"}
            </a>
          ) : null
        }
        style={{ width: "100%" }}
        styles={{ body: { backgroundColor: "#f3f4f6" } }}
      >
        <div className="flex gap-2">
          <Card title="设备信息" variant="borderless" style={{ flex: 1 }}>
            <InfoItem label="采购数量">
              {formatNumber(deviceData.numbers ?? 0)}
            </InfoItem>
            <InfoItem label="采购总价">
              {formatNumber(deviceData.total ?? 0)} 元
            </InfoItem>
            <InfoItem label="当前状态">{data.state}</InfoItem>
            <InfoItem label="设备分类">{data.category}</InfoItem>
          </Card>

          <Card title="采购信息" variant="borderless" style={{ flex: 1 }}>
            <ConditionalInfoItem
              label="采购人员"
              value={deviceData.purchaser}
              condition={isName}
            />
            <ConditionalInfoItem
              label="设备编号"
              value={data.number}
              condition={isName}
            />
            <ConditionalInfoItem
              label="使用人员"
              value={data.name}
              condition={isName}
            />
            <ConditionalInfoItem
              label="设备用途"
              value={data.purpose}
              condition={isName}
            />
          </Card>
        </div>

        <Card title="订单信息" variant="borderless" className="mt-2">
          <div className="flex justify-between mb-2">
            <div className="flex-1">
              <ConditionalInfoItem
              label="采购单号"
              value={deviceData.order}
              condition={isName}
            />
            </div>
            <div className="flex-1 ml-4">
              <InfoItem label="下单时间">
                {deviceData.order_time
                  ? formatDate(deviceData.order_time)
                  : "暂无"}
              </InfoItem>
            </div>
          </div>

          <div className="flex justify-between">
            <div className="flex-1">
              <InfoItem label="采购平台">
                {deviceData.platform || "暂无"}
              </InfoItem>
            </div>
            <div className="flex-1 ml-4">
              <InfoItem label="支付方式">
                {deviceData.pay_method || "暂无"}
              </InfoItem>
            </div>
          </div>
        </Card>
      </Card>
    </>
  );
};

// 创建一个可重用的信息展示组件
const InfoItem: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <p>
    <b>{label}：</b>
    {children}
  </p>
);

// 创建一个可重用的带条件渲染的信息展示组件
const ConditionalInfoItem: React.FC<{
  label: string;
  value: string | undefined;
  condition: boolean;
}> = ({ label, value, condition }) => (
  <InfoItem label={label}>
    {condition ? (
      value
    ) : (
      <Skeleton.Input active={true} size={"small"} className="!h-4" />
    )}
  </InfoItem>
);

export default App;
