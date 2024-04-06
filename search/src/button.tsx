import React, { useState } from "react";
import { Input, Space } from "antd";
import { fetchData } from "./axios";
import Detailed from "@/components/part/device-details/detailed";
import { MysqlDevice, Computer } from "@/store/interface";
import ShowUser from "@/showUser";
import type { SearchProps } from "antd/es/input/Search";

const { Search } = Input;
const App: React.FC = () => {
  const [responseData, setResponseData] = useState<MysqlDevice>(); // 返回值
  const [displayData, setDisplayData] = useState<Computer>(); // 设备数据

  //输入框中的值
  const onSearch: SearchProps["onSearch"] = async (value, _e, info) => {
    const data = await fetchData(value, "9527"); //获取数据

    /**
     * 渲染用数据
     *  将数组中的硬件数据从json格式处理成对象
     */
    const parsedData = JSON.parse(data.data); //从字符串处理为对象

    setResponseData(data); // 存储返回数据
    setDisplayData(parsedData); // 存储对象设备数据
    console.log(info?.source, value);
  };

  return (
    <>
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Search
          placeholder="输入编号或者姓名"
          onSearch={onSearch}
          style={{ width: 200 }}
        />

        {responseData && <ShowUser data={responseData} />}
        {responseData && <Detailed data={displayData!} />}
      </Space>
    </>
  );
};

export default App;
