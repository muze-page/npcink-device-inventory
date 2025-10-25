/**
 * 展示用户数据
 */
import React from "react";
import { Card, Space } from "antd";
import {  formatDate } from "@/utils/tool";
import { MysqlDeviceChange } from "@/type/index";

interface Props {
  data: MysqlDeviceChange; //设备数据
}
const App: React.FC<Props> = ({ data }) => {
  return (
    <>
      <Space direction="vertical" size={16}>
        <Card title="设备信息" style={{ width: 300, textAlign: "left" }}>
          <p>
            <b>姓名：</b>
            {data.name}
          </p>
          <p>
            <b>编号：</b>
            {data.number}
          </p>
          <p>
            <b>时间：</b>
            {formatDate(data.created_at)}
          </p>
          <p>
            <b>部门：</b>
            {data.department}
          </p>
          <p>
            <b>状态：</b>
            {data.state}
          </p>
        </Card>
      </Space>
    </>
  );
};
export default App;
