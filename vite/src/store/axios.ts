//各种于数据库的交互方法
import axios from "axios";
import { Ajaxurl } from "@/store";

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
 * 修改设备数据
 */
//返回值类型
type MysqlChange = {
  message: string;
  status: string;
  data: string;
};
/**
 *
 * @param uuid 唯一标识符
 * @param data 修改后的值
 * @param type 修改的字段名
 */
export const changeMySql = async (
  uuid: string,
  type: string,
  data: string
): Promise<boolean> => {
  const params = new URLSearchParams();
  params.append("action", "update_style_name_callback");
  params.append("uuid", uuid);
  params.append("data", data);
  params.append("type", type);

  try {
    const response = await axios.post<MysqlChange>(Ajaxurl, params);

    if (response.status === 200) {
      // console.log(response.data);
      return true;
    } else {
      console.log("保存设置选项时出错：" + response.data);
      return false;
    }
  } catch (error: any) {
    console.log("保存设置选项时出错：" + error.message);
    throw error; // 重新抛出错误
  }
};

/**
 * 修改设备变更数据
 */
/**
 *
 * @param id 唯一ID
 * @param type 修改的字段名
 * @param data 修改后的值
 *
 */
export const changeMySqlData = async (
  id: string,
  type: string,
  data: string
) => {
  const params = new URLSearchParams();
  params.append("action", "update_change_callback");
  params.append("id", id);
  params.append("data", data);
  params.append("type", type);

  try {
    const response = await axios.post<MysqlChange>(Ajaxurl, params);

    if (response.status === 200) {
      //console.log(response.data);
    } else {
      console.log("保存设置选项时出错：" + response.data);
    }
  } catch (error: any) {
    console.log("保存设置选项时出错：" + error.message);
  } finally {
    //console.log(false);
  }
};

//根据指定UUID移除设备
export const deltSQLData = async (uuid: string) => {
  const params = new URLSearchParams();
  params.append("action", "delt_sql_uuid_callback");
  params.append("uuid", uuid);

  try {
    const response = await axios.post<MysqlChange>(Ajaxurl, params);

    if (response.status === 200) {
      //console.log(response.data);
    } else {
      console.log("保存设置选项时出错：" + response.data);
    }
  } catch (error: any) {
    console.log("保存设置选项时出错：" + error.message);
  } finally {
    //console.log(false);
  }
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
  params.append("action", "import_config_data_callback");
  params.append("name", name);
  params.append("data", data);

  try {
    const response = await axios.post<MysqlChange>(Ajaxurl, params);
    //console.log(response.data);
    alert("导入成功");
    return response.data;
  } catch (error: any) {
    alert("导入失败");
    // 将错误信息保存到全局状态中
    console.log("保存数据时出错：" + error.message);
    throw new Error("保存数据时出错：" + error.message);
  }
};
