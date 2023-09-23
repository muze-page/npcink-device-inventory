import "./App.css";
import Index from "@/components/page/index";
import { ConfigProvider,Empty } from "antd";

import zhCN from 'antd/locale/zh_CN';

import { useContext } from "react";
import DataContext from "@/store/dataContext";
function App() {
   //拿到数据
   const data = useContext(DataContext);
  return (
    <>
   
    <ConfigProvider locale={zhCN}>
    {data.length ===0?( <Empty />):( <Index />)}
      </ConfigProvider>
    </>
  );
}

export default App;
