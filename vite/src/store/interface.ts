//类型
//从数据库读取的设备信息
export interface MysqlDevice {
  id: string;
  name: string;
  styleName: string;
  styleNumber: string;
  dataNew: string;
  dataOld: string;
}

//硬件基本信息
export interface Computer {
  baseboard: object;
  bios: object;
  chassis: object;
  cpu: object;
  diskLayout: ComputerDevice[];
  graphics: object;
  memLayout: object;
  net: object;
  os: object;
  system: object;
  uuid: object;
  version: string;
  versions: object;
}

//替换列表
export interface Replacements {
  [key: string]: string;
}
//统计信息
export interface SumBrand {
  type: string;
  sum: number;
}
//表头
export interface TableData {
  type: string;
  sum: number;
}

//硬盘
export interface ComputerDevice {
  device: string;
  interfaceType: string;
  name: string;
  size: number;
  type: string;
  vendor: string;
}
