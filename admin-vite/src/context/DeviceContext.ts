import { createContext } from "react";
import { MysqlDeviceChangeMeat, DataItemArr } from "@/type/index";

interface AppContextType {
  //当前选中的设备的值和修改方法
  //listData: MysqlDeviceChangeMeat[]; //列表数据
  setListData: React.Dispatch<React.SetStateAction<MysqlDeviceChangeMeat[]>>; //设置列表数据
  drawerData: MysqlDeviceChangeMeat; //弹窗数据
  setDrawerData: React.Dispatch<React.SetStateAction<MysqlDeviceChangeMeat>>; //弹窗数据修改方法
  isName: boolean; //是否显示姓名
  setActive: React.Dispatch<React.SetStateAction<boolean>>; //设置弹窗状态
  deviceCategoryOption: DataItemArr[]; //设备类别
}

export const DevieContext = createContext<AppContextType>({
  //listData: [],
  setListData: () => {},
  drawerData: {} as MysqlDeviceChangeMeat,
  setDrawerData: () => {},
  isName: true,
  setActive: () => {},
  deviceCategoryOption: [],
});
