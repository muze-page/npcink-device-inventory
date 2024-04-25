//公共方法
import {
  Replacements,
  TableData,
  OsTypeArray,
  MysqlDeviceChangeMeat,
  DataItemArr,
} from "@/store/interface";

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

interface ResultItem {
  type: string;
  sum: number;
}

export const sum_order = (data: DataItem[], thresholds: Thresholds) => {
  const result: ResultItem[] = [];

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
 * 字节转mb
 */
export const bytesToMB = (bytes: number | null, type: string) => {
  if (bytes === null) {
    return "0";
  }
  if (type == "MB") {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }
  if (type == "GB") {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  }
  if (type == "TB") {
    return (bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2) + " TB";
  }
};

/**
 * 判断布尔值
 */
export const judge_bool = (boo: any) => {
  if (boo === true) {
    return "是";
  }

  if (boo === false) {
    return "否";
  }

  return "未知";
};

/**
 * 找到需要的系统对象
 * @param array  存储图片的数组对象
 * @param data 系统类型
 * @returns 包含图片的对象
 */
export const findOsTypeObj = (
  array: OsTypeArray[],
  data: MysqlDeviceChangeMeat
) => {
  return array.find((item) => item.name === data.meat.ostype);
};

/**
 * 将字符串数组转换为对象，方便下拉选择
 */
export const changeSelectData = (data: string[] | undefined) => {
  if (data && data.length > 0) {
    return data.map((str) => ({
      value: str,
      label: str,
    }));
  } else {
    // 如果 defaultOption.department 不存在或为空数组，返回一个空数组或其他默认值
    return [];
  }
};

/**
 * 查找对象中，符合要求对象的另一个键的值
 */

export const findBValue = (arr: DataItemArr[], targetAValue: string) => {
  const foundObject = arr.find((obj) => obj.value === targetAValue);
  return foundObject ? foundObject.label + "中" : "无状态";
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
