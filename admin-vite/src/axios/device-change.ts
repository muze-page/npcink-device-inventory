/**
 * 硬件变更操作
 */

import axios from "axios";
import { Ajaxurl } from "@/store";
import {
  MysqlChange,
  ComputerChangeReturn,
  axiosType,
} from "@/store/interface";
import { instance, addParamIfDefined } from "@/axios/public";
/**
 * 增 - 添加变更数据
 */

export const addChangeData = async (
  uuid: string,
  data: ComputerChangeReturn
): Promise<boolean> => {
  const params = new URLSearchParams();
  params.append("action", "add_change_data_callback");
  addParamIfDefined(params, "uuid", uuid);
  addParamIfDefined(params, "user", data.user);
  addParamIfDefined(params, "type", data.type);
  addParamIfDefined(params, "data", data.data);
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
    await instance.post<MysqlChange>(Ajaxurl, params) ;
  } catch (error: any) {
    console.log("保存设置选项时出错：" + error.message);
  } finally {
    //console.log(false);
  }
};

/**
 * 查
 */
export const searchChangeData = async (uuid: string) => {
  try {
    const params = new URLSearchParams({
      action: "search_change_data_callback",
      uuid,
    });
    const response = await axios.post(Ajaxurl, params) as axiosType;
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};
