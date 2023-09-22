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
  const b = data.dataNew;
  const a = data.dataOld;

  const changes: { type: string; old: any; new: any }[] = [];
  if (a && a.length > 0) {
    // 进行比较操作
    a.forEach(itemA => {
      const itemB = b.find(itemB => itemB.id === itemA.id);
  
      Object.keys(itemA).forEach(key => {
        const valueA = itemA[key];
        const valueB = itemB ? itemB[key] : undefined;
  
        if (typeof valueA === 'object' && typeof valueB === 'object') {
          compareObjects(valueA, valueB, changes, key);
        } else if (valueA !== valueB) {
          changes.push({ type: key, old: valueA, new: valueB });
        }
      });
    });
  
    b.forEach(itemB => {
      const itemA = a.find(itemA => itemA.id === itemB.id);
  
      if (!itemA) {
        changes.push({ type: 'add', object: itemB });
      }
    });
  }
  
  console.log(changes);
  
  function compareObjects(objA, objB, changes, key) {
    if (Array.isArray(objA)) {
      objA.forEach((valueA, index) => {
        const valueB = objB[index];
  
        if (typeof valueA === 'object' && typeof valueB === 'object') {
          compareObjects(valueA, valueB, changes, `${key}[${index}]`);
        } else if (valueA !== valueB) {
          changes.push({
            type: `${key}[${index}]`,
            old: valueA,
            new: valueB
          });
        }
      });
    } else {
      Object.keys(objA).forEach(innerKey => {
        const valueA = objA[innerKey];
        const valueB = objB ? objB[innerKey] : undefined;
        const newKey = `${key}.${innerKey}`;
  
        if (typeof valueA === 'object' && typeof valueB === 'object') {
          compareObjects(valueA, valueB, changes, newKey);
        } else if (valueA !== valueB) {
          changes.push({ type: newKey, old: valueA, new: valueB });
        }
      });
    }
  }
 

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
