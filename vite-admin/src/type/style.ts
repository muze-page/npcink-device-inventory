/**
 * 自定义设备
 */
import type { Dayjs } from "dayjs";
import { repType } from "@/type/index";
//拿到的分类和状态数据
export interface StyleCategoryType {
  states: repType[]; //设备状态
  categories: repType[]; //设备分类
  platforms: repType[]; //采购平台
  pay_methods: repType[]; //支付方式
}

//筛选数据类型 - 自定义设备
export interface FilterStyleData {
  state: string; //筛选自定义设备状态
  category: string; //设备类别
  platform: string; //筛选采购平台
  payMethod: string; //付款方式
}

//自定义设备设置用类型
export interface StyleDeviceSeting {
  name: string; //使用人
  number: string; //设备编号
  category: string; //分类
  purpose: string; //用途
  state: string; //设备状态
  data: StyleDeviceData; //设备数据
}

//自定义设备类型
export type StyleDevice = StyleDeviceSeting & {
  id: string; //设备ID，数据库自动创建
  created_at: Dayjs; //添加时间，此时间由数据库创建新表时自动填入
  uuid: string; //设备UUID，数据库自动创建
};

//自定义设备数据属性
export interface StyleDeviceData {
  title: string; //设备名称
  numbers: number; //设备数量
  total: number; //单价
  platform: string; //采购平台
  shop_name: string; //店铺名称
  link: string; //购买链接
  order_time: Dayjs; //下单时间
  order: string; //订单号
  pay_method: string; //支付方式
  purchaser: string; //采购人
}
