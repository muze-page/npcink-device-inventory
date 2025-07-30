/**
 * 搜索组件
 */
import { useState, useEffect } from "react";
import { Input } from "antd";
import type { SearchProps } from "antd/es/input/Search";
//TODO:考虑去除此模块
//import Fuse from "fuse.js";
//准备搜索框
const { Search } = Input;
interface Props {
  value: string; //搜索的值
  onChange: (kw: string) => void; //修改搜索的值
}

const App: React.FC<Props> = ({ value, onChange }) => {
  //存储输入框中的值
  const [inputValue, setInputValue] = useState<string>(value);

  // 同步外部 value 变化
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  /**
   * 搜索框
   */

  // 配置 Fuse.js
  //const options = {
  // 定义要搜索的键
  //  keys: ["name", "number", "mac", "ip"], // MAC 是自己添加的
  //};

  // 创建 Fuse 实例
  //const fuse = new Fuse(data, options);

  /**
   * 处理搜索 MAC 地址的场景
   * 兼容大小写 + 容错空格
   * @param v 输入框的值
   * @returns 若搜索的值类似这样的da:b1:99:04:29:42，则处理成这样的：da-b1-99-04-29-42
   */
  const normalize = (v: string) =>
    v
      .trim()
      .toLowerCase()
      .replace(
        /^([0-9a-f]{2}):([0-9a-f]{2}):([0-9a-f]{2}):([0-9a-f]{2}):([0-9a-f]{2}):([0-9a-f]{2})$/i,
        "$1-$2-$3-$4-$5-$6"
      );

  //搜索
  const onSearch: SearchProps["onSearch"] = (value, _e, _info) => {
    //正则处理，处理 mac 地址格式，方便搜索
    let data = normalize(value);
    onChange(data); //搜索
    //console.log("搜索的值：" + data);
  };

  //同步输入框变化
  const handleChange: SearchProps["onChange"] = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
  };

  return (
    <Search
      placeholder="搜索名字、编号、IP地址或MAC地址"
      allowClear
      value={inputValue} // 使用本地状态
      onChange={handleChange} // 添加 onChange 处理
      onSearch={onSearch}
      style={{ width: 260, lineHeight: "inherit", minHeight: "10px" }}
      className="searchInput"
    />
  );
};

export default App;
