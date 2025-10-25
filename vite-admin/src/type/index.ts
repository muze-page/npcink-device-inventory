//类型
import type { Dayjs } from "dayjs";
//PC 设备
import { PCCategoryType, FilterData } from "@/type/pc";
export type { PCCategoryType, FilterData };
//自定义设备
import {
  StyleCategoryType,
  FilterStyleData,
  StyleDeviceSeting,
  StyleDevice,
  StyleDeviceData,
} from "@/type/style";
export type {
  StyleCategoryType,
  FilterStyleData,
  StyleDeviceSeting,
  StyleDevice,
  StyleDeviceData,
};

import {
  Computer,
  ComputerBaseboard,
  ComputerCpu,
  ComputerRam,
  ComputerOS,
  ComputerSystem,
  ComputerDishplays,
  ComputerControllers,
  ComputerDevice,
  ComputerNet,
  ComputerBios,
  ComputerChassis,
  ComputerUuid,
} from "@/type/computer";

export type {
  Computer,
  ComputerBaseboard,
  ComputerCpu,
  ComputerRam,
  ComputerOS,
  ComputerSystem,
  ComputerDishplays,
  ComputerControllers,
  ComputerDevice,
  ComputerNet,
  ComputerBios,
  ComputerChassis,
  ComputerUuid,
};
/**
 * 导出数据时的数据结构
 */
export interface ImportListData {
  site: string; //导出站点的网址
  time: Dayjs; //数据导出时间
  name: string; //导出的表格名
  data: MysqlDevice; //导出的数据
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

//选项数据类型
export interface OptionType {
  route?: string; //路由
  password?: string; //密码
  delete_mysql?: boolean; //是否删除数据库
  depreciation_year: number; //折旧月限
  residual_value_rate: number; //残值率
  department: string[]; //部门数组
  public_search_route: string; //前端公共搜索路由
}

//替换列表
export interface Replacements {
  [key: string]: string;
}

//表头 统计信息
export interface TableData {
  type: string;
  sum: number;
}

//标准下拉TODO:择机删除
export interface DataItemArr {
  key?: string;
  label: string;
  value: string | number | null | undefined;
}

export interface repType {
  value: string;
  label: string;
}

//硬件变更返回值
export interface ComputerChangeReturn {
  id: string;
  uuid: string; //变更唯一标识
  time: Dayjs; //变更时间
  type: string; //变更类型
  user: string; //变更人
  data: string; //变更说明
  [key: string]: string | Dayjs;
}

//硬件设置选项
export interface DeviceSeting {
  name?: string; //项目
  number?: string; //编号
  state?: string; //状态
  department?: string; //部门
  [key: string]: string | undefined;
}

/**
 * Axios 标准返回类型
 */
export interface axiosType {
  success: boolean; //状态
  data: {
    data?: any; //返回值
    message?: string; //成功信息
    error?: string; //失败信息
  };
}

/**
 * 变更类型
 */
export interface MysqlChange {
  message: string;
  status: string;
  data: any;
}

/**
 * 设备变更展示列表
 */
export interface DeviceChangeList {
  data: string; //变更数据
  id: string; //列表编号
  key: number; //唯一KEY
  msg: string; //设备信息
  created_at: Dayjs; //变更时间
  type: string; //变更类型
  user: string; //变更人
  uuid: string; //设备UUID
  [keysx: string]: number | string | Dayjs;
}

/**
 * 自动记录变更表数据类型
 */
export interface ChangeAutoRecord {
  id: number;
  table_name: string; //变更的表名
  column_name: string; //变更的字段名
  old_value: string; //变更前的值
  new_value: string; //变更后的值
  changed_at: Dayjs; //变更的时间
  record_uuid: string; //对应设备的UUID
  msg: string; //描述信息
  [keysx: string]: number | string | Dayjs;
}

/**
 * 列表图片内容,不同的设备不同的背景图片
 */
export interface OsTypeArray {
  name: string;
  image: string;
}
