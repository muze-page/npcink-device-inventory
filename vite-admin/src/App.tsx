import Index from "@/pages/index";
import { ConfigProvider } from "antd";
import "./App.css";
import zhCN from "antd/locale/zh_CN";
import "dayjs/locale/zh-cn";
import { message } from "antd";
message.config({
  top: 50,
  duration: 2,
  maxCount: 3,
  prefixCls: "my-message",
});

const App = () => {
  return (
    <>
      <ConfigProvider locale={zhCN}>
        <Index />
      </ConfigProvider>
    </>
  );
};

export default App;
