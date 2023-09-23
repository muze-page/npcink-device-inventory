//公共方法
import { SumBrand } from "@/store/interface";

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
 * @param data 待处理的数组对象
 * @param replacements 替换列表
 * @returns 替换后的数组对象
 */
export const replaceType = (
  data: any[],
  replacements: { [x: string]: any },
  type = "type"
) => {
  for (let i = 0; i < data.length; i++) {
    let obj = data[i];
    for (let key in replacements) {
      if (obj[type].includes(key)) {
        obj[type] = replacements[key];
      }
    }
  }
  return data;
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
