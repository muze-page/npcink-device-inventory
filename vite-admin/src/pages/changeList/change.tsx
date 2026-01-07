//手动记录设备变更
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getManualChangeList } from "@/services/index";
import { Table, Input, Space } from "antd";
import type { TableColumnsType } from "antd";
import { DeviceChangeList } from "@/type/index";
import { queryKeys } from "@/services/queryKeys";

type Props = {
  isActive: boolean; //控制显示
};
const App: React.FC<Props> = ({ isActive }) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();

  const listParams = {
    page,
    per_page: pageSize,
    search,
    user: userFilter,
    type: typeFilter,
  };

  const listQuery = useQuery({
    queryKey: queryKeys.manualChanges(listParams),
    queryFn: () => getManualChangeList(listParams),
    keepPreviousData: true,
  });

  const dataAxios = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const userFilters = listQuery.data?.filters?.users ?? [];
  const typeFilters = listQuery.data?.filters?.types ?? [];
  const loading = listQuery.isFetching;

  //准备姓名，类型数组
  //从数组对象中，提取指定键的值，去重后输出为指定的对象数组
  const userArr = userFilters.map((item) => ({
    text: item,
    value: item,
  }));
  const typeArr = typeFilters.map((item) => ({
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
