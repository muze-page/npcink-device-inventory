/**
 * 电脑硬件资产盘点
 */
import { useState, useEffect } from "react";
import { getPercentage, formatNumber } from "@/utils/tool";
import { TableData, PcSummary } from "@/type/index";
import { getPcSummary } from "@/services/index";

import Ad from "@/pages/check/block/ad";
import TabHeader from "@/pages/check/block/tableHeader";
//导入tab组件
import Baseboard from "@/pages/check/tab/baseboard";
import Cpu from "@/pages/check/tab/cpu";
import Disk from "@/pages/check/tab/disk";
import Memory from "@/pages/check/tab/memory";
import Header from "@/components/tabHeader";

const sumTableData = (data: TableData[]) =>
  data.reduce((accumulator, item) => accumulator + item.sum, 0);

const App: React.FC = () => {
  const [summary, setSummary] = useState<PcSummary | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await getPcSummary();
        setSummary(data);
      } catch (error) {
        console.error("获取盘点数据失败:", error);
        setSummary(null);
      }
    };

    fetchSummary();
  }, []);

  const cpuData = summary?.cpu || [];
  const diskData = summary?.disk || [];
  const memoryData = summary?.memory || [];
  const baseboardData = summary?.baseboard || [];
  const totals = summary?.totals || { purchase: 0, depreciation: 0, residual: 0 };

  //表头内容
  const items = [
    {
      key: "1",
      label: `CPU（个）`,
      sum: sumTableData(cpuData),
      color: "from-blue-100 to-blue-200",
      activeColor: "from-blue-200 to-blue-300",
      children: <Cpu tableData={cpuData} />,
    },
    {
      key: "2",
      label: `硬盘（块）`,
      sum: sumTableData(diskData),
      color: "from-orange-100 to-orange-200",
      activeColor: "from-orange-200 to-orange-300",
      children: <Disk tableData={diskData} />,
    },
    {
      key: "3",
      label: `内存（条）`,
      sum: sumTableData(memoryData),
      color: "from-red-100 to-red-200",
      activeColor: "from-red-200 to-red-300",
      children: <Memory tableData={memoryData} />,
    },
    {
      key: "4",
      label: `主板（个）`,
      sum: sumTableData(baseboardData),
      color: "from-green-100 to-green-200",
      activeColor: "from-green-200 to-green-300",
      children: <Baseboard tableData={baseboardData} />,
    },
  ];

  const totalPurchase = totals.purchase || 0;
  const totalDepreciation = totals.depreciation || 0;
  const totalResidual = totals.residual || 0;

  //切换表格
  const [activeTab, setActiveTab] = useState(0);

  //点击切换方法
  const handleTabClick = (index: number) => {
    setActiveTab(index);
  };

  return (
    <>
      <div className="h-[625px] relative bg-white pb-6 px-5 rounded-r border-rose-600 max-w-3xl">
        {/**标题 */}
        <Header title="资产盘点" />
        {/**表头 */}
        <TabHeader
          items={items}
          handleTabClick={handleTabClick}
          activeTab={activeTab}
        />
        <div className="relative mt-4 h-80">
          {/**
             *  <div className="relative">
            <div className="flex flex-col h-full">
             */}

          <div className="relative rounded-none box-border w-full min-h-0">
            {/**表体内容 */}
            <div className="content">{items[activeTab].children}</div>
          </div>
        </div>

        {/**广告内容 */}
        <Ad />
      </div>
      <div className="mt-6 pb-6 px-5">
        <table>
          <tr>
            <th className="w-28 text-center">总采购价</th>
            <th className="w-28 text-center">总二手价</th>
            <th className="w-28 text-center">二手折价率</th>
            <th className="w-28 text-center">总残值</th>
            <th className="w-28 text-center">残值率</th>
          </tr>

          <tr>
            <td className="w-28 text-center">
              {formatNumber(totalPurchase) || 0}元
            </td>
            <td className="w-28 text-center">
              {formatNumber(totalDepreciation) || 0}元
            </td>
            <td className="w-28 text-center">
              {getPercentage(totalDepreciation, totalPurchase)}
            </td>
            <td className="w-28 text-center">
              {formatNumber(totalResidual)}元
            </td>
            <td className="w-28 text-center">
              {getPercentage(totalResidual, totalPurchase)}
            </td>
          </tr>
        </table>

        <ul className="mt-4 text-xs">
          <li> 计算方式：</li>
          <li>残值 = 采购价 - 已折旧值</li>
          <li>已折旧值 = 已使用月数 * 每月折旧值</li>
          <li>每月折旧值 = 总折旧值 / 总折旧月数</li>
          <li>总折旧值 = 采购价 * (1 - 残值率)</li>
          <li>二手折价率 = 总二手价 / 采购价</li>
          <li>残值率 = 总残值 / 采购价</li>
        </ul>
      </div>
    </>
  );
};

export default App;
