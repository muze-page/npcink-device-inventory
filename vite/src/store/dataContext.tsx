//准备初始数据
import { createContext } from "react";
import data from "@/store/defaultVar";

//开发环境状态
const state: boolean = import.meta.env.VITE_STATE;

//输出选项值
function getDataLocal(): any {
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
// 使用 Array.concat() 将多个数组合并为一个
const combineData = (dataArrays: any) => {
  const combined = dataArrays.map((obj: { dataNew: any; dataOld: any }) => {
    const processedDataNew = processData(obj.dataNew);
    const processedDataOld = processData(obj.dataOld);
    return { ...obj, dataNew: processedDataNew, dataOld: processedDataOld };
  });
  return combined;
};

// 假设有一个函数 processData 对数据进行处理
const processData = (data: any) => {
  // 在这里进行对 data 的处理
  // 返回处理后的值
  return JSON.parse(data);
};

const combinedData = combineData(dataObject);

const DataContext = createContext(combinedData);

export const StateContext = createContext({} as any);

export default DataContext;

const dataNew = {
  os: {
    arch: "ia32",
    distro: "Microsoft Windows 11 家庭版",
    codename: "",
  },
};
const dataOld = {
  os: {
    arch: "ia32",
    distro: "Microsoft Windows 12 家庭版",
    codename: "",
  },
};

const arr = [
  {
    type: "distro",
    new: "Microsoft Windows 11 家庭版",
    old: "Microsoft Windows 12 家庭版",
  },
];

const arrs = [
  {
    type: "os",
    new: "ia32",
    old: "ia32",
  },
];
