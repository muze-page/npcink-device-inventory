/**
 * 设备变更自动记录
 */
import { restInstance } from "@/services/axiosConfig";
import type { ChangeListResponse, ChangeAutoRecord } from "@/type/index";

export interface AutoChangeParams {
  page?: number;
  per_page?: number;
  search?: string;
  record_uuid?: string;
  table_name?: string;
  column_name?: string;
}

export const getAutoChangeList = async (
  params: AutoChangeParams
): Promise<ChangeListResponse<ChangeAutoRecord>> => {
  const response = await restInstance.get("/admin/changes/auto", { params });
  return response.data as ChangeListResponse<ChangeAutoRecord>;
};

/**
 * 输入设备的UUID，输出查到的变更数组
 * 不提供设备的UUID，则返回所有变更数据
 */
export const searchAutoChangeAllData = async (
  uuid?: string
): Promise<ChangeListResponse<ChangeAutoRecord>> => {
  return getAutoChangeList({
    record_uuid: uuid,
    page: 1,
    per_page: 20,
  });
};
