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
    const sizeInGB = obj.size / (1024 * 1024 * 1024); // 将 size 从字节转换为 GB

    for (const type in thresholds) {
      if (sizeInGB < thresholds[type]) {
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
  replacements: { [x: string]: any }
) => {
  for (let i = 0; i < data.length; i++) {
    let obj = data[i];
    for (let key in replacements) {
      if (obj.type.includes(key)) {
        obj.type = replacements[key];
      }
    }
  }
  return data;
};
