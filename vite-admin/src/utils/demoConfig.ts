import DemoData from "./demoData";
import StyleData from "./demoStyleData";

//示例设置信息
export const option = {
  route: "device-post-data", //路由
  password: "9527", //密码
  delete_mysql: false, //是否删除数据库
  depreciation_year: 36, //折旧月限
  residual_value_rate: 5, //残值率 %
  department: ["开发部", "推广部", "运营部", "默认"],
  public_search_route: "publicsearchroute",
};
//数据库表名
const sqlTableNameData = {
  changeAutoData: "npcink_device_auto",
  changeManualData: "npcink_device_manual",
  pcData: "npcink_device_pc",
  styleData: "npcink_device_style",
};

const data = {
  data: DemoData, //演示用设备
  styleData: StyleData, //自定义设备数据类型
  option: option, //选项
  ajaxurl: "/wp-admin/admin-ajax.php", //这里需要配置代理，所以没有用完整地址，仅影响开发，不影响正式打包
  site: "http://localhost:10048", //网址
  sqlTableName: sqlTableNameData, //数据库表名
};
export default data;
