/**
 * 设置选项
 */
import { Dayjs } from "dayjs";
import { MysqlDevice } from "@/type/pc";
/**
 * 导出数据时的数据结构
 */
export interface ImportListData {
  site: string; //导出站点的网址
  time: Dayjs; //数据导出时间
  name: string; //导出的表格名
  data: MysqlDevice; //导出的数据
}

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
