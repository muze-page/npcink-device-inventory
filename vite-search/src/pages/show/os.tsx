/**
 * 设备详情 - OS
 * https://systeminformation.io/os.html
 */
import { Table } from "antd";
import { ComputerOS } from "@/type/index";
import { judge_bool, removeEmpty } from "@/utils/tool";
import { columnsTable } from "@/utils/replace";
interface Props {
  data: ComputerOS;
}
const App: React.FC<Props> = ({ data }) => {
  const Items = [
    { label: "平台", value: data.platform },
    { label: "发行版", value: data.distro },
    { label: "版本号", value: data.release },
    { label: "代号", value: data.codename },
    { label: "内核", value: data.kernel },
    { label: "架构", value: data.arch },
    { label: "主机名", value: data.hostname },
    { label: "完全限定域名", value: data.fqdn },
    { label: "操作系统内部版本", value: data.codepage },
    { label: "徽标文件", value: data.logofile },
    { label: "系统内部版本", value: data.build },
    { label: "服务包版本", value: data.servicepack },
    { label: "UEFI启动", value: judge_bool(data.uefi) },
    { label: "系统序列号", value: data.serial },
    { label: "Hyper-V", value: data.hypervizor },
    { label: "远程会话", value: data.remoteSession },
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
