// 传递方法和参数
import { createContext } from "react";
import { StyleDevice, StyleCategoryType } from "@/type/index";
interface StyleContextType {
  // 根据实际上下文内容定义类型，示例：
  drawerData: StyleDevice; //当前选中弹窗的数据,同步选中数据
  setDrawerData: React.Dispatch<React.SetStateAction<StyleDevice>>; //弹窗数据修改
  handleAddDevice: (device: StyleDevice) => void; //添加自定义设备
  handleDeleteData: (uuid: string) => void; //删除指定UUID的自定义设备
  handleUpdateData: (uuid: string, device: StyleDevice) => void; //修改自定义设备数据
  styleCategoryOption: StyleCategoryType; //自定义设备分类数组
  isName: boolean; //是否隐藏隐私
  detailLoading: boolean; //详情加载状态
}
export const StyleContext = createContext<StyleContextType>({
  drawerData: {} as StyleDevice, //默认空对象
  setDrawerData: () => {}, //默认空函数
  handleAddDevice: () => {},
  handleDeleteData: () => {},
  handleUpdateData: () => {}, //默认空函数
  styleCategoryOption: {
    states: [],
    categories: [],
    platforms: [],
    pay_methods: [],
  }, //默认空数组
  isName: false,
  detailLoading: false,
});
