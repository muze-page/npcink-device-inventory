/**
 * 硬件设置选项
 */
import { Ajaxurl } from "@/store";
import { MysqlChange, MysqlDeviceData } from "@/store/interface";
import { instance, addParamIfDefined } from "@/axios/public";
/**
 * 修改设备数据，一次性更新
 */
/**
 *
 * @param uuid 唯一标识符
 * @param value 修改后的值
 */
export const changeMySql = async (uuid: string, data: MysqlDeviceData) => {
  const params = new URLSearchParams();
  params.append("action", "modify_device_callback");
  addParamIfDefined(params, "uuid", uuid);
  addParamIfDefined(params, "data", JSON.stringify(data));
  try {
    const res = (await instance.post(Ajaxurl, params));
    return res.data.success; //返回状态
  } catch (error: any) {
    console.log("保存设置选项时出错：" + error.message);
    //throw error; // 重新抛出错误
    return false;
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
