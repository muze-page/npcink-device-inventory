import "./App.css";
import Index from "@/components/index";
import { ConfigProvider } from "antd";

import zhCN from "antd/locale/zh_CN";
import { message } from "antd";
message.config({
  top: 50,
  duration: 2,
  maxCount: 3,
  rtl: true,
  prefixCls: "my-message",
});

const App=()=> {
  return (
    <>
      <ConfigProvider locale={zhCN}>
        <Index />
      </ConfigProvider>
    </>
  );
}

export default App;
