import { Replacements } from "@/store/interface";
//替换表

/**
 * 主板品牌
 */
export const replaceBaseboard: Replacements = {
  "Apple Inc.": "Apple",
  "Colorful Technology And Development Co.,LTD": "七彩虹",
  "Dell Inc.": "戴尔",
  // 其他需要替换的字符串
};

/**
 * 硬件变更替换表
 */

export const replacements: Replacements = {
  "os.distro": "系统版本",
  "diskLayout.1.size": "主硬盘大小",
  "baseboard.model": "主板型号",
  // 其他需要替换的字符串
};

/**
 * 替换数组
 */

//系统替换数组
export const osReplace = [
  { name: "Windows 11", data: "Windows 11" },
  { name: "Windows 10", data: "Windows 10" },
  { name: "linux", data: "linux" },
  { name: "macOS", data: "macOS" },
];

//内存替换数组
export const memoryReplace = [
  { name: "8", data: "8" },
  { name: "16", data: "16" },
  { name: "32", data: "32" },
  { name: "64", data: "64" },
  { name: "128", data: "128" },
];

/**
 * 筛选数组
 */
//系统数组
export const osScreenList = [
  { value: "", label: "全部" },
  { value: "unknown", label: "其他" },
  { value: "Windows 11", label: "Windows 11" },
  { value: "Windows 10", label: "Windows 10" },
  { value: "macOS", label: "Apple" },
  { value: "linux", label: "Linux" },
];

//内存数组
export const memoryScreenList = [
  { value: "", label: "全部" },
  { value: "unknown", label: "其他" },
  { value: "8", label: "8G" },
  { value: "16", label: "16G" },
  { value: "32", label: "32G" },
  { value: "64", label: "64G" },
  { value: "128", label: "128G" },
];

//硬盘数组
export const diskScreenList = [
  { value: "", label: "全部" },
  { value: "unknown", label: "其他" },
  { value: "120", label: "120G" },
  { value: "250", label: "250G" },
  { value: "512", label: "512G" },
  { value: "1024", label: "1T" },
  { value: "2048", label: "2T" },
];


//硬件详细配置表头
export const columnsTable = [
  {
    title: "编号",
    dataIndex: "key",
    key: "key",
  },
  {
    title: "属性",
    dataIndex: "label",
    key: "label",
  },
  {
    title: "值",
    dataIndex: "value",
    key: "value",
  },
];