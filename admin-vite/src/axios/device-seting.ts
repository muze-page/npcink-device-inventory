/**
 * 硬件设置选项
 */
import { Ajaxurl } from "@/store";
import { MysqlChange, axiosType } from "@/store/interface";
import { instance, addParamIfDefined } from "@/axios/public";
/**
 * 修改设备数据
 */

/**
 *
 * @param uuid 唯一标识符
 * @param data 修改后的值
 * @param type 修改的字段名
 */
export const changeMySql = async (uuid: string, type: string, data: string) => {
  const params = new URLSearchParams();
  params.append("action", "modify_device_callback");
  addParamIfDefined(params, "uuid", uuid);
  addParamIfDefined(params, "data", data);
  addParamIfDefined(params, "type", type);

  try {
    const res = (await instance.post(Ajaxurl, params)) as axiosType;

    //TODO:自定义返回错误形式？
    //if(res.success){
    //  return res.success//返回状态
    //} else{
    //  message.warning(res.data.message);
    //}

    return res.success; //返回状态
  } catch (error: any) {
    console.log("保存设置选项时出错：" + error.message);
    throw error; // 重新抛出错误
  }
};

//根据指定UUID移除设备
export const deltSQLData = async (uuid: string) => {
  const params = new URLSearchParams();
  params.append("action", "delt_device_callback");
  addParamIfDefined(params, "uuid", uuid);

  try {
    await instance.post<MysqlChange>(Ajaxurl, params);
  } catch (error: any) {
    console.log("保存设置选项时出错：" + error.message);
  } finally {
    //console.log(false);
  }
};
