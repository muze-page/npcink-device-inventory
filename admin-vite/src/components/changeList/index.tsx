import React, { useState, useEffect } from "react";
import { searchChangeAllData } from "@/axios";
import { Button, Table, message } from "antd";
import { DeviceChangeList } from "@/store/interface";

//
//导出表格
const exportTable = (jsonData: {}[]) => {
  // 如果没有拿到值，就此结束
  if (!jsonData) {
    return;
  }

  // 创建一个表格元素
  const table = document.createElement("table");

  // 添加表头
  const thead = document.createElement("thead");
  const headers = Object.keys(jsonData[0]);
  const headerRow = document.createElement("tr");
  headers.forEach((headerText) => {
    const th = document.createElement("th");
    th.appendChild(document.createTextNode(headerText));
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // 添加数据行
  const tbody = document.createElement("tbody");
  jsonData.forEach((rowData: { [x: string]: string }) => {
    const row = document.createElement("tr");
    headers.forEach((header) => {
      const cell = document.createElement("td");
      cell.appendChild(document.createTextNode(rowData[header]));
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  // 将表格转换为 Excel 文件
  const blob = new Blob([table.outerHTML], {
    type: "application/vnd.ms-excel",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "硬件变更数据导出文件.xlsx";
  link.click();

  // 等待一段时间后释放 URL 对象
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
};

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
    exportTable(dataAxios);
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
