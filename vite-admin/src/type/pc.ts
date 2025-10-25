/**
 * 自定义电脑设备状态
 */
import { Dayjs } from "dayjs";
import { repType } from "@/type/index";
import { Computer } from "@/type/computer";
//拿到的分类和状态数据
export interface PCCategoryType {
  states: repType[]; //状态
  departments: repType[]; //部门
}

//筛选数据类型 - 电脑设备
export interface FilterData {
  state: string; //筛选电脑设备状态
  department: string; //部门
}

//上传数据时需要的值
export interface MysqlDeviceData {
  name: string; //姓名
  state: string; //设备状态
  number: string; //编号
  department: string; //部门
  ip: string; //ip
  purchase: number; //采购价
  depreciation: number; //二手价
}

//从数据库读取的设备信息 - 继承
export interface MysqlDevice extends MysqlDeviceData {
  id: number; //设备id
  created_at: Dayjs; //添加时间
  updated_at: Dayjs; //更新时间
  uuid: string; //唯一编号
  data: string; //数据
  [key: string]: any; //索引签名
}

//整理后 交叉类型
export type MysqlDeviceChange = MysqlDeviceData & {
  id: number; //设备id
  created_at: Dayjs; //添加时间
  updated_at: Dayjs; //更新时间
  uuid: string; //唯一编号
  data: Computer; //数据
  [key: string]: any;
};

//准备交叉类型，本地处理后的值
export type MysqlDeviceChangeMeat = MysqlDeviceChange & {
  meat: {
    //为方便筛选
    os: string; //系统版本 Windows 10
    ostype: string; //系统类型 Windows Linux Macos
    cpu: string; //CPU 品牌 Intel
    cpuModel: string; //CPU 型号 Core i5-10400F
    //model: string; //设备型号
    motherboard: string; ///主板型号
    graphics: string; //显卡型号
    memory: string; //内存容量
    disk: string; //硬盘容量
  };
  mac: string[];
};
