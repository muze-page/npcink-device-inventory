import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Tabs, Segmented } from "antd";
import type { TabsProps } from "antd";
import { formatNumber } from "@/utils/tool";
import { MysqlDeviceChange } from "@/type/index";
import { getPcListFull } from "@/services/index";

const STATUS_ORDER = ["在用", "闲置", "待维修", "报废"];
const FETCH_PAGE_SIZE = 100;

type LossGroupBy = "device" | "model" | "department";
type ViewMode = "table" | "chart";

const normalizeStatus = (state?: string) => {
  const value = typeof state === "string" ? state.trim() : "";
  if (!value) return "其他";
  const lowerValue = value.toLowerCase();
  if (value === "使用" || value === "在用" || value === "启用") return "在用";
  if (value === "闲置" || value === "空闲") return "闲置";
  if (value === "报废" || lowerValue === "scrap") return "报废";
  if (
    value === "维修" ||
    value === "待维修" ||
    value === "故障" ||
    lowerValue === "repair"
  ) {
    return "待维修";
  }
  return value;
};

const normalizeDepartment = (department?: string) => {
  const value = typeof department === "string" ? department.trim() : "";
  return value || "未分配";
};

const toNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const buildDeviceLabel = (item: MysqlDeviceChange) => {
  const name = typeof item.name === "string" ? item.name.trim() : "";
  const number = typeof item.number === "string" ? item.number.trim() : "";
  if (name && number) return `${name} (${number})`;
  return name || number || "未命名设备";
};

const buildModelLabel = (item: MysqlDeviceChange) => {
  const data =
    item.data && typeof item.data === "object" ? (item.data as any) : null;
  const systemModel = data?.system?.model;
  const systemManufacturer = data?.system?.manufacturer;
  const systemLabel = [systemManufacturer, systemModel]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (systemLabel) return systemLabel;
  const baseboardModel = data?.baseboard?.model;
  const baseboardManufacturer = data?.baseboard?.manufacturer;
  const baseboardLabel = [baseboardManufacturer, baseboardModel]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (baseboardLabel) return baseboardLabel;
  return "未知型号";
};

const formatPercentValue = (value: number) => {
  if (!Number.isFinite(value)) return "0.00%";
  return `${(value * 100).toFixed(2)}%`;
};

const formatPercent = (num: number, den: number) => {
  if (!Number.isFinite(num) || !Number.isFinite(den) || den <= 0) {
    return "0.00%";
  }
  return formatPercentValue(num / den);
};

const formatAmount = (value: number) => {
  const rounded = Math.round(toNumber(value) * 100) / 100;
  return rounded.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const statusColorMap: Record<string, string> = {
  在用: "bg-emerald-500",
  闲置: "bg-amber-500",
  待维修: "bg-rose-500",
  报废: "bg-zinc-400",
  其他: "bg-slate-400",
};

const getStatusColor = (status: string) =>
  statusColorMap[status] || "bg-slate-400";

const Analyze: React.FC = () => {
  const [devices, setDevices] = useState<MysqlDeviceChange[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [lossGroupBy, setLossGroupBy] = useState<LossGroupBy>("model");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  useEffect(() => {
    let mounted = true;
    const fetchAllDevices = async () => {
      setDevicesLoading(true);
      try {
        let page = 1;
        let totalPages = 1;
        const items: MysqlDeviceChange[] = [];
        while (page <= totalPages) {
          const res = await getPcListFull({
            page,
            per_page: FETCH_PAGE_SIZE,
          });
          items.push(...(res.items || []));
          totalPages = res.total_pages > 0 ? res.total_pages : 1;
          page += 1;
        }
        if (mounted) {
          setDevices(items);
        }
      } catch (error) {
        console.error("获取设备列表失败:", error);
        if (mounted) {
          setDevices([]);
        }
      } finally {
        if (mounted) {
          setDevicesLoading(false);
        }
      }
    };

    fetchAllDevices();

    return () => {
      mounted = false;
    };
  }, []);

  const statusSummary = useMemo(() => {
    const counts = new Map<string, number>();
    devices.forEach((item) => {
      const status = normalizeStatus(item.state);
      counts.set(status, (counts.get(status) || 0) + 1);
    });
    const extraStatuses = Array.from(counts.keys()).filter(
      (status) => !STATUS_ORDER.includes(status)
    );
    const orderedStatuses = [...STATUS_ORDER, ...extraStatuses];
    const total = devices.length;
    const items = orderedStatuses.map((status) => {
      const count = counts.get(status) || 0;
      return {
        status,
        count,
        percentage: formatPercent(count, total),
      };
    });
    return { counts, total, items, orderedStatuses };
  }, [devices]);

  const departmentStatus = useMemo(() => {
    const statusKeys = statusSummary.orderedStatuses;
    const totals = statusKeys.reduce<Record<string, number>>((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});
    const map = new Map<string, Record<string, number>>();
    devices.forEach((item) => {
      const department = normalizeDepartment(item.department);
      const status = normalizeStatus(item.state);
      if (!map.has(department)) {
        const initial = statusKeys.reduce<Record<string, number>>((acc, key) => {
          acc[key] = 0;
          return acc;
        }, {});
        map.set(department, initial);
      }
      const row = map.get(department);
      if (row) {
        row[status] = (row[status] || 0) + 1;
      }
      totals[status] = (totals[status] || 0) + 1;
    });
    const rows = Array.from(map.entries()).map(([department, counts]) => ({
      department,
      counts,
      total: statusKeys.reduce((sum, key) => sum + (counts[key] || 0), 0),
    }));
    rows.sort(
      (a, b) => b.total - a.total || a.department.localeCompare(b.department)
    );
    const totalCount = statusKeys.reduce(
      (sum, key) => sum + (totals[key] || 0),
      0
    );
    return { rows, totals, totalCount };
  }, [devices, statusSummary.orderedStatuses]);

  const lossAnalysis = useMemo(() => {
    const map = new Map<
      string,
      { label: string; purchase: number; depreciation: number; count: number }
    >();
    devices.forEach((item) => {
      let label = "未命名";
      if (lossGroupBy === "device") {
        label = buildDeviceLabel(item);
      } else if (lossGroupBy === "department") {
        label = normalizeDepartment(item.department);
      } else {
        label = buildModelLabel(item);
      }
      const purchase = toNumber(item.purchase);
      const depreciation = toNumber(item.depreciation);
      const current = map.get(label) || {
        label,
        purchase: 0,
        depreciation: 0,
        count: 0,
      };
      current.purchase += purchase;
      current.depreciation += depreciation;
      current.count += 1;
      map.set(label, current);
    });
    const rows = Array.from(map.values()).map((item) => {
      const loss = item.purchase - item.depreciation;
      const lossRate = item.purchase > 0 ? loss / item.purchase : 0;
      return { ...item, loss, lossRate };
    });
    const sorted = [...rows];
    if (lossGroupBy === "department") {
      sorted.sort(
        (a, b) =>
          b.purchase - a.purchase ||
          b.lossRate - a.lossRate ||
          b.loss - a.loss
      );
    } else {
      sorted.sort(
        (a, b) =>
          b.lossRate - a.lossRate ||
          b.loss - a.loss ||
          b.purchase - a.purchase
      );
    }
    const rateRows = rows
      .filter((row) => row.purchase > 0)
      .sort((a, b) => b.lossRate - a.lossRate);
    const worst = rateRows[0];
    const best = rateRows[rateRows.length - 1];
    return { rows: sorted, worst, best };
  }, [devices, lossGroupBy]);

  const departmentAssets = useMemo(() => {
    const map = new Map<
      string,
      {
        department: string;
        purchase: number;
        depreciation: number;
        idleValue: number;
        count: number;
      }
    >();
    const now = dayjs();
    let totalPurchase = 0;
    let totalDepreciation = 0;
    let totalMonths = 0;
    let monthsCount = 0;
    let idleValueTotal = 0;
    devices.forEach((item) => {
      const department = normalizeDepartment(item.department);
      const status = normalizeStatus(item.state);
      const purchase = toNumber(item.purchase);
      const depreciation = toNumber(item.depreciation);
      totalPurchase += purchase;
      totalDepreciation += depreciation;

      const current = map.get(department) || {
        department,
        purchase: 0,
        depreciation: 0,
        idleValue: 0,
        count: 0,
      };
      current.purchase += purchase;
      current.depreciation += depreciation;
      current.count += 1;
      if (status === "闲置") {
        current.idleValue += depreciation;
        idleValueTotal += depreciation;
      }
      map.set(department, current);

      if (item.created_at) {
        const monthsUsed = Math.abs(now.diff(item.created_at, "month"));
        totalMonths += monthsUsed;
        monthsCount += 1;
      }
    });
    const rows = Array.from(map.values())
      .map((item) => ({
        ...item,
        loss: item.purchase - item.depreciation,
      }))
      .sort((a, b) => b.purchase - a.purchase)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    const totalLoss = totalPurchase - totalDepreciation;
    const avgYearsUsed = monthsCount ? totalMonths / monthsCount / 12 : 0;
    const annualDepRate =
      avgYearsUsed > 0 && totalPurchase > 0
        ? totalLoss / totalPurchase / avgYearsUsed
        : 0;
    const topDepartments = rows.slice(0, 3);
    return {
      rows,
      idleValueTotal,
      annualDepRate,
      topDepartments,
    };
  }, [devices]);

  const statusItems = statusSummary.items;
  const statusKeys = statusSummary.orderedStatuses;
  const totalDevices = statusSummary.total;
  const idleCount = statusSummary.counts.get("闲置") || 0;
  const inUseCount = statusSummary.counts.get("在用") || 0;
  const scrapCount = statusSummary.counts.get("报废") || 0;
  const repairCount = statusSummary.counts.get("待维修") || 0;

  const lossGroupOptions: Array<{ label: string; value: LossGroupBy }> = [
    { value: "device", label: "按设备" },
    { value: "model", label: "按型号" },
    { value: "department", label: "按部门" },
  ];

  const viewModeOptions: Array<{ label: string; value: ViewMode }> = [
    { value: "table", label: "表格" },
    { value: "chart", label: "可视化" },
  ];

  const statusMaxCount = Math.max(
    1,
    ...statusItems.map((item) => item.count)
  );
  const departmentMaxTotal = Math.max(
    1,
    ...departmentStatus.rows.map((row) => row.total)
  );
  const lossChartRows = lossAnalysis.rows.slice(0, 8);
  const assetChartRows = departmentAssets.rows.slice(0, 8);
  const assetMaxPurchase = Math.max(
    1,
    ...assetChartRows.map((row) => row.purchase)
  );

  const loadingState = (
    <div className="py-6 text-center text-xs text-zinc-500">
      数据加载中...
    </div>
  );
  const emptyState = (
    <div className="py-6 text-center text-xs text-zinc-500">暂无设备数据</div>
  );

  const tabBarExtra = (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500">展示形态</span>
      <Segmented
        size="small"
        options={viewModeOptions}
        value={viewMode}
        onChange={(value) => setViewMode(value as ViewMode)}
      />
    </div>
  );

  const tabs: TabsProps["items"] = [
    {
      key: "status",
      label: "设备状态",
      children: (
        <div className="p-4">
          <div className="text-sm font-medium text-zinc-800">
            设备状态 × 数量（健康度基础）
          </div>
          <div className="mt-4">
            {viewMode === "table" ? (
              <div className="overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-zinc-600">
                        状态
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-zinc-600">
                        数量
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-zinc-600">
                        占比
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {devicesLoading ? (
                      <tr>
                        <td
                          className="px-3 py-4 text-center text-zinc-500"
                          colSpan={3}
                        >
                          数据加载中...
                        </td>
                      </tr>
                    ) : statusItems.length ? (
                      statusItems.map((item) => (
                        <tr
                          key={item.status}
                          className="border-t border-gray-100"
                        >
                          <td className="px-3 py-2 text-left text-zinc-800">
                            {item.status}
                          </td>
                          <td className="px-3 py-2 text-right text-zinc-800">
                            {formatNumber(item.count)}
                          </td>
                          <td className="px-3 py-2 text-right text-zinc-800">
                            {item.percentage}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          className="px-3 py-4 text-center text-zinc-500"
                          colSpan={3}
                        >
                          暂无设备数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div>
                {devicesLoading ? (
                  loadingState
                ) : totalDevices > 0 ? (
                  <div className="space-y-3">
                    {statusItems.map((item) => (
                      <div
                        key={item.status}
                        className="flex items-center gap-3"
                      >
                        <div className="w-16 text-xs text-zinc-600">
                          {item.status}
                        </div>
                        <div className="flex-1">
                          <div className="h-2 rounded bg-zinc-100">
                            <div
                              className={`h-2 rounded ${getStatusColor(
                                item.status
                              )}`}
                              style={{
                                width: `${(item.count / statusMaxCount) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="w-12 text-right text-xs text-zinc-600">
                          {formatNumber(item.count)}
                        </div>
                        <div className="w-14 text-right text-xs text-zinc-400">
                          {item.percentage}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  emptyState
                )}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
              <div>在用设备占比：{formatPercent(inUseCount, totalDevices)}</div>
              <div>闲置设备占比：{formatPercent(idleCount, totalDevices)}</div>
              <div>报废率：{formatPercent(scrapCount, totalDevices)}</div>
              <div>
                待维修占比：{formatPercent(repairCount, totalDevices)}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      label: "部门状态",
      children: (
        <div className="p-4">
          <div className="text-sm font-medium text-zinc-800">
            部门 × 设备数量 / 状态（资源调拨依据）
          </div>
          <div className="mt-4">
            {viewMode === "table" ? (
              <div className="overflow-auto">
                <table className="w-full min-w-[640px] text-xs">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-zinc-600">
                        部门
                      </th>
                      {statusKeys.map((status) => (
                        <th
                          key={status}
                          className="px-3 py-2 text-right font-medium text-zinc-600"
                        >
                          {status}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-right font-medium text-zinc-600">
                        合计
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {devicesLoading ? (
                      <tr>
                        <td
                          className="px-3 py-4 text-center text-zinc-500"
                          colSpan={statusKeys.length + 2}
                        >
                          数据加载中...
                        </td>
                      </tr>
                    ) : departmentStatus.rows.length ? (
                      <>
                        {departmentStatus.rows.map((row) => (
                          <tr
                            key={row.department}
                            className="border-t border-gray-100"
                          >
                            <td className="px-3 py-2 text-left text-zinc-800">
                              {row.department}
                            </td>
                            {statusKeys.map((status) => (
                              <td
                                key={status}
                                className="px-3 py-2 text-right text-zinc-800"
                              >
                                {formatNumber(row.counts[status] || 0)}
                              </td>
                            ))}
                            <td className="px-3 py-2 text-right text-zinc-800">
                              {formatNumber(row.total)}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t border-gray-200 bg-zinc-50">
                          <td className="px-3 py-2 text-left text-zinc-700 font-medium">
                            合计
                          </td>
                          {statusKeys.map((status) => (
                            <td
                              key={status}
                              className="px-3 py-2 text-right text-zinc-700 font-medium"
                            >
                              {formatNumber(departmentStatus.totals[status] || 0)}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-right text-zinc-700 font-medium">
                            {formatNumber(departmentStatus.totalCount)}
                          </td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td
                          className="px-3 py-4 text-center text-zinc-500"
                          colSpan={statusKeys.length + 2}
                        >
                          暂无设备数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div>
                {statusKeys.length ? (
                  <div className="mb-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                    {statusKeys.map((status) => (
                      <div key={status} className="flex items-center gap-1">
                        <span
                          className={`h-2 w-2 rounded-sm ${getStatusColor(
                            status
                          )}`}
                        />
                        <span>{status}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {devicesLoading ? (
                  loadingState
                ) : departmentStatus.rows.length ? (
                  <div className="space-y-3">
                    {departmentStatus.rows.map((row) => {
                      const width =
                        departmentMaxTotal > 0
                          ? (row.total / departmentMaxTotal) * 100
                          : 0;
                      return (
                        <div
                          key={row.department}
                          className="flex items-center gap-3"
                        >
                          <div className="w-28 text-xs text-zinc-600 truncate">
                            {row.department}
                          </div>
                          <div className="flex-1">
                            <div className="h-3 rounded bg-zinc-100">
                              <div
                                className="flex h-3 rounded overflow-hidden"
                                style={{ width: `${width}%` }}
                              >
                                {statusKeys.map((status) => {
                                  const segmentWidth =
                                    row.total > 0
                                      ? ((row.counts[status] || 0) / row.total) *
                                        100
                                      : 0;
                                  return (
                                    <div
                                      key={status}
                                      className={`h-3 ${getStatusColor(status)}`}
                                      style={{ width: `${segmentWidth}%` }}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="w-12 text-right text-xs text-zinc-500">
                            {formatNumber(row.total)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  emptyState
                )}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "loss",
      label: "资产损耗",
      children: (
        <div className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-medium text-zinc-800">
              采购价 × 二手价 → 资产损耗分析
            </div>
            <Segmented
              size="small"
              options={lossGroupOptions}
              value={lossGroupBy}
              onChange={(value) => setLossGroupBy(value as LossGroupBy)}
            />
          </div>
          <div className="mt-4">
            {viewMode === "table" ? (
              <div className="overflow-auto">
                <table className="w-full min-w-[720px] text-xs">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-zinc-600">
                        {lossGroupBy === "department"
                          ? "部门"
                          : lossGroupBy === "device"
                          ? "设备"
                          : "型号"}
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-zinc-600">
                        采购价
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-zinc-600">
                        当前二手价
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-zinc-600">
                        折旧金额
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-zinc-600">
                        折旧率
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {devicesLoading ? (
                      <tr>
                        <td
                          className="px-3 py-4 text-center text-zinc-500"
                          colSpan={5}
                        >
                          数据加载中...
                        </td>
                      </tr>
                    ) : lossAnalysis.rows.length ? (
                      lossAnalysis.rows.map((row) => (
                        <tr key={row.label} className="border-t border-gray-100">
                          <td className="px-3 py-2 text-left text-zinc-800">
                            {row.label}
                          </td>
                          <td className="px-3 py-2 text-right text-zinc-800">
                            {formatAmount(row.purchase)}
                          </td>
                          <td className="px-3 py-2 text-right text-zinc-800">
                            {formatAmount(row.depreciation)}
                          </td>
                          <td className="px-3 py-2 text-right text-zinc-800">
                            {formatAmount(row.loss)}
                          </td>
                          <td className="px-3 py-2 text-right text-zinc-800">
                            {formatPercent(row.loss, row.purchase)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          className="px-3 py-4 text-center text-zinc-500"
                          colSpan={5}
                        >
                          暂无设备数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div>
                {devicesLoading ? (
                  loadingState
                ) : lossChartRows.length ? (
                  <div className="space-y-3">
                    {lossChartRows.map((row) => {
                      const rate = Math.min(
                        100,
                        Math.max(0, row.lossRate * 100)
                      );
                      return (
                        <div key={row.label} className="flex items-center gap-3">
                          <div className="w-36 text-xs text-zinc-600 truncate">
                            {row.label}
                          </div>
                          <div className="flex-1">
                            <div className="h-2 rounded bg-zinc-100">
                              <div
                                className="h-2 rounded bg-rose-500"
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                          </div>
                          <div className="w-14 text-right text-xs text-zinc-600">
                            {formatPercentValue(row.lossRate)}
                          </div>
                          <div className="w-24 text-right text-[11px] text-zinc-400">
                            采 {formatAmount(row.purchase)} / 二{" "}
                            {formatAmount(row.depreciation)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  emptyState
                )}
                <div className="mt-2 text-xs text-zinc-500">
                  折旧率 = 折旧金额 / 采购价
                  {lossAnalysis.rows.length > lossChartRows.length
                    ? `，仅展示前 ${lossChartRows.length} 条`
                    : ""}
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 text-xs text-zinc-500">
            <div>
              贬值最快：
              {lossAnalysis.worst
                ? `${lossAnalysis.worst.label}（折旧率 ${formatPercent(
                    lossAnalysis.worst.loss,
                    lossAnalysis.worst.purchase
                  )}）`
                : "暂无数据"}
            </div>
            <div>
              保值最好：
              {lossAnalysis.best
                ? `${lossAnalysis.best.label}（折旧率 ${formatPercent(
                    lossAnalysis.best.loss,
                    lossAnalysis.best.purchase
                  )}）`
                : "暂无数据"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "assets",
      label: "部门成本",
      children: (
        <div className="p-4">
          <div className="text-sm font-medium text-zinc-800">
            部门 × 资产原值 / 残值（部门成本视角）
          </div>
          <div className="mt-4">
            {viewMode === "table" ? (
              <div className="overflow-auto">
                <table className="w-full min-w-[720px] text-xs">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-zinc-600">
                        排名
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-zinc-600">
                        部门
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-zinc-600">
                        采购总额
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-zinc-600">
                        当前二手总值
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-zinc-600">
                        资产损耗额
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {devicesLoading ? (
                      <tr>
                        <td
                          className="px-3 py-4 text-center text-zinc-500"
                          colSpan={5}
                        >
                          数据加载中...
                        </td>
                      </tr>
                    ) : departmentAssets.rows.length ? (
                      departmentAssets.rows.map((row) => (
                        <tr
                          key={row.department}
                          className="border-t border-gray-100"
                        >
                          <td className="px-3 py-2 text-left text-zinc-800">
                            {row.rank}
                          </td>
                          <td className="px-3 py-2 text-left text-zinc-800">
                            {row.department}
                          </td>
                          <td className="px-3 py-2 text-right text-zinc-800">
                            {formatAmount(row.purchase)}
                          </td>
                          <td className="px-3 py-2 text-right text-zinc-800">
                            {formatAmount(row.depreciation)}
                          </td>
                          <td className="px-3 py-2 text-right text-zinc-800">
                            {formatAmount(row.loss)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          className="px-3 py-4 text-center text-zinc-500"
                          colSpan={5}
                        >
                          暂无设备数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div>
                <div className="mb-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-emerald-500" />
                    <span>当前二手总值</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-amber-400" />
                    <span>资产损耗</span>
                  </div>
                </div>
                {devicesLoading ? (
                  loadingState
                ) : assetChartRows.length ? (
                  <div className="space-y-3">
                    {assetChartRows.map((row) => {
                      const total = row.purchase;
                      const depreciationRate =
                        total > 0
                          ? Math.min(1, Math.max(0, row.depreciation / total))
                          : 0;
                      const lossRate =
                        total > 0
                          ? Math.min(1, Math.max(0, row.loss / total))
                          : 0;
                      const width =
                        assetMaxPurchase > 0
                          ? (total / assetMaxPurchase) * 100
                          : 0;
                      return (
                        <div key={row.department} className="flex items-center gap-3">
                          <div className="w-28 text-xs text-zinc-600 truncate">
                            {row.department}
                          </div>
                          <div className="flex-1">
                            <div className="h-3 rounded bg-zinc-100 overflow-hidden">
                              <div
                                className="flex h-3"
                                style={{ width: `${width}%` }}
                              >
                                <div
                                  className="h-3 bg-emerald-500"
                                  style={{ width: `${depreciationRate * 100}%` }}
                                />
                                <div
                                  className="h-3 bg-amber-400"
                                  style={{ width: `${lossRate * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="w-20 text-right text-xs text-zinc-500">
                            {formatAmount(row.purchase)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  emptyState
                )}
                {departmentAssets.rows.length > assetChartRows.length ? (
                  <div className="mt-2 text-xs text-zinc-500">
                    仅展示前 {assetChartRows.length} 条
                  </div>
                ) : null}
              </div>
            )}
          </div>
          <div className="mt-3 text-xs text-zinc-500">
            <div>
              闲置资产价值（按二手价汇总）：
              {formatAmount(departmentAssets.idleValueTotal)}元
            </div>
            <div>
              资产年均折旧率：{formatPercentValue(departmentAssets.annualDepRate)}
            </div>
            <div>
              部门资产占用排名：
              {departmentAssets.topDepartments.length
                ? departmentAssets.topDepartments
                    .map((row) => `${row.rank}.${row.department}`)
                    .join(" / ")
                : "暂无数据"}
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="mt-8 pb-6 px-5 max-w-3xl">
      <div className="text-sm font-semibold text-zinc-900">数据透视</div>
      <div className="mt-4 rounded border border-gray-200 bg-white">
        <Tabs
          defaultActiveKey="status"
          items={tabs}
          tabBarExtraContent={tabBarExtra}
        />
      </div>
    </div>
  );
};

export default Analyze;
