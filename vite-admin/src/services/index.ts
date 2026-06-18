export {
  saveSQLData,
  exportSQLData,
  importSQLData,
  addPublicSearchPage,
  precheckPcMigrationPhase1,
  applyPcMigrationPhase1,
} from "@/services/seting";
export {
  addChangeData,
  changeMySqlData,
  getManualChangeList,
  searchChangeData,
  searchChangeAllData,
} from "@/services/manual";

export {
  changeMySql,
  deltSQLData,
  getDeviceCategory,
  getPcList,
  getPcListFull,
  getPcSummary,
  getPcDetail,
} from "@/services/pc";

//自定义硬件设备数据
export {
  addStyleDeviceData,
  deleteStyleDeviceData,
  updateStyleDeviceData,
  getStyleDeviceCategory,
  getStyleList,
  getStyleDetail,
} from "@/services/style";

//硬件设备数据变更自动记录
export { getAutoChangeList, searchAutoChangeAllData } from "@/services/auto";
