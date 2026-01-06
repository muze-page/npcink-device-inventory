//准备初始数据
import axios from "axios";
import data from "@/utils/demoConfig";
import { MysqlDevice, OptionType, Computer, StyleDevice } from "@/type/index";
//开发环境状态
const devStatus = import.meta.env.VITE_STATE;

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

const dataLocal = getDataLocal();

//将数组中的硬件data数据从json格式处理成对象
const combineData = (dataArrays?: MysqlDevice[]) => {
  if (!Array.isArray(dataArrays)) return [];
  return dataArrays
    .map((item) => {
      // 解析 "data" 字符串为对象
      const parsedData = JSON.parse(item.data) as Computer;
      // 返回更新后的对象
      return { ...item, data: parsedData };
    })
    .reverse(); //倒序;
};

//将自定义硬件数组中的data数据从json格式处理成对象
const combineDataStyle = (dataArrays?: StyleDevice[]) => {
  if (!Array.isArray(dataArrays)) return [];
  return dataArrays
    .map((item) => {
      // 解析 "data" 字符串为对象
      //const parsedData = JSON.parse(item.data) as StyleDeviceData;
      const parsedData =
        typeof item.data === "string" ? JSON.parse(item.data) : item.data;
      // 返回更新后的对象
      return { ...item, data: parsedData };
    })
    .reverse(); //倒序
};

//对硬件值进行处理后传出
export const dataMySql = combineData(dataLocal.data);

//对自定义设备值进行处理后传出
export const dataStyle = combineDataStyle(dataLocal.styleData);

//拿到选项值并传出

export const defaultOption: OptionType = dataLocal.option || ({} as OptionType);

//输出接口地址
export const Ajaxurl: string = dataLocal.ajaxurl;
export const AjaxNonce: string = dataLocal.ajax_nonce || "";

//输出站点网址
export const Site: string = dataLocal.site;

//REST API 基础地址与 nonce
export const RestUrl: string =
  dataLocal.rest_url || (Site ? `${Site}/wp-json/npcink/v1` : "");
export const RestNonce: string = dataLocal.rest_nonce || "";

//输出数据库表名
export const TableDataName: string = dataLocal.table_data_name; //电脑设备表名称
export const TableStyleDataName: string = dataLocal.table_style_name; //自定义设备表名称
export const TableChangeName: string = dataLocal.table_change_name; //手动变更记录表
export const TableAUtoName: string = dataLocal.table_change_auto; //自动变更记录表

type SqlTableNameType = {
  pcData: string; //设备数据表名
  styleData: string; //自定义设备数据表名
  changeManualData: string; //手动变更记录数据表名
  changeAutoData: string; //自动变更记录表名
};
export const sqlTableName: SqlTableNameType = dataLocal.sqlTableName; //数据库列表
