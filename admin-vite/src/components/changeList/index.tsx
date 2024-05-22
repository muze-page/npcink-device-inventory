import React, { useState, useEffect } from "react";
import { searchChangeAllData } from "@/axios";
import { Table, message } from "antd";
const App: React.FC = () => {
  const [dataAxios, setDataAxios] = useState([]); //待渲染的值
  // 获取数据并处理
  const getData = async () => {
    const response = await searchChangeAllData(); // 获取数据

    if (response.success) {
      // const addKeyData = response.data.data;
      const addKeyData = response.data.data
        .map((obj: any, index: number) => ({
          ...obj,
          key: index + 1,
        }))
        .reverse();
      setDataAxios(addKeyData); // 传值
      console.log(addKeyData);
    } else {
      message.error(response.data.error);
    }
  };

  //拿到最新UUID
  useEffect(() => {
    getData();
  }, []);

  const columns = [
    {
      title: "序号",
      dataIndex: "key",
      key: "key",
    },
    {
      title: "变更姓名",
      dataIndex: "user",
      key: "user",
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
    {
      title: "变更日期",
      dataIndex: "time",
      key: "time",
    },
  ];

  return (
    <>
      {/* <Button onClick={getData}>获取数据</Button>*/}
      <Table dataSource={dataAxios} columns={columns} />
    </>
  );
};

export default App;
