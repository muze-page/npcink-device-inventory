/**
 * 设备详情 - 硬盘
 */
import { Table } from "antd";
import { ComputerDevice } from "@/store/interface";
import { columnsTable } from "@/store/dataReplace";
import { bytesToMB, removeEmpty } from "@/store/tool";
interface Props {
  data: ComputerDevice[];
}
const App: React.FC<Props> = ({ data }) => {

  const formattedData = (item: ComputerDevice) => {
    const arr = [
      { key: "1", label: "设备", value: item.device },
      { key: "2", label: "类型", value: item.type },
      { key: "3", label: "接口类型", value: item.interfaceType },
      { key: "4", label: "名称", value: item.name },
      { key: "5", label: "容量", value: bytesToMB(item.size, "GB") },
      { key: "6", label: "总气缸数", value: item.totalCylinders },
      { key: "7", label: "总头数", value: item.totalHeads },
      { key: "8", label: "总曲目数", value: item.totalTracks },
      { key: "9", label: "总扇区", value: item.totalSectors },
      { key: "10", label: "每缸轨道数", value: item.tracksPerCylinder },
      { key: "11", label: "每轨扇区数", value: item.sectorsPerTrack },
      { key: "12", label: "每个扇区字节数", value: item.bytesPerSector },
      { key: "13", label: "固件修订版本", value: item.firmwareRevision },
      { key: "14", label: "序列号", value: item.serialNum },
      { key: "15", label: "供应商", value: item.vendor },
      { key: "16", label: "智能状态", value: item.smartStatus },
      { key: "17", label: "温度", value: item.temperature },
      { key: "18", label: "智能数据", value: item.smartData },
    ];
    return removeEmpty(arr);
  };

  return (
    <>
      {data.map((item, index) => {
        return (
          
            <div key={index}>
              <p className="font-black my-2 text-xl"> {data.length === 1 ? "硬盘" : `硬盘 - ${index + 1}`}</p>
              <Table dataSource={formattedData(item)} columns={columnsTable} />
            </div>
          
        );
      })}
    </>
  );
};

export default App;
