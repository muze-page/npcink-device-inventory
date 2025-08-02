/**
 *测试 - 添加自定义硬件数据
 */
import { useState } from "react";
import { Button, Input } from "antd";
import dayjs from "dayjs";
import {
  addStyleDeviceData,
  deleteStyleDeviceData,
  updateStyleDeviceData,
} from "@/axios";
import { StyleDevice } from "@/store/interface";

const App: React.FC = () => {
  // 构造测试数据
  const testData: StyleDevice = {
    id: "test-id-001",
    name: "测试设备",
    purpose: "测试用途",
    state: "apply",
    data: {
      title: "华为手机",
      link: "https://item.taobao.com/item.htm?id=1234567890",
      shop_name: "华为官方旗舰店",
      number: 2,
      order_time: dayjs("2025-11-09T10:00:00Z"),
      total: 39999.0,
      order: "JD1234567890",
      pay_method: "信用卡",
      platform: "XianYu",
      purchaser: "李四",
    }, // 根据实际接口补充字段
  };

  //增
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

  const [uuid, setUuid] = useState<string>("");
  //删
  const onDelete = async () => {
    //if (!uuid) {
    //  alert("请输入 UUID");
    //  return;
    //}
    // 删除数据
    const state = await deleteStyleDeviceData(uuid);

    //成功删除则清除输入框
    if (state) {
      alert("删除成功");
    } else {
      alert("删除失败");
    }
    console.log("返回值:", state);
  };

  //改
  const onUpdate = async () => {
    const state = await updateStyleDeviceData(uuid, testData);
    if (state) {
      alert("修改成功");
    } else {
      alert("修改失败");
    }
  };

  return (
    <>
      <Input
        placeholder="请输入 UUID"
        value={uuid}
        onChange={(e) => setUuid(e.target.value)}
        style={{ width: 300, margin: "10px 0" }}
      />
      <Button onClick={() => onFinish(testData)}>添加数据</Button>
      <Button onClick={() => onDelete()}>删除数据</Button>
      <Button onClick={() => onUpdate()}>改数据</Button>
    </>
  );
};

export default App;
