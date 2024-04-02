/**
 * 硬件变更操作
 */

import axios from "axios";
import { Ajaxurl } from "@/store";
import { MysqlChange } from "@/store/interface";

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
