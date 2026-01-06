/**
 * 设置
 */
import { Ajaxurl } from "@/utils/index";
import {   axiosType } from "@/type/index";
import {
  instance,
  addParamIfDefined,
  appendAjaxNonce,
} from "@/services/axiosConfig";

//成功响应传出的接口数据

export const saveSQLData = async (optionObj: object) => {
  const params = new URLSearchParams();
  params.append("action", "save_object_option");
  addParamIfDefined(params, "object_data", JSON.stringify(optionObj));
  appendAjaxNonce(params);
  try {
    await instance.post(Ajaxurl, params);
  } catch (error: any) {
    console.error(`保存设置选项时出错：${error}`);
    throw error;
  }
};

/**
 * 导出数据
 * @param name 数据库名
 * @returns
 */

export const exportSQLData = async (name: string): Promise<axiosType> => {
  const params = new URLSearchParams();
  params.append("action", "export_data_callback");
  addParamIfDefined(params, "name", name);
  appendAjaxNonce(params);

  try {
    const response = await instance.post<axiosType>(Ajaxurl, params);
    return response.data;
  } catch (error: any) {
    // 将错误信息保存到全局状态中
    console.log("传出数据时出错：" + error.message);
    throw new Error("传出数据时出错：" + error.message);
  }
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
): Promise<axiosType> => {
  const params = new URLSearchParams();
  params.append("action", "import_data_callback");
  addParamIfDefined(params, "name", name);
  addParamIfDefined(params, "data", data);
  appendAjaxNonce(params);

  try {
    const response = await instance.post<axiosType>(Ajaxurl, params);
    // 只导入目前不存在的数据
    return response.data;
  } catch (error: any) {
    // 将错误信息保存到全局状态中
    console.log("保存数据时出错：" + error.message);
    throw new Error("保存数据时出错：" + error.message);
  }
};

/**
 * 添加自定义公共引导页
 * 接收路由字符串
 */
export const addPublicSearchPage = async (route: string) => {
  const params = new URLSearchParams();
  params.append("action", "add_public_search_page_callback");
  addParamIfDefined(params, "route", route);
  appendAjaxNonce(params);
  try {
    const res = await instance.post(Ajaxurl, params); //执行
    return res.data.success;
  } catch {
    console.log("添加自定义公共引导页失败");
    return false;
  } finally {
  }
};
