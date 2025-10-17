//自动记录设备变更
import React, { useState, useEffect } from "react";
import { searchAutoChangeAllData } from "@/axios";
import { Table, message } from "antd";
import type { TableColumnsType } from "antd";
import { ChangeAutoRecord } from "@/type/index";
type Props = {
  isActive: boolean; //控制显示
};
const App: React.FC<Props> = ({ isActive }) => {
  const [dataAxios, setDataAxios] = useState<ChangeAutoRecord[]>([]); //待渲染的值

  // 获取数据并处理TODO:优化报错机制
  const getData = async () => {
    const response = await searchAutoChangeAllData(); // 获取自定义设备变更数据
    if (response.success) {
      const addKeyData = response.data.data
        .map((obj: ChangeAutoRecord, index: number) => ({
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
  const uniqueTypess = (data: ChangeAutoRecord[], name: string) => {
    const uniqueNames = [...new Set(data.map((obj) => obj[name]))];
    return uniqueNames.map((item) => ({
      text: item.toString(),
      value: item.toString(),
    }));
  };

  //表名
  const userArr = uniqueTypess(dataAxios, "table_name");
  //字段名
  const typeArr = uniqueTypess(dataAxios, "column_name");
  //筛选
  const columns: TableColumnsType<ChangeAutoRecord> = [
    {
      title: "序号",
      dataIndex: "key",
      sorter: (a, b) => a.id - b.id,
      width: "10%",
    },
    {
      title: "表名",
      dataIndex: "table_name",
      filters: userArr,
      filterMode: "tree",
      filterSearch: true,
      onFilter: (value, record) =>
        record.table_name.startsWith(value.toString()),
      width: "15%",
    },
    {
      title: "字段名",
      dataIndex: "column_name",
      filters: typeArr,
      filterMode: "tree",
      filterSearch: true,
      onFilter: (value, record) =>
        record.column_name.startsWith(value.toString()),
      width: "10%",
    },

    {
      title: "变更前的值",
      dataIndex: "old_value",
      key: "old_value",
      width: "35%",
    },
    {
      title: "变更后的值",
      dataIndex: "new_value",
      key: "new_value",
      width: "15%",
    },
    {
      title: "日期",
      dataIndex: "changed_at",
      key: "changed_at",
      width: "15%",
    },
  ];

  return (
    <>
      <Table
        dataSource={dataAxios}
        columns={columns}
        className={isActive ? "hideName" : ""}
      />
    </>
  );
};
export default App;
