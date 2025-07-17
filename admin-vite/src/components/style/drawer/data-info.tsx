/**
 * 自定义设备信息展示
 */
import { Card } from "antd";
import { StyleDeviceData } from "@/store/interface";
interface Props {
  data: StyleDeviceData[];
}
const App: React.FC<Props> = ({ data }) => {
  const gridStyle: React.CSSProperties = {
    width: "50%",
    textAlign: "left",
  };
  return (
    <>
      {data.map((item, index) => (
        <Card
          key={index}
          title={item.title}
          extra={<a href="{item.link}">{item.shop_name}</a>}
          style={{ width: 600, marginTop: 20 }}
        >
          <Card.Grid hoverable={false} style={gridStyle}>
            <p>
              <b>采购总价：</b>
              {item.total}
            </p>
            <p>
              <b>采购单号：</b>
              {item.order}
            </p>
            <p>
              <b>下单时间：</b>
              {item.order_time}
            </p>
            <p>
              <b>支付方式：</b>
              {item.pay_method}
            </p>
          </Card.Grid>
          <Card.Grid hoverable={false} style={gridStyle}>
            <p>
              <b>采购用途：</b>
              {item.purpose}
            </p>
            <p>
              <b>采购平台：</b>
              {item.platform}
            </p>
            <p>
              <b>采购数量：</b>
              {item.number}
            </p>
          </Card.Grid>
        </Card>
      ))}
    </>
  );
};

export default App;
