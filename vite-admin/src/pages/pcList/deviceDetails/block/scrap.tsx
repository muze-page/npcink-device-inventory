/**
 * 设置页面的残值组件
 */
import React from "react";
import { Tooltip } from "antd";
import { MysqlDeviceChangeMeat } from "@/type";
import { getPercentage } from "@/utils/tool";

interface Props {
  drawerData: MysqlDeviceChangeMeat; //设备数据
  residualValue: number; //残值
}
const App: React.FC<Props> = ({ drawerData, residualValue }) => {
  return (
    <>
      <div className="flex">
        <div className="flex-1">
          <Tooltip title="采购价对比二手价格的百分比">折旧率：</Tooltip>
          {/* 为啥可能是字符串 */}
          {getPercentage(
            Number(drawerData.depreciation),
            Number(drawerData.purchase)
          )}
        </div>
        <div className="flex-1">
          <Tooltip title="按照设定百分比，相对于购买时间，当前剩下的价值">
            残值：
          </Tooltip>
          {residualValue}元
        </div>
        <div className="flex-1">
          <Tooltip title="采购价对比残值价格的百分比">残值率：</Tooltip>
          {getPercentage(residualValue, drawerData.purchase)}
        </div>
      </div>
    </>
  );
};
export default App;
