//公共方法
import dayjs, { Dayjs } from "dayjs";
export {
  totalResidualValue,
  replaceKeyValues,
  sum_order,
  sum_brand,
} from "@/utils/check";
export { exportTable } from "@/utils/config";
export {
  judge_bool,
  normalize,
  validateIPv4,
  findOsTypeObj,
  handleGraphics,
  updateOSType,
  removeEmpty,
} from "@/utils/pc";
export { formatBytes, formatMB } from "@/utils/format";

//开发环境状态,各种调试按钮用
export const devStatus: boolean = import.meta.env.VITE_STATE;

//传入日期，返回格式化
export const formatDate = (date: Dayjs | string) => {
  const formattedTime = dayjs(date).format("YYYY 年 MM 月 DD 日");
  //console.log("Formatted Time:", formattedTime);
  return formattedTime;
};

/**
 * 将数字格式化为带千分位分隔符的形式
 * 可以处理 undefined 或 null 值
 * 类型安全，接受 number | undefined 并返回字符串
 */
export const formatNumber = (num: number | undefined): string => {
  if (num === undefined || num === null) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// formatBytes/formatMB moved to utils/format to avoid circular imports.

/**
 * 通用函数
 */

//输入两个数，输出百分比
export const getPercentage = (num1: number, num2: number) => {
  if (num1 === 0 || num2 === 0) return "0%";
  //计算出百分比
  return ((num1 / num2) * 100).toFixed(2) + "%";
};
