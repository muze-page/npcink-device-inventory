/**
 * 电脑硬件资产盘点
 */
import { MysqlDeviceChange, TableData, Replacements } from "@/type/index";
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

//关键词替换TODO:改进，只要部分值出现，就整体替换，提高通用性
/**
 * 根据字符表将指定键的值替换
 * @param tableData 待处理的数据数组
 * @param key 待处理的对象键
 * @param replacements 替换映射表
 * @returns 替换后的数据数组
 */
export const replaceKeyValues = (
  tableData: TableData[],
  key: keyof TableData,
  replacements: Replacements
): TableData[] => {
  return tableData.map((obj) => {
    const updatedValue = replacements[obj[key]] || obj[key];
    return { ...obj, [key]: updatedValue };
  });
};

/**
 * 统计数组中指定容量的出现次数
 * @param data 待处理的硬件数组
 * @returns 对象数组，type是名称，sum是出现次数
 */

//泛型
interface DataItem {
  size: number;
}

type Thresholds = { [type: string]: number };

export const sum_order = (data: DataItem[], thresholds: Thresholds) => {
  const result: TableData[] = [];

  data.forEach(({ size }) => {
    const sizeInGB = size / 1024 ** 3;
    for (const [type, threshold] of Object.entries(thresholds)) {
      if (sizeInGB <= threshold) {
        const index = result.findIndex((item) => item.type === type);
        if (index !== -1) {
          result[index].sum += 1;
        } else {
          result.push({ type, sum: 1 });
        }
        break;
      }
    }
  });

  return result;
};

/**
 *拿到指定键的值并统计该键的出现次数
 * @param dataArrays 待检测数组对象
 * @param type 键名
 * @returns 数组对象[{
 * type:键
 * sum:次数
 * }]
 */

export const sum_brand = (data: any[], key: string): TableData[] => {
  return data.reduce((acc, cur) => {
    const type = cur[key];
    const index = acc.findIndex((item: { type: any }) => item.type === type);
    if (index !== -1) {
      acc[index].sum++;
    } else {
      acc.push({ type, sum: 1 });
    }
    return acc;
  }, []);
};
