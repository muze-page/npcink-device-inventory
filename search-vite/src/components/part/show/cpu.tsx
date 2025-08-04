/**
 * 设备详情 - CPU
 * https://systeminformation.io/cpu.html
 */
import { Table } from "antd";
import { ComputerCpu } from "@/store/interface";
import { bytesToMB, judge_bool, removeEmpty } from "@/store/tool";
import { columnsTable } from "@/store/dataReplace";
interface Props {
  data: ComputerCpu;
}
const App: React.FC<Props> = ({ data }) => {
  // CPU信息的数组
  const Items = [
    { key: "1", label: "制造者", value: data.manufacturer },
    { key: "2", label: "品牌", value: data.brand },
    { key: "3", label: "基准频率", value: data.speed + " GHz" },
    { key: "4", label: "最低频率", value: data.speedMin + " GHz" },
    { key: "5", label: "最大频率", value: data.speedMax + " GHz" },
    { key: "7", label: "核心数", value: data.cores + " 个" },
    { key: "8", label: "物理核心", value: data.physicalCores + " 个" },
    { key: "9", label: "性能核心", value: data.performanceCores + " 个" },
    { key: "10", label: "效率核心", value: data.efficiencyCores + " 个" },
    { key: "11", label: "处理器数量", value: data.processors + " 个" },
    { key: "12", label: "插槽类型", value: data.socket },
    { key: "13", label: "供应商", value: data.vendor },
    { key: "18", label: "电压", value: data.voltage },
    { key: "20", label: "虚拟化", value: judge_bool(data.virtualization) },
    { key: "21", label: "L1 数据", value: bytesToMB(data.cache.l1d, "MB") },
    { key: "22", label: "L1 缓存", value: bytesToMB(data.cache.l1i, "MB") },
    { key: "23", label: "L2 缓存", value: bytesToMB(data.cache.l2, "MB") },
    { key: "24", label: "L3 缓存", value: bytesToMB(data.cache.l3, "MB") },
    { key: "6", label: "调度器", value: data.governor },

    { key: "14", label: "系列", value: data.family },
    { key: "15", label: "型号", value: data.model },
    { key: "16", label: "改进", value: data.stepping },
    { key: "17", label: "校订", value: data.revision },
    { key: "19", label: "处理器标志", value: data.flags },
  ];

  return (
    <>
      <Table
        dataSource={removeEmpty(Items)}
        columns={columnsTable}
        size="small"
      />
    </>
  );
};

export default App;
