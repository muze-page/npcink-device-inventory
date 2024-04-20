/**
 * 搜索组件
 */
import { Input } from "antd";
import type { SearchProps } from "antd/es/input/Search";
import Fuse from "fuse.js";
import { MysqlDeviceChangeMeat } from "@/store/interface";
//准备搜索框
const { Search } = Input;
interface Props {
  data: MysqlDeviceChangeMeat[]; //筛选用数据
  onSet: Function; //传递筛选后的数据
}

const App: React.FC<Props> = ({ data, onSet }) => {
  /**
   * 搜索框
   */

  // 配置 Fuse.js
  const options = {
    // 定义要搜索的键
    keys: ["name", "number","mac"], // MAC 是自己添加的
  };

  // 创建 Fuse 实例
  const fuse = new Fuse(data, options);

  const onSearch: SearchProps["onSearch"] = (value, _e, _info) => {
    const results = fuse.search(value);
    const data = results.map((result) => result.item);
    onSet(data);
    //console.log(data);
    //console.log(info?.source, value);
  };

  return (
    <Search
      placeholder="搜索名字、编号或MAC地址"
      allowClear
      onSearch={onSearch}
      style={{ width: 260, lineHeight: "inherit", minHeight: "10px" }}
      className="searchInput"
    />
  );
};

export default App;
