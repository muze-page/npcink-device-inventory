/**
 * 硬件设置选项
 */
import { MysqlDeviceData, PCCategoryType, MysqlDeviceChange } from "@/type/index";
import { restInstance } from "@/services/axiosConfig";
import { PagedResponse, PcSummary } from "@/type/index";
/**
 * 修改设备数据，一次性更新
 */
/**
 *
 * @param uuid 唯一标识符
 * @param value 修改后的值
 */
export const changeMySql = async (uuid: string, data: MysqlDeviceData) => {
  try {
    const res = await restInstance.put(`/admin/pc/${uuid}`, data);
    return res.data.success === true; //返回状态
  } catch (error: any) {
    console.log("保存设置选项时出错：" + error.message);
    //throw error; // 重新抛出错误
    return false;
  }
};

//根据指定UUID移除设备
export const deltSQLData = async (uuid: string) => {
  try {
    const res = await restInstance.delete(`/admin/pc/${uuid}`);
    return res.data.success === true;
  } catch (error: any) {
    console.log("保存设置选项时出错：" + error.message);
    return false;
  } finally {
    //console.log(false);
  }
};

//获取电脑设备状态和分类键值对
export const getDeviceCategory = async (): Promise<PCCategoryType> => {
  try {
    const response = await restInstance.get("/admin/pc-categories");
    return response.data as PCCategoryType;
  } catch (error) {
    console.log(error);
    // 返回默认值，确保始终返回正确的类型
    return {
      states: [],
      departments: [],
    };
  }
};

export interface PcListParams {
  page?: number;
  per_page?: number;
  search?: string;
  state?: string;
  department?: string;
  orderby?: string;
  order?: "asc" | "desc";
}

const emptyComputer = {
  os: { distro: "", platform: "" },
  cpu: { manufacturer: "", brand: "" },
  baseboard: { model: "", manufacturer: "" },
  graphics: { controllers: [] },
  memLayout: [],
  diskLayout: [],
  uuid: { macs: [] },
};

const safeParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error("解析设备数据失败:", error);
    return emptyComputer;
  }
};

const parsePcItem = (item: any): MysqlDeviceChange => {
  const parsedData =
    typeof item.data === "string" ? safeParse(item.data) : item.data;
  return { ...item, data: parsedData } as MysqlDeviceChange;
};

export const getPcList = async (
  params: PcListParams
): Promise<PagedResponse<MysqlDeviceChange>> => {
  const response = await restInstance.get("/admin/pc", { params });
  const payload = response.data as PagedResponse<MysqlDeviceChange>;
  const items = Array.isArray(payload.items)
    ? payload.items.map(parsePcItem)
    : [];
  return { ...payload, items };
};

export const getPcSummary = async (): Promise<PcSummary> => {
  const response = await restInstance.get("/admin/pc-summary");
  return response.data as PcSummary;
};
