/**
 * 展示设备信息自动变更记录
 */
import { useState, useEffect } from "react";
import { Table, Space, Empty, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import { getAutoChangeList } from "@/services/index";
import { ChangeAutoRecord } from "@/type/index";
import { formatDate } from "@/utils/tool";
import { Dayjs } from "dayjs";

interface Props {
  uuid: string;
  recordHint?: string;
}

const App: React.FC<Props> = ({ uuid, recordHint }) => {
  const [data, setData] = useState<ChangeAutoRecord[]>([]); // 变更记录数据
  const [loading, setLoading] = useState(false); // 加载状态
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [columnFilter, setColumnFilter] = useState<string | undefined>();
  const [filters, setFilters] = useState<{ columns: string[] }>({
    columns: [],
  });

  const getData = async () => {
    // 检查UUID是否有效
    if (!uuid) {
      setData([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    try {
      const res = await getAutoChangeList({
        record_uuid: uuid,
        page,
        per_page: pageSize,
        search,
        column_name: columnFilter,
      });
      const records = Array.isArray(res.items) ? res.items : [];
      setData(records);
      setTotal(res.total || 0);
      if (res.filters) {
        setFilters({
          columns: res.filters.columns || [],
        });
      }
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 严格模式下，这里会执行两次
   * uuid变化时，自动执行
   */
  useEffect(() => {
    setPage(1);
    setSearch("");
    setColumnFilter(undefined);
  }, [uuid]);

  useEffect(() => {
    getData();
  }, [uuid, page, pageSize, search, columnFilter]);

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
  };

  // 获取所有唯一字段名作为筛选选项
  const getFieldFilters = () => {
    return filters.columns.map((field) => ({
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
      filteredValue: columnFilter ? [columnFilter] : null,
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
        {recordHint ? (
          <div className="text-xs text-zinc-500">{recordHint}</div>
        ) : null}
        <Input.Search
          placeholder="搜索变更记录"
          allowClear
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onChange={(e) => {
            if (e.target.value === "") {
              setSearch("");
              setPage(1);
            }
          }}
          style={{ width: 240 }}
        />
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
          }}
          onChange={(pagination, tableFilters) => {
            setPage(pagination.current || 1);
            setPageSize(pagination.pageSize || 10);
            const columnName = Array.isArray(tableFilters.column_name)
              ? (tableFilters.column_name[0] as string)
              : undefined;
            setColumnFilter(columnName);
          }}
          locale={{
            emptyText: <Empty description="暂无数据" />,
          }}
        />
      </Space>
    </div>
  );
};

export default App;
