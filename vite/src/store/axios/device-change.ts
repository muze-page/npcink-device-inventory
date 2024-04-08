/**
 * 硬件变更操作
 */

import axios from "axios";
import { Ajaxurl } from "@/store";
import { MysqlChange, ComputerChangeReturn } from "@/store/interface";

/**
 * 增 - 添加变更数据
 */
export const addChangeData = async (
  uuid: string,
  data: ComputerChangeReturn
): Promise<MysqlChange> => {
  const params = new URLSearchParams();
  params.append("action", "add_change_data_callback");
  params.append("uuid", uuid);
  params.append("user", data.user);
  params.append("type", data.type);
  params.append("msg", data.msg);

  const { data: res } = await axios.post(Ajaxurl, params);
  return res;
};

/**
 * 删
 */

/**
 * 改
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
  params.append("action", "modify_change_data_callback");
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

/**
 * 查
 */
export const searchChangeData = async (uuid: string): Promise<MysqlChange> => {
  const params = new URLSearchParams();
  params.append("action", "search_change_data_callback");
  params.append("uuid", JSON.stringify(uuid));
  const { data: res } = await axios.post(Ajaxurl, params);
  return res;
};
