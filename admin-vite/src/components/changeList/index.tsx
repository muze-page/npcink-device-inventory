import React, { useState, useEffect } from "react";
import { searchChangeAllData } from "@/axios";
import { Button, Table, message } from "antd";
import type { TableColumnsType } from "antd";
import { DeviceChangeList } from "@/store/interface";
import { exportTable } from "@/store/tool";
//

const App: React.FC = () => {
  const [dataAxios, setDataAxios] = useState<DeviceChangeList[]>([]); //待渲染的值

  // 获取数据并处理TODO:优化报错机制
  const getData = async () => {
    const response = await searchChangeAllData(); // 获取数据

    if (response.success) {
      const addKeyData = response.data.data
        .map((obj: DeviceChangeList, index: number) => ({
          ...obj,
          key: index + 1,
        }))
        .reverse();
      setDataAxios(addKeyData); // 传值
      //console.log(addKeyData);
    } else {
      message.error(response.data.error);
    }
  };

  //拿到最新UUID
  useEffect(() => {
    getData();
  }, []);

  //准备姓名，类型数组
  //从数组对象中，提取指定键的值，去重后输出为指定的对象数组
  const uniqueTypess = (data: DeviceChangeList[], name: string) => {
    const uniqueNames = [...new Set(data.map((obj) => obj[name]))];
    return uniqueNames.map((item) => ({
      text: item,
      value: item,
    }));
  };

  //姓名
  const userArr = uniqueTypess(dataAxios, "user");
  //类型
  const typeArr = uniqueTypess(dataAxios, "type");
  //筛选
  const columns: TableColumnsType<DeviceChangeList> = [
    {
      title: "序号",
      dataIndex: "key",
      sorter: (a, b) => a.key - b.key,
    },
    {
      title: "姓名",
      dataIndex: "user",
      filters: userArr,
      filterMode: "tree",
      filterSearch: true,
      onFilter: (value, record) => record.user.startsWith(value as string),
      width: "10%",
    },
    {
      title: "类型",
      dataIndex: "type",
      filters: typeArr,
      filterMode: "tree",
      filterSearch: true,
      onFilter: (value, record) => record.user.startsWith(value as string),
      width: "10%",
    },

    {
      title: "内容",
      dataIndex: "data",
      key: "data",
      width: "30%",
    },
    {
      title: "信息",
      dataIndex: "msg",
      key: "msg",
    },
    {
      title: "日期",
      dataIndex: "time",
      key: "time",
    },
  ];

  //导出表格数据
  const exportForm = async () => {
    await getData();
    //console.log(dataAxios);
    exportTable(dataAxios, "硬件变更数据列表");
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
