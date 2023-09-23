//类型
//从数据库读取的信息

//硬件基本信息
export interface Computer {
  baseboard: object;
  bios: object;
  chassis: object;
  cpu: object;
  diskLayout: object;
  graphics: object;
  memLayout: object;
  net: object;
  os: object;
  system: object;
  uuid: object;
  version: string;
  versions: object;
}

//表头
export interface TableData {
  type: string;
  sum: number;
}
