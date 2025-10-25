/**
 * 自定义电脑设备状态
 */
import { repType } from "@/type/index";
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
