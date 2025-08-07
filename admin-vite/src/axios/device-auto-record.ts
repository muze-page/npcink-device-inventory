/**
 * 设备变更自动记录
 */
import { Ajaxurl } from "@/store";
import {  axiosType } from "@/store/interface";
import { instance,  } from "@/axios/public";

/**
 * 标准接口，使用的方法是标准方法
 * 查
 * 输入设备的UUID，输出查到的变更数组
 */
export const changeAutoRecordAxios = async (
  uuid: string
): Promise<axiosType> => {
  const params = new URLSearchParams();
  params.append("action", "auto_change_data_callback");
  params.append("uuid", uuid);
  try {
    const response = await instance.post<axiosType,axiosType>(Ajaxurl, params);
   // console.log("返回的值");
    //console.log(response);
    return response;
  } catch (error: any) {
    // 错误已在拦截器中处理
    console.error("查询变更数据时出错：" + error);
    throw error;
  }
};
