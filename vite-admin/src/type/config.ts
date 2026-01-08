/**
 * 设置选项
 */
import { Dayjs } from "dayjs";
/**
 * 导出数据时的数据结构
 */
export interface ImportListData {
  site: string; //导出站点的网址
  time: Dayjs | string; //数据导出时间
  name: string; //导出的表格名
  data: Array<Record<string, unknown>>; //导出的数据
}

export interface ExportPageData {
  items?: Array<Record<string, unknown>>;
  csv?: string;
  columns?: string[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ImportReport {
  total_records: number;
  imported_records: number;
  skipped_records: number;
  failed_records: number;
  errors?: Array<{
    index: number;
    id?: string;
    reason: string;
  }>;
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
