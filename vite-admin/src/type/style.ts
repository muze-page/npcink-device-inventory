/**
 * 自定义设备
 */
import { repType } from "@/type/index";
//拿到的分类和状态数据
export interface StyleCategoryType {
  states: repType[]; //设备状态
  categories: repType[]; //设备分类
  platforms: repType[]; //采购平台
  pay_methods: repType[]; //支付方式
}
