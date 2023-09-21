/**
 * 设备详情 - 弹窗
 */
import { useContext } from "react";
import { StateContext } from "@/store/dataContext";

import { Drawer } from "antd";
import Property from "@/components/page/details/property";
const App: React.FC = () => {
  //拿到状态数据
  const { state, updateState } = useContext(StateContext);

  //弹窗状态

  //关闭
  const onClose = () => {
    updateState("drawer", false); //打开弹窗
    console.log("触发关闭");
    console.log(state);
  };

  return (
    <>
      <h2> {state.drawer ? "有值" : "无值"}</h2>
      <h2> {state.id}</h2>
      <Drawer
        title="资产详细信息"
        placement={"right"}
        closable={false}
        onClose={onClose}
        open={state.drawer}
        key={"right"}
        width={"60%"}
      >
        666
        {state.drawer ? "有值" : "无值"}
        <Property />
      </Drawer>
    </>
  );
};

export default App;
