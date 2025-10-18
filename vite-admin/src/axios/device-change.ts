/**
 * 硬件变更操作
 */

import axios from "axios";
import { Ajaxurl } from "@/store";
import { MysqlChange, ComputerChangeReturn, axiosType } from "@/type/index";
import { instance, addParamIfDefined } from "@/axios/public";
/**
 * 增 - 添加变更数据
 * @param uuid 设备的唯一标识符
 * @param user 变更人、
 * @param data 变更内容
 * @returns 返回一个Promise，表示添加操作的结果，成功返回true，否则返回false
 */

export const addChangeData = async (
  uuid: string,//设备的UUID
  data: ComputerChangeReturn
): Promise<boolean> => {
  const params = new URLSearchParams();
  params.append("action", "add_change_data_callback");
  addParamIfDefined(params, "record_uuid", uuid);
  addParamIfDefined(params, "user", data.user);
  addParamIfDefined(params, "type", data.type);
  addParamIfDefined(params, "data", data.data);
  try {
    const data = await instance.post(Ajaxurl, params);
    return data.data.success;
  } catch (error) {
    console.log(error);
    return false;
  }
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
) => {
  const params = new URLSearchParams();
  params.append("action", "modify_change_data_callback");
  addParamIfDefined(params, "id", id);
  addParamIfDefined(params, "data", data);
  addParamIfDefined(params, "type", type);

  try {
    await instance.post<MysqlChange>(Ajaxurl, params);
  } catch (error: any) {
    console.log("保存设置选项时出错：" + error.message);
  } finally {
    //console.log(false);
  }
};

/**
 * 查
 * TODO:优化下，使用try catch ,配和调用端
 */
export const searchChangeData = async (record_uuid: string) => {
  const params = new URLSearchParams({
    action: "search_change_data_callback",
    record_uuid,
  });
  const response = await axios.post(Ajaxurl, params);
  return response.data as axiosType;
};

/**
 * 查全部电脑数据
 */
export const searchChangeAllData = async () => {
  const params = new URLSearchParams({
    action: "search_change_all_data_callback",
  });
  const response = await axios.post(Ajaxurl, params);
  return response.data as axiosType;
};
