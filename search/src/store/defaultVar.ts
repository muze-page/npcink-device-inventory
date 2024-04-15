//示例设置信息
export const option = {
  route: "device-post-data", //路由
  password: "$P$B2IXx1GFDOWPE8CSF7hwVnrooXBIol1", //密码
  delete_mysql: false, //是否删除数据库
  department: ["开发部", "推广部", "运营部", "默认"],
  device_show_number: 10, //设备显示
};

const data = {
  option: option, //选项
  site: "http://localhost:10048",
};
export default data;
