/**
 * 自定义设备的增删改查操作
 */
import axios from "axios";
import { Ajaxurl } from "@/utils/index";
import {
  StyleDevice,
  StyleDeviceSeting,
  StyleCategoryType,
} from "@/type/index";
import { instance, addParamIfDefined } from "@/services/axiosConfig";

/**
 * 获取自定义设备分类和状态数组
 */
export const getStyleDeviceCategory = async (): Promise<StyleCategoryType> => {
  const params = new URLSearchParams();
  params.append("action", "get_style_device_categories_callback");
  try {
    const data = await axios.post(Ajaxurl, params);
    console.log("拿到的值:");
    console.log(data);
    return data.data.data;
  } catch (error) {
    console.log(error);
    return { states: [], categories: [] };
  }
};
/**
 * 增 - 添加自定义硬件数据
 */

export const addStyleDeviceData = async (
  data: StyleDeviceSeting
): Promise<{ success: boolean; deviceData?: StyleDevice }> => {
  const params = new URLSearchParams();
  params.append("action", "add_style_device_data_callback");
  // addParamIfDefined(params, "uuid", data.uuid);
  addParamIfDefined(params, "name", data.name);
  addParamIfDefined(params, "number", data.number);
  addParamIfDefined(params, "category", data.category);
  addParamIfDefined(params, "purpose", data.purpose);
  addParamIfDefined(params, "state", data.state);
  addParamIfDefined(params, "data", JSON.stringify(data.data));
  try {
    const response = await instance.post(Ajaxurl, params);
    if (response.data.success) {
      // 如果请求成功，返回成功状态和数据
      return {
        success: true,
        deviceData: response.data.data as StyleDevice,
      };
    } else {
      // 如果请求失败，返回失败状态
      return {
        success: false,
      };
    }
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
  const params = new URLSearchParams();
  params.append("action", "delete_style_device_data_callback");
  addParamIfDefined(params, "uuid", uuid);
  try {
    const data = await instance.post(Ajaxurl, params);
    return data.data.success;
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
  const params = new URLSearchParams();
  params.append("action", "update_style_device_data_callback");
  addParamIfDefined(params, "uuid", uuid);
  addParamIfDefined(params, "name", data.name);
  addParamIfDefined(params, "number", data.number);
  addParamIfDefined(params, "category", data.category);
  addParamIfDefined(params, "purpose", data.purpose);
  addParamIfDefined(params, "state", data.state);
  addParamIfDefined(params, "data", JSON.stringify(data.data));
  try {
    const data = await instance.post(Ajaxurl, params);
    return data.data.success;
  } catch (error) {
    console.log(error);
    return false;
  }
};
