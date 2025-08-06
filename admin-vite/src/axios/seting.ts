/**
 * 设置
 */
import { Ajaxurl } from "@/store";
import { MysqlChange, MysqlDevice, axiosType } from "@/store/interface";
import { instance, addParamIfDefined } from "@/axios/public";

//成功响应传出的接口数据

export const saveSQLData = async (optionObj: object) => {
  const params = new URLSearchParams();
  params.append("action", "save_object_option");
  addParamIfDefined(params, "object_data", JSON.stringify(optionObj));
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

export const exportSQLData = async (name: string) => {
  const params = new URLSearchParams();
  params.append("action", "export_data_callback");
  addParamIfDefined(params, "name", name);
  try {
    const response = (await instance.post(Ajaxurl, params)) as axiosType;
    if (response.success) {
      return response.data.data as MysqlDevice[]; //导出设备信息
    } else {
      return;
    }
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
export const importSQLData = async (name: string, data: string) => {
  const params = new URLSearchParams();
  params.append("action", "import_data_callback");
  addParamIfDefined(params, "name", name);
  addParamIfDefined(params, "data", data);

  try {
    await instance.post<MysqlChange>(Ajaxurl, params);
    //console.log(response.data);
    //TODO:是覆盖式导入，还是只导入目前不存在的数据
    //只导入目前不存在的数据
  } catch (error: any) {
    // 将错误信息保存到全局状态中
    console.log("保存数据时出错：" + error.message);
    throw new Error("保存数据时出错：" + error.message);
  }
};

/**
 * 移除部门
 *
 */
export const remove_department = async (optionObj: string) => {
  const params = new URLSearchParams();
  params.append("action", "remove_department_callback");
  addParamIfDefined(params, "data", optionObj);
  try {
    await instance.post(Ajaxurl, params);
  } catch (error: any) {
    console.error("保存设置选项时出错：" + error.message);
  } finally {
    //console.log(false);
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
  try {
    const res = (await instance.post(Ajaxurl, params)) as axiosType; //执行
    return res.success;
  } catch {
    console.log("添加自定义公共引导页失败");
    return false;
  } finally {
  }
};

/**
 * 保存选项
 */
//export const saveSQLData = async (optionObj: object) => {
//  const params = new URLSearchParams();
//  params.append("action", "save_object_option");
//  params.append("object_data", JSON.stringify(optionObj));
//  try {
//    const response = await axios.post(Ajaxurl, params);
//    if (response.status === 200) {
//      if (response.data.success || response.data.success === false) {
//        message.error(response.data.data.message);
//      } else {
//        message.success(response.data.data.message);
//      }
//      return response.data;
//    } else {
//      message.error("保存设置选项时出错：服务器返回状态码 " + response.status);
//      throw new Error(
//        "保存设置选项时出错：服务器返回状态码 " + response.status
//      );
//    }
//  } catch (error: any) {
//    // 处理错误情况
//    console.error("保存设置选项时出错：" + error);
//    console.log(error);
//    throw error; // 重新抛出错误，以便调用者可以进一步处理
//  } finally {
//    //console.log(false);
//  }
//};
