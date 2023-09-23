/**
 * 设备详情 - 变更记录
 */
import { Table, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import { findDifferentKeys } from "@/store/tool";

import axios from "axios";
import { dataAjaxurl } from "@/store/dataContext";

interface DataType {
  key: string;
  time: string;
  change: string;
  old: string;
  new: string;
}

const columns: ColumnsType<DataType> = [
  {
    title: "时间",
    dataIndex: "time",
    key: "time",
  },
  {
    title: "变更项目",
    dataIndex: "change",
    key: "change",
  },
  {
    title: "原配置",
    dataIndex: "old",
    key: "old",
  },
  {
    title: "现配置",
    key: "new",
    dataIndex: "new",
  },
];

//替换列表
interface Replacements {
  [key: string]: string;
}

const replacements: Replacements = {
  "os.distro": "系统版本",
  "diskLayout.1.size": "主硬盘大小",
  // 其他需要替换的字符串
};

interface Props {
  data: any;
}
const App: React.FC<Props> = ({ data }) => {
  console.log(data);
  //准备变化后的数组
  const dataNew = data.dataNew;
  const dataOld = data.dataOld;

  //进行处理
  const differences = findDifferentKeys(dataOld, dataNew);

  //替换关键词
  differences.forEach((difference) => {
    if (replacements.hasOwnProperty(difference.change)) {
      difference.change = replacements[difference.change];
    }
  });

  //检测new 和old 的值，大于1000000的进行处理

  console.log(differences);
  //添加若干参数
  addUniqueIdAndTime(differences);
  const dataTable = differences as DataType[];
  console.log(differences);

  /**
   * 临时用
   */
  function addUniqueIdAndTime(array: any) {
    array.forEach((obj: any, _index: any) => {
      obj.key = generateUniqueId();
      obj.time = generateRandomDate();
    });
  }

  function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
  }

  function generateRandomDate() {
    const startDate = new Date(2000, 0, 1); // 开始日期为2000年1月1日
    const endDate = new Date(); // 结束日期为当前日期

    const randomTimestamp = Math.floor(
      Math.random() * (endDate.getTime() - startDate.getTime()) +
        startDate.getTime()
    );
    const randomDate = new Date(randomTimestamp);

    const year = randomDate.getFullYear();
    const month = String(randomDate.getMonth() + 1).padStart(2, "0");
    const day = String(randomDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  //发出请求获取数据
  const getData = () => {
    const params = new URLSearchParams();
    params.append("action", "search_change_data_callback");
    params.append("uuid", JSON.stringify("8588"));

    axios
      .post(dataAjaxurl, params)
      .then((res) => {
        console.log(res);
      })
      .catch((error) => {
        // 请求失败，处理错误信息
        console.error(error);
      });
  };

  return (
    <>
      <div className="pl-5 relative">
        {/**列表 */}
        <div className="mt-1">
          <p className="mb-4 text-base font-bold text-[#333]">硬件信息变更</p>
          {differences.length === 0 ? (
            <Empty />
          ) : (
            <>
              <Table size="small" columns={columns} dataSource={dataTable} />
              <button onClick={() => getData()}>获取数据</button>
            </>
          )}
        </div>
        {/**下载按钮 */}
      </div>
    </>
  );
};

export default App;
