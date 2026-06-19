import { useEffect, useMemo, useState } from "react";
import { Button, Checkbox, Select, Space, Spin, message } from "antd";
import type { Dayjs } from "dayjs";
import {
  exportTable,
  formatBytes,
  formatDate,
  handleGraphics,
} from "@/utils/tool";
import { normalizeComputerData } from "@/utils/assetAdapter";
import { getDeviceCategory, getPcListFull } from "@/services/index";
import {
  ComputerDevice,
  ComputerRam,
  MysqlDeviceChange,
  PCCategoryType,
} from "@/type/index";

type ExportFieldKey =
  | "state"
  | "department"
  | "ip"
  | "os"
  | "deviceModel"
  | "cpu"
  | "baseboard"
  | "memory"
  | "disk"
  | "graphics"
  | "macs"
  | "created_at"
  | "updated_at";

type CheckboxValueType = string | number | boolean;

const EXPORT_PAGE_SIZE = 100;

const exportFieldOptions: Array<{ label: string; value: ExportFieldKey }> = [
  { label: "设备状态", value: "state" },
  { label: "设备部门", value: "department" },
  { label: "IP 地址", value: "ip" },
  { label: "系统版本", value: "os" },
  { label: "设备型号", value: "deviceModel" },
  { label: "CPU 型号", value: "cpu" },
  { label: "主板型号", value: "baseboard" },
  { label: "内存型号和容量", value: "memory" },
  { label: "硬盘型号和容量", value: "disk" },
  { label: "显卡型号", value: "graphics" },
  { label: "MAC 地址", value: "macs" },
  { label: "添加时间", value: "created_at" },
  { label: "更新时间", value: "updated_at" },
];

const fieldLabelMap = exportFieldOptions.reduce<Record<ExportFieldKey, string>>(
  (acc, item) => {
    acc[item.value] = item.label;
    return acc;
  },
  {} as Record<ExportFieldKey, string>
);

const cleanText = (value?: string | number | null) => {
  if (value === undefined || value === null) return "";
  if (typeof value === "number") return String(value);
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed === "Default string" || trimmed === "Unknown" || trimmed === "NULL") {
    return "";
  }
  return trimmed;
};

const joinText = (values: Array<string | undefined>, separator = " / ") =>
  values.map((value) => cleanText(value)).filter(Boolean).join(separator);

const formatMemory = (memLayout?: ComputerRam[]) => {
  if (!memLayout || memLayout.length === 0) return "";
  return memLayout
    .map((item) => {
      const size = formatBytes(item.size || 0);
      const model = cleanText(item.partNum) || cleanText(item.manufacturer);
      const type = cleanText(item.type);
      const label = joinText([model, type], " ");
      return joinText([label, size], " ");
    })
    .filter(Boolean)
    .join("; ");
};

const formatDisk = (diskLayout?: ComputerDevice[]) => {
  if (!diskLayout || diskLayout.length === 0) return "";
  return diskLayout
    .map((item) => {
      const size = formatBytes(item.size || 0);
      const model = cleanText(item.name) || cleanText(item.vendor);
      const type = cleanText(item.type);
      const label = joinText([model, type], " ");
      return joinText([label, size], " ");
    })
    .filter(Boolean)
    .join("; ");
};

const formatDateValue = (value?: Dayjs | string | null) => {
  if (!value) return "";
  return formatDate(value);
};

const buildRow = (item: MysqlDeviceChange, fields: ExportFieldKey[]) => {
  const row: Record<string, string> = {
    姓名: cleanText(item.name),
    编号: cleanText(item.number),
  };

  const data = normalizeComputerData(item.data);
  const baseboard = data
    ? joinText([data.baseboard?.manufacturer, data.baseboard?.model])
    : "";
  const deviceModel = data
    ? joinText([data.system?.manufacturer, data.system?.model])
    : "";
  const os = data ? joinText([data.os?.distro, data.os?.release], " ") : "";
  const cpu = data ? cleanText(data.cpu?.brand) : "";
  const graphics = data?.graphics?.controllers
    ? handleGraphics(data.graphics.controllers).filter(Boolean).join("; ")
    : "";
  const macs = data?.uuid?.macs ? data.uuid.macs.join("; ") : "";

  const valueMap: Record<ExportFieldKey, string> = {
    state: cleanText(item.state),
    department: cleanText(item.department),
    ip: cleanText(item.ip),
    os,
    deviceModel,
    cpu,
    baseboard,
    memory: formatMemory(data?.memLayout),
    disk: formatDisk(data?.diskLayout),
    graphics,
    macs,
    created_at: formatDateValue(item.created_at),
    updated_at: formatDateValue(item.updated_at),
  };

  fields.forEach((field) => {
    const label = fieldLabelMap[field];
    if (label) {
      row[label] = valueMap[field] || "";
    }
  });

  return row;
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<PCCategoryType>({
    states: [],
    departments: [],
  });
  const [filters, setFilters] = useState({
    state: "all",
    department: "all",
  });
  const [selectedFields, setSelectedFields] = useState<ExportFieldKey[]>([]);

  useEffect(() => {
    let mounted = true;
    getDeviceCategory()
      .then((data) => {
        if (mounted) {
          setCategory(data);
        }
      })
      .catch(() => {
        if (mounted) {
          setCategory({ states: [], departments: [] });
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const stateOptions = useMemo(
    () => [{ label: "全部", value: "all" }, ...category.states],
    [category.states]
  );

  const departmentOptions = useMemo(
    () => [{ label: "全部", value: "all" }, ...category.departments],
    [category.departments]
  );

  const fetchAllItems = async () => {
    let page = 1;
    let totalPages = 1;
    const items: MysqlDeviceChange[] = [];

    while (page <= totalPages) {
      const res = await getPcListFull({
        page,
        per_page: EXPORT_PAGE_SIZE,
        state: filters.state !== "all" ? filters.state : undefined,
        department: filters.department !== "all" ? filters.department : undefined,
      });
      items.push(...(res.items || []));
      totalPages = res.total_pages > 0 ? res.total_pages : 1;
      page += 1;
    }

    return items;
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const items = await fetchAllItems();
      if (!items.length) {
        message.warning("没有可导出的设备数据");
        return;
      }
      const rows = items.map((item) => buildRow(item, selectedFields));
      exportTable(rows, "电脑设备_Excel导出");
      message.success("导出完成");
    } catch (error) {
      console.error("导出错误:", error);
      message.error("导出失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const onFieldsChange = (values: CheckboxValueType[]) => {
    setSelectedFields(values as ExportFieldKey[]);
  };

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="middle" className="w-full">
        <div className="text-sm text-zinc-500">
          默认导出：姓名、编号。筛选条件仅影响导出范围，不会写入设置。
        </div>
        <Space size="large" wrap>
          <div>
            状态：
            <Select
              value={filters.state}
              style={{ width: 160 }}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, state: value }))
              }
              options={stateOptions}
            />
          </div>
          <div>
            部门：
            <Select
              value={filters.department}
              style={{ width: 160 }}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, department: value }))
              }
              options={departmentOptions}
            />
          </div>
        </Space>
        <div>
          <div className="mb-2 text-sm text-zinc-500">可选导出字段</div>
          <Checkbox.Group value={selectedFields} onChange={onFieldsChange}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {exportFieldOptions.map((item) => (
                <Checkbox key={item.value} value={item.value}>
                  {item.label}
                </Checkbox>
              ))}
            </div>
          </Checkbox.Group>
        </div>
        <Button type="primary" className="bg-[#1677ff]" onClick={handleExport}>
          导出 Excel
        </Button>
      </Space>
    </Spin>
  );
};

export default App;
