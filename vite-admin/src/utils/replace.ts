//替换表
import { Replacements } from "@/type/index";

/**
 * 主板品牌
 */
export const replaceBaseboard: Replacements = {
  "Apple Inc.": "苹果",
  "Colorful Technology And Development Co.,LTD": "七彩虹",
  "Dell Inc.": "戴尔",
  "ASUSTeK COMPUTER INC.": "华硕",
  HUANANZHI: "华南金牌",
  "Galaxy Microsystems Ltd.": "影驰",
  GALAXY: "影驰",
  HUAWEI: "华为",
  HP: "惠普",
  AOC: "冠捷",
  "Micro-Star International Co., Ltd.": "微星",
  LENOVO: "联想",
  "Gigabyte Technology Co., Ltd.": "技嘉",
  KOLOE: "科脑",
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



//排除出现在这里的显卡型号
export const excludeGraphics = [
  "Parsec Virtual Display Adapter",
  "OrayIddDriver Device",
  "System Product Name",
  "OrayIddDriver Device",
  "Virtual Display Device",
];

//硬件详细配置表头
export const columnsTable = [
  {
    title: "序号",
    dataIndex: "index",
    key: "index",
    /**自定义序号 */
    render: (_text: any, _record: any, index: number) => index + 1,
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



//采购平台展示标签。发布包不使用第三方平台图标，避免商标/素材授权风险。
export const platformArray = [
  { name: "EcommerceA", label: "电商平台A" },
  { name: "EcommerceB", label: "电商平台B" },
  { name: "EcommerceC", label: "电商平台C" },
  { name: "LocalService", label: "本地服务平台" },
  { name: "SecondHand", label: "二手交易平台" },
  { name: "ShortVideo", label: "短视频平台" },
  { name: "Offline", label: "线下购买" },
  { name: "About", label: "其他" },
];

//自定义产品支付方式
export const stylePayType = [
  { value: "WalletA", label: "电子钱包A" },
  { value: "WalletB", label: "电子钱包B" },
  { value: "BankCard", label: "银行卡" },
  { value: "Cash", label: "现金" },
  { value: "About", label: "其他" },
];
//支付方式展示标签。发布包不使用第三方支付图标，避免商标/素材授权风险。
export const payArray = [
  { name: "WalletA", label: "电子钱包A" },
  { name: "WalletB", label: "电子钱包B" },
  { name: "BankCard", label: "银行卡" },
  { name: "Cash", label: "现金" },
  { name: "AboutPay", label: "其他" },
];
