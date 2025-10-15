import { createContext } from "react";
import { DataItemArr } from "@/store/interface.ts";
interface AppContextType {
  styleCategoryOption: DataItemArr[]; //自定义设备分类数组
}

export const AppContext = createContext<AppContextType>({
  styleCategoryOption: [{ label: "", value: "" }],
});
