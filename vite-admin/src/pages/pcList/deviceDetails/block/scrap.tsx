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
    <table>
      <thead>
        <tr>
          <th className="w-28 text-center">
            <Tooltip title="采购价对比二手价格的百分比">折旧率</Tooltip>
          </th>
          <th className="w-28 text-center">
            <Tooltip title="按照设定百分比，相对于购买时间，当前剩下的价值">
              残值
            </Tooltip>
          </th>
          <th className="w-28 text-center">
            <Tooltip title="采购价对比残值价格的百分比">残值率</Tooltip>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td className="w-28 text-center">
            {/* 为啥可能是字符串 */}
            {getPercentage(
              Number(drawerData.depreciation),
              Number(drawerData.purchase)
            )}
          </td>
          <td className="w-28 text-center">{residualValue}元</td>
          <td className="w-28 text-center">
            {getPercentage(residualValue, drawerData.purchase)}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={3} className="text-sm text-right py-2 text-zinc-400">
            以上数据仅供参考
          </td>
        </tr>
      </tfoot>
    </table>
  );
};
export default App;
