/**
 * 设备详情 - 变更记录
 */
import React, { useContext, useEffect, useRef, useState } from "react";
import { Table, Empty, Form, Input } from "antd";
import type { InputRef } from "antd";
import type { FormInstance } from "antd/es/form";

import { changeMySqlData, searchChangeData } from "@/store/axios";

import { ComputerChangeReturn } from "@/store/interface";

import AddChangeData from "@/components/part/device-details/change/add";

//在嵌套的组件之间传递Form实例，使得表单可以进行联动
const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface EditableRowProps {
  index: number;
}

//可编辑表格的行和单元格组件
const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
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
  dataIndex: keyof ComputerChangeReturn;
  record: ComputerChangeReturn;
  handleSave: (record: ComputerChangeReturn) => void;
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

//准备表头
//const columns: ColumnsType<ComputerChangeReturn> = [
const columns: (ColumnTypes[number] & {
  editable?: boolean;
  dataIndex: string;
})[] = [
  {
    title: "序号",
    dataIndex: "id",
    key: "id",
  },
  {
    title: "变更项目",
    dataIndex: "type",
    key: "type",
    editable: true,
  },

  {
    title: "变更说明",
    dataIndex: "msg",
    key: "msg",
    editable: true,
  },
  {
    title: "变更人",
    dataIndex: "user",
    key: "user",
    editable: true,
  },
  {
    title: "变更时间",
    dataIndex: "time",
    key: "time",
  },
];

interface Props {
  uuid: string; //UUID
}
const App: React.FC<Props> = ({ uuid }) => {
  const [dataAxios, setDataAxios] = useState<ComputerChangeReturn[]>([]); //待渲染的值
  const [loading, setLoading] = useState(false); //加载中
  const [error, setError] = useState(""); //报错

  const getData = async (uuid: string) => {
    setLoading(true); //开始加载
    const data = await searchChangeData(uuid); //获取数据
    //是否获取到数据
    if (data.success) {
      //添加key
      const addKeyData = data.data.data.map((obj: ComputerChangeReturn) => {
        return { ...obj, key: obj.id };
      });
      //倒序并传递
      setDataAxios(addKeyData.reverse());
    } else {
      setError("获取数据时出错：" + data.data.message);
    }
    setLoading(false); //结束加载
  };

  //拿到最新UUID
  useEffect(() => {
    getData(uuid);
  }, [uuid]);

  //保存
  const handleSave = (row: ComputerChangeReturn) => {
    //浅拷贝 创建副本
    const newData = [...dataAxios];

    //在newData数组中查找具有与row.id相同的id属性的元素，并返回该元素在数组中的索引位置。
    const index = newData.findIndex((item) => row.id === item.id);
    const oldData = newData[index]; //修改前的值

    //更新数据
    newData.splice(index, 1, {
      ...oldData,
      ...row,
    });

    setDataAxios(newData); //保存选项
    //console.log(row);
    //console.log(dataAxios);
    //console.log(newData);
    //console.log(index);
    //console.log(oldData);

    //console.log(row); //当前设置的值
    //console.log(dataAxios); //服务器传来的值
    //console.log(changeData); //来自服务器的当前设置的值
    //哪个发生变化就更新那个
    for (let key in oldData) {
      if (oldData[key] !== row[key]) {
        console.log(`a2.${key}: `, row[key]);
        switch (key) {
          case "user":
            changeMySqlData(row.id, "user", row.user); //更新姓名
            break;
          case "type":
            changeMySqlData(row.id, "type", row.type); //更新类型
            break;
          case "msg":
            changeMySqlData(row.id, "msg", row.msg); //更新描述
            break;
          default:
            break;
        }
      }
    }
  };

  //覆盖默认的 table 元素
  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  //编辑
  const columnss = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: ComputerChangeReturn) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });

  //显示配置
  const pagination = {
    pageSize: 6, // 每页显示的数据条数
  };

  return (
    <>
      {loading ? (
        <Loading />
      ) : error ? (
        <Error message={error} />
      ) : (
        <div className="pl-5 relative">
          {/**列表 */}
          <div className="mt-1">
            <p className="mb-4 text-base font-bold text-[#333]">硬件信息变更</p>
            {dataAxios.length !== 0 ? (
              //展示数据
              <Table
                components={components}
                rowClassName={() => "editable-row"}
                bordered
                size="small"
                columns={columnss as ColumnTypes}
                dataSource={dataAxios}
                pagination={pagination}
              />
            ) : (
              //没有数据
              <Empty description={<span>暂无记录</span>} />
            )}
            {/*添加 - 修改记录*/}
            <AddChangeData uuid={uuid} />
          </div>
        </div>
      )}
    </>
  );
};

/**
 * 加载中
 * @returns
 */
const Loading = () => {
  return <p>加载中...</p>;
};

/**
 * 报错
 * @param param0
 * @returns
 */
interface PropsError {
  message: string;
}

const Error: React.FC<PropsError> = ({ message }) => {
  return <p>{message}</p>;
};

export default App;
