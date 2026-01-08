/**
 * 自定义设备的增删改查操作
 */
import {
  StyleDevice,
  StyleDeviceSeting,
  StyleCategoryType,
} from "@/type/index";
import { restInstance } from "@/services/axiosConfig";
import { PagedResponse } from "@/type/index";

/**
 * 获取自定义设备分类和状态数组
 */
export const getStyleDeviceCategory = async (): Promise<StyleCategoryType> => {
  try {
    const response = await restInstance.get("/admin/style-categories");
    return response.data as StyleCategoryType;
  } catch (error) {
    console.log(error);
    return { states: [], categories: [], platforms: [], pay_methods: [] };
  }
};
/**
 * 增 - 添加自定义硬件数据
 */

export const addStyleDeviceData = async (
  data: StyleDeviceSeting
): Promise<{ success: boolean; deviceData?: StyleDevice }> => {
  try {
    const response = await restInstance.post("/admin/style", data);
    if (response.data && response.data.success) {
      const deviceData = {
        id: response.data.id,
        uuid: response.data.uuid,
        created_at: response.data.created_at,
      } as StyleDevice;
      // 如果请求成功，返回成功状态和数据
      return {
        success: true,
        deviceData,
      };
    }
    // 如果请求失败，返回失败状态
    return {
      success: false,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
    };
  }
};

/**
 * 删
 */

export const deleteStyleDeviceData = async (uuid: string): Promise<boolean> => {
  try {
    const response = await restInstance.delete(`/admin/style/${uuid}`);
    return response.data.success === true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
/**
 * 改 - 修改自定义设备数据的描述信息，设备信息不修改
 */
/**
 *
 * @param id 唯一ID
 * @param type 修改的字段名
 * @param data 修改后的值
 *
 */
export const updateStyleDeviceData = async (
  uuid: string,
  data: StyleDeviceSeting
): Promise<boolean> => {
  try {
    const response = await restInstance.put(`/admin/style/${uuid}`, data);
    return response.data.success === true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export interface StyleListParams {
  page?: number;
  per_page?: number;
  search?: string;
  state?: string;
  category?: string;
  platform?: string;
  pay_method?: string;
  orderby?: string;
  order?: "asc" | "desc";
}

export const getStyleList = async (
  params: StyleListParams
): Promise<PagedResponse<StyleDevice>> => {
  const response = await restInstance.get("/admin/style", {
    params: { ...params, fields: "summary" },
  });
  return response.data as PagedResponse<StyleDevice>;
};

export type StyleDetailFields = "summary" | "full";

export const getStyleDetail = async (
  uuid: string,
  fields: StyleDetailFields = "full"
): Promise<StyleDevice> => {
  const response = await restInstance.get(`/admin/style/${uuid}`, {
    params: { fields },
  });
  return response.data as StyleDevice;
};
