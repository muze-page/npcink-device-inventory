/**
 * 设备详情 - 变更记录
 */
import { useState, useEffect } from "react";
import { Table, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";

import axios from "axios";
import { Ajaxurl } from "@/store";
import { replacements } from "@/store/dataReplace";
import { ComputerChangeReturn } from "@/store/interface";

//准备表格数据类型
interface DataType {
  key: string;
  time: string;
  type: string;
  old: string;
  new: string;
}

//准备表头
const columns: ColumnsType<DataType> = [
  {
    title: "时间",
    dataIndex: "time",
    key: "time",
  },
  {
    title: "变更项目",
    dataIndex: "type",
    key: "type",
  },
  {
    title: "原配置",
    dataIndex: "old",
    key: "old",
  },
  {
    title: "现配置",
    dataIndex: "new",
    key: "new",
  },
];

//替换对象中type的值
const replaceType = (data: ComputerChangeReturn[]) => {
  return data.map((obj: ComputerChangeReturn) => {
    const type = obj.type;
    if (type && replacements[type]) {
      return { ...obj, type: replacements[type] };
    }
    return obj;
  });
};

interface Props {
  data: string;
}
const App: React.FC<Props> = ({ data }) => {
  //检测new 和old 的值，大于1000000的进行处理

  const [dataAxios, setDataAxios] = useState<DataType[]>([]); //待渲染的值
  const [loading, setLoading] = useState(false); //加载中
  const [error, setError] = useState(""); //报错

  //返回值类型
  type MysqlChange = {
    data: ComputerChangeReturn[];
    message: string;
    status: string;
  };
  //发出请求获取值
  const getData = async (uuid: string) => {
    const params = new URLSearchParams();
    params.append("action", "search_change_data_callback");
    params.append("uuid", JSON.stringify(uuid));

    try {
      setLoading(true);
      const response = await axios.post<MysqlChange>(Ajaxurl, params);

      if (response.status === 200) {
        const data = response.data.data;
        console.log(response.data);
        //关键值替换
        const updatedData = replaceType(data);

        //添加key
        const updatedDatas = updatedData.map((obj: ComputerChangeReturn) => {
          return { ...obj, key: obj.id };
        });
        //传递
        setDataAxios(updatedDatas);
      } else {
        setError("保存设置选项时出错：" + response.data);
      }
    } catch (error: any) {
      setError("保存设置选项时出错：" + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData(data);
  }, [data]);

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
            <DataList data={dataAxios} />
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
  return <p>Loading...</p>;
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

/**
 * 渲染数据
 * @param param0
 * @returns
 */
interface PropsDataList {
  data: DataType[];
}
const DataList: React.FC<PropsDataList> = ({ data }) => {
  if (data.length === 0) {
    return <Empty />;
  }

  return <Table size="small" columns={columns} dataSource={data} />;
};

export default App;
