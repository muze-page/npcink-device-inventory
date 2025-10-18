export {
  saveSQLData,
  exportSQLData,
  importSQLData,
  addPublicSearchPage,
} from "@/services/seting";
export {
  addChangeData,
  changeMySqlData,
  searchChangeData,
  searchChangeAllData,
} from "@/services/manual";

export { changeMySql, deltSQLData, getDeviceCategory } from "@/services/pc";

//自定义硬件设备数据
export {
  addStyleDeviceData,
  deleteStyleDeviceData,
  updateStyleDeviceData,
  getStyleDeviceCategory,
} from "@/services/style";

//硬件设备数据变更自动记录
export { searchAutoChangeAllData } from "@/services/auto";
