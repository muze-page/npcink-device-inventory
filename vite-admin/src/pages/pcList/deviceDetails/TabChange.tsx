/**
 * 设备详情 - 变更记录
 */
import React, { useContext, useEffect, useRef, useState } from "react";
import { Table, Form, Input, Empty, Space } from "antd";
import type { InputRef } from "antd";
import type { FormInstance } from "antd/es/form";

import { changeMySqlData, getManualChangeList } from "@/services/index";

import { DeviceChangeList } from "@/type/index";

import TabChangeAdd from "@/pages/pcList/deviceDetails/block/TabChangeAdd";

//在嵌套的组件之间传递Form实例，使得表单可以进行联动
const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface EditableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  index?: number;
}

//可编辑表格的行和单元格组件
const EditableRow: React.FC<EditableRowProps> = (props) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  children: React.ReactNode;
  dataIndex: keyof DeviceChangeList;
  record: DeviceChangeList;
  handleSave: (record: DeviceChangeList) => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<InputRef>(null);
  const form = useContext(EditableContext)!;

  useEffect(() => {
    if (editing) {
      inputRef.current!.focus();
    }
  }, [editing]);

  //设定状态？
  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  //保存
  const save = async () => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log("Save failed:", errInfo);
    }
  };

  let childNode = children;

  //核心
  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{ margin: 0 }}
        name={dataIndex}
        rules={[
          {
            required: true,
            message: `${title} is required.`,
          },
        ]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{ paddingRight: 24 }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};

type EditableTableProps = Parameters<typeof Table>[0];

type ColumnTypes = Exclude<EditableTableProps["columns"], undefined>;

interface Props {
  uuid: string; //UUID
}
const App: React.FC<Props> = ({ uuid }) => {
  const [dataAxios, setDataAxios] = useState<DeviceChangeList[]>([]); //待渲染的值
  const [loading, setLoading] = useState(false); //加载状态
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [filters, setFilters] = useState<{ users: string[]; types: string[] }>({
    users: [],
    types: [],
  });
  const requestIdRef = useRef(0);

  // 获取数据并处理
  const getData = async () => {
    if (!uuid) {
      setDataAxios([]);
      setTotal(0);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true); // 开始加载
    try {
      const response = await getManualChangeList({
        record_uuid: uuid,
        page,
        per_page: pageSize,
        search,
        user: userFilter,
        type: typeFilter,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }
      const addKeyData = (response.items || []).map(
        (obj: DeviceChangeList, index: number) => ({
          ...obj,
          key: (page - 1) * pageSize + index + 1,
        })
      );
      setDataAxios(addKeyData); // 传值
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
        setLoading(false); // 结束加载
      }
    }
  };

  //拿到最新UUID
  useEffect(() => {
    setPage(1);
    setSearch("");
    setUserFilter(undefined);
    setTypeFilter(undefined);
  }, [uuid]);

  useEffect(() => {
    getData();
  }, [uuid, page, pageSize, search, userFilter, typeFilter]);

  const refreshData = () => {
    if (page !== 1) {
      setPage(1);
      return;
    }
    getData();
  };

  //保存
  const handleSave = async (row: DeviceChangeList) => {
    // 浅拷贝 创建副本
    const newData = [...dataAxios];

    //在newData数组中查找具有与row.id相同的id属性的元素，并返回该元素在数组中的索引位置。
    const index = newData.findIndex((item) => row.id === item.id);

    // 如果找不到对应的记录，直接返回
    if (index === -1) {
      return;
    }

    const oldData = newData[index]; //修改前的值

    //更新数据
    newData.splice(index, 1, {
      ...oldData,
      ...row,
    });

    setDataAxios(newData); //保存选项

    //哪个发生变化就更新那个
    let hasChanges = false;
    for (const key in oldData) {
      if (oldData[key] !== row[key]) {
        hasChanges = true;
        try {
          let updated = true;
          switch (key) {
            case "user":
              updated = await changeMySqlData(row.id, "user", row.user); //更新姓名
              break;
            case "type":
              updated = await changeMySqlData(row.id, "type", row.type); //更新类型
              break;
            case "data":
              updated = await changeMySqlData(row.id, "data", row.data); //更新描述
              break;
            default:
              break;
          }
          if (!updated) {
            setDataAxios([...dataAxios]);
            return;
          }
        } catch (error) {
          // 恢复原数据
          setDataAxios([...dataAxios]);
          return;
        }
      }
    }

    if (hasChanges) {
      //提示成功信息
      //message.success("保存成功");
    }
  };

  //覆盖默认的 table 元素
  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  const userFilters = filters.users.map((item) => ({
    text: item,
    value: item,
  }));
  const typeFilters = filters.types.map((item) => ({
    text: item,
    value: item,
  }));

  const columns: (ColumnTypes[number] & {
    editable?: boolean;
    dataIndex: string;
  })[] = [
    {
      title: "序号",
      dataIndex: "key",
      key: "key",
    },
    {
      title: "变更项目",
      dataIndex: "type",
      key: "type",
      editable: true,
      filters: typeFilters,
      filteredValue: typeFilter ? [typeFilter] : null,
    },
    {
      title: "变更说明",
      dataIndex: "data",
      key: "data",
      editable: true,
    },
    {
      title: "变更人",
      dataIndex: "user",
      key: "user",
      editable: true,
      filters: userFilters,
      filteredValue: userFilter ? [userFilter] : null,
    },
    {
      title: "变更时间",
      dataIndex: "created_at",
      key: "created_at",
    },
  ];

  //编辑
  const columnss = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: DeviceChangeList) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });

  return (
    <>
      <div className="pl-5 relative">
        <div className="mt-1">
          <p className="mb-4 text-base font-bold text-[#333]">硬件信息变更</p>
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
          {dataAxios.length !== 0 ? (
            <Table
              components={components}
              rowClassName={() => "editable-row"}
              bordered
              size="small"
              columns={columnss as ColumnTypes}
              dataSource={dataAxios}
              loading={loading}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
              }}
              onChange={(pagination, tableFilters) => {
                setPage(pagination.current || 1);
                setPageSize(pagination.pageSize || 6);
                const user = Array.isArray(tableFilters.user)
                  ? (tableFilters.user[0] as string)
                  : undefined;
                const type = Array.isArray(tableFilters.type)
                  ? (tableFilters.type[0] as string)
                  : undefined;
                setUserFilter(user);
                setTypeFilter(type);
              }}
              locale={{ emptyText: "暂无数据" }}
            />
          ) : (
            <Empty description={<span>暂无记录</span>} />
          )}
          <TabChangeAdd uuid={uuid} onUpdata={refreshData} />
        </div>
      </div>
    </>
  );
};

export default App;
