/**
 * 设置
 */
import type { RestResponse, ExportPageData, ImportReport } from "@/type/index";
import { restInstance, type RequestConfig } from "@/services/axiosConfig";

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

export interface ExportParams {
  page?: number;
  per_page?: number;
  format?: "json" | "csv";
}

export const exportSQLData = async (
  name: string,
  params: ExportParams = {}
): Promise<RestResponse<ExportPageData>> => {
  const response = await restInstance.get("/admin/export", {
    params: { name, ...params },
    showSuccessMessage: false,
  } as RequestConfig);
  return response.data as RestResponse<ExportPageData>;
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
): Promise<RestResponse<ImportReport>> => {
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

  const response = await restInstance.post(
    "/admin/import",
    {
      name: payloadName,
      data: payloadData,
    },
    { showSuccessMessage: false } as RequestConfig
  );
  return response.data as RestResponse<ImportReport>;
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
