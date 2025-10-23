/**
 * 自定义设备信息展示
 */
import { useContext } from "react";
import { Card, Skeleton, Space } from "antd";
import { StyleDevice } from "@/type/index";

//跨组件提供方法
import { StyleContext } from "@/context/StyleContext";

import {
  formatDate,
  findBValue,
  formatNumber,
  statusLabel,
} from "@/utils/tool";
//导入自定义设备的采购和支付方式列表
import { stylePlatform, stylePayType } from "@/utils/replace";
interface Props {
  data: StyleDevice;
}
const App: React.FC<Props> = ({ data }) => {
  const deviceData = data.data;
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
            href={deviceData.link}
            target="_blank"
            style={{ color: "#1890ff" }}
          >
            {deviceData.shop_name}
          </a>
        }
        style={{ width: "100%" }}
        className="bg-slate-200"
      >
        <div className="flex  gap-2">
          <Card
            title="设备信息："
            variant="borderless"
             style={{ flex: 1 }}
          >
            <p>
              <b>用途：</b>
              {data.purpose}
            </p>
            <p>
              <b>采购数量：</b>
              {formatNumber(deviceData.numbers)}
            </p>
            <p>
              <b>采购总价：</b>
              {formatNumber(deviceData.total)} 元
            </p>
            <p>
              <b>当前状态：</b>
              {statusLabel(data.state)}
            </p>
            <p>
              <b>分类：</b>
              {data.category}
            </p>
          </Card>
          <Card title="采购信息" variant="borderless"  style={{ flex: 1 }}>
            <p>
              <b>采购人员：</b>
              {isName ? (
                deviceData.purchaser
              ) : (
                <Skeleton.Input active={true} size={"small"} />
              )}
            </p>
            <p>
              <b>设备编号：</b>
              {isName ? (
                data.number
              ) : (
                <Skeleton.Input active={true} size={"small"} />
              )}
            </p>
            <p>
              <b>使用人员：</b>
              {isName ? (
                data.name
              ) : (
                <Skeleton.Input active={true} size={"small"} />
              )}
            </p>
          </Card>
        </div>
        <Card title="订单信息" variant="borderless" className="mt-2">
          <Space size={16}>
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
          </Space>
          <Space size={16}>
            <p>
              <b>采购平台：</b>
              {platfromType}
            </p>
            <p>
              <b>支付方式：</b>
              {payType}
            </p>
          </Space>
        </Card>
      </Card>
    </>
  );
};

export default App;
