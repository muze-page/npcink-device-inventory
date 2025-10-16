//公共方法
import {
  Replacements,
  TableData,
  OsTypeArray,
  MysqlDeviceChange,
  MysqlDeviceChangeMeat,
  DataItemArr,
  ComputerRam,
  ComputerDevice,
  ComputerControllers,
  MysqlDevice,
} from "@/type/index";
import { defaultOption } from "@/store";
import dayjs, { Dayjs } from "dayjs";
import Unknown from "@/assets/type/unknown.png";

//替换用数组
import {
  device_status,
  osReplace,
  osTypeReplace,
  excludeGraphics,
} from "@/store/dataReplace";

//开发环境状态,各种调试按钮用
export const devStatus: boolean = import.meta.env.VITE_STATE;

//传入日期，返回格式化
export const formatDate = (date: Dayjs) => {
  const formattedTime = dayjs(date).format("YYYY 年 MM 月 DD 日");
  //console.log("Formatted Time:", formattedTime);
  return formattedTime;
};

//准备设备状态
type DeviceStatus = "apply" | "idie" | "fault" | "scrap" | "repair";
export const statusLabel = (value: DeviceStatus) => {
  return device_status.find((item) => item.value === value)?.label;
};

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

/**
 * 字节转换单位 - 自动选择合适的单位（适用于硬件规格显示）
 * 对于B和KB单位显示整数（如"512 B"或"8 KB"）
 * 对于MB及以上单位只保留1位小数，并自动去除尾部的0（如"8 GB"而不是"8.0 GB"）
 */
export const formatBytes = (bytes: number | null) => {
  if (bytes === null || bytes === 0) {
    return "0";
  }

  // 自动选择合适的单位，包含PB（Petabyte）单位
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  // 对于硬件规格显示，通常使用整数或1位小数就足够了
  if (unitIndex <= 1) {
    // B和KB单位显示整数
    return Math.round(size) + " " + units[unitIndex];
  } else {
    // MB及以上单位显示最多1位小数，去除尾部的0
    const rounded = parseFloat(size.toFixed(1));
    return rounded + " " + units[unitIndex];
  }
};

/**
 * MB单位转换 - 自动选择合适的单位（适用于内存和显存显示）
 */
export const formatMB = (mb: number | null) => {
  if (mb === null || mb === 0) {
    return "0";
  }

  // 如果是MB单位，我们可以直接处理
  // 自动选择合适的单位，适用于内存和显存显示
  const units = ["MB", "GB", "TB", "PB"];
  let size = mb;
  let unitIndex = 0;

  // 从MB开始，1024 MB = 1 GB
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  // 对于内存和显存显示，通常使用整数或1位小数就足够了
  if (unitIndex === 0) {
    // MB单位显示整数
    return Math.round(size) + " " + units[unitIndex];
  } else {
    // GB及以上单位显示最多1位小数，去除尾部的0
    const rounded = parseFloat(size.toFixed(1));
    return rounded + " " + units[unitIndex];
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
 *拿到指定键的值并统计该键的出现次数
 * @param dataArrays 待检测数组对象
 * @param type 键名
 * @returns 数组对象[{
 * type:键
 * sum:次数
 * }]
 */

export const sum_brand = (data: any[], key: string): TableData[] => {
  return data.reduce((acc, cur) => {
    const type = cur[key];
    const index = acc.findIndex((item: { type: any }) => item.type === type);
    if (index !== -1) {
      acc[index].sum++;
    } else {
      acc.push({ type, sum: 1 });
    }
    return acc;
  }, []);
};

/**
 * 统计数组中指定容量的出现次数
 * @param data 待处理的硬件数组
 * @returns 对象数组，type是名称，sum是出现次数
 */

//泛型
interface DataItem {
  size: number;
}

type Thresholds = { [type: string]: number };

export const sum_order = (data: DataItem[], thresholds: Thresholds) => {
  const result: TableData[] = [];

  data.forEach(({ size }) => {
    const sizeInGB = size / 1024 ** 3;
    for (const [type, threshold] of Object.entries(thresholds)) {
      if (sizeInGB <= threshold) {
        const index = result.findIndex((item) => item.type === type);
        if (index !== -1) {
          result[index].sum += 1;
        } else {
          result.push({ type, sum: 1 });
        }
        break;
      }
    }
  });

  return result;
};

//关键词替换TODO:改进，只要部分值出现，就整体替换，提高通用性
/**
 * 根据字符表将指定键的值替换
 * @param tableData 待处理的数据数组
 * @param key 待处理的对象键
 * @param replacements 替换映射表
 * @returns 替换后的数据数组
 */
export const replaceKeyValues = (
  tableData: TableData[],
  key: keyof TableData,
  replacements: Replacements
): TableData[] => {
  return tableData.map((obj) => {
    const updatedValue = replacements[obj[key]] || obj[key];
    return { ...obj, [key]: updatedValue };
  });
};

/**
 * 展示设备详细数据，去除数组对象中，值是空字符串和undefined的对象
 *
 */
export const removeEmpty = (data: DataItemArr[]) => {
  //包含下列字符将移除
  const defaultValues = ["Default string", "Unknown", "NULL"];

  return data.filter((obj) => {
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
  });
};

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

/**
 * 将字符串数组转换为对象，方便下拉选择，TODO:检查有没有使用
 */
export const changeSelectData = (data: string[] | undefined) => {
  if (data && data.length > 0) {
    return data.map((str) => ({
      value: str,
      label: str,
    }));
  } else {
    // 如果 defaultOption.department 不存在或为空数组，返回一个空数组或其他默认值
    return [];
  }
};

/**
 * 查找对象中，符合要求对象的另一个键的值
 */

export const findBValue = (arr: DataItemArr[], targetAValue: string) => {
  const foundObject = arr.find((obj) => obj.value === targetAValue);
  return foundObject ? foundObject.label : "未找到";
};

/**
 *
 * @param jsonData 对象数组
 * @param tableName 下载的文件名称
 * @returns 数组对象导出为表格
 */
export const exportTable = (
  jsonData: MysqlDevice[] | undefined,
  tableName: string
) => {
  // 如果没有拿到值，就此结束
  if (!jsonData) {
    return;
  }

  // 创建一个表格元素
  const table = document.createElement("table");

  // 添加表头
  const thead = document.createElement("thead");
  const headers = Object.keys(jsonData[0]);
  const headerRow = document.createElement("tr");
  headers.forEach((headerText) => {
    const th = document.createElement("th");
    th.appendChild(document.createTextNode(headerText));
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // 添加数据行
  const tbody = document.createElement("tbody");
  jsonData.forEach((rowData: { [x: string]: string }) => {
    const row = document.createElement("tr");
    headers.forEach((header) => {
      const cell = document.createElement("td");
      cell.appendChild(document.createTextNode(rowData[header]));
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  // 将表格转换为 Excel 文件
  const blob = new Blob([table.outerHTML], {
    type: "application/vnd.ms-excel",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = tableName + ".xlsx";
  link.click();

  // 等待一段时间后释放 URL 对象
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
};

/**
 * 提供设备信息，算出采购价和使用月数组成的数组
 */

interface ProcessedItem {
  purchase: number;
  monthsUsed: number;
}

//计算月份差
const processArray = (arr: MysqlDeviceChange[]): ProcessedItem[] => {
  const now = dayjs();
  return arr.map((item) => {
    // 直接使用 dayjs 方法计算月份差
    const monthsUsed = Math.abs(now.diff(item.created_at, "month"));
    return {
      purchase: item.purchase,
      monthsUsed: monthsUsed,
    };
  });
};

//计算残值 输入采购价 使用月数，算出当前残值
const calculateResidualValue = (purchasePrice: number, monthsUsed: number) => {
  const salvageRate = defaultOption.residual_value_rate * 0.01; // 残值率（5%）
  const totalDepreciationPeriod = defaultOption.depreciation_year; // 折旧年限（月）
  //console.log("残值率", salvageRate);
  //console.log("折旧月数", totalDepreciationPeriod);
  return (
    purchasePrice -
    ((purchasePrice * (1 - salvageRate)) / totalDepreciationPeriod) * monthsUsed
  );
};

/**
 *
 * 将包含采购价和使用月数组成的对象数组，分别算出残值并累计相加输出
 */
const calculateTotalResidualValue = (data: ProcessedItem[]): number => {
  return data.reduce((total, item) => {
    const residualValue = calculateResidualValue(
      item.purchase,
      item.monthsUsed
    );
    return total + residualValue;
  }, 0);
};

//算出总残值
export const totalResidualValue = (data: MysqlDeviceChange[]) => {
  //计算出采购价和使用月数组
  const array = processArray(data);
  //计算出总残值
  return Number(calculateTotalResidualValue(array).toFixed(2));
};

/**
 * 电脑设备列表首页用
 */

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
interface repType {
  value: string;
  label: string;
}
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

/**
 * 通用函数
 */

//输入两个数，输出百分比
export const getPercentage = (num1: number, num2: number) => {
  if (num1 === 0 || num2 === 0) return "0%";
  //计算出百分比
  return ((num1 / num2) * 100).toFixed(2) + "%";
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
