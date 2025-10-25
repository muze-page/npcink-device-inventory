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

//自定义产品购买平台
export const stylePlatform = [
  { value: "TaoBao", label: "淘宝" },
  { value: "JingDong", label: "京东" },
  { value: "PingDuoDuo", label: "拼多多" },
  { value: "MeiTuan", label: "美团" },
  { value: "XianYu", label: "闲鱼" },
  //{ value: "DouYin", label: "抖音" },
  { value: "Offline", label: "线下" },
  { value: "About", label: "其他" },
];

//准备图标
import JD from "@/assets/platform/京东.png";
import TaoBao from "@/assets/platform/淘宝.png";
import PDD from "@/assets/platform/拼多多.png";
import MeiTuan from "@/assets/platform/美团.png";
import XianYu from "@/assets/platform/闲鱼.png";
import DouYin from "@/assets/platform/抖音.png";
import Offline from "@/assets/platform/线下购买.png";
import About from "@/assets/platform/其他.png";
//采购平台展示图片
export const platformArray = [
  { name: "JingDong", image: JD },
  { name: "TaoBao", image: TaoBao },
  { name: "PingDuoDuo", image: PDD },
  { name: "MeiTuan", image: MeiTuan },
  { name: "XianYu", image: XianYu },
  { name: "DouYin", image: DouYin },
  { name: "Offline", image: Offline },
  { name: "About", image: About },
];

//自定义产品支付方式
export const stylePayType = [
  { value: "Wechat", label: "微信" },
  { value: "Alipay", label: "支付宝" },
  { value: "BankCard", label: "银行卡" },
  { value: "Cash", label: "现金" },
  { value: "About", label: "其他" },
];
//支付平台展示图片
import Alipay from "@/assets/pay/支付宝支付.png";
import Wechat from "@/assets/pay/微信支付.png";
import Cash from "@/assets/pay/现金支付.png";
import BankCard from "@/assets/pay/银行卡支付.png";
import AboutPay from "@/assets/pay/其他支付.png";
export const payArray = [
  { name: "Alipay", image: Alipay },
  { name: "Wechat", image: Wechat },
  { name: "BankCard", image: BankCard },
  { name: "Cash", image: Cash },
  { name: "AboutPay", image: AboutPay },
];
