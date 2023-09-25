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
  baseboard: ComputerBaseboard;
  bios: object;
  chassis: object;
  cpu: ComputerCpu;
  diskLayout: ComputerDevice[];
  graphics: object;
  memLayout: ComputerRam[];
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

//主板
export interface ComputerBaseboard {
  assetTag: string;
  manufacturer: string;
  memMax: number;
  memslots: number;
  model: string;
  serial: string;
  version: string;
}

//CPU
interface Cache {
  l1d: number;
  l1i: number;
  l2: number;
  l3: number | null;
}

export interface ComputerCpu {
  brand: string;
  cache: Cache;
  cores: number;
  flags: string;
  model: string;
  speed: number;
  family: string;
  socket: string;
  vendor: string;
  voltage: string;
  governor: string;
  revision: string;
  speedMax: number;
  speedMin: number;
  stepping: string;
  processors: number;
  manufacturer: string;
  physicalCores: number;
  virtualization: boolean;
  efficiencyCores: number;
  performanceCores: number;
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

//内存
export interface ComputerRam {
  ecc: boolean;
  bank: string;
  size: number;
  type: string;
  partNum: string;
  serialNum: string;
  clockSpeed: number;
  formFactor: string;
  voltageMax: number | null;
  voltageMin: number | null;
  manufacturer: string;
  voltageConfigured: number | null;
}
