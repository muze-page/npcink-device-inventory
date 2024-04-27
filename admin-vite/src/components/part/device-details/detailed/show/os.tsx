/**
 * 设备详情 - OS
 * https://systeminformation.io/os.html
 */
import { Table } from "antd";
import { ComputerOS } from "@/store/interface";
import { judge_bool, removeEmpty } from "@/store/tool";
import { columnsTable } from "@/store/dataReplace";
interface Props {
  data: ComputerOS;
}
const App: React.FC<Props> = ({ data }) => {
  const Items = [
    { key: "1", label: "平台", value: data.platform },
    { key: "2", label: "发行版", value: data.distro },
    { key: "3", label: "版本号", value: data.release },
    { key: "4", label: "代号", value: data.codename },
    { key: "5", label: "内核", value: data.kernel },
    { key: "6", label: "架构", value: data.arch },
    { key: "7", label: "主机名", value: data.hostname },
    { key: "8", label: "完全限定域名", value: data.fqdn },
    { key: "9", label: "操作系统内部版本", value: data.codepage },
    { key: "10", label: "徽标文件", value: data.logofile },
    { key: "11", label: "系统内部版本", value: data.build },
    { key: "12", label: "服务包版本", value: data.servicepack },
    { key: "13", label: "UEFI启动", value: judge_bool(data.uefi) },
    { key: "14", label: "系统序列号", value: data.serial },
    { key: "15", label: "Hyper-V", value: data.hypervizor },
    { key: "16", label: "远程会话", value: data.remoteSession },
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
