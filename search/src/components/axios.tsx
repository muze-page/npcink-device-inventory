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
    console.log(response);

 

    // 更新状态以显示响应数据
    return response.data.data.data;
  } catch (error: any) {
    const msg = error.response.status + "：" + error.response.data.data.error;
    alert(msg);
    // 捕获错误并处理
   // console.error("错误原因: ", error);
    
    return {}; // 或者 return null; 或者 throw error;
  }
};
