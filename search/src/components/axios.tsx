import axios from "axios";
import { defaultOption, Site } from "@/store";
/**
 * 获取返回值
 */

/**
 *
 * @param id 姓名或编号
 *
 */
export const fetchData = async (id: string) => {
  try {
    // 发送 GET 请求到指定的 URL
    const response = await axios.get(Site + "/wp-json/npcink/v1/query", {
      params: {
        data: id,
        password: defaultOption.password,
      },
    });

    // 如果响应中存在错误信息，则抛出错误
    if (response.data && response.data.error) {
      throw new Error(response.data.error);
    }

    // 更新状态以显示响应数据
    return response.data;
  } catch (error: any) {
    const msg = error.response.status + "：" + error.response.data.error;
    alert(msg);
    // 捕获错误并处理
    console.error("Error fetching data: ", error);
    // 如果是服务器错误，可能包含响应对象
    //if (error.response) {
    //  console.log("Server Response Data: ", error.response.data.message);//错误信息
    //  console.log("Server Response Status: ", error.response.status);//状态码
    //  console.log("Server Response Headers: ", error.response.headers);
    //}
    // 返回空对象或其他默认值，或者继续抛出错误
    return {}; // 或者 return null; 或者 throw error;
  }
};
