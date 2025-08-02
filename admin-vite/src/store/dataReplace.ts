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

//用于选项录入
export const device_status = [
  { value: "apply", label: "使用" },
  { value: "idie", label: "闲置" },
  { value: "fault", label: "故障" },
  { value: "scrap", label: "报废" },
];

//自定义产品购买平台
export const stylePlatform = [
  { value: "TaoBao", label: "淘宝" },
  { value: "JingDong", label: "京东" },
  { value: "PingDuoDuo", label: "拼多多" },
  { value: "MeiTuan", label: "美团" },
  { value: "XianYu", label: "闲鱼" },
  { value: "DouYin", label: "抖音" },
  { value: "About", label: "其他" },
];

//自定义产品支付方式
export const stylePayType = [
  { value: "wx", label: "微信" },
  { value: "zfb", label: "支付宝" },
  { value: "yhk", label: "银行卡" },
  { value: "about", label: "其他" },
];

//排除的显卡
export const excludeGraphics = [
  "Parsec Virtual Display Adapter",
  "OrayIddDriver Device",
  "System Product Name",
  "OrayIddDriver Device",
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

//准备图标
import JD from "@/assets/platform/京东.png";
import MeiTuan from "@/assets/platform/美团.png";
import TaoBao from "@/assets/platform/淘宝.png";
import XianYu from "@/assets/platform/闲鱼.png";
import PDD from "@/assets/platform/拼多多.png";
import DouYin from "@/assets/platform/抖音.png";
import About from "@/assets/platform/其他.png";
//采购平台展示图片
export const platformArray = [
  { name: "JingDong", image: JD },
  { name: "TaoBao", image: TaoBao },
  { name: "PingDuoDuo", image: PDD },
  { name: "MeiTuan", image: MeiTuan },
  { name: "XianYu", image: XianYu },
  { name: "DouYin", image: DouYin },
  { name: "About", image: About },
];
