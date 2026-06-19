import { Computer } from "@/type/index";

const emptyCpu = {
  brand: "",
  cache: { l1d: 0, l1i: 0, l2: 0, l3: null },
  cores: 0,
  flags: "",
  model: "",
  speed: 0,
  family: "",
  socket: "",
  vendor: "",
  voltage: "",
  governor: "",
  revision: "",
  speedMax: 0,
  speedMin: 0,
  stepping: "",
  processors: 0,
  manufacturer: "",
  physicalCores: 0,
  virtualization: false,
  efficiencyCores: 0,
  performanceCores: 0,
};

const emptyBaseboard = {
  assetTag: "",
  manufacturer: "",
  memMax: 0,
  memslots: 0,
  model: "",
  serial: "",
  version: "",
};

const emptyBios = {
  vendor: "",
  version: "",
  releaseDate: "",
  revision: "",
  langage: "",
  features: "",
  serial: "",
};

const emptySystem = {
  sku: "",
  uuid: "",
  model: "",
  serial: "",
  version: "",
  virtual: false,
  manufacturer: "",
  virtualHost: false,
  raspberry: {},
};

const emptyOs = {
  arch: "",
  fqdn: "",
  uefi: false,
  build: "",
  distro: "",
  kernel: "",
  serial: "",
  release: "",
  codename: "",
  codepage: "",
  hostname: "",
  logofile: "",
  platform: "",
  servicepack: "",
  hypervizor: "",
  remoteSession: "",
};

export const normalizeComputerData = (data?: Computer): Computer | undefined => {
  if (!data) return data;
  const source = data as any;
  const asset = source.asset;
  if (!asset || typeof asset !== "object") return data;

  const summary = asset.summary || {};
  const hardware = asset.hardware || {};
  const identity = asset.identity || {};
  const memory = hardware.memory || {};
  const network = hardware.network || {};
  const graphics = hardware.graphics || {};

  const memLayout = Array.isArray(memory.modules)
    ? memory.modules.map((item: any) => ({
        ecc: false,
        bank: item.bank || "",
        size: Number(item.size_bytes || 0),
        type: item.type || memory.type || "",
        partNum: item.part_number || "",
        serialNum: item.serial_number || "",
        clockSpeed: Number(item.clock_speed || 0),
        formFactor: "",
        voltageMax: null,
        voltageMin: null,
        manufacturer: item.manufacturer || "",
        voltageConfigured: null,
      }))
    : [];

  const diskLayout = Array.isArray(hardware.disks)
    ? hardware.disks.map((item: any) => ({
        name: item.name || "",
        size: Number(item.size_bytes || 0),
        type: item.type || "",
        device: item.mount || "",
        vendor: item.vendor || "",
        serialNum: item.serial_number || "",
        totalHeads: null,
        smartStatus: "",
        temperature: null,
        totalTracks: null,
        totalSectors: null,
        interfaceType: item.interface_type || "",
        bytesPerSector: null,
        totalCylinders: null,
        sectorsPerTrack: null,
        firmwareRevision: "",
        tracksPerCylinder: null,
        smartData: "",
        smartAttributes: "",
        smartError: "",
        smartSelfTest: "",
        smartAvailable: "",
        smartEnabled: "",
        smartEnabledDefault: "",
        smartAvailableDefault: "",
        smartSelfTestDefault: "",
        smartAttributesDefault: "",
        smartErrorDefault: "",
        smartStatusDefault: "",
        smartDataDefault: {},
      }))
    : [];

  const net = Array.isArray(network.interfaces)
    ? network.interfaces
    : network.primary
      ? [network.primary]
      : [];

  const os = {
    ...emptyOs,
    ...(source.os || {}),
    distro: summary.os || source.os?.distro || "",
    platform: summary.platform || source.os?.platform || "",
  };

  return {
    ...data,
    baseboard: { ...emptyBaseboard, ...(hardware.baseboard || {}) },
    bios: { ...emptyBios, ...(hardware.bios || {}) },
    chassis: source.chassis || {
      manufacturer: "",
      model: "",
      type: "",
      version: "",
      serial: "",
      assetTag: "",
      sku: "",
    },
    cpu: { ...emptyCpu, ...(hardware.cpu || {}) },
    diskLayout,
    graphics: {
      displays: Array.isArray(hardware.displays) ? hardware.displays : [],
      controllers: Array.isArray(graphics.controllers) ? graphics.controllers : [],
    },
    memLayout,
    net,
    os,
    system: { ...emptySystem, ...(hardware.system || {}) },
    uuid: {
      os: source.uuid?.os || "",
      hardware: identity.hardware_uuid || source.uuid?.hardware || "",
      macs: Array.isArray(identity.macs) ? identity.macs : source.uuid?.macs || [],
    },
    version: source.version || "",
    versions: source.versions || {},
  } as Computer;
};
