//准备初始数据
import data from "@/store/defaultVar";
import { MysqlDevice,OptionType } from "./interface";
import axios from "axios";

//开发环境状态
const state: boolean = import.meta.env.VITE_STATE;

if (state) {
  axios.defaults.baseURL = "/api"; //开发环境下配置代理
}
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

//将数组中的硬件数据从json格式处理成对象
const combineData = (dataArrays: MysqlDevice[]) => {
  return dataArrays.map((item) => {
    // 解析 "data" 字符串为对象
    const parsedData = JSON.parse(item.data);
    // 返回更新后的对象
    return { ...item, data: parsedData };
  });
};

//对硬件值进行处理后传出
export const dataMySql = combineData(getDataLocal().data);

//拿到选项值并传出
//console.log(getDataLocal().option);
export const defaultOption: OptionType = getDataLocal().option;

//输出接口地址
export const Ajaxurl:string = getDataLocal().ajaxurl;

//输出站点网址
export const Site:string = getDataLocal().site;
