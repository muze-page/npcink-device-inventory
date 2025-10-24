/**
 * 设置页面
 */
import { MysqlDevice } from "@/type";
/**
 *
 * @param jsonData 对象数组
 * @param tableName 下载的文件名称
 * @returns 数组对象导出为表格
 */
export const exportTable = (
  jsonData: MysqlDevice[] | undefined,
  tableName: string
) => {
  // 如果没有拿到值，就此结束
  if (!jsonData) {
    return;
  }

  // 创建一个表格元素
  const table = document.createElement("table");

  // 添加表头
  const thead = document.createElement("thead");
  const headers = Object.keys(jsonData[0]);
  const headerRow = document.createElement("tr");
  headers.forEach((headerText) => {
    const th = document.createElement("th");
    th.appendChild(document.createTextNode(headerText));
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // 添加数据行
  const tbody = document.createElement("tbody");
  jsonData.forEach((rowData: { [x: string]: string }) => {
    const row = document.createElement("tr");
    headers.forEach((header) => {
      const cell = document.createElement("td");
      cell.appendChild(document.createTextNode(rowData[header]));
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  // 将表格转换为 Excel 文件
  const blob = new Blob([table.outerHTML], {
    type: "application/vnd.ms-excel",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = tableName + ".xlsx";
  link.click();

  // 等待一段时间后释放 URL 对象
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
};
