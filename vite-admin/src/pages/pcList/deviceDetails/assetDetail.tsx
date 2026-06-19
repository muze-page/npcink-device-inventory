import { Empty, Tag } from "antd";
import { Computer } from "@/type/index";
import { formatBytes, formatDate } from "@/utils/tool";
import type { Dayjs } from "dayjs";

type AssetRecord = Record<string, any>;

const cleanText = (value: unknown) => {
  if (value === undefined || value === null) return "";
  const text = String(value).trim();
  if (!text || text === "Default string" || text === "Unknown" || text === "NULL") {
    return "";
  }
  return text;
};

const joinText = (values: unknown[], separator = " / ") =>
  values.map(cleanText).filter(Boolean).join(separator);

const bytes = (value: unknown) => formatBytes(Number(value || 0));

const hasValue = (value: unknown) => cleanText(value) !== "";

const valueText = (value: unknown, suffix = "") => {
  const text = cleanText(value);
  return text ? `${text}${suffix}` : "未采集";
};

const getAsset = (data?: Computer) => {
  const asset = (data as any)?.asset;
  return asset && typeof asset === "object" ? (asset as AssetRecord) : null;
};

const InfoGrid: React.FC<{
  items: Array<{ label: string; value: unknown; mono?: boolean }>;
}> = ({ items }) => {
  const visible = items.filter((item) => hasValue(item.value));
  if (!visible.length) return <Empty description="暂无可展示信息" />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
      {visible.map((item) => (
        <div
          key={item.label}
          className="flex gap-5 border-b border-zinc-100 py-3 min-w-0"
        >
          <div className="w-28 shrink-0 text-zinc-500">{item.label}</div>
          <div
            className={`flex-1 min-w-0 break-words text-zinc-800 ${
              item.mono ? "font-mono text-xs" : ""
            }`}
          >
            {String(item.value)}
          </div>
        </div>
      ))}
    </div>
  );
};

const Section: React.FC<{
  title: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, extra, children }) => (
  <section className="mb-8">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="m-0 text-base font-semibold text-zinc-900">{title}</h3>
      {extra ? <div>{extra}</div> : null}
    </div>
    {children}
  </section>
);

const ItemBlock: React.FC<{
  title: string;
  rows: Array<{ label: string; value: unknown; mono?: boolean }>;
}> = ({ title, rows }) => (
  <div className="mb-4 rounded-md border border-zinc-100 bg-white px-4 py-3">
    <div className="mb-1 text-sm font-semibold text-zinc-900">{title}</div>
    <InfoGrid items={rows} />
  </div>
);

export const AssetOverview: React.FC<{
  data?: Computer;
  time: Dayjs;
  loading?: boolean;
}> = ({ data, time, loading }) => {
  const asset = getAsset(data);
  if (loading) return <Empty description="设备详情加载中" />;
  if (!asset) return <Empty description="这条设备数据尚未迁移到 v2 结构" />;

  const summary = asset.summary || {};
  const hardware = asset.hardware || {};
  const identity = asset.identity || {};
  const memory = hardware.memory || {};
  const disks = Array.isArray(hardware.disks) ? hardware.disks : [];
  const network = hardware.network || {};
  const primaryNet = network.primary || {};
  const display = Array.isArray(hardware.displays) ? hardware.displays[0] : null;

  const summaryItems = [
    { label: "设备型号", value: summary.device_model },
    { label: "系统", value: summary.os },
    { label: "处理器", value: summary.cpu },
    { label: "显卡", value: summary.graphics },
    { label: "内存", value: bytes(summary.memory_bytes || memory.total_bytes) },
    { label: "硬盘", value: bytes(summary.disk_bytes) },
    { label: "主 IP", value: summary.primary_ip || primaryNet.ip4 || primaryNet.ip6 },
    { label: "设备编号", value: identity.stable_device_id_v2, mono: true },
  ];

  const inventoryItems = [
    { label: "硬盘数量", value: disks.length ? `${disks.length} 块` : "" },
    { label: "主 MAC", value: identity.primary_mac, mono: true },
    {
      label: "显示器",
      value: display
        ? joinText([
            display.model,
            display.currentResX && display.currentResY
              ? `${display.currentResX} x ${display.currentResY}`
              : "",
            display.currentRefreshRate ? `${display.currentRefreshRate} Hz` : "",
          ], " ")
        : "",
    },
    { label: "添加时间", value: formatDate(time) },
  ];

  return (
    <div className="pt-1">
      <Section title="设备概览">
        <InfoGrid items={summaryItems} />
      </Section>
      <Section title="资产口径">
        <InfoGrid items={inventoryItems} />
      </Section>
    </div>
  );
};

export const AssetDetails: React.FC<{ data?: Computer; loading?: boolean }> = ({
  data,
  loading,
}) => {
  const asset = getAsset(data);
  if (loading) return <Empty description="设备详情加载中" />;
  if (!asset) return <Empty description="这条设备数据尚未迁移到 v2 结构" />;

  const hardware = asset.hardware || {};
  const identity = asset.identity || {};
  const cpu = hardware.cpu || {};
  const memory = hardware.memory || {};
  const disks = Array.isArray(hardware.disks) ? hardware.disks : [];
  const network = hardware.network || {};
  const primaryNet = network.primary || {};
  const interfaces = Array.isArray(network.interfaces) ? network.interfaces : [];
  const controllers = Array.isArray(hardware.graphics?.controllers)
    ? hardware.graphics.controllers
    : [];
  const displays = Array.isArray(hardware.displays) ? hardware.displays : [];
  const baseboard = hardware.baseboard || {};
  const bios = hardware.bios || {};
  const system = hardware.system || {};

  return (
    <div className="pt-1">
      <Section title="处理器">
        <InfoGrid
          items={[
            { label: "型号", value: joinText([cpu.manufacturer, cpu.brand], " ") },
            { label: "核心", value: valueText(cpu.cores, " 个") },
            { label: "物理核心", value: valueText(cpu.physicalCores, " 个") },
            { label: "处理器数", value: valueText(cpu.processors, " 个") },
            { label: "频率", value: cpu.speed ? `${cpu.speed} GHz` : "" },
            { label: "供应商", value: cpu.vendor },
          ]}
        />
      </Section>

      <Section title="内存">
        <InfoGrid
          items={[
            { label: "总容量", value: bytes(memory.total_bytes) },
            { label: "类型", value: memory.type },
          ]}
        />
        {Array.isArray(memory.modules) && memory.modules.length ? (
          <div className="mt-4">
            {memory.modules.map((item: AssetRecord, index: number) => (
              <ItemBlock
                key={`${item.bank || "memory"}-${index}`}
                title={memory.modules.length === 1 ? "内存" : `内存 ${index + 1}`}
                rows={[
                  { label: "容量", value: bytes(item.size_bytes) },
                  { label: "插槽", value: item.bank },
                  { label: "类型", value: item.type },
                  { label: "厂商", value: item.manufacturer },
                  { label: "部件号", value: item.part_number },
                  { label: "序列号", value: item.serial_number, mono: true },
                ]}
              />
            ))}
          </div>
        ) : null}
      </Section>

      <Section title="硬盘" extra={<Tag color="green">资产盘 {disks.length}</Tag>}>
        {disks.length ? (
          disks.map((item: AssetRecord, index: number) => (
            <ItemBlock
              key={`${item.name || "disk"}-${index}`}
              title={disks.length === 1 ? "硬盘" : `硬盘 ${index + 1}`}
              rows={[
                { label: "名称", value: item.name },
                { label: "类型", value: item.type },
                { label: "容量", value: bytes(item.size_bytes) },
                { label: "接口", value: item.interface_type },
                { label: "文件系统", value: item.file_system },
                { label: "挂载位置", value: item.mount },
                { label: "序列号", value: item.serial_number, mono: true },
              ]}
            />
          ))
        ) : (
          <Empty description="暂无硬盘信息" />
        )}
      </Section>

      <Section title="网卡" extra={<Tag color="blue">主网卡</Tag>}>
        <InfoGrid
          items={[
            { label: "接口", value: primaryNet.ifaceName || primaryNet.iface },
            { label: "MAC", value: primaryNet.mac || identity.primary_mac, mono: true },
            { label: "IPv4", value: primaryNet.ip4 },
            { label: "IPv6", value: primaryNet.ip6 },
            { label: "类型", value: primaryNet.type },
            { label: "速度", value: primaryNet.speed ? `${primaryNet.speed} Mbps` : "" },
          ]}
        />
        {interfaces.length > 1 ? (
          <div className="mt-4 text-sm text-zinc-500">
            已保留 {interfaces.length} 个接口用于诊断，设备身份只使用主网卡。
          </div>
        ) : null}
      </Section>

      <Section title="显卡 / 显示器">
        {controllers.length ? (
          controllers.map((item: AssetRecord, index: number) => (
            <ItemBlock
              key={`${item.model || "graphics"}-${index}`}
              title={controllers.length === 1 ? "显卡" : `显卡 ${index + 1}`}
              rows={[
                { label: "型号", value: item.model },
                { label: "厂商", value: item.vendor },
                { label: "总线", value: item.bus },
                { label: "显存", value: item.vram ? `${item.vram} MB` : "" },
              ]}
            />
          ))
        ) : (
          <Empty description="暂无显卡信息" />
        )}
        {displays.length ? (
          <div className="mt-4">
            {displays.map((item: AssetRecord, index: number) => (
              <ItemBlock
                key={`${item.model || "display"}-${index}`}
                title={displays.length === 1 ? "显示器" : `显示器 ${index + 1}`}
                rows={[
                  { label: "型号", value: item.model },
                  { label: "分辨率", value: item.currentResX && item.currentResY ? `${item.currentResX} x ${item.currentResY}` : "" },
                  { label: "刷新率", value: item.currentRefreshRate ? `${item.currentRefreshRate} Hz` : "" },
                  { label: "连接", value: item.connection },
                  { label: "内置", value: item.builtin === true ? "是" : item.builtin === false ? "否" : "" },
                ]}
              />
            ))}
          </div>
        ) : null}
      </Section>

      <Section title="主板 / 系统">
        <InfoGrid
          items={[
            { label: "设备型号", value: joinText([system.manufacturer, system.model]) },
            { label: "系统序列号", value: system.serial, mono: true },
            { label: "系统 UUID", value: system.uuid, mono: true },
            { label: "主板厂商", value: baseboard.manufacturer },
            { label: "主板型号", value: baseboard.model },
            { label: "主板序列号", value: baseboard.serial, mono: true },
            { label: "BIOS 厂商", value: bios.vendor },
            { label: "BIOS 版本", value: bios.version },
            { label: "BIOS 序列号", value: bios.serial, mono: true },
          ]}
        />
      </Section>
    </div>
  );
};
