/**
 * 电脑硬件资产盘点
 */
import { MysqlDeviceChange } from "@/type/index";
import { defaultOption } from "@/utils/index";
import dayjs from "dayjs";
/**
 * 提供设备信息，算出采购价和使用月数组成的数组
 */

interface ProcessedItem {
  purchase: number;
  monthsUsed: number;
}

//计算月份差
const processArray = (arr: MysqlDeviceChange[]): ProcessedItem[] => {
  const now = dayjs();
  return arr.map((item) => {
    // 直接使用 dayjs 方法计算月份差
    const monthsUsed = Math.abs(now.diff(item.created_at, "month"));
    return {
      purchase: item.purchase,
      monthsUsed: monthsUsed,
    };
  });
};

//计算残值 输入采购价 使用月数，算出当前残值
const calculateResidualValue = (purchasePrice: number, monthsUsed: number) => {
  const salvageRate = defaultOption.residual_value_rate * 0.01; // 残值率（5%）
  const totalDepreciationPeriod = defaultOption.depreciation_year; // 折旧年限（月）
  //console.log("残值率", salvageRate);
  //console.log("折旧月数", totalDepreciationPeriod);
  return (
    purchasePrice -
    ((purchasePrice * (1 - salvageRate)) / totalDepreciationPeriod) * monthsUsed
  );
};

/**
 *
 * 将包含采购价和使用月数组成的对象数组，分别算出残值并累计相加输出
 */
const calculateTotalResidualValue = (data: ProcessedItem[]): number => {
  return data.reduce((total, item) => {
    const residualValue = calculateResidualValue(
      item.purchase,
      item.monthsUsed
    );
    return total + residualValue;
  }, 0);
};

//算出总残值
export const totalResidualValue = (data: MysqlDeviceChange[]) => {
  //计算出采购价和使用月数组
  const array = processArray(data);
  //计算出总残值
  return Number(calculateTotalResidualValue(array).toFixed(2));
};
