/**
 * 设备详情 - 网卡
 * https://systeminformation.io/network.html
 */
import { Table } from "antd";
import { ComputerNet } from "@/store/interface";
import { columnsTable } from "@/store/dataReplace";
import { judge_bool } from "@/store/tool";
interface Props {
  data: ComputerNet[];
}
const App: React.FC<Props> = ({ data }) => {
  console.log("网口");
  console.log(data);
  const formattedData = (item: ComputerNet) => {
    const arr = [
      { key: "1", label: "接口名", value: item.ifaceName },
      { key: "2", label: "默认接口", value: judge_bool(item.default) },
      { key: "3", label: "IPV4", value: item.ip4 },
      { key: "4", label: "IPV4子网掩码", value: item.ip4subnet },
      { key: "5", label: "IPV6", value: item.ip6 },
      { key: "6", label: "IPV6子网掩码", value: item.ip6subnet },
      { key: "7", label: "MAC地址", value: item.mac },
      { key: "8", label: "内部接口", value: judge_bool(item.internal) },
      { key: "9", label: "虚拟接口", value: judge_bool(item.virtual) },
      { key: "10", label: "操作状态", value: judge_bool(item.operstate) },
      { key: "11", label: "类型", value: item.type },
      { key: "12", label: "双工", value: item.duplex },
      { key: "13", label: "MTU最大传输单元", value: item.mtu },
      { key: "14", label: "速度", value: item.speed },
      { key: "15", label: "通过DHCP获取的地址", value: judge_bool(item.dhcp) },
      { key: "16", label: "DNS后缀", value: item.dnsSuffix },
      { key: "17", label: "IEEE 802.1x身份验证", value: item.ieee8021xAuth },
      { key: "18", label: "IEEE 802.1x状态", value: item.ieee8021xState },
      { key: "19", label: "运营商变更", value: item.carrierChanges },
    ];
    return arr;
  };

  return (
    <>
      {data.map((item, index) => {
        return (
         
            <div key={index}>
              <p className="font-black my-2 text-xl">网卡 - {index + 1}</p>
              <Table dataSource={formattedData(item)} columns={columnsTable} />
            </div>
          
        );
      })}
    </>
  );
};

export default App;
