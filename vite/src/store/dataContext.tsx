//准备初始数据
import { createContext } from "react";
import data from "@/store/defaultVar";

//开发环境状态
const state: boolean = import.meta.env.VITE_STATE;


//输出选项值
function getDataLocal():any {
  if (state) {
    //开发
    return data;
  } else {
    //打包
    return (window as any).dataLocal?.data !== ""
      ? (window as any).dataLocal?.data
      : {};
  }
}

//传值
const dataObject: any = getDataLocal();

//处理成数组
const combineData = (dataArrays: any) => {
  // 使用 Array.concat() 将多个数组合并为一个
  const combined = [].concat(...dataArrays);
  return combined;
};
const combinedData = combineData(
  dataObject.map((obj: { dataNew: any }) => JSON.parse(obj.dataNew))
);

const DataContext = createContext(combinedData);

export default DataContext;
