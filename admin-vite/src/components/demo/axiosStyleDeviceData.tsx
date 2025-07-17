/**
 *测试 - 添加自定义硬件数据
 */
/**
 *测试 - 添加自定义硬件数据
 */
import { addStyleDeviceData } from "@/axios";
import { StyleDevice } from "@/store/interface";

const App: React.FC = () => {
  // 构造测试数据
  const testData: StyleDevice = {
    id: "test-id-001",
    name: "测试设备",
    purpose: "测试用途",
    state: "正常",
    uuid: "test-uuid-001",
    data: {
      title: "华为手机",
      link: "https://item.taobao.com/item.htm?id=1234567890",
      shop_name: "华为官方旗舰店",
      number: 2,
      order_time: "2025-11-09 18:13:02",
      total: 39999.0,
      order: "JD1234567890",
      pay_method: "信用卡",
      platform: "微信",
      purchaser: "李四",
    }, // 根据实际接口补充字段
  };

  const onFinish = async (values: StyleDevice) => {
    // 发送POST请求
    const state = await addStyleDeviceData(values);

    //成功添加则清除输入框
    if (state) {
      alert("添加成功");
    } else {
      alert("添加失败");
    }
  };

  return (
    <button onClick={() => onFinish(testData)}>测试添加自定义硬件数据</button>
  );
};

export default App;
