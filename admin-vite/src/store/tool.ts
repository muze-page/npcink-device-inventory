//公共方法
import {
  Replacements,
  TableData,
  OsTypeArray,
  MysqlDeviceChange,
  MysqlDeviceChangeMeat,
  DataItemArr,
} from "@/store/interface";
import { defaultOption } from "@/store";

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
 * 字节转mb
 */
export const bytesToMB = (bytes: number | null, type: string) => {
  if (bytes === null) {
    return "0";
  }
  if (type == "MB") {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }
  if (type == "GB") {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  }
  if (type == "TB") {
    return (bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2) + " TB";
  }
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
 * 找到需要的系统对象
 * @param array  存储图片的数组对象
 * @param data 系统类型
 * @returns 包含图片的对象
 */
export const findOsTypeObj = (
  array: OsTypeArray[],
  data: MysqlDeviceChangeMeat
) => {
  return array.find((item) => item.name === data.meat.ostype);
};

/**
 * 将字符串数组转换为对象，方便下拉选择
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
  return foundObject ? foundObject.label + "中" : "无状态";
};

/**
 *
 * @param jsonData 对象数组
 * @param tableName 下载的文件名称
 * @returns 数组对象导出为表格
 */
export const exportTable = (jsonData: {}[], tableName: string) => {
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

const calculateMonthsDifference = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30)); // 计算月份
  return diffMonths;
};

const processArray = (arr: MysqlDeviceChange[]): ProcessedItem[] => {
  const now = new Date();

  return arr.map((item) => {
    const itemDate = new Date(item.time);
    const monthsUsed = calculateMonthsDifference(itemDate, now);
    return {
      purchase: item.purchase,
      monthsUsed: monthsUsed,
    };
  });
};

//计算残值 输入采购价 使用月数，算出当前残值
const calculateResidualValue = (purchasePrice: number, monthsUsed: number) => {
  const salvageRate = defaultOption.residual_value_rate * 0.01; // 残值率（5%）
  const totalDepreciationPeriod = defaultOption.depreciation_year ; // 折旧年限（月）
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
  return calculateTotalResidualValue(array).toFixed(2);
};
