import { useState } from "react";
import { fetchData } from "./axios";
const App: React.FC = () => {
  const [inputValue, setInputValue] = useState(""); //输入框的值
  const [responseData, setResponseData] = useState(null); //响应数据

  // 处理输入框内容变化
  const handleChange = (event: any) => {
    setInputValue(event.target.value);
  };

  // 处理按钮点击
  const handleClick =async () => {
    console.log(inputValue);
    const data =await fetchData(inputValue, "9527");
    setResponseData(data);
  };
  return (
    <>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="请输入要查询的编号或名字"
      />
      <button onClick={handleClick}>打印值</button>
      <hr />
      <pre>{JSON.stringify(responseData, null, 2)}</pre>
    </>
  );
};
export default App;
