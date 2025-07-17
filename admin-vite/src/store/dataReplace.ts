import { Replacements } from "@/store/interface";
//替换表

/**
 * 主板品牌
 */
export const replaceBaseboard: Replacements = {
  "Apple Inc.": "苹果",
  "Colorful Technology And Development Co.,LTD": "七彩虹",
  "Dell Inc.": "戴尔",
  "ASUSTeK COMPUTER INC.": "华硕",
  "HUANANZHI": "华南金牌",
  "Galaxy Microsystems Ltd.":"影驰",
  "GALAXY":"影驰",
  "HUAWEI":"华为",
  "HP":"惠普",
  "AOC":"冠捷",
  "Micro-Star International Co., Ltd.":"微星",
  "LENOVO":"联想",
  "Gigabyte Technology Co., Ltd.":"技嘉",
  "KOLOE":"科脑",
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

//用于选项录入
export const device_status = [
  { value: "apply", label: "使用" },
  { value: "idie", label: "闲置" },
  { value: "fault", label: "故障" },
  { value: "scrap", label: "报废" },
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
