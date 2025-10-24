//公共方法
import { DataItemArr } from "@/type/index";

import dayjs, { Dayjs } from "dayjs";

//替换用数组
import { device_status } from "@/utils/replace";

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

//开发环境状态,各种调试按钮用
export const devStatus: boolean = import.meta.env.VITE_STATE;

//传入日期，返回格式化
export const formatDate = (date: Dayjs) => {
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

//准备设备状态
type DeviceStatus = "apply" | "idie" | "fault" | "scrap" | "repair";
export const statusLabel = (value: DeviceStatus) => {
  return device_status.find((item) => item.value === value)?.label;
};

/**
 * 字节转换单位 - 自动选择合适的单位（适用于硬件规格显示）
 * 对于B和KB单位显示整数（如"512 B"或"8 KB"）
 * 对于MB及以上单位只保留1位小数，并自动去除尾部的0（如"8 GB"而不是"8.0 GB"）
 */
export const formatBytes = (bytes: number | null) => {
  if (bytes === null || bytes === 0) {
    return "0";
  }

  // 自动选择合适的单位，包含PB（Petabyte）单位
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  // 对于硬件规格显示，通常使用整数或1位小数就足够了
  if (unitIndex <= 1) {
    // B和KB单位显示整数
    return Math.round(size) + " " + units[unitIndex];
  } else {
    // MB及以上单位显示最多1位小数，去除尾部的0
    const rounded = parseFloat(size.toFixed(1));
    return rounded + " " + units[unitIndex];
  }
};

/**
 * MB单位转换 - 自动选择合适的单位（适用于内存和显存显示）
 */
export const formatMB = (mb: number | null) => {
  if (mb === null || mb === 0) {
    return "0";
  }

  // 如果是MB单位，我们可以直接处理
  // 自动选择合适的单位，适用于内存和显存显示
  const units = ["MB", "GB", "TB", "PB"];
  let size = mb;
  let unitIndex = 0;

  // 从MB开始，1024 MB = 1 GB
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  // 对于内存和显存显示，通常使用整数或1位小数就足够了
  if (unitIndex === 0) {
    // MB单位显示整数
    return Math.round(size) + " " + units[unitIndex];
  } else {
    // GB及以上单位显示最多1位小数，去除尾部的0
    const rounded = parseFloat(size.toFixed(1));
    return rounded + " " + units[unitIndex];
  }
};

/**
 * 查找对象中，符合要求对象的另一个键的值
 */

export const findBValue = (arr: DataItemArr[], targetAValue: string) => {
  const foundObject = arr.find((obj) => obj.value === targetAValue);
  return foundObject ? foundObject.label : "未找到";
};

/**
 * 通用函数
 */

//输入两个数，输出百分比
export const getPercentage = (num1: number, num2: number) => {
  if (num1 === 0 || num2 === 0) return "0%";
  //计算出百分比
  return ((num1 / num2) * 100).toFixed(2) + "%";
};
