import { createContext } from "react";
// 创建一个 Context 对象，用于存储 handleTypeUpdate 函数
interface AppContextType {
  //修改当前选中设备的状态
  handleTypeUpdate?: (newType: string) => void; //修改状态
  deltArrData?: () => void; //删除数据
}

export const AppContext = createContext<AppContextType>({});
