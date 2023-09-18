//公共方法

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
