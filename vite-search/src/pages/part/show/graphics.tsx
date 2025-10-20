/**
 * 设备详情 - 显卡
 * https://systeminformation.io/graphics.html
 */
import { Table } from "antd";
import { ComputerControllers } from "@/type/index";
import { columnsTable } from "@/utils/replace";
import { judge_bool, removeEmpty, formatMB } from "@/utils/tool";
interface Props {
  data: ComputerControllers[];
}
const App: React.FC<Props> = ({ data }) => {
  const formattedData = (item: ComputerControllers) => {
    const arr = [
      { label: "型号", value: item.model },
      {
        label: "显存",
        value: item.vram ? formatMB(item.vram) : "",
      },
      { label: "显卡ID", value: item.subDeviceId },
      { label: "供应商", value: item.vendor },
      { label: "总线", value: item.bus },
      { label: "动态分配", value: judge_bool(item.vramDynamic) },
      { label: "GPU内核", value: item.cores },
      { label: "设备标识", value: item.deviceId },
      { label: "外部GPU", value: judge_bool(item.external) },
      { label: "API Metal 版本", value: item.metalVersion },
      { label: "供应商编号", value: item.vendorId },
    ];
    return removeEmpty(arr);
  };

  return (
    <>
      {data.map((item, index) => {
        return (
          <div key={index}>
            <p className="font-black my-2 text-xl">
              {data.length === 1 ? "显卡" : `显卡 - ${index + 1}`}
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
