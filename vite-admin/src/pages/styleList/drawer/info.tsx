/**
 * 自定义设备信息展示
 */
import { useContext } from "react";
import { Card, Skeleton } from "antd";
import { StyleDeviceData } from "@/type/index";

//跨组件提供方法
import { StyleContext } from "@/context/StyleContext";

import { formatDate, findBValue, formatNumber } from "@/utils/tool";
//导入自定义设备的采购和支付方式列表
import { stylePlatform, stylePayType } from "@/utils/replace";
interface Props {
  deviceData: StyleDeviceData;
}
const App: React.FC<Props> = ({ deviceData }) => {
  //拿到是否隐藏姓名的状态
  const { isName } = useContext(StyleContext);

  //采购平台
  const platfromType = findBValue(stylePlatform, deviceData.platform);
  //支付方式
  const payType = findBValue(stylePayType, deviceData.pay_method);
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
        style={{ width: "100%" }}
      >
        <p>
          <b>采购总价：</b>
          {formatNumber(deviceData.total)} 元
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
          {payType}
        </p>

        <p>
          <b>采购平台：</b>
          {platfromType}
        </p>
        <p>
          <b>采购数量：</b>
          {formatNumber(deviceData.numbers)}
        </p>
        <p>
          <b>采购人员：</b>
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
