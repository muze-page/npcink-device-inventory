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
          style={{ width: 500, marginTop: 20 }}
        >
          <Card.Grid hoverable={false} style={gridStyle}>
            <p>采购总价：{item.total}</p>
            <p>采购单号：{item.order}</p>
            <p>下单时间：{item.order_time}</p>
            <p>支付方式：{item.pay_method}</p>
          </Card.Grid>
          <Card.Grid hoverable={false} style={gridStyle}>
            <p>采购用途：{item.purpose}</p>
            <p>采购平台：{item.platform}</p>
            <p>采购数量：{item.number}</p>
          </Card.Grid>
        </Card>
      ))}
    </>
  );
};

export default App;
