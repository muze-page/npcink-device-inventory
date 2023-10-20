//类型
//从数据库读取的设备信息
export interface MysqlDevice {
  id: string;
  uuid: string;
  name: string;
  styleName: string;
  styleNumber: string;
  dataNew: string;
  dataOld: string;
}

//整理后
export interface MysqlDeviceChange {
  id: string;
  uuid: string;
  name: string;
  styleName: string;
  styleNumber: string;
  dataNew: Computer;
  dataOld: Computer;
  is_enabled: string;
}

//准备交叉类型
export type MysqlDeviceChangeMeat = MysqlDeviceChange & {
  meat: {
    ostype: string;
    cpu: string;
    model: string;
    memory: number;
    disk: number;
  };
};

//硬件基本信息
export interface Computer {
  baseboard: ComputerBaseboard;
  bios: object;
  chassis: object;
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
  uuid: object;
  version: string;
  versions: object;
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

//硬件变更返回值
export interface ComputerChangeReturn {
  id: string;
  new: string;
  old: string;
  time: string;
  type: string;
  uuid: string;
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
}

//显示器
export interface ComputerDishplays {
  main: boolean;
  model: string;
  sizeX: number | null;
  sizeY: number | null;
  serial: string | null;
  vendor: string;
  builtin: boolean;
  vendorId: string;
  displayId: string;
  positionX: number;
  positionY: number;
  connection: string | null;
  pixelDepth: number | null;
  currentResX: number;
  currentResY: number;
  resolutionX: number;
  resolutionY: number;
  productionYear: string;
  currentRefreshRate: number;
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
