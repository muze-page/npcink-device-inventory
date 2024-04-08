/**
 * 硬件设置选项
 */
import axios from "axios";
import { Ajaxurl } from "@/store";
import { MysqlChange } from "@/store/interface";

/**
 * 修改设备数据
 */

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
  params.append("action", "modify_device_callback");
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

//根据指定UUID移除设备
export const deltSQLData = async (uuid: string) => {
  const params = new URLSearchParams();
  params.append("action", "delt_device_callback");
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
