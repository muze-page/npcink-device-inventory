import { Replacements } from "@/store/interface";
//替换表

/**
 * 主板品牌
 */
export const replaceBaseboard: Replacements = {
  "Apple Inc.": "Apple",
  "Colorful Technology And Development Co.,LTD": "七彩虹",
  "Dell Inc.": "戴尔",
  "ASUSTeK COMPUTER INC.": "华硕",
  HUANANZHI: "华南金牌",

  // 其他需要替换的字符串
};

/**
 * 替换数组
 */

//系统类型替换数组
export const osReplace = [
  { value: "Windows", label: "Windows" },
  { value: "darwin", label: "Mac" },
  { value: "linux", label: "linux" },
];
//系统型号替换数组
export const osTypeReplace = [
  { value: "Windows 11", label: "Windows 11" },
  { value: "Windows 10", label: "Windows 10" },
  { value: "macOS", label: "Apple" },
  { value: "linux", label: "Linux" },
];

export const device_status = [
  { value: "apply", label: "使用" },
  { value: "idie", label: "闲置" },
  { value: "fault", label: "故障" },
  { value: "scrap", label: "报废" },
];

/**
 * 筛选数组
 */

//系统数组


//内存数组TODO:没有其他筛选项
export const memoryScreenList = [
  { value: "", label: "全部" },
  { value: "8", label: "8G" },
  { value: "16", label: "16G" },
  { value: "32", label: "32G" },
  { value: "64", label: "64G" },
  { value: "128", label: "128G" },
];

//硬盘数组
export const diskScreenList = [
  { value: "", label: "全部" },
  { value: "120", label: "120G" },
  { value: "250", label: "250G" },
  { value: "512", label: "512G" },
  { value: "1024", label: "1T" },
  { value: "2048", label: "2T" },
  { value: "other", label: "2T以上" },
];

//硬件详细配置表头
export const columnsTable = [
  {
    title: "序号",
    dataIndex: "key",
    key: "key",
  },
  {
    title: "属性",
    dataIndex: "label",
    key: "label",
  },
  {
    title: "配置",
    dataIndex: "value",
    key: "value",
  },
];
