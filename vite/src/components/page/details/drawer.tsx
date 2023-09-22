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
    updateState("drawer", false); //关闭弹窗
  };

  return (
    <>
     
        <Drawer
          title="资产详细信息"
          placement={"right"}
          onClose={onClose}
          open={state.drawer}
          width={"60%"}
          className="pt-9"
        >
          <Property data={state.data} />
        </Drawer>
     
    </>
  );
};

export default App;
