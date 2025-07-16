/**
 * 自定义设备弹窗中的数据展示
 */
import { StyleDevice } from "@/store/interface";
interface Props {
  data: StyleDevice;//弹出的自定义设备数据
}
const App: React.FC<Props> = ({ data }) => {
  return <>数据展示ss{data.name}
  {JSON.stringify(data, null, 2)}
  </>;
};

export default App;
