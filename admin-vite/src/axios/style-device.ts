/**
 * 自定义设备的增删改查操作
 */

import { Ajaxurl } from "@/store";
import { StyleDevice, axiosType } from "@/store/interface";
import { instance, addParamIfDefined } from "@/axios/public";
/**
 * 增 - 添加自定义硬件数据
 */

export const addStyleDeviceData = async (
  data: StyleDevice
): Promise<boolean> => {
  const params = new URLSearchParams();
  params.append("action", "add_style_device_data_callback");
  addParamIfDefined(params, "uuid", data.uuid);
  addParamIfDefined(params, "name", data.name);
  addParamIfDefined(params, "purpose", data.purpose);
  addParamIfDefined(params, "state", data.state);
  addParamIfDefined(params, "data", JSON.stringify(data.data));
  try {
    const data = (await instance.post(Ajaxurl, params)) as axiosType;
    return data.success;
  } catch (error) {
    console.log(error);
    return false;
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
    const data = (await instance.post(Ajaxurl, params)) as axiosType;
    return data.success;
  } catch (error) {
    console.log(error);
    return false;
  }
};
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
export const updateStyleDeviceData = async (
 uuid:string, data: StyleDevice
): Promise<boolean> => {
  const params = new URLSearchParams();
  params.append("action", "update_style_device_data_callback");
  addParamIfDefined(params, "uuid", uuid);
  addParamIfDefined(params, "name", data.name);
  addParamIfDefined(params, "purpose", data.purpose);
  addParamIfDefined(params, "state", data.state);
  addParamIfDefined(params, "data", JSON.stringify(data.data));
  try {
    const data = (await instance.post(Ajaxurl, params)) as axiosType;
    return data.success;
  } catch (error) {
    console.log(error);
    return false;
  }
};
