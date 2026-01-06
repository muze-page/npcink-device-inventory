/**
 * 电脑设备页使用
 */
import {
  MysqlDeviceChange,
  MysqlDeviceChangeMeat,
  ComputerRam,
  ComputerDevice,
  ComputerControllers,
  repType,
  OsTypeArray,
  DataItemArr,
} from "@/type/index";
//替换用数组
import { osReplace, osTypeReplace, excludeGraphics } from "@/utils/replace";

import { formatBytes, formatMB } from "@/utils/format";
import Unknown from "@/assets/type/unknown.png";

/**
 * 判断布尔值
 */
export const judge_bool = (boo: boolean) => {
  if (boo === true) {
    return "是";
  } else {
    return "否";
  }
};
// IPv4 正则表达式
const ipv4Regex =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

// 自定义校验规则
export const validateIPv4 = (_: any, value: string) => {
  if (!value || ipv4Regex.test(value)) {
    return Promise.resolve();
  }
  return Promise.reject(new Error("请输入正确的IP v4 地址"));
};

/**
 * 处理搜索 MAC 地址的场景
 * 兼容大小写 + 容错空格
 * @param v 输入框的值
 * @returns 若搜索的值类似这样的da:b1:99:04:29:42，则处理成这样的：da-b1-99-04-29-42
 */
export const normalize = (v: string) =>
  v
    .trim()
    .toLowerCase()
    .replace(
      /^([0-9a-f]{2}):([0-9a-f]{2}):([0-9a-f]{2}):([0-9a-f]{2}):([0-9a-f]{2}):([0-9a-f]{2})$/i,
      "$1-$2-$3-$4-$5-$6"
    );

/**
 * 找到需要的系统对象 - 展示图片用
 * @param array  存储图片的数组对象
 * @param value 系统或平台类型
 * @returns 包含图片的对象
 */
export const findOsTypeObj = (array: OsTypeArray[], value: string) => {
  const result = array.find((item) => item.name === value);
  // 返回默认对象，避免返回 undefined
  return (
    result || {
      name: "unknown",
      image: Unknown /* 其他默认属性 */,
    }
  );
};

//收集数组中的指定键值的总和，并转为GB单位
type DataType = ComputerRam | ComputerDevice;
const calculateTotalSize = (dataArrays: DataType[]) => {
  const totalSize = dataArrays.reduce((sum: number, obj: { size: number }) => {
    return sum + obj.size;
  }, 0);
  return formatBytes(totalSize); // 单位转换
};

/**
 * 检查是否有指定字符串，有则整段替换，没有则表示为未知
 * @param dataArrays
 * @returns
 */

const replaceString = (input: string, obj: repType[]): string => {
  const filteredObjects = obj.filter((item) => input.includes(item.value));
  if (filteredObjects.length === 0) {
    // 如果没有找到匹配项，返回 "未收录"
    return "未收录";
  } else {
    // 使用map方法将符合条件的label值映射为一个字符串数组
    const labels = filteredObjects.map((item) => item.label);
    // 使用join方法将字符串数组连接成一个字符串，以逗号分隔
    return labels.join(", ");
  }
};

/**
 * 处理多张显卡，按显存大小从大到小排序，输出字符串数组
 * @param data
 * @returns
 */
export const handleGraphics = (data: ComputerControllers[]) => {
  //对值进行处理，出现如下字符串的，去掉
  const filteredData = data.filter(
    (item) => !excludeGraphics.some((str) => item.model.includes(str))
  );

  // 按显存大小从大到小排序
  const sortedData = filteredData.sort((a, b) => {
    const vramA = a.vram || 0;
    const vramB = b.vram || 0;
    return vramB - vramA;
  });

  // 返回排序好的字符串数组
  const value = sortedData.map(
    (item) => item.model + " " + (item.vram ? formatMB(item.vram) : "")
  );

  return value;
};

//显卡、主板和CPU的字符串数组
const graphicsReplace = [
  "NVIDIA GeForce",
  "Intel\\(R\\)",
  "\\(MS-7D48\\)",
  "\\(MS-7D46\\)",
  "with Radeon Graphics",
];
//添加需要的筛选标记数据
export const updateOSType = (
  dataArrays: MysqlDeviceChange[]
): MysqlDeviceChangeMeat[] => {
  //添加meat值，方便使用
  const updatedData = dataArrays.map((obj: MysqlDeviceChange) => {
    const value = obj.data; //拿到对象
    const memory = calculateTotalSize(value.memLayout) || "暂无内存容量"; //内存数组
    const disk = calculateTotalSize(value.diskLayout) || "暂无硬盘容量"; //混合计算，不分固态和机械

    const motherboard = value.baseboard.model
      ? removeSubstring(value.baseboard.model, graphicsReplace)
      : "暂无主板型号"; //去除主板中的指定字符串

    const cpuModel = value.cpu.brand
      ? removeSubstring(value.cpu.brand, graphicsReplace)
      : "暂无 CPU 型号";

    const graphicsData = handleGraphics(value.graphics.controllers)[0]; //拿显存最大的卡
    const graphics = graphicsData
      ? removeSubstring(graphicsData, graphicsReplace)
      : "暂无显卡型号"; //去除显卡中的指定字符串

    //整理添加的信息
    const meat = {
      os: replaceString(value.os.distro, osTypeReplace), //系统版本 Windows 10
      ostype: replaceString(value.os.platform, osReplace), //系统类型，windows linux macos
      cpu: value.cpu.manufacturer || "暂无 CPU 品牌", //CPU品牌 Intel
      cpuModel: cpuModel, //CPU型号 Core™ i5-9400F
      motherboard: motherboard, //主板型号
      graphics: graphics, //仅展示显存最大的显卡
      memory: memory, //内存容量
      disk: disk, //硬盘容量
    };
    const mac = value.uuid.macs; //获取mac地址
    return { ...obj, meat, mac };
  });
  return updatedData;
};

/**
 * 展示设备详细数据，去除数组对象中，值是空字符串和undefined的对象
 *添加key对象，值是label的值，展示数据用
 */
export const removeEmpty = (data: DataItemArr[]) => {
  //包含下列字符将移除
  const defaultValues = ["Default string", "Unknown", "NULL"];

  return data
    .filter((obj) => {
      if (typeof obj.value === "string") {
        if (defaultValues.includes(obj.value)) {
          return false;
        } else {
          return obj.value.trim() !== "";
        }
      } else if (typeof obj.value === "number") {
        if (obj.value === 0) {
          return false;
        } else {
          return true; // 如果是数字，保留该项
        }
      } else {
        return false; // 其他情况均移除
      }
    })
    .map((obj) => {
      // 为每个对象添加唯一的 key 属性，值为 label
      return {
        ...obj,
        key: obj.label,
      };
    });
};

/**
 * 提供待检测字符串a，和字符串数组b，若a中有部分字符串是在b中出现，则去除a中的这段字符串
 * @param a 待检测
 * @param b 待匹配的字符串数组
 */
export const removeSubstring = (a: string, b: string[]) => {
  // 创建一个正则表达式，将字符串数组中的字符串连接成 | 匹配模式
  const regex = new RegExp(b.join("|"), "gi");

  // 使用正则表达式去除a中的匹配字符串
  return a.replace(regex, "");
};
