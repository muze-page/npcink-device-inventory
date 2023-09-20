/**
 * 详情
 */
import { useState, useContext } from "react";
import type { DrawerProps } from "antd";
import { Drawer } from "antd";
import DataContext from "@/store/dataContext";
import DetailsList from "@/components/block/detailsList";
import Property from "@/components/page/details/property";
const App: React.FC = () => {
  //拿到数据
  const data = useContext(DataContext);
  console.log(data);
  const newArray = data.map((item:any) => {
    return { os: item.os.distro };
  });
  console.log(newArray);
  //整理，需要，设备类型，Apple 还是Windows，
  /**
   * 昵称
   * 系统的 system model
   * 芯片品牌 内存大小 硬盘大小
   * 备注名
   */

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
