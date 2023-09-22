/**
 * 设备详情 - 变更记录
 */
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";

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

const dataTable: DataType[] = [
  {
    key: "1",
    time: "2023-09-20 17:30:46",
    change: "网卡",
    old: "Realtek(R) PCI(e) Ethernet Controller;Realtek 8822CE Wireless LAN 802.11ac PCI-E NIC",
    new: "Realtek PCIe GbE Family Controller;Realtek 8822CE Wireless LAN 802.11ac PCI-E NIC",
  },
  {
    key: "2",
    time: "Jim Green",
    change: "42",
    old: "London No. 1 Lake Park",
    new: "loser",
  },
  {
    key: "3",
    time: "Joe Black",
    change: "32",
    old: "Sydney No. 1 Lake Park",
    new: "cool",
  },
];

interface Props {
  data: any;
}
const App: React.FC<Props> = ({ data }) => {
  console.log(data);
  //准备变化后的数组
  const dataNew = data.dataNew;
  const dataOld = data.dataOld;

  function findDifferentKeys(dataOld, dataNew) {
    const result = [];

    if (isNull(dataOld) || typeof dataOld !== "object") {
      // 如果 dataOld 为空或不是对象，则返回 dataNew 中的所有键值对
      Object.keys(dataNew).forEach((key) => {
        result.push({
          type: key,
          old: undefined,
          new: dataNew[key],
        });
      });

      return result;
    }

    const keys1 = isNull(dataOld) ? [] : Object.keys(dataOld);
    const keys2 = isNull(dataNew) ? [] : Object.keys(dataNew);

    const keys = [...new Set([...keys1, ...keys2])];

    keys.forEach((key) => {
      if (!isNull(dataOld[key]) && !isNull(dataNew[key])) {
        if (!deepEqual(dataOld[key], dataNew[key])) {
          result.push({
            type: key,
            old: dataOld[key],
            new: dataNew[key],
          });
        }
      }
    });

    return result;
  }

  // 检查是否为 null、undefined、空字符串的函数
  function isNull(value) {
    return value === null || typeof value === "undefined" || value === "";
  }

  // 深度比较两个值是否相等的函数
  function deepEqual(value1, value2) {
    if (Array.isArray(value1) && Array.isArray(value2)) {
      if (value1.length !== value2.length) {
        return false;
      }

      for (let i = 0; i < value1.length; i++) {
        if (!deepEqual(value1[i], value2[i])) {
          return false;
        }
      }

      return true;
    }

    if (typeof value1 === "object" && typeof value2 === "object") {
      const keys1 = Object.keys(value1);
      const keys2 = Object.keys(value2);

      if (keys1.length !== keys2.length) {
        return false;
      }

      for (const key of keys1) {
        if (!isNull(value1[key]) && !isNull(value2[key])) {
          if (!deepEqual(value1[key], value2[key])) {
            return false;
          }
        }
      }

      return true;
    }

    return value1 === value2;
  }

  const differences = findDifferentKeys(dataOld, dataNew);
  console.log(differences);

  return (
    <>
      <div className="pl-5 relative">
        {/**列表 */}
        <div className="mt-1">
          <p className="mb-4 text-base font-bold text-[#333]">硬件信息变更</p>
          <Table size="small" columns={columns} dataSource={dataTable} />
        </div>
        {/**下载按钮 */}
      </div>
    </>
  );
};

export default App;
