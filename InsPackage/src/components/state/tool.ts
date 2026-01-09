//工具函数

/**
 * 字节转兆
 * @param bytes
 * @returns
 */
export const formatBytes = (bytes: number | null, type = "m"): string => {
 
  if (type === "m") {
    if (bytes === null || bytes === 0) {
      return "";
    }
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }

  if (type === "g") {
    if (bytes === null || bytes === 0) {
      return "";
    }
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  }
  return "类型错误";
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
