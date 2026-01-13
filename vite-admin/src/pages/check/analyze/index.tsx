import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { getPercentage, formatNumber } from "@/utils/tool";
import { MysqlDeviceChange } from "@/type/index";
import { getPcListFull } from "@/services/index";

const STATUS_ORDER = ["在用", "闲置", "待维修", "报废"];
const FETCH_PAGE_SIZE = 100;

type LossGroupBy = "device" | "model" | "department";

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

const formatRate = (value: number) => {
  if (!Number.isFinite(value)) return "0%";
  return `${(value * 100).toFixed(2)}%`;
};

const Analyze: React.FC = () => {
  const [devices, setDevices] = useState<MysqlDeviceChange[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [lossGroupBy, setLossGroupBy] = useState<LossGroupBy>("model");

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
        percentage: getPercentage(count, total),
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

  const lossGroupOptions: Array<{ key: LossGroupBy; label: string }> = [
    { key: "device", label: "按设备" },
    { key: "model", label: "按型号" },
    { key: "department", label: "按部门" },
  ];

  return (
    <>
      <div className="mt-8 pb-6 px-5 max-w-3xl">
        <div className="text-sm font-semibold text-zinc-900">
          IT 管理价值（基础但必做）
        </div>

        <div className="mt-4 rounded border border-gray-200 bg-white">
          <div className="px-4 py-2 text-sm font-medium text-zinc-800 border-b border-gray-200">
            设备状态 × 数量（健康度基础）
          </div>
          <div className="p-4">
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
                    <tr key={item.status} className="border-t border-gray-100">
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
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
              <div>在用设备占比：{getPercentage(inUseCount, totalDevices)}</div>
              <div>闲置设备占比：{getPercentage(idleCount, totalDevices)}</div>
              <div>报废率：{getPercentage(scrapCount, totalDevices)}</div>
              <div>
                待维修占比：{getPercentage(repairCount, totalDevices)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded border border-gray-200 bg-white">
          <div className="px-4 py-2 text-sm font-medium text-zinc-800 border-b border-gray-200">
            部门 × 设备数量 / 状态（资源调拨依据）
          </div>
          <div className="p-4 overflow-auto">
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
        </div>
      </div>

      <div className="mt-8 pb-6 px-5 max-w-3xl">
        <div className="text-sm font-semibold text-zinc-900">
          财务价值（开始“值钱”）
        </div>

        <div className="mt-4 rounded border border-gray-200 bg-white">
          <div className="px-4 py-2 text-sm font-medium text-zinc-800 border-b border-gray-200">
            采购价 × 二手价 → 资产损耗分析
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {lossGroupOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setLossGroupBy(option.key)}
                  className={`px-3 py-1 text-xs rounded border ${
                    lossGroupBy === option.key
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-white text-zinc-600 border-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-4 overflow-auto">
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
                          {formatNumber(row.purchase)}
                        </td>
                        <td className="px-3 py-2 text-right text-zinc-800">
                          {formatNumber(row.depreciation)}
                        </td>
                        <td className="px-3 py-2 text-right text-zinc-800">
                          {formatNumber(row.loss)}
                        </td>
                        <td className="px-3 py-2 text-right text-zinc-800">
                          {getPercentage(row.loss, row.purchase)}
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
            <div className="mt-3 text-xs text-zinc-500">
              <div>
                贬值最快：
                {lossAnalysis.worst
                  ? `${lossAnalysis.worst.label}（折旧率 ${getPercentage(
                      lossAnalysis.worst.loss,
                      lossAnalysis.worst.purchase
                    )}）`
                  : "暂无数据"}
              </div>
              <div>
                保值最好：
                {lossAnalysis.best
                  ? `${lossAnalysis.best.label}（折旧率 ${getPercentage(
                      lossAnalysis.best.loss,
                      lossAnalysis.best.purchase
                    )}）`
                  : "暂无数据"}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded border border-gray-200 bg-white">
          <div className="px-4 py-2 text-sm font-medium text-zinc-800 border-b border-gray-200">
            部门 × 资产原值 / 残值（部门成本视角）
          </div>
          <div className="p-4 overflow-auto">
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
                        {formatNumber(row.purchase)}
                      </td>
                      <td className="px-3 py-2 text-right text-zinc-800">
                        {formatNumber(row.depreciation)}
                      </td>
                      <td className="px-3 py-2 text-right text-zinc-800">
                        {formatNumber(row.loss)}
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
            <div className="mt-3 text-xs text-zinc-500">
              <div>
                闲置资产价值（按二手价汇总）：
                {formatNumber(departmentAssets.idleValueTotal)}元
              </div>
              <div>
                资产年均折旧率：{formatRate(departmentAssets.annualDepRate)}
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
        </div>
      </div>
    </>
  );
};

export default Analyze;
