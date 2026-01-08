//准备初始数据
import data from "@/utils/config";
import { OptionType } from "@/type/index";

//开发环境状态
const state =
  import.meta.env.DEV ||
  String(import.meta.env.VITE_STATE || "")
    .toLowerCase()
    .trim() === "true";

//输出选项值
const getDataLocal = () => {
  const injected = (window as any).dataLocal;
  const hasInjected =
    injected && typeof injected === "object" && Object.keys(injected).length > 0;

  if (hasInjected) {
    return injected;
  }

  if (state) {
    //开发
    return data;
  }

  //打包
  return {};
};

const dataLocal = getDataLocal();

//拿到选项值并传出
export const defaultOption: OptionType =
  dataLocal.option || ({} as OptionType);

//输出站点网址
export const Site: string = dataLocal.site || "";
