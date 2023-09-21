/**
 * 弹窗
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
  };

  return (
    <>
      <Drawer
        title="资产详细信息"
        placement={"right"}
        closable={false}
        onClose={onClose}
        open={state.drawer}
        key={"right"}
        width={"60%"}
      >
       
        <Property data={state.data}/>
      </Drawer>
    </>
  );
};

export default App;
