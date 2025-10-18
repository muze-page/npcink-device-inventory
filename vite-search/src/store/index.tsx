//准备初始数据
import data from "@/utils/defaultVar";
import { OptionType } from "@/type/index";

//开发环境状态
const state: boolean = import.meta.env.VITE_STATE;

//输出选项值
const getDataLocal = () => {
  if (state) {
    //开发
    return data;
  } else {
    //打包
    return (window as any).dataLocal !== "" ? (window as any).dataLocal : {};
  }
};

//拿到选项值并传出
export const defaultOption: OptionType = getDataLocal().option;

//输出站点网址
export const Site: string = getDataLocal().site;
