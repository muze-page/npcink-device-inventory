import DemoData from "./demoData";

//示例设置信息
export const option = {
  route: "device-post-data", //路由
  password: "9527", //密码
  delete_mysql: false, //是否删除数据库
  department: ["开发部", "推广部", "运营部", "默认"],
  device_show_number: 10, //设备显示
  addPage: {
    route: "publicsearch",
    state: false,
  },
};

const data = {
  data: DemoData,
  option: option, //选项
  ajaxurl: "/wp-admin/admin-ajax.php", //代理
  site: "http://localhost:10048",
};
export default data;
