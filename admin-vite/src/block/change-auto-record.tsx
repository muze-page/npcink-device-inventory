/**
 * 自定义设备信息变更记录
 */
import { useState, useEffect } from "react";
import { Table, Space } from "antd";
import { changeAutoRecordAxios } from "@/axios/index";
import { ChangeAutoRecord } from "@/store/interface";
import { formatDate } from "@/store/tool";
import { Dayjs } from "dayjs";

interface Props {
  uuid: string;
}

const App: React.FC<Props> = ({ uuid }) => {
  const [data, setData] = useState<ChangeAutoRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const getData = async () => {
    setLoading(true);
    try {
      const res = await changeAutoRecordAxios(uuid);
      if (res.success) {
        setData(res.data.data || []);
      }
    } catch (error: any) {
      setData([]);
      console.error("获取变更记录失败:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 严格模式下，这里会执行两次
   * uuid变化时，自动执行
   */
  useEffect(() => {
    getData();
  }, [uuid]);

  const columns = [
    {
      title: "字段名",
      dataIndex: "column_name",
      key: "column_name",
    },
    {
      title: "变更前",
      dataIndex: "old_value",
      key: "old_value",
    },
    {
      title: "变更后",
      dataIndex: "new_value",
      key: "new_value",
    },
    {
      title: "变更时间",
      dataIndex: "changed_at",
      key: "changed_at",
      render: (text: Dayjs) => formatDate(text),
    },
  ];

  return (
    <div>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Space>
    </div>
  );
};

export default App;
