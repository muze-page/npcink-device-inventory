//手动记录设备变更
import React, { useState, useEffect, useRef } from "react";
import { getManualChangeList } from "@/services/index";
import { Table, Input, Space } from "antd";
import type { TableColumnsType } from "antd";
import { DeviceChangeList } from "@/type/index";

type Props = {
  isActive: boolean; //控制显示
};
const App: React.FC<Props> = ({ isActive }) => {
  const [dataAxios, setDataAxios] = useState<DeviceChangeList[]>([]); //待渲染的值
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [filters, setFilters] = useState<{ users: string[]; types: string[] }>({
    users: [],
    types: [],
  });
  const requestIdRef = useRef(0);

  const getData = async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const response = await getManualChangeList({
        page,
        per_page: pageSize,
        search,
        user: userFilter,
        type: typeFilter,
      });
      if (requestId !== requestIdRef.current) {
        return;
      }
      const records = Array.isArray(response.items) ? response.items : [];
      setDataAxios(records);
      setTotal(response.total || 0);
      if (response.filters) {
        setFilters({
          users: response.filters.users || [],
          types: response.filters.types || [],
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
  }, [page, pageSize, search, userFilter, typeFilter]);

  //准备姓名，类型数组
  //从数组对象中，提取指定键的值，去重后输出为指定的对象数组
  const userArr = filters.users.map((item) => ({
    text: item,
    value: item,
  }));
  const typeArr = filters.types.map((item) => ({
    text: item,
    value: item,
  }));
  //筛选
  const columns: TableColumnsType<DeviceChangeList> = [
    {
      title: "序号",
      dataIndex: "id",
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
      width: "10%",
    },
    {
      title: "姓名",
      dataIndex: "user",
      filters: userArr,
      filterMode: "tree",
      filterSearch: true,
      filteredValue: userFilter ? [userFilter] : null,
      width: "15%",
      hidden: isActive, // 这一列含有敏感信息
    },
    {
      title: "类型",
      dataIndex: "type",
      filters: typeArr,
      filterMode: "tree",
      filterSearch: true,
      filteredValue: typeFilter ? [typeFilter] : null,
      width: "10%",
    },

    {
      title: "内容",
      dataIndex: "data",
      key: "data",
      width: "35%",
    },
    {
      title: "设备",
      dataIndex: "msg",
      key: "msg",
      width: "15%",
      hidden: isActive, // 这一列含有敏感信息
    },
    {
      title: "日期",
      dataIndex: "created_at",
      key: "created_at",
      width: "15%",
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
          const user = Array.isArray(tableFilters.user)
            ? (tableFilters.user[0] as string)
            : undefined;
          const type = Array.isArray(tableFilters.type)
            ? (tableFilters.type[0] as string)
            : undefined;
          const filterChanged = user !== userFilter || type !== typeFilter;
          const pageSizeChanged = nextPageSize !== pageSize;

          setPage(filterChanged || pageSizeChanged ? 1 : pagination.current || 1);
          setPageSize(nextPageSize);
          setUserFilter(user);
          setTypeFilter(type);
        }}
      />
    </>
  );
};
export default App;
