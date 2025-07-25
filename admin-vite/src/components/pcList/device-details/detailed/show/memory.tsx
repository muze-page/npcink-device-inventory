/**
 * 设备详情 - 内存
 * https://systeminformation.io/memory.html
 */
import { Table } from "antd";
import { ComputerRam } from "@/store/interface";
import { columnsTable } from "@/store/dataReplace";
import { bytesToMB, judge_bool, removeEmpty } from "@/store/tool";
interface Props {
  data: ComputerRam[];
}
const App: React.FC<Props> = ({ data }) => {
  const formattedData = (item: ComputerRam) => {
    const arr = [
      { key: "1", label: "大小", value: bytesToMB(item.size, "GB") },
      { key: "2", label: "内存库", value: item.bank },
      { key: "3", label: "内存类型", value: item.type },
      { key: "4", label: "ECC 内存", value: judge_bool(item.ecc) },
      { key: "5", label: "时钟速度", value: item.clockSpeed +' GHz'},
      { key: "6", label: "外形尺寸", value: item.formFactor },
      { key: "7", label: "制造者", value: item.manufacturer },
      { key: "8", label: "部件号", value: item.partNum },
      { key: "9", label: "序号", value: item.serialNum },
      { key: "10", label: "配置电压", value: item.voltageConfigured +" V"},
      { key: "11", label: "最小电压", value: item.voltageMin },
      { key: "12", label: "最大电压", value: item.voltageMax },
    ];
    return removeEmpty(arr);
  };

  return (
    <>
      {data.map((item, index) => {
        return (
          <div key={index}>
            <p className="font-black my-2 text-xl">
              {data.length === 1 ? "内存" : `内存 - ${index + 1}`}
            </p>
            <Table
              dataSource={formattedData(item)}
              columns={columnsTable}
              size="small"
            />
          </div>
        );
      })}
    </>
  );
};

export default App;
