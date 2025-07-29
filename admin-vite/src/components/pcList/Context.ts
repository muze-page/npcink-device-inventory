import { createContext } from "react";
import { DeviceSeting, MysqlDeviceChangeMeat } from "@/store/interface";

interface AppContextType {
  //当前选中的设备的值和修改方法
  //listData: MysqlDeviceChangeMeat[]; //列表数据
  setListData: React.Dispatch<React.SetStateAction<MysqlDeviceChangeMeat[]>>; //设置列表数据
  drawerData: MysqlDeviceChangeMeat; //弹窗数据
  setDrawerData: React.Dispatch<React.SetStateAction<MysqlDeviceChangeMeat>>; //弹窗数据修改方法

  deltArrData: () => void; //删除数据
  isName: boolean; //是否显示姓名
  toggleStyle: () => void; //隐藏姓名
}

export const AppContext = createContext<AppContextType>({
  //listData: [],
  setListData: () => {},
  drawerData: {} as MysqlDeviceChangeMeat,
  setDrawerData: () => {},

  deltArrData: () => {},
  isName: true,
  toggleStyle: () => {},
});

//硬件变更的设置与硬件变更头部的数据进行沟通

interface AppContextDevice {
  realData: DeviceSeting;
  changeReal: (key: string, value: string) => void;
}
export const DeviceContext = createContext<AppContextDevice>({
  realData: {
    name: "0", //姓名
    number: "0", //编号
    state: "0", //状态
    department: "0", //部门
  },
  changeReal: () => {},
});
