// 传递方法和参数
import { createContext } from "react";
import { StyleDevice } from "@/store/interface";
interface StyleContextType {
  // 根据实际上下文内容定义类型，示例：
  handleAddDevice: (device: StyleDevice) => void; //添加自定义设备
  handleDeleteData?: (uuid: string) => void; //删除指定UUID的自定义设备
}
export const StyleContext = createContext<StyleContextType>({
  handleAddDevice: () => {}, //
  handleDeleteData: () => {},
});
