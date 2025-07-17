//演示用自定义数据

const DataOne = {
  title: "MacBook Pro 16",
  link: "https://item.taobao.com/item.htm?id=1234567890",
  shop_name: "Apple官方旗舰店",
  number: 1,
  order_time: "2023-11-09 18:13:02",
  total: 19999.00,
  order: "TB1234567890",
  pay_method: "支付宝",
  platform: "淘宝",
  purchaser: "张三",
};

const DateTwo = {
  title: "华为手机",
  link: "https://item.taobao.com/item.htm?id=1234567890",
  shop_name: "华为官方旗舰店",
  number: 2,
  order_time: "2025-11-09 18:13:02",
  total: 39999.00,
  order: "JD1234567890",
  pay_method: "信用卡",
  platform: "微信",
  purchaser: "李四",
};

const data = [
  {
    id: "1",
    state: "apply",
    name: "管理员",
    purpose: "测试使用",
    time: "2023-11-09 18:13:02",
    uuid: "4b60abe878f60c54a04dc1ed9ecead7c",
    data: DataOne,
  },
  {
    id: "12",
    state: "scrap",
    name: "布局",
    purpose: "测试使用",
    time: "2025-11-09 18:13:02",
    uuid: "4b60abe878f60c54a04dc1ed9ecead7s",
    data: DateTwo,
  },
];

export default data;
