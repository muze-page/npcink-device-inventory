export {
  saveSQLData,
  exportSQLData,
  importSQLData,
  remove_department,
  addPublicSearchPage,
} from "@/axios/seting";
export {
  addChangeData,
  changeMySqlData,
  searchChangeData,
  searchChangeAllData,
} from "@/axios/device-change";

export { changeMySql, deltSQLData,getDeviceCategory } from "@/axios/device-seting";

//自定义硬件设备数据
export {
  addStyleDeviceData,
  deleteStyleDeviceData,
  updateStyleDeviceData,
  getStyleDeviceCategory,
} from "@/axios/device-style";

//硬件设备数据变更自动记录
export { changeAutoRecordAxios } from "@/axios/device-auto-record";
