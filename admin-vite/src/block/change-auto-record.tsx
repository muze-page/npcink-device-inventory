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

  //准备翻译表
  const changeRecordFieldNames = {
    name: "姓名",
    number: "设备编号",
    department: "部门",
    ip: "ip",
    state: "设备状态",
    purchase: "采购价",
    depreciation: "二手价",
    purpose: "用途",
    //设备状态表
    apply: "使用",
    idie: "闲置",
    fault: "故障",
    scrap: "报废",
  };

  const columns = [
    {
      title: "字段名",
      dataIndex: "column_name",
      key: "column_name",
      render: (text: string) =>
        changeRecordFieldNames[text as keyof typeof changeRecordFieldNames] ||
        text,
    },
    {
      title: "变更前",
      dataIndex: "old_value",
      key: "old_value",
      render: (text: string) =>
        changeRecordFieldNames[text as keyof typeof changeRecordFieldNames] ||
        text,
    },
    {
      title: "变更后",
      dataIndex: "new_value",
      key: "new_value",
      render: (text: string) =>
        changeRecordFieldNames[text as keyof typeof changeRecordFieldNames] ||
        text,
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
