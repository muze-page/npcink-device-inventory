/**
 * 自定义设备信息展示
 */
import { useContext } from "react";
import { Card, Skeleton } from "antd";
import { StyleDeviceData } from "@/store/interface";

//跨组件提供方法
import { StyleContext } from "@/components/styleList/styleContext";

import { formatDate } from "@/store/tool";
interface Props {
  deviceData: StyleDeviceData;
}
const App: React.FC<Props> = ({ deviceData }) => {
  //拿到是否隐藏姓名的状态
  const { isName } = useContext(StyleContext);
  return (
    <>
      <Card
        title={deviceData.title}
        extra={
          <a
            href="{deviceData.link}"
            target="_blank"
            style={{ color: "#1890ff" }}
          >
            {deviceData.shop_name}
          </a>
        }
        style={{ width: 450 }}
      >
        <p>
          <b>采购总价：</b>
          {deviceData.total}
        </p>
        <p>
          <b>采购单号：</b>
          {isName ? (
            deviceData.order
          ) : (
            <Skeleton.Input active={true} size={"small"} />
          )}
        </p>
        <p>
          <b>下单时间：</b>
          {formatDate(deviceData.order_time)}
        </p>
        <p>
          <b>支付方式：</b>
          {deviceData.pay_method}
        </p>

        <p>
          <b>采购平台：</b>
          {deviceData.platform}
        </p>
        <p>
          <b>采购数量：</b>
          {deviceData.number}
        </p>
        <p>
          <b>采购人：</b>
          {isName ? (
            deviceData.purchaser
          ) : (
            <Skeleton.Input active={true} size={"small"} />
          )}
        </p>
      </Card>
    </>
  );
};

export default App;
