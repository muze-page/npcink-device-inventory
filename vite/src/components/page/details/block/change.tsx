/**
 * 设备详情 - 变更记录
 */
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import {findDifferentKeys} from "@/store/tool"

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

  //进行处理
  const differences = findDifferentKeys(dataOld, dataNew);

  

  addUniqueIdAndTime(differences);
  console.log(differences);

  /**
   * 临时用
   */
  function addUniqueIdAndTime(array) {
    array.forEach((obj, index) => {
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
  
    const randomTimestamp = Math.floor(Math.random() * (endDate - startDate) + startDate.getTime());
    const randomDate = new Date(randomTimestamp);
  
    const year = randomDate.getFullYear();
    const month = String(randomDate.getMonth() + 1).padStart(2, '0');
    const day = String(randomDate.getDate()).padStart(2, '0');
  
    return `${year}-${month}-${day}`;
  }


  return (
    <>
      <div className="pl-5 relative">
        {/**列表 */}
        <div className="mt-1">
          <p className="mb-4 text-base font-bold text-[#333]">硬件信息变更</p>
          <Table size="small" columns={columns} dataSource={differences} />
        </div>
        {/**下载按钮 */}
      </div>
    </>
  );
};

export default App;
