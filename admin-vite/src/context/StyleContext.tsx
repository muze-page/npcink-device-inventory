// 传递方法和参数
import { createContext } from "react";
import { StyleDevice } from "@/type/index";
interface StyleContextType {
  // 根据实际上下文内容定义类型，示例：
  drawerData: StyleDevice; //当前选中弹窗的数据,同步选中数据
  setDrawerData: (data: StyleDevice) => void; //弹窗数据修改
  handleAddDevice: (device: StyleDevice) => void; //添加自定义设备
  handleDeleteData: (uuid: string) => void; //删除指定UUID的自定义设备
  handleUpdateData: (uuid: string, device: StyleDevice) => void; //修改自定义设备数据
  isName: boolean; //是否隐藏隐私
}
export const StyleContext = createContext<StyleContextType>({
  drawerData: {} as StyleDevice, //默认空对象
  setDrawerData: () => {}, //默认空函数
  handleAddDevice: () => {},
  handleDeleteData: () => {},
  handleUpdateData: () => {}, //默认空函数
  isName: false,
});
