/**
 * 设备详情 - 网卡
 * https://systeminformation.io/network.html
 */
import { Table } from "antd";
import { ComputerNet } from "@/type/index";
import { columnsTable } from "@/store/dataReplace";
import { judge_bool, removeEmpty } from "@/store/tool";
interface Props {
  data: ComputerNet[];
}
const App: React.FC<Props> = ({ data }) => {
  const formattedData = (item: ComputerNet) => {
    const arr = [
      { label: "接口名", value: item.ifaceName },
      { label: "默认接口", value: judge_bool(item.default) },
      { label: "速度", value: item.speed },
      { label: "类型", value: item.type },
      { label: "IPV4", value: item.ip4 },
      { label: "IPV4子网掩码", value: item.ip4subnet },
      { label: "IPV6", value: item.ip6 },
      { label: "IPV6子网掩码", value: item.ip6subnet },
      { label: "MAC地址", value: item.mac },
      { label: "内部接口", value: judge_bool(item.internal) },
      { label: "虚拟接口", value: judge_bool(item.virtual) },
      { label: "操作状态", value: item.operstate },
      { label: "双工", value: item.duplex },
      { label: "MTU最大传输单元", value: item.mtu },
      { label: "通过DHCP获取的地址", value: judge_bool(item.dhcp) },
      { label: "DNS后缀", value: item.dnsSuffix },
      { label: "IEEE 802.1x身份验证", value: item.ieee8021xAuth },
      { label: "IEEE 802.1x状态", value: item.ieee8021xState },
      { label: "运营商变更", value: item.carrierChanges },
    ];
    return removeEmpty(arr);
  };

  return (
    <>
      {data.map((item, index) => {
        return (
          <div key={index}>
            <p className="font-black my-2 text-xl">
              {data.length === 1 ? "网卡" : `网卡 - ${index + 1}`}
            </p>
            <Table
              dataSource={formattedData(item)}
              columns={columnsTable}
              size="small"
              pagination={{
                pageSize: 10,
                hideOnSinglePage: true,
              }}
            />
          </div>
        );
      })}
    </>
  );
};

export default App;
