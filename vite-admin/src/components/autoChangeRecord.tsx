/**
 * 展示设备信息自动变更记录
 */
import { useState, useEffect } from "react";
import { Table, Space, Empty } from "antd";
import type { ColumnsType} from "antd/es/table";
import { searchAutoChangeAllData } from "@/services/index";
import { ChangeAutoRecord } from "@/type/index";
import { formatDate } from "@/utils/tool";
import { Dayjs } from "dayjs";

interface Props {
  uuid: string;
}

const App: React.FC<Props> = ({ uuid }) => {
  const [data, setData] = useState<ChangeAutoRecord[]>([]); // 变更记录数据
  const [loading, setLoading] = useState(false); // 加载状态
  const [errorMsg, setErrorMsg] = useState(""); //错误信息

  const getData = async () => {
    // 检查UUID是否有效
    if (!uuid) {
      setData([]);
      return;
    }

    setLoading(true);
    try {
      const res = await searchAutoChangeAllData(uuid);
      if (res.success) {
        // 确保数据存在且为数组
        const records = Array.isArray(res.data?.data) ? res.data.data : [];
        setData(records);
      } else {
        // 处理业务逻辑错误
        const errorMsg = res.data?.data?.error || "获取变更记录失败";
        setErrorMsg(errorMsg);
        //message.error(errorMsg);
        setData([]);
      }
    } catch (error: any) {
      // 处理网络或其他异常错误
      //console.error("获取变更记录失败:", error);
      //message.error("网络请求失败，请稍后重试");
      console.log(error);
      const errorMsg = error.response?.data?.data?.error || "获取变更记录失败";
      setErrorMsg(errorMsg);
      setData([]);
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

  // 准备翻译表
  type ChangeRecordFieldNames = {
    name: string;
    number: string;
    department: string;
    ip: string;
    state: string;
    purchase: string;
    depreciation: string;
    purpose: string;
    // 设备状态表
    apply: string; // 使用
    idie: string; // 闲置
    fault: string; // 故障
    scrap: string; // 报废
    repair: string; // 维修
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
    // 设备状态表
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
    )
      .filter((field): field is string => field !== undefined)
      .map((field) => ({
        text:
          changeRecordFieldNames[
            field as keyof typeof changeRecordFieldNames
          ] || field,
        value: field,
      }));

    return uniqueFields;
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
      render: (text: string) => {
        if (!text) return "未知字段";
        return (
          changeRecordFieldNames[text as keyof typeof changeRecordFieldNames] ||
          text
        );
      },
    },
    {
      title: "变更前",
      dataIndex: "old_value",
      key: "old_value",
      render: (text: string) => {
        if (text === null || text === undefined) return "空值";
        return (
          changeRecordFieldNames[text as keyof typeof changeRecordFieldNames] ||
          text
        );
      },
    },
    {
      title: "变更后",
      dataIndex: "new_value",
      key: "new_value",
      render: (text: string) => {
        if (text === null || text === undefined) return "空值";
        return (
          changeRecordFieldNames[text as keyof typeof changeRecordFieldNames] ||
          text
        );
      },
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
          locale={{
            emptyText: <Empty description={errorMsg} />,
          }}
        />
      </Space>
    </div>
  );
};

export default App;
