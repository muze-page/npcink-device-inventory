//导入导出变更数据
import { useState } from "react";
import { Space, Button, message, Modal, Spin } from "antd";
import { exportSQLData, importSQLData } from "@/services/index";
import { Site } from "@/utils/index";
import { exportTable, formatDate } from "@/utils/tool";
import { ImportListData, ImportReport } from "@/type/index";

interface Props {
  name: string; //数据库表名
}

//数据库名称翻译
const translateTableName = (name: string) => {
  switch (name) {
    case "npcink_device_pc":
      return "电脑设备数据";
    case "npcink_device_style":
      return "自定义设备数据";
    case "npcink_device_manual":
      return "手动变更数据";
    case "npcink_device_auto":
      return "自动变更数据";
    default:
      return name;
  }
};

const App: React.FC<Props> = ({ name }) => {
  const EXPORT_PAGE_SIZE = 500;
  const MAX_ERROR_DISPLAY = 20;

  //导入数据
  const [jsonContent, setJsonContent] = useState<ImportListData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  //选中数据
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      message.error("未选择文件");
      return;
    }

    // 检查文件类型
    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      message.error("请选择 JSON 格式的文件");
      return;
    }

    // 检查文件大小（限制为 10MB）
    if (file.size > 10 * 1024 * 1024) {
      message.error("文件大小不能超过 10MB");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();

    reader.onloadstart = () => {
      setLoading(true);
    };

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const content = e.target?.result as string;
        if (!content) {
          message.error("文件内容为空");
          return;
        }

        const jsonData = JSON.parse(content);

        // 验证必要的字段
        if (!jsonData.name || !Array.isArray(jsonData.data)) {
          message.error("文件格式不正确，请选择有效的导出文件");
          return;
        }

        setJsonContent(jsonData); //保存数据
        message.success(`成功加载文件: ${file.name}`);
      } catch (error) {
        message.error("JSON 文件解析失败，请检查文件格式");
        console.error("文件解析错误:", error);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      message.error("文件读取失败");
      setLoading(false);
    };

    reader.readAsText(file);
  };

  //保存到数据库
  //保存到数据库
  const importData = async () => {
    if (!jsonContent) {
      message.error("请选择文件或文件内容为空");
      return;
    }

    //弹窗提示
    Modal.confirm({
      title: "确认导入信息",
      content: (
        <div>
          <p>数据导出时间：{formatDate(jsonContent.time)}</p>
          <p>数据导出网址：{jsonContent.site}</p>
          <p>
            数据导出名称：<b>{translateTableName(jsonContent.name)}</b>
          </p>
          <p>
            需要文件名称：<b>{translateTableName(name)}</b>
          </p>
          <p className="mt-4 text-zinc-400 ">
            仅导入当前不存在的新数据，导入成功后，需刷新页面可见
          </p>
          <p className="mt-4 text-red-600 ">您确定要导入此数据吗？</p>
        </div>
      ),
      onOk: () => {
        //进行表格名称判断
        if (name === jsonContent.name) {
          return handleImport(); // 返回Promise以便Modal正确处理
        } else {
          message.error(
            `文件类型不匹配：需要 ${translateTableName(
              name
            )}，但选择了 ${translateTableName(jsonContent.name)}`
          );
          return Promise.reject(); // 确保Modal知道操作失败
        }
      },
      onCancel() {
        //console.log("用户点击了“取消”按钮");
        // 在这里处理取消逻辑
      },
    });
  };

  // 独立的导入处理函数
  const showImportReport = (report: ImportReport) => {
    const errors = report.errors || [];
    const visibleErrors = errors.slice(0, MAX_ERROR_DISPLAY);
    Modal.info({
      title: "导入报告",
      width: 520,
      content: (
        <div>
          <p>总记录：{report.total_records}</p>
          <p>成功：{report.imported_records}</p>
          <p>跳过：{report.skipped_records}</p>
          <p>失败：{report.failed_records}</p>
          {visibleErrors.length > 0 ? (
            <div className="mt-3">
              <p className="text-sm text-zinc-500">失败明细（仅展示前 {MAX_ERROR_DISPLAY} 条）</p>
              <div className="max-h-40 overflow-auto text-sm">
                {visibleErrors.map((item, index) => (
                  <div key={`${item.index}-${index}`}>
                    #{item.index} {item.id ? `(${item.id})` : ""}：{item.reason}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ),
    });
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      const res = await importSQLData(name, JSON.stringify(jsonContent));
      if (res?.data) {
        showImportReport(res.data);
      }
    } catch (error: any) {
      console.error("导入错误:", error);
      if (!error?.response) {
        message.error("导入过程中发生错误，请重试");
      }
    } finally {
      setLoading(false);
    }
  };

  //导出数据
  const fetchExportPages = async (format: "json" | "csv") => {
    let page = 1;
    let totalPages = 1;
    const items: Array<Record<string, unknown>> = [];
    const csvChunks: string[] = [];
    const includeDetail = format === "json" ? 1 : 0;

    while (page <= totalPages) {
      const res = await exportSQLData(name, {
        page,
        per_page: EXPORT_PAGE_SIZE,
        format,
        detail: includeDetail,
      });
      if (!res?.success || !res.data) {
        throw new Error(res?.message || "导出失败");
      }
      const payload = res.data;
      totalPages = payload.total_pages > 0 ? payload.total_pages : 1;
      if (format === "csv") {
        if (payload.csv) {
          csvChunks.push(payload.csv);
        }
      } else {
        items.push(...(payload.items || []));
      }
      page += 1;
    }

    return {
      items,
      csv: csvChunks.join(""),
    };
  };

  const downloadData = async () => {
    try {
      setLoading(true);
      const exportResult = await fetchExportPages("json");
      // 添加时间键值对
      const currentTime = new Date().toLocaleString();

      //添加网址
      const dataWithTime = {
        site: Site,
        time: currentTime,
        name: name,
        data: exportResult.items || [],
      };

      // 将数据转换为 JSON 字符串
      const jsonString = JSON.stringify(dataWithTime, null, 2);

      // 创建 Blob 对象
      const blob = new Blob([jsonString], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;

      const tableName = translateTableName(name) || "数据";
      link.download = `${tableName}_导出文件_${Site}_${currentTime}.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 等待一段时间后释放 URL 对象
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      //message.success("数据导出成功");
    } catch (error: any) {
      console.error("导出错误:", error);
      if (!error?.response) {
        message.error("导出过程中发生错误，请重试");
      }
    } finally {
      setLoading(false);
    }
  };

  //导出表格
  const exportTableData = async () => {
    try {
      setLoading(true);
      const exportResult = await fetchExportPages("json");

      //准备导出文件名
      const tableName = translateTableName(name)
        ? `${translateTableName(name)}_导出文件`
        : "数据导出文件";

      // 如果没有拿到值，就此结束
      exportTable(exportResult.items || [], tableName);
      //message.success("表格导出成功");
    } catch (error: any) {
      console.error("表格导出错误:", error);
      if (!error?.response) {
        message.error("表格导出过程中发生错误，请重试");
      }
    } finally {
      setLoading(false);
    }
  };

  const exportCsvData = async () => {
    try {
      setLoading(true);
      const exportResult = await fetchExportPages("csv");
      const currentTime = new Date().toLocaleString();
      const tableName = translateTableName(name) || "数据";
      const csvContent = exportResult.csv ? `\uFEFF${exportResult.csv}` : "";

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${tableName}_导出文件_${Site}_${currentTime}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error: any) {
      console.error("CSV导出错误:", error);
      if (!error?.response) {
        message.error("CSV 导出过程中发生错误，请重试");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space>
      <Spin spinning={loading}>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            disabled={loading}
          />
          {fileName && (
            <span className="text-sm text-gray-500 truncate max-w-xs">
              {fileName}
            </span>
          )}
        </div>
        <Button onClick={importData} disabled={loading || !jsonContent}>
          导入
        </Button>
        <Button onClick={downloadData} disabled={loading}>
          导出
        </Button>
        <Button onClick={exportCsvData} disabled={loading}>
          导出CSV
        </Button>
        <Button onClick={exportTableData} disabled={loading}>
          导出表格
        </Button>
      </Spin>
    </Space>
  );
};

export default App;
