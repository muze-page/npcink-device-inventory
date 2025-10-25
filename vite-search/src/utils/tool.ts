//公共方法
import {
  DataItemArr,
} from "@/type/index";
import dayjs, { Dayjs } from "dayjs";

//传入日期，返回格式化
export const formatDate = (date: Dayjs) => {
  const formattedTime = dayjs(date).format("YYYY 年 MM 月 DD 日");
  //console.log("Formatted Time:", formattedTime);
  return formattedTime;
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
 * 判断布尔值
 */
export const judge_bool = (boo: boolean) => {
  if (boo === true) {
    return "是";
  } else {
    return "否";
  }
};

/**
 * 展示设备详细数据，去除数组对象中，值是空字符串和undefined的对象
 *添加key对象，值是label的值，展示数据用
 */
export const removeEmpty = (data: DataItemArr[]) => {
  //包含下列字符将移除
  const defaultValues = ["Default string", "Unknown", "NULL"];

  return data
    .filter((obj) => {
      if (typeof obj.value === "string") {
        if (defaultValues.includes(obj.value)) {
          return false;
        } else {
          return obj.value.trim() !== "";
        }
      } else if (typeof obj.value === "number") {
        if (obj.value === 0) {
          return false;
        } else {
          return true; // 如果是数字，保留该项
        }
      } else {
        return false; // 其他情况均移除
      }
    })
    .map((obj) => {
      // 为每个对象添加唯一的 key 属性，值为 label
      return {
        ...obj,
        key: obj.label,
      };
    });
};





