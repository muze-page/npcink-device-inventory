/**
 * 设备详情 - 详细信息
 */

/**
 * 设备详情 - 设备详细信息，TODO:电池信息
 */

import { Empty } from "antd";
import { Computer } from "@/type/index";
import { AssetDetails } from "@/pages/pcList/deviceDetails/assetDetail";

interface Props {
  data?: Computer;
  loading?: boolean;
}
const App: React.FC<Props> = ({ data, loading }) => {
  if (loading) return <Empty description="设备详情加载中" />;
  if (!(data as any)?.asset) {
    return <Empty description="这条设备数据尚未迁移到 v2 结构" />;
  }
  return <AssetDetails data={data} />;
};

export default App;
