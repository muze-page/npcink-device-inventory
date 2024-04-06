/**
 * 展示用户数据
 */
import React from "react";
import { Card, Space } from "antd";
import {findBValue} from "@/store/tool";
import {device_status} from "@/store/dataReplace";
import { MysqlDevice } from "@/store/interface";

interface Props {
  data: MysqlDevice;
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
            {data.time}
          </p>
          <p>
            <b>部门：</b>
            {data.department}
          </p>
          <p>
            <b>状态：</b>
            {findBValue(device_status,data.state)}
          </p>
        </Card>
      </Space>
    </>
  );
};
export default App;
