//类型
//从数据库读取的设备信息
export interface MysqlDevice {
  id: string;
  name: string; //姓名
  state: string; //状态
  number: string; //编号
  department: string; //部门
  time: string; //添加时间
  uuid: string; //唯一编号
  data: string; //数据
}

//整理后
export interface MysqlDeviceChange {
  id: string;
  name: string; //姓名
  state: string; //状态
  number: string; //编号
  department: string; //部门
  time: string; //添加时间
  uuid: string; //唯一编号
  data: Computer; //数据
  [key: string]: any;
}

//准备交叉类型
export type MysqlDeviceChangeMeat = MysqlDeviceChange & {
  meat: {
    //为方便筛选
    os: string; //系统型号
    ostype: string; //系统类型
    cpu: string; //cpu型号
    model: string; //系统型号
    memory: number; //内存
    disk: number; //硬盘
  };
};

//选项数据类型
export interface OptionType {
  route?: string;
  password?: string;
  delete_mysql?: boolean;
  department: string[];
  device_show_number: number; //设备显示数
  public_search_route: string;//前端公共搜索路由
}

//替换列表
export interface Replacements {
  [key: string]: string;
}

//表头 统计信息
export interface TableData {
  type: string;
  sum: number;
}

//标准下拉
export interface DataItemArr {
  value: string;
  label: string;
}

//硬件变更返回值
export interface ComputerChangeReturn {
  id: string;
  uuid: string; //变更唯一标识
  time: string; //变更时间
  type: string; //变更类型
  user: string; //变更人
  data: string; //变更说明
  [key: string]: string;
}

//硬件设置选项
export interface DeviceSeting {
  name?: string; //项目
  number?: string; //编号
  state?: string; //状态
  department?: string; //部门
  [key: string]: string|undefined;
}

/**
 * Axios 返回类型
 */
export interface axiosType {
  success: boolean;//状态
  data: {
    data?: any;//返回值
    message?: string;//成功信息
    error?:string;//失败信息
  };
};

export interface MysqlChange {
  message: string;
  status: string;
  data: any;
}

/**
 * 列表图片内容,不同的设备不同的背景色
 */
export interface OsTypeArray {
  id: number;
  name: string;
  image: string;
}

//硬件基本信息
export interface Computer {
  baseboard: ComputerBaseboard;
  bios: ComputerBios;
  chassis: ComputerChassis; //机箱
  cpu: ComputerCpu;
  diskLayout: ComputerDevice[];
  graphics: {
    displays: ComputerDishplays[];
    controllers: ComputerControllers[];
  };
  memLayout: ComputerRam[];
  net: ComputerNet[];
  os: ComputerOS;
  system: ComputerSystem;
  uuid: ComputerUuid;
  version: string;
  versions: object;
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

//CPU
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

//OS
export interface ComputerOS {
  arch: string;
  fqdn: string;
  uefi: boolean;
  build: string;
  distro: string;
  kernel: string;
  serial: string;
  release: string;
  codename: string;
  codepage: string;
  hostname: string;
  logofile: string;
  platform: string;
  servicepack: string;
  hypervisor: string;
  remoteSession: string;
}

//操作系统
export interface ComputerSystem {
  sku: string;
  uuid: string;
  model: string;
  serial: string;
  version: string;
  virtual: boolean;
  manufacturer: string;

  virtualHost: boolean;
  raspberry: object;
}

//显示器
export interface ComputerDishplays {
  builtin: boolean;
  connection: number | null;
  currentRefreshRate: number;
  currentResX: number;
  currentResY: number;
  displayId: string;
  main: boolean;
  model: string;
  pixelDepth: number | null;
  positionX: number;
  positionY: number;
  productionYear: string;
  resolutionX: number;
  resolutionY: number;
  serial: number | null;
  sizeX: number | null;
  sizeY: number | null;
  vendor: string;
  vendorId: string;
  deviceName: string;
}
//显卡
export interface ComputerControllers {
  bus: string;
  vram: number | null;
  cores: string;
  model: string;
  vendor: string;
  deviceId: string;
  external: boolean;
  vendorId: string;
  vramDynamic: boolean;
  metalVersion: string;
}

//硬盘
export interface ComputerDevice {
  name: string;
  size: number;
  type: string;
  device: string;
  vendor: string;
  serialNum: string;
  totalHeads: number | null;
  smartStatus: string;
  temperature: number | null;
  totalTracks: number | null;
  totalSectors: number | null;
  interfaceType: string;
  bytesPerSector: number | null;
  totalCylinders: number | null;
  sectorsPerTrack: number | null;
  firmwareRevision: string;
  tracksPerCylinder: number | null;
  smartData: string;
  smartAttributes: string;
  smartError: string;
  smartSelfTest: string;
  smartAvailable: string;
  smartEnabled: string;
  smartEnabledDefault: string;
  smartAvailableDefault: string;
  smartSelfTestDefault: string;
  smartAttributesDefault: string;
  smartErrorDefault: string;
  smartStatusDefault: string;
  smartDataDefault: object;
}
//网口
export interface ComputerNet {
  ip4: string;
  ip6: string;
  mac: string;
  mtu: number;
  dhcp: boolean;
  type: string;
  iface: string;
  speed: number | null;
  duplex: string;
  default: boolean;
  virtual: boolean;
  internal: boolean;
  dnsSuffix: string;
  ifaceName: string;
  ip4subnet: string;
  ip6subnet: string;
  operstate: string;
  ieee8021xAuth: string;
  carrierChanges: number;
  ieee8021xState: string;
}

//BIOS
export interface ComputerBios {
  vendor: string;
  version: string;
  releaseDate: string;
  revision: string;
  langage: string;
  features: string;
  serial: string;
}

//机箱
export interface ComputerChassis {
  manufacturer: string;
  model: string;
  type: string;
  version: string;
  serial: string;
  assetTag: string;
  sku: string;
}

//UUID
export interface ComputerUuid {
  os: string;
  hardware: string;
}
