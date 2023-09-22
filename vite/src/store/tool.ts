//公共方法

/**
 *统计指定词汇出现次数
 * @param dataArrays 待检测数组对象
 * @param type 键名
 * @returns 数组对象
 */
export const sum_brand = (dataArrays: any[], type: string) => {
  const counts: { [key: string]: number } = {};

  const processData = (data: string) => {
    if (counts.hasOwnProperty(data)) {
      counts[data]++;
    } else {
      counts[data] = 1;
    }
  };

  for (let i = 0; i < dataArrays.length; i++) {
    const data = dataArrays[i][type];
    processData(data);
  }

  //对象转为数组
  const result = Object.entries(counts).map(([type, sum]) => ({ type, sum }));

  return result;
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
 * 根据字符表将Type中出现指定关键词时，替换整个的值
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
 * 从对象中找出不同值，组成数组并输出
 */
export const findDifferentKeys = (dataOld: any, dataNew: any) => {
  const result: { change: string; new: any; old: any }[] = [];

  if (
    isNull(dataOld) ||
    typeof dataOld !== "object" ||
    Object.keys(dataOld).length === 0
  ) {
    return result;
  }

  const keys1 = Object.keys(dataOld);
  const keys2 = Object.keys(dataNew);

  const keys = [...new Set([...keys1, ...keys2])];

  keys.forEach((key) => {
    if (!isNull(dataOld[key]) && !isNull(dataNew[key])) {
      if (!deepEqual(dataOld[key], dataNew[key])) {
        if (
          typeof dataOld[key] !== "object" ||
          typeof dataNew[key] !== "object"
        ) {
          result.push({
            change: key,
            new: dataNew[key],
            old: dataOld[key],
          });
        } else {
          const subDifferences = findDifferentKeys(dataOld[key], dataNew[key]);
          result.push(
            ...subDifferences.map((subDifference) => ({
              change: `${key}.${subDifference.change}`,
              new: subDifference.new,
              old: subDifference.old,
            }))
          );
        }
      }
    } else if (!isNull(dataNew[key])) {
      result.push({
        change: key,
        new: getLowestValue(dataNew[key]),
        old: undefined,
      });
    }
  });

  return result;
};

// 获取最底层的键名和键值
function getLowestValue(obj: { [x: string]: any }) {
  if (typeof obj !== "object") {
    return obj;
  }

  const keys = Object.keys(obj);
  if (keys.length === 0) {
    return undefined;
  }

  const key = keys[0];
  return getLowestValue(obj[key]);
}

// 检查是否为 null、undefined、空字符串的函数
function isNull(value: string | null) {
  return value === null || typeof value === "undefined" || value === "";
}

// 深度比较两个值是否相等的函数
function deepEqual(value1: string | any[], value2: string | any[]): boolean {
  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) {
      return false;
    }

    for (let i = 0; i < value1.length; i++) {
      if (!deepEqual(value1[i], value2[i])) {
        return false;
      }
    }

    return true;
  }

  if (typeof value1 === "object" && typeof value2 === "object") {
    const keys1 = Object.keys(value1);
    const keys2 = Object.keys(value2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (
        !isNull(value1[key as keyof typeof value1]) &&
        !isNull(value2[key as keyof typeof value2])
      ) {
        if (
          !deepEqual(
            value1[key as keyof typeof value1],
            value2[key as keyof typeof value2]
          )
        ) {
          return false;
        }
      }
    }

    return true;
  }

  return value1 === value2;
}
