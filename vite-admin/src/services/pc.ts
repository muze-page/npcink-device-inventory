/**
 * 硬件设置选项
 */
import {
  MysqlDeviceData,
  PCCategoryType,
  MysqlDeviceChange,
  MysqlDeviceChangeMeat,
} from "@/type/index";
import { restInstance } from "@/services/axiosConfig";
import { PagedResponse, PcSummary } from "@/type/index";
/**
 * 修改设备数据，一次性更新
 */
/**
 *
 * @param uuid 唯一标识符
 * @param value 修改后的值
 */
export const changeMySql = async (uuid: string, data: MysqlDeviceData) => {
  try {
    const res = await restInstance.put(`/admin/pc/${uuid}`, data);
    return res.data.success === true; //返回状态
  } catch (error: any) {
    console.log("保存设置选项时出错：" + error.message);
    //throw error; // 重新抛出错误
    return false;
  }
};

//根据指定UUID移除设备
export const deltSQLData = async (uuid: string) => {
  try {
    const res = await restInstance.delete(`/admin/pc/${uuid}`);
    return res.data.success === true;
  } catch (error: any) {
    console.log("保存设置选项时出错：" + error.message);
    return false;
  } finally {
    //console.log(false);
  }
};

//获取电脑设备状态和分类键值对
export const getDeviceCategory = async (): Promise<PCCategoryType> => {
  try {
    const response = await restInstance.get("/admin/pc-categories");
    return response.data as PCCategoryType;
  } catch (error) {
    console.log(error);
    // 返回默认值，确保始终返回正确的类型
    return {
      states: [],
      departments: [],
    };
  }
};

export interface PcListParams {
  page?: number;
  per_page?: number;
  search?: string;
  state?: string;
  department?: string;
  orderby?: string;
  order?: "asc" | "desc";
}

export const getPcList = async (
  params: PcListParams
): Promise<PagedResponse<MysqlDeviceChangeMeat>> => {
  const response = await restInstance.get("/admin/pc", {
    params: { ...params, fields: "summary" },
  });
  return response.data as PagedResponse<MysqlDeviceChangeMeat>;
};

export const getPcListFull = async (
  params: PcListParams
): Promise<PagedResponse<MysqlDeviceChange>> => {
  const response = await restInstance.get("/admin/pc", {
    params: { ...params, fields: "full" },
  });
  return response.data as PagedResponse<MysqlDeviceChange>;
};

export const getPcSummary = async (): Promise<PcSummary> => {
  const response = await restInstance.get("/admin/pc-summary");
  return response.data as PcSummary;
};

export type PcDetailFields = "summary" | "full";

export const getPcDetail = async (
  uuid: string,
  fields: PcDetailFields = "full"
): Promise<MysqlDeviceChange> => {
  const response = await restInstance.get(`/admin/pc/${uuid}`, {
    params: { fields },
  });
  return response.data as MysqlDeviceChange;
};
