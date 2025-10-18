/**
 * 设备变更自动记录
 */
import axios from "axios";
import { Ajaxurl } from "@/utils/index";
import { axiosType } from "@/type/index";

/**
 * 输入设备的UUID，输出查到的变更数组
 * 不提供设备的UUID，则返回所有变更数据
 */
export const searchAutoChangeAllData = async (
  uuid?: string
): Promise<axiosType> => {
  const params = new URLSearchParams();
  params.append("action", "auto_change_data_callback");

  // 当uuid为有效字符串时才添加到参数中
  if (uuid !== undefined && uuid !== null && uuid.trim() !== "") {
    params.append("uuid", uuid);
  }

  try {
    const response = await axios.post<axiosType, axiosType>(Ajaxurl, params);
    return response.data as axiosType;
  } catch (error: any) {
    // 错误已在拦截器中处理
    console.error("查询变更数据时出错：" + error);
    throw error;
  }
};
