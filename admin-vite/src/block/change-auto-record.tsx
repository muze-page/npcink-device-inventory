/**
 * 自定义设备信息变更记录
 */
import { useState, useEffect } from "react";
import { Table, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import { changeAutoRecordAxios } from "@/axios/index";
import { ChangeAutoRecord } from "@/type/index";
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
  type ChangeRecordFieldNames = {
    name: string;
    number: string;
    department: string;
    ip: string;
    state: string;
    purchase: string;
    depreciation: string;
    purpose: string;
    //设备状态表
    apply: string; //使用
    idie: string; //闲置
    fault: string; //故障
    scrap: string; //报废
    repair: string; //维修
  };
  const changeRecordFieldNames: ChangeRecordFieldNames = {
    name: "姓名",
    number: "设备编号",
    department: "部门",
    ip: "IP",
    state: "设备状态",
    purchase: "采购价",
    depreciation: "二手价",
    purpose: "用途",
    //设备状态表
    apply: "使用",
    idie: "闲置",
    fault: "故障",
    scrap: "报废",
    repair: "维修",
  };

  // 获取所有唯一字段名作为筛选选项
  const getFieldFilters = () => {
    const uniqueFields = Array.from(
      new Set(data.map((item) => item.column_name))
    ).filter((field) => field !== undefined);

    return uniqueFields.map((field) => ({
      text:
        changeRecordFieldNames[field as keyof typeof changeRecordFieldNames] ||
        field,
      value: field,
    }));
  };

  const columns: ColumnsType<ChangeAutoRecord> = [
    {
      title: "序号",
      dataIndex: "index",
      key: "index",
      render: (_, __, index) => index + 1,
      width: 60,
    },
    {
      title: "选项",
      dataIndex: "column_name",
      key: "column_name",
      filters: getFieldFilters(),
      onFilter: (value, record) => record.column_name === value,
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
      title: "时间",
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
