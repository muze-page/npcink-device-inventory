//搜索时没有数据时的提示内容
import { Empty } from "antd";
const App: React.FC = () => {
  return (
    <Empty
      className="mt-10"
      description={
        <span>
          未筛选或搜索到数据
          <br />
          请更换筛选条件或搜索内容试试
        </span>
      }
    />
  );
};
export default App;
