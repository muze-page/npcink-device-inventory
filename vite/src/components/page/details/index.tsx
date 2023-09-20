/**
 * 详情
 */
import { useState } from "react";
import type { DrawerProps } from "antd";
import { Drawer } from "antd";
import DetailsList from "@/components/block/detailsList";
import Property from "@/components/page/details/property";
const App: React.FC = () => {
  const rtElements = [];

  for (let i = 0; i < 6; i++) {
    rtElements.push(<DetailsList key={i} />);
  }

  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<DrawerProps["placement"]>("right");

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  return (
    <>
      <div
        className="mt-1 flex content-start items-center flex-wrap w-[728px]"
        onClick={showDrawer}
      >
        {/**开始循环 */}
        {rtElements}
      </div>

      <Drawer
        title="资产详细信息"
        placement={placement}
        closable={false}
        onClose={onClose}
        open={open}
        key={placement}
        width={"60%"}
      >
       
        <Property />
      </Drawer>
    </>
  );
};

export default App;
