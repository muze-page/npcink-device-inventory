/**
 * 设置
 */
import axios from "axios";
import { Ajaxurl } from "@/store";
import { MysqlChange } from "@/store/interface";
import { message } from "antd";

/**
 * 移除部门
 *
 */
export const remove_department = async (optionObj: string) => {
  let state = false;
  const params = new URLSearchParams();
  params.append("action", "remove_department_callback");
  params.append("data", JSON.stringify(optionObj));
  try {
    const response = await axios.post(Ajaxurl, params);

    if (response.status === 200) {
      //保存成功
      //console.log(response);
      state = true;
    } else {
      console.error("保存设置选项时出错：" + response.data);
    }
  } catch (error: any) {
    console.error("保存设置选项时出错：" + error.message);
  } finally {
    //console.log(false);
  }
  return state;
};

/**
 * 保存选项
 */
export const saveSQLData = async (optionObj: object) => {
  let state = false;
  const params = new URLSearchParams();
  params.append("action", "save_object_option");
  params.append("object_data", JSON.stringify(optionObj));
  try {
    const response = await axios.post(Ajaxurl, params);

    if (response.status === 200) {
      //保存成功
      //console.log(response);
      state = true;
    } else {
      console.error("保存设置选项时出错：" + response.data);
    }
  } catch (error: any) {
    console.error("保存设置选项时出错：" + error.message);
  } finally {
    //console.log(false);
  }
  return state;
};

/**
 * 导出数据
 * @param name 数据库名
 * @returns
 */
export const exportSQLData = async (name: string): Promise<MysqlChange> => {
  const params = new URLSearchParams();
  params.append("action", "export_data_callback");
  params.append("name", name);

  try {
    const response = await axios.post<MysqlChange>(Ajaxurl, params);
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
): Promise<MysqlChange> => {
  const params = new URLSearchParams();
  params.append("action", "import_data_callback");
  params.append("name", name);
  params.append("data", data);

  try {
    const response = await axios.post<MysqlChange>(Ajaxurl, params);
    //console.log(response.data);
    //TODO:是覆盖式导入，还是只导入目前不存在的数据
    //只导入目前不存在的数据
    message.success("导入成功，导入前的设备信息未变更");
    return response.data;
  } catch (error: any) {
    message.error("导入失败");
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
  params.append("route", JSON.stringify(route));
  try {
    const response = await axios.post(Ajaxurl, params);
    if (response.status === 200) {
      //保存成功
      console.log(response);
    }
  } catch {
    console.log("添加自定义公共引导页失败");
  }
};
