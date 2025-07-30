//准备初始数据
import axios from "axios";
import data from "@/store/defaultVar";
import {
  MysqlDevice,
  OptionType,
  Computer,
  StyleDevice,
} from "@/store/interface";
//开发环境状态
import { devStatus } from "@/store/tool";

//输出选项值
const getDataLocal = () => {
  if (devStatus) {
    //开发
    axios.defaults.baseURL = "/api"; //开发环境下配置代理
    return data;
  } else {
    //打包
    return (window as any).dataLocal !== "" ? (window as any).dataLocal : {};
  }
};

//将数组中的硬件data数据从json格式处理成对象
const combineData = (dataArrays: MysqlDevice[]) => {
  return dataArrays.map((item) => {
    // 解析 "data" 字符串为对象
    const parsedData = JSON.parse(item.data) as Computer;
    // 返回更新后的对象
    return { ...item, data: parsedData };
  });
};

//将自定义硬件数组中的data数据从json格式处理成对象
const combineDataStyle = (dataArrays: StyleDevice[]) => {
  return dataArrays.map((item) => {
    // 解析 "data" 字符串为对象
    //const parsedData = JSON.parse(item.data) as StyleDeviceData;
    const parsedData =
      typeof item.data === "string" ? JSON.parse(item.data) : item.data;
    // 返回更新后的对象
    return { ...item, data: parsedData };
  });
};

//对硬件值进行处理后传出
export const dataMySql = combineData(getDataLocal().data);

//对自定义设备值进行处理后传出
export const dataStyle = combineDataStyle(getDataLocal().styleData);

//拿到选项值并传出

export const defaultOption: OptionType = getDataLocal().option;

//输出接口地址
export const Ajaxurl: string = getDataLocal().ajaxurl;

//输出站点网址
export const Site: string = getDataLocal().site;

//输出数据库表名
export const TableDataName: string = getDataLocal().table_data_name; //数据表
export const TableChangeName: string = getDataLocal().table_change_name; //变更表
export const TableStyleDataName: string = getDataLocal().table_style_name; //自定义设备表
