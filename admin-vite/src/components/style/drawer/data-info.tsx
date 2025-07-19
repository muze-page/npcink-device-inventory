/**
 * 自定义设备信息展示
 */
import { Card } from "antd";
import { StyleDeviceData } from "@/store/interface";
import { formatDate } from "@/store/tool";
interface Props {
  data: StyleDeviceData;
}
const App: React.FC<Props> = ({ data }) => {
  return (
    <>
      <Card
        title={data.title}
        extra={<a href="{data.link}" target="_blank">{data.shop_name}</a>}
        style={{ width: 600, marginTop: 20 }}
      >
        <p>
          <b>采购总价：</b>
          {data.total}
        </p>
        <p>
          <b>采购单号：</b>
          {data.order}
        </p>
        <p>
          <b>下单时间：</b>
          {formatDate(data.order_time)}
        </p>
        <p>
          <b>支付方式：</b>
          {data.pay_method}
        </p>

        <p>
          <b>采购平台：</b>
          {data.platform}
        </p>
        <p>
          <b>采购数量：</b>
          {data.number}
        </p>
         <p>
          <b>采购人：</b>
          {data.purchaser}
        </p>
      </Card>
    </>
  );
};

export default App;
