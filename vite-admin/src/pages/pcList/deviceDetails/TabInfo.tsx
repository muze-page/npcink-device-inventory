import { Computer } from "@/type/index";
import { AssetOverview } from "@/pages/pcList/deviceDetails/assetDetail";
import { Empty } from "antd";
import { Dayjs } from "dayjs";
interface Props {
  data?: Computer;
  time: Dayjs;
  loading?: boolean;
}
const App: React.FC<Props> = ({ data, time, loading }) => {
  if (loading) return <Empty description="设备详情加载中" />;
  if (!(data as any)?.asset) {
    return <Empty description="这条设备数据尚未迁移到 v2 结构" />;
  }
  return <AssetOverview data={data} time={time} />;
};

export default App;
