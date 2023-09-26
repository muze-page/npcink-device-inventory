//准备初始数据
import { createContext } from "react";
import data from "@/store/defaultVar";
import { MysqlDevice,  Computer } from "./interface";

//开发环境状态
const state: boolean = import.meta.env.VITE_STATE;

//输出选项值
const getDataLocal = () => {
  if (state) {
    //开发
    return data;
  } else {
    //打包
    return (window as any).dataLocal?.data !== ""
      ? (window as any).dataLocal?.data
      : {};
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

//对新旧两个值进行处理
const combinedData = combineData(getDataLocal());

//传出
const DataContext = createContext(combinedData);
export default DataContext;




//输出接口地址
const getAjaxurl = (): string => {
  if (state) {
    //开发
    return "http://localhost:10048/wp-admin/admin-ajax.php";
  } else {
    //打包
    return (window as any).ajaxurl !== "" ? (window as any).ajaxurl : {};
  }
};
//传值
export const dataAjaxurl = getAjaxurl();


