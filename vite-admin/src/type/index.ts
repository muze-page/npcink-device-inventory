//类型
import type { Dayjs } from "dayjs";
//PC 设备
import {
  PCCategoryType,
  FilterData,
  MysqlDeviceChangeMeat,
  MysqlDeviceChange,
  MysqlDevice,
  MysqlDeviceData,
} from "@/type/pc";
export type {
  PCCategoryType,
  FilterData,
  MysqlDeviceChangeMeat,
  MysqlDeviceChange,
  MysqlDevice,
  MysqlDeviceData,
};
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
//设置
import {
  ImportListData,
  OptionType,
  ClientTokenSummary,
  ExportPageData,
  ImportReport,
} from "@/type/config";
export type {
  ImportListData,
  OptionType,
  ClientTokenSummary,
  ExportPageData,
  ImportReport,
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

//替换列表
export interface Replacements {
  [key: string]: string;
}

//表头 统计信息
export interface TableData {
  type: string;
  sum: number;
}

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PcSummary {
  cpu: TableData[];
  disk: TableData[];
  memory: TableData[];
  baseboard: TableData[];
  totals: {
    purchase: number;
    depreciation: number;
    residual: number;
  };
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
 * REST 接口标准返回
 */
export interface RestResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface ChangeListFilters {
  users?: string[];
  types?: string[];
  tables?: string[];
  columns?: string[];
}

export interface ChangeListResponse<T> extends PagedResponse<T> {
  filters?: ChangeListFilters;
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
