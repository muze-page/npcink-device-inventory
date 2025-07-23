// 传递方法和参数
import { createContext } from "react";
import { StyleDevice } from "@/store/interface";
interface StyleContextType {
  // 根据实际上下文内容定义类型，示例：
  setDrawerData: (data: StyleDevice) => void; //设置弹窗数据
  handleAddDevice: (device: StyleDevice) => void; //添加自定义设备
  handleDeleteData: (uuid: string) => void; //删除指定UUID的自定义设备
  handleUpdateData: (uuid: string, device: StyleDevice) => void; //修改自定义设备数据
}
export const StyleContext = createContext<StyleContextType>({
  setDrawerData: () => {}, //默认空函数
  handleAddDevice: () => {},
  handleDeleteData: () => {},
  handleUpdateData: () => {}, //默认空函数
});
