//自动记录设备变更
import React, { useState, useEffect, useRef } from "react";
import { getAutoChangeList } from "@/services/index";
import { Table, Input, Space } from "antd";
import type { TableColumnsType } from "antd";
import { ChangeAutoRecord } from "@/type/index";
type Props = {
  isActive: boolean; //控制显示
};
const App: React.FC<Props> = ({ isActive }) => {
  const [dataAxios, setDataAxios] = useState<ChangeAutoRecord[]>([]); //待渲染的值
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState<string | undefined>();
  const [columnFilter, setColumnFilter] = useState<string | undefined>();
  const [filters, setFilters] = useState<{
    tables: string[];
    columns: string[];
  }>({
    tables: [],
    columns: [],
  });
  const requestIdRef = useRef(0);

  const getData = async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const response = await getAutoChangeList({
        page,
        per_page: pageSize,
        search,
        table_name: tableFilter,
        column_name: columnFilter,
      });
      if (requestId !== requestIdRef.current) {
        return;
      }
      const records = Array.isArray(response.items) ? response.items : [];
      setDataAxios(records);
      setTotal(response.total || 0);
      if (response.filters) {
        setFilters({
          tables: response.filters.tables || [],
          columns: response.filters.columns || [],
        });
      }
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setDataAxios([]);
      setTotal(0);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  //拿到最新UUID
  useEffect(() => {
    getData();
  }, [page, pageSize, search, tableFilter, columnFilter]);

  //准备姓名，类型数组
  //从数组对象中，提取指定键的值，去重后输出为指定的对象数组
  const userArr = filters.tables.map((item) => ({
    text: item,
    value: item,
  }));
  const typeArr = filters.columns.map((item) => ({
    text: item,
    value: item,
  }));

  //筛选
  const columns: TableColumnsType<ChangeAutoRecord> = [
    {
      title: "序号",
      dataIndex: "id",
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
      width: "10%",
    },
    {
      title: "表名",
      dataIndex: "table_name",
      filters: userArr,
      filterMode: "tree",
      filterSearch: true,
      filteredValue: tableFilter ? [tableFilter] : null,
      width: "10%",
    },
    {
      title: "字段名",
      dataIndex: "column_name",
      filters: typeArr,
      filterMode: "tree",
      filterSearch: true,
      filteredValue: columnFilter ? [columnFilter] : null,
      width: "10%",
    },

    {
      title: "变更前的值",
      dataIndex: "old_value",
      key: "old_value",
      width: "15%",
    },
    {
      title: "变更后的值",
      dataIndex: "new_value",
      key: "new_value",
      width: "15%",
    },
    {
      title: "描述信息",
      dataIndex: "msg",
      key: "msg",
      width: "20%",
      hidden: isActive, // 这一列含有敏感信息
    },
    {
      title: "日期",
      dataIndex: "changed_at",
      key: "changed_at",
      width: "20%",
    },
  ];

  return (
    <>
      <Space className="mb-4">
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
      </Space>
      <Table
        dataSource={dataAxios}
        columns={columns}
        loading={loading}
        rowKey="id"
        scroll={{ y: 520 }}
        virtual
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
        }}
        onChange={(pagination, tableFilters) => {
          const nextPageSize = pagination.pageSize || 20;
          const tableName = Array.isArray(tableFilters.table_name)
            ? (tableFilters.table_name[0] as string)
            : undefined;
          const columnName = Array.isArray(tableFilters.column_name)
            ? (tableFilters.column_name[0] as string)
            : undefined;
          const filterChanged =
            tableName !== tableFilter || columnName !== columnFilter;
          const pageSizeChanged = nextPageSize !== pageSize;

          setPage(filterChanged || pageSizeChanged ? 1 : pagination.current || 1);
          setPageSize(nextPageSize);
          setTableFilter(tableName);
          setColumnFilter(columnName);
        }}
      />
    </>
  );
};
export default App;
