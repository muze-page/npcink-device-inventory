import axios from "axios";
import { Site } from "@/utils/index";
/**
 * 获取返回值
 */

/**
 *@param password 密码
 * @param id 姓名或编号
 *
 */
export const fetchData = async (password: string, id: string) => {
  const safePassword = password.trim();
  const safeId = id.trim();

  if (!safePassword || !safeId) {
    alert("请输入密码和设备号/姓名");
    return null;
  }

  try {
    // 发送 GET 请求到指定的 URL
    const response = await axios.get(Site + "/wp-json/npcink/v1/query", {
      headers: {
        "x-npcink-password": safePassword,
      },
      params: {
        data: safeId,
        password: safePassword,
        detail: 1,
      },
    });
    //console.log(response);

    // 更新状态以显示响应数据
    return response?.data?.data?.data ?? null;
  } catch (error: any) {
    const status = error?.response?.status;
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.data?.error ||
      error?.message ||
      "请求失败";
    alert(`${status ?? "请求失败"}：${message}`);
    // 捕获错误并处理
    // console.error("错误原因: ", error);

    return null; // 或者 return null; 或者 throw error;
  }
};
