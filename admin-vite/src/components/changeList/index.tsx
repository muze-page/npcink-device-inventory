import React, { useState, useEffect } from "react";
import { searchChangeAllData } from "@/axios";
import { Button, Table, message } from "antd";
import { DeviceChangeList } from "@/store/interface";
import {exportTable} from "@/store/tool";
//


const App: React.FC = () => {
  const [dataAxios, setDataAxios] = useState([]); //待渲染的值
  // 获取数据并处理
  const getData = async () => {
    const response = await searchChangeAllData(); // 获取数据

    if (response.success) {
      // const addKeyData = response.data.data;
      const addKeyData = response.data.data
        .map((obj: DeviceChangeList, index: number) => ({
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

  //导出表格数据
  const exportForm =async () => {
    await getData();
    console.log(dataAxios);
    exportTable(dataAxios,"硬件变更数据列表");
  };
  return (
    <>
      <Table dataSource={dataAxios} columns={columns} />
      <br />
      <Button onClick={exportForm}>下载表格</Button>
    </>
  );
};

export default App;
