/**
 * 表格 - 数据展示
 */
//颜色 表头 表数据
//添加hover效果

//表头
import { TableData } from "@/store/interface";

interface Props {
  thData: string[];
  tableData: TableData[];
}
const App: React.FC<Props> = ({ thData, tableData }) => {
  return (
    <>
      <div className="h-full relative box-border">
        <div className="flex flex-col w-auto h-full">
          {/**顶部 */}
          <div className="relative box-border">
            <div className="rounded-none overflow-hidden bg-white relative">
              <table className="w-full min-w-full m-0 border-separate border-spacing-0 table-fixed">
                <thead>
                  <tr>
                    {thData.map((tab, index) => (
                      <th
                        key={index}
                        className="text-sm text-zinc-900 h-12 bg-orange-50 relative box-border text-left"
                      >
                        <span className="py-3 px-4 flex items-center">
                          <span>{tab}</span>
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
              </table>
            </div>
          </div>
          {/**底部 */}
          <div className="flex min-h-0 relative box-border">
            <div className="max-h-[275px] relative min-h-[40px] overflow-auto bg-white w-full">
              <table className="w-full min-w-full m-0 border-separate border-spacing-0 table-fixed">
                <tbody>
                  {tableData.map((tab, index) => (
                    <tr key={index}>
                      <td className="text-sm h-14 border-b-1 border-solid  border-gray-200 text-zinc-900 text-left break-all bg-white">
                        <span className="py-3 px-4 flex items-center">
                          <span className="block w-full">{tab.type}</span>
                        </span>
                      </td>
                      <td className="text-sm h-14 border-b-1 border-solid  border-gray-200 text-zinc-900 text-left break-all bg-white">
                        <span className="py-3 px-4 flex items-center">
                          <span className="block w-full">{tab.sum}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
