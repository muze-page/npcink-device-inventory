/**
 * 设置
 */
import type { RestResponse } from "@/type/index";
import { restInstance } from "@/services/axiosConfig";

export const saveSQLData = async (
  optionObj: object
): Promise<RestResponse> => {
  const response = await restInstance.put("/admin/settings", optionObj);
  return response.data as RestResponse;
};

/**
 * 导出数据
 * @param name 数据库名
 * @returns
 */

export const exportSQLData = async (name: string): Promise<RestResponse> => {
  const response = await restInstance.get("/admin/export", {
    params: { name },
  });
  return response.data as RestResponse;
};

/**
 * 导入数据
 * @param name 数据库名
 * @param data 导入数据
 * @returns
 */
export const importSQLData = async (
  name: string,
  data: string
): Promise<RestResponse> => {
  let payload: any = data;
  if (typeof data === "string") {
    try {
      payload = JSON.parse(data);
    } catch (error) {
      throw new Error("导入数据解析失败");
    }
  }

  const payloadName = payload?.name || name;
  const payloadData = payload?.data || payload;

  const response = await restInstance.post("/admin/import", {
    name: payloadName,
    data: payloadData,
  });
  return response.data as RestResponse;
};

/**
 * 添加自定义公共引导页
 * 接收路由字符串
 */
export const addPublicSearchPage = async (
  route: string
): Promise<RestResponse> => {
  const res = await restInstance.post("/admin/public-search-page", { route });
  return res.data as RestResponse;
};
