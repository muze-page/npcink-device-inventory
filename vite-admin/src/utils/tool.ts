//公共方法
import {
  Replacements,
  TableData,
  OsTypeArray,
  DataItemArr,
} from "@/type/index";

import dayjs, { Dayjs } from "dayjs";
import Unknown from "@/assets/type/unknown.png";

//替换用数组
import { device_status } from "@/utils/replace";

export { totalResidualValue } from "@/utils/check";
export { exportTable } from "@/utils/config";
export { handleGraphics, updateOSType } from "@/utils/pc";

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

// IPv4 正则表达式
const ipv4Regex =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

// 自定义校验规则
export const validateIPv4 = (_: any, value: string) => {
  if (!value || ipv4Regex.test(value)) {
    return Promise.resolve();
  }
  return Promise.reject(new Error("请输入正确的IP v4 地址"));
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

/**
 * 找到需要的系统对象 - 展示图片用
 * @param array  存储图片的数组对象
 * @param value 系统或平台类型
 * @returns 包含图片的对象
 */
export const findOsTypeObj = (array: OsTypeArray[], value: string) => {
  const result = array.find((item) => item.name === value);
  // 返回默认对象，避免返回 undefined
  return (
    result || {
      name: "unknown",
      image: Unknown /* 其他默认属性 */,
    }
  );
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

/**
 * 处理搜索 MAC 地址的场景
 * 兼容大小写 + 容错空格
 * @param v 输入框的值
 * @returns 若搜索的值类似这样的da:b1:99:04:29:42，则处理成这样的：da-b1-99-04-29-42
 */
export const normalize = (v: string) =>
  v
    .trim()
    .toLowerCase()
    .replace(
      /^([0-9a-f]{2}):([0-9a-f]{2}):([0-9a-f]{2}):([0-9a-f]{2}):([0-9a-f]{2}):([0-9a-f]{2})$/i,
      "$1-$2-$3-$4-$5-$6"
    );
