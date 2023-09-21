/**
 * 设备详情 - 弹窗
 */
import { useState, useContext } from "react";
import { StateData } from "@/store/dataContext";

import { Drawer } from "antd";
import type { DrawerProps } from "antd";
import Property from "@/components/page/details/property";
const App: React.FC = () => {
  //拿到状态数据
  const state = useContext(StateData);

  //弹窗状态
  const [open, setOpen] = useState(true);
  const [placement, setPlacement] = useState<DrawerProps["placement"]>("right");

  //开启
  const showDrawer = () => {
    setOpen(state.drawer);
    console.log("触发开启");
  };

  //关闭
  const onClose = () => {
    setOpen(false);
    state.drawer = false;
    console.log("触发关闭");
    console.log(state);
  };

  return (
    <>
      <h2> {state.drawer ? "有值" : "无值"}</h2>
      <Drawer
        title="资产详细信息"
        placement={placement}
        closable={false}
        onClose={onClose}
        open={state.drawer}
        key={placement}
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
