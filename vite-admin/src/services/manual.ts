/**
 * 手动记录
 */

import { restInstance } from "@/services/axiosConfig";
import type {
  ChangeListResponse,
  DeviceChangeList,
  ComputerChangeReturn,
} from "@/type/index";

export interface ManualChangeParams {
  page?: number;
  per_page?: number;
  search?: string;
  record_uuid?: string;
  user?: string;
  type?: string;
  column_name?: string;
}

/**
 * 增 - 添加变更数据
 */
export const addChangeData = async (
  uuid: string, //设备的UUID
  data: ComputerChangeReturn
): Promise<boolean> => {
  const response = await restInstance.post("/admin/changes/manual", {
    record_uuid: uuid,
    user: data.user,
    type: data.type,
    data: data.data,
  });
  return response.data.success === true;
};

/**
 * 删
 */

/**
 * 改
 */
/**
 *
 * @param id 唯一ID
 * @param type 修改的字段名
 * @param data 修改后的值
 *
 */
export const changeMySqlData = async (
  id: string,
  type: string,
  data: string
): Promise<boolean> => {
  const response = await restInstance.put(`/admin/changes/manual/${id}`, {
    [type]: data,
  });
  return response.data.success === true;
};

/**
 * 查
 * TODO:优化下，使用try catch ,配和调用端
 */
export const searchChangeData = async (
  record_uuid: string
): Promise<ChangeListResponse<DeviceChangeList>> => {
  return getManualChangeList({ record_uuid, page: 1, per_page: 20 });
};

/**
 * 查全部电脑数据
 */
export const searchChangeAllData = async (
  params: ManualChangeParams
): Promise<ChangeListResponse<DeviceChangeList>> => {
  return getManualChangeList(params);
};

export const getManualChangeList = async (
  params: ManualChangeParams
): Promise<ChangeListResponse<DeviceChangeList>> => {
  const response = await restInstance.get("/admin/changes/manual", { params });
  return response.data as ChangeListResponse<DeviceChangeList>;
};
