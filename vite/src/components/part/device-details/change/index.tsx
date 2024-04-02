/**
 * 设备详情 - 变更记录
 */
import React, { useContext, useEffect, useRef, useState } from "react";
import { Table, Empty, Form, Input } from "antd";
import type { InputRef } from "antd";
import type { FormInstance } from "antd/es/form";

import { changeMySqlData } from "@/store/axios";

import axios from "axios";
import { Ajaxurl } from "@/store";

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
    title: "时间",
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

  //返回值类型
  type MysqlChange = {
    data: ComputerChangeReturn[];
    message: string;
    status: string;
  };

  //发出请求获取值 TODO:抽离试试
  const getData = async (uuid: string) => {
    const params = new URLSearchParams();
    params.append("action", "search_change_data_callback");
    params.append("uuid", JSON.stringify(uuid));

    try {
      setLoading(true);
      const response = await axios.post<MysqlChange>(Ajaxurl, params);

      if (response.status === 200) {
        //拿到的展示用数据
        const data = response.data.data;

        //添加key
        const updatedDatas = data.map((obj: ComputerChangeReturn) => {
          return { ...obj, key: obj.id };
        });
        //倒序并传递
        setDataAxios(updatedDatas.reverse());
      } else {
        setError("获取数据时出错：" + response.data);
      }
    } catch (error: any) {
      setError("获取数据时出错：" + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData(uuid);
  }, [uuid]);

  //保存
  const handleSave = (row: ComputerChangeReturn) => {
    const newData = [...dataAxios];
    const index = newData.findIndex((item) => row.id === item.id);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    setDataAxios(newData); //保存选项

    //找到需要的数据
    // 用于存储符合条件的对象的数组

    //原始对象
    let changeData;
    // 遍历数组，查找 id 为当前的对象
    for (let i = 0; i < dataAxios.length; i++) {
      if (dataAxios[i].id === row.id) {
        changeData = dataAxios[i];
      }
    }
    //console.log(row); //当前设置的值
    //console.log(dataAxios); //服务器传来的值
    //console.log(changeData); //来自服务器的当前设置的值

    for (let key in changeData) {
      if (changeData[key] !== row[key]) {
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
            {/*添加 - 修改记录*/}
            <AddChangeData uuid={uuid} />
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
              />
            ) : (
              //没有数据
              <Empty description={<span>暂无记录</span>} />
            )}
          </div>
          {/**下载按钮 */}
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
