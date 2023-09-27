//准备初始数据
import { createContext } from "react";
import data from "@/store/defaultVar";
import { MysqlDevice, Computer } from "./interface";

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

//处理对象
const processObject = ({ dataNew, dataOld, ...rest }: MysqlDevice) => ({
  ...rest,
  dataNew: JSON.parse(dataNew) as Computer,
  dataOld: JSON.parse(dataOld) as Computer,
});

//处理成数组
const combineData = (dataArrays: MysqlDevice[]) =>
  dataArrays.map(processObject);

//对新旧两个值进行处理后传出
export const dataMySql = combineData(getDataLocal().data);

//拿到选项值并传出
export const option = getDataLocal().option;

//输出接口地址
export const dataAjaxurl = getDataLocal().ajaxurl;
