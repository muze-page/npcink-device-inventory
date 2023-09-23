//公共方法
import { SumBrand, Replacements } from "@/store/interface";

/**
 *拿到指定键的值并统计该键的出现次数
 * @param dataArrays 待检测数组对象
 * @param type 键名
 * @returns 数组对象[{
 * type:键
 * sum:次数
 * }]
 */

export const sum_brand = (data: any[], key: string): SumBrand[] => {
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
export const sum_order = (
  data: {
    size: number;
  }[],
  thresholds: { [x: string]: number }
) => {
  const arr: { type: string; sum: number }[] = [];

  data.forEach((obj: { size: number }) => {
    const sizeInGB = obj.size / 1024 ** 3; // 将 size 从字节转换为 GB
    for (const type in thresholds) {
      if (sizeInGB <= thresholds[type]) {
        const index = arr.findIndex((item) => item.type === type);
        if (index !== -1) {
          arr[index].sum += 1;
        } else {
          arr.push({ type, sum: 1 });
        }
        break;
      }
    }
  });
  return arr;
};

//关键词替换
/**
 * 根据字符表将指定键的值替换
 * @param arr 待处理
 * @param type 待处理的对象键
 * @param replacements 替换映射表
 * @returns
 */
export const replaceType = (
  arr: object[],
  type: string,
  replacements: Replacements
) => {
  return arr.map((obj) => {
    const { [type]: oldType, ...rest } = obj; // 解构出指定键对应的值和其他属性
    const updatedType = replacements[oldType] || oldType; // 如果有对应的替换值，则使用替换值，否则保持不变
    return { [type]: updatedType, ...rest }; // 返回更新后的对象
  });
};

/**
 * 
 const data =[
    {
        "type": "Apple Inc.",
        "sum": 1
    },
    {
        "type": "Dell Inc.",
        "sum": 1
    },
    {
        "type": "Colorful Technology And Development Co.,LTD",
        "sum": 1
    }
]
 
 const rep = {
  "Apple Inc.": "Apple",
  "Colorful Technology": "七彩虹",
  Dell: "戴尔",
  // 其他需要替换的字符串
};

const old=[
    {
        "type": "Apple",
        "sum": 1
    },
    {
        "type": "戴尔",
        "sum": 1
    },
    {
        "type": "七彩虹",
        "sum": 1
    }
]
 */
