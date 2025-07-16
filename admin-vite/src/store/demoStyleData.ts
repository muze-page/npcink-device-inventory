//演示用自定义数据

const DataOne = {
  platform: "淘宝",
  title: "MacBook Pro 16",
  shop_name: "Apple官方旗舰店",
  number: "1",
  total: "19999.00",
  order_time: "2023-11-09 18:13:02",
  order: "TB1234567890",
  link: "https://item.taobao.com/item.htm?id=1234567890",
  purpose: "办公使用",
  pay_method: "支付宝",
};

const DateTwo={
   platform: "京东",
  title: "MacBook Pro 19",
  shop_name: "苹果官方旗舰店",
  number: "2",
  total: "39999.00",
  order_time: "2025-11-09 18:13:02",
  order: "JD1234567890",
  link: "https://item.jd.com/item.htm?id=1234567890",
  purpose: "测试使用",
  pay_method: "微信",
}

const data = [
  {
    id: "1",
    state: "apply",
    time: "2023-11-09 18:13:02",
    uuid: "4b60abe878f60c54a04dc1ed9ecead7c",
    name: "管理员",
    data: [DataOne],
  },
   {
    id: "12",
    state: "scrap",
    time: "2025-11-09 18:13:02",
    uuid: "4b60abe878f60c54a04dc1ed9ecead7s",
    name: "布局",
    data: [DataOne,DateTwo],
  },
];

export default data;
