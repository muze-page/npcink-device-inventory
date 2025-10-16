/**
 * 设备详情 - CPU
 * https://systeminformation.io/cpu.html
 */
import { Table } from "antd";
import { ComputerCpu } from "@/type/index";
import { bytesToMB, judge_bool, removeEmpty } from "@/store/tool";
import { columnsTable } from "@/store/dataReplace";
interface Props {
  data: ComputerCpu;
}
const App: React.FC<Props> = ({ data }) => {
  // CPU信息的数组
  const Items = [
    { label: "制造者", value: data.manufacturer },
    { label: "品牌", value: data.brand },
    { label: "基准频率", value: data.speed + " GHz" },
    { label: "最低频率", value: data.speedMin + " GHz" },
    { label: "最大频率", value: data.speedMax + " GHz" },
    { label: "核心数", value: data.cores + " 个" },
    { label: "物理核心", value: data.physicalCores + " 个" },
    { label: "性能核心", value: data.performanceCores + " 个" },
    { label: "效率核心", value: data.efficiencyCores + " 个" },
    { label: "处理器数量", value: data.processors + " 个" },
    { label: "插槽类型", value: data.socket },
    { label: "供应商", value: data.vendor },
    { label: "电压", value: data.voltage },
    { label: "虚拟化", value: judge_bool(data.virtualization) },
    { label: "L1 数据", value: bytesToMB(data.cache.l1d, "MB") },
    { label: "L1 缓存", value: bytesToMB(data.cache.l1i, "MB") },
    { label: "L2 缓存", value: bytesToMB(data.cache.l2, "MB") },
    { label: "L3 缓存", value: bytesToMB(data.cache.l3, "MB") },
    { label: "调度器", value: data.governor },
    { label: "系列", value: data.family },
    { label: "型号", value: data.model },
    { label: "改进", value: data.stepping },
    { label: "校订", value: data.revision },
    { label: "处理器标志", value: data.flags },
  ];

  return (
    <>
      <Table
        dataSource={removeEmpty(Items)}
        columns={columnsTable}
        size="small"
        pagination={{
          pageSize: 10,
          hideOnSinglePage: true,
        }}
      />
    </>
  );
};

export default App;
