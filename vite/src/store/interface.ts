//类型
//从数据库读取的设备信息
export interface MysqlDevice {
  id: string;
  uuid: string;
  name: string;
  number: string;
  data: string;
  state: string;
}

//整理后
export interface MysqlDeviceChange {
  id: string;
  uuid: string;
  name: string;
  number: string;
  data: Computer;
  state: string;
  [key: string]: any;
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
  new: string; //变更后
  old: string; //变更前
  time: string; //变更时间
  type: string; //变更类型
  uuid: string; //变更唯一标识
  ch_name: string; //变更人
  ch_describe: string; //变更说明
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

//不同的设备不同的背景色
export interface PropBgColor {
  id: number;
  name: string;
  image: string;
}
