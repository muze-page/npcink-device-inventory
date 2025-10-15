import React, { useState } from "react";
import { Input, Space } from "antd";
import { fetchData } from "./axios";
import Detailed from "@/components/part/";
import { MysqlDeviceChange, Computer } from "@/type/index";
import ShowUser from "@/components/showUser";
import type { SearchProps } from "antd/es/input/Search";

const { Search } = Input;
const App: React.FC = () => {
  const [responseData, setResponseData] = useState<MysqlDeviceChange>(); // 返回值
  const [displayData, setDisplayData] = useState<Computer>(); // 设备数据

  //输入框中的值
  // 定义状态变量用于存储输入框的值
  const [inputValue, setInputValue] = useState("");

  // 处理输入框值的变化
  const handleInputChange = (e: any) => {
    setInputValue(e.target.value); // 更新状态变量中的值
  };

  //输入框中的值
  const onSearch: SearchProps["onSearch"] = async (value, _e, _info) => {
    const data = await fetchData(inputValue, value); //获取数据
    //空对象
    if (Object.keys(data).length === 0) {
      return;
    }
    /**
     * 渲染用数据
     *  将数组中的硬件数据从json格式处理成对象
     */
    const parsedData = JSON.parse(data.data); //从字符串处理为对象

    setResponseData(data); // 存储返回数据
    setDisplayData(parsedData); // 存储对象设备数据
    //console.log(info?.source, value);
  };

  return (
    <>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Input
          addonBefore="密码"
          placeholder="后台设置下的密码"
          style={{ width: 300 }}
          value={inputValue} // 绑定输入框的值到状态变量
          onChange={handleInputChange} // 处理输入框值的变化
        />
        <Search
          placeholder="输入编号或者姓名"
          onSearch={onSearch}
          style={{ width: 300 }}
        />

        {responseData && <ShowUser data={responseData} />}
        {responseData && <Detailed data={displayData!} />}
      </Space>
    </>
  );
};

export default App;
