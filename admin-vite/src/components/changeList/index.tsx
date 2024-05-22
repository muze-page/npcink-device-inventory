import React, { useState } from "react";
import { searchChangeAllData } from "@/axios";
import { Button, Table, message } from "antd";
const App: React.FC = () => {
  const [dataAxios, setDataAxios] = useState([]); //待渲染的值
  // 获取数据并处理
  const getData = async () => {
    const response = await searchChangeAllData(); // 获取数据

    if (response.success) {
      const addKeyData = response.data.data;
      setDataAxios(addKeyData); // 传值
      console.log(addKeyData);
    } else {
    }
  };

  
  const columns = [
    {
      title: "变更姓名",
      dataIndex: "user",
      key: "user",
    },
    {
      title: "变更日期",
      dataIndex: "time",
      key: "time",
    },
    {
      title: "变更内容",
      dataIndex: "data",
      key: "data",
    },
    {
      title: "设备信息",
      dataIndex: "msg",
      key: "msg",
    },
  ];

  return (
    <>
      <Button onClick={getData}>获取数据</Button>
      <Table dataSource={dataAxios} columns={columns} />;
    </>
  );
};

export default App;
