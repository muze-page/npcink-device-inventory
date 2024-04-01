import "./App.css";
import Index from "@/components/index";
import { ConfigProvider } from "antd";

import zhCN from "antd/locale/zh_CN";

function App() {
  return (
    <>
      <ConfigProvider locale={zhCN}>
        <Index />
      </ConfigProvider>
    </>
  );
}

export default App;
