import { useState } from "react";
import { fetchData } from "./axios";
import Detailed from "@/components/part/device-details/detailed";
import { MysqlDevice, Computer } from "@/store/interface";
import ShowUser from "@/showUser"
const App: React.FC = () => {
  const [inputValue, setInputValue] = useState(""); //输入框的值
  const [responseData, setResponseData] = useState<MysqlDevice>(); //响应数据
  const [showData, setShowData] = useState<Computer>(); //展示数据

  // 处理输入框内容变化
  const handleChange = (event: any) => {
    setInputValue(event.target.value);
  };

  // 处理按钮点击
  const handleClick = async () => {
    console.log(inputValue);
    const data = await fetchData(inputValue, "9527");
    
    
    /**
     * 渲染用数据
     *  将数组中的硬件数据从json格式处理成对象
     */
    const showData = JSON.parse(data.data);
    console.log(data);
    console.log(showData);
    setResponseData(data);//存储响应数据
    setShowData(showData);//存储渲染用数据
    
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
      {responseData && <ShowUser data={responseData} />}
      {responseData && <Detailed data={showData!} />}
    </>
  );
};
export default App;
