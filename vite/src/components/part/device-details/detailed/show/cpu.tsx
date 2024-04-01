/**
 * 设备详情 - CPU
 * https://systeminformation.io/cpu.html
 */
import { Table } from "antd";
import { ComputerCpu } from "@/store/interface";
import { bytesToMB, judge_bool } from "@/store/tool";
import { columnsTable } from "@/store/dataReplace";
interface Props {
  data: ComputerCpu;
}
const App: React.FC<Props> = ({ data }) => {

  // CPU信息的数组
  const Items = [
    { key: "1", label: "制造者", value: data.manufacturer },
    { key: "2", label: "品牌", value: data.brand },
    { key: "3", label: "速度", value: data.speed },
    { key: "4", label: "速度最小值", value: data.speedMin },
    { key: "5", label: "速度最大值", value: data.speedMax },
    { key: "6", label: "总督", value: data.governor },
    { key: "7", label: "核心", value: data.cores },
    { key: "8", label: "物理核心", value: data.physicalCores },
    { key: "9", label: "性能核心", value: data.performanceCores },
    { key: "10", label: "效率核心", value: data.efficiencyCores },
    { key: "11", label: "处理器", value: data.processors },
    { key: "12", label: "插座类型", value: data.socket },
    { key: "13", label: "供应商", value: data.vendor },
    { key: "14", label: "系列", value: data.family },
    { key: "15", label: "型号", value: data.model },
    { key: "16", label: "步进", value: data.stepping },
    { key: "17", label: "校订", value: data.revision },
    { key: "18", label: "电压", value: data.voltage },
    { key: "19", label: "处理器标志", value: data.flags },
    { key: "20", label: "虚拟化", value: judge_bool(data.virtualization) },
    { key: "21", label: "L1数据", value: bytesToMB(data.cache.l1d, "MB") },
    { key: "22", label: "L1指令", value: bytesToMB(data.cache.l1i, "MB") },
    { key: "23", label: "L2缓存", value: bytesToMB(data.cache.l2, "MB") },
    { key: "24", label: "L3缓存", value: bytesToMB(data.cache.l3, "MB") },
  ];

  return (
    <>
      <Table dataSource={Items} columns={columnsTable} />
    </>
  );
};

export default App;
