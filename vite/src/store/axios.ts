//各种于数据库的交互方法
import axios from "axios";
import { dataAjaxurl } from "@/store/dataContext";
/**
 * 修改数据库中的自定义名字和编号
 */
//返回值类型
type MysqlChange = {
  message: string;
  status: string;
};
/**
 *
 * @param uuid 唯一标识符
 * @param data 修改后的值
 * @param type 修改的字段名
 */
export const changeMySql = async (data: string, uuid: string, type: string) => {
  const params = new URLSearchParams();
  params.append("action", "update_style_name_callback");
  params.append("uuid", uuid);
  params.append("data", data);
  params.append("type", type);

  try {
    const response = await axios.post<MysqlChange>(dataAjaxurl, params);

    if (response.status === 200) {
      console.log(response.data);
    } else {
      console.log("保存设置选项时出错：" + response.data);
    }
  } catch (error: any) {
    console.log("保存设置选项时出错：" + error.message);
  } finally {
    //console.log(false);
  }
};
