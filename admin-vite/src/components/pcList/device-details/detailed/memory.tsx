/**
 * 设备详情 - 内存
 * https://systeminformation.io/memory.html
 */
import { Table } from "antd";
import { ComputerRam } from "@/type/index";
import { columnsTable } from "@/store/dataReplace";
import { bytesToMB, judge_bool, removeEmpty } from "@/store/tool";
interface Props {
  data: ComputerRam[];
}
const App: React.FC<Props> = ({ data }) => {
  const formattedData = (item: ComputerRam) => {
    const arr = [
      { label: "大小", value: bytesToMB(item.size, "GB") },
      { label: "内存库", value: item.bank },
      { label: "内存类型", value: item.type },
      { label: "ECC 内存", value: judge_bool(item.ecc) },
      { label: "时钟速度", value: item.clockSpeed + " GHz" },
      { label: "外形尺寸", value: item.formFactor },
      { label: "制造者", value: item.manufacturer },
      { label: "部件号", value: item.partNum },
      { label: "序号", value: item.serialNum },
      { label: "配置电压", value: item.voltageConfigured + " V" },
      { label: "最小电压", value: item.voltageMin },
      { label: "最大电压", value: item.voltageMax },
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
