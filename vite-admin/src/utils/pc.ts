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
} from "@/type/index";
//替换用数组
import { osReplace, osTypeReplace, excludeGraphics } from "@/utils/replace";

import { formatBytes, formatMB } from "@/utils/tool";

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

//处理多张显卡，按显存大小从大到小排序，输出字符串数组
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

//添加需要的筛选标记数据
export const updateOSType = (
  dataArrays: MysqlDeviceChange[]
): MysqlDeviceChangeMeat[] => {
  //添加meat值，方便使用
  const updatedData = dataArrays.map((obj: MysqlDeviceChange) => {
    const value = obj.data; //拿到对象
    const memory = calculateTotalSize(value.memLayout); //内存数组
    const disk = calculateTotalSize(value.diskLayout); //混合计算，不分固态和机械
    //整理添加的信息
    const meat = {
      os: replaceString(value.os.distro, osTypeReplace), //系统版本 Windows 10
      ostype: replaceString(value.os.platform, osReplace), //系统类型，windows linux macos
      cpu: value.cpu.manufacturer || "暂无 CPU 品牌", //CPU品牌 Intel
      cpuModel: value.cpu.brand || "暂无 CPU 型号", //CPU型号 Core™ i5-9400F
      model: value.system.model || "暂无设备型号", //设备型号
      motherboard: value.baseboard.model || "暂无主板型号", //主板型号
      graphics: handleGraphics(value.graphics.controllers)[0] || "暂无显卡型号", //仅展示显存最大的显卡
      memory: memory.toString() || "暂无内存容量", //内存容量
      disk: disk.toString() || "暂无硬盘容量", //硬盘容量
    };
    const mac = value.uuid.macs; //获取mac地址
    return { ...obj, meat, mac };
  });
  return updatedData;
};
