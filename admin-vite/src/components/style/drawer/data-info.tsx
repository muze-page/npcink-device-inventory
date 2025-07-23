/**
 * 自定义设备信息展示
 */
import { Card } from "antd";
import { StyleDeviceData } from "@/store/interface";
import { formatDate } from "@/store/tool";
interface Props {
  deviceData: StyleDeviceData;
}
const App: React.FC<Props> = ({ deviceData }) => {
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
        style={{ width: 600, marginTop: 20 }}
      >
        <p>
          <b>采购总价：</b>
          {deviceData.total}
        </p>
        <p>
          <b>采购单号：</b>
          {deviceData.order}
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
          {deviceData.purchaser}
        </p>
      </Card>
    </>
  );
};

export default App;
