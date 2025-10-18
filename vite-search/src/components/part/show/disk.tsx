/**
 * 设备详情 - 硬盘
 */
import { Table } from "antd";
import { ComputerDevice } from "@/type/index";
import { columnsTable } from "@/utils/replace";
import { formatBytes, removeEmpty } from "@/utils/tool";
interface Props {
  data: ComputerDevice[];
}
const App: React.FC<Props> = ({ data }) => {
  const formattedData = (item: ComputerDevice) => {
    const arr = [
      { label: "设备", value: item.device },
      { label: "类型", value: item.type },
      { label: "接口类型", value: item.interfaceType },
      { label: "名称", value: item.name },
      { label: "容量", value: formatBytes(item.size) },
      { label: "总柱面数", value: item.totalCylinders },
      { label: "磁头总数", value: item.totalHeads },
      { label: "总磁道数", value: item.totalTracks },
      { label: "总扇区数", value: item.totalSectors },
      { label: "每柱面磁道数", value: item.tracksPerCylinder },
      { label: "每磁道扇区数", value: item.sectorsPerTrack },
      { label: "每扇区字节数", value: item.bytesPerSector },
      { label: "固件修订版本", value: item.firmwareRevision },
      { label: "序列号", value: item.serialNum },
      { label: "供应商", value: item.vendor },
      { label: "智能状态", value: item.smartStatus },
      { label: "温度", value: item.temperature },
      { label: "智能数据", value: item.smartData },
    ];
    return removeEmpty(arr);
  };

  return (
    <>
      {data.map((item, index) => {
        return (
          <div key={index}>
            <p className="font-black my-2 text-xl">
              {data.length === 1 ? "硬盘" : `硬盘 - ${index + 1}`}
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
