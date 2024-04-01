//导入导出变更数据
import { useState } from "react";
import { Space, Button } from "antd";
import { exportSQLData, importSQLData } from "@/store/axios";

interface Props {
  name: string; //数据库表名
  /**
   * 基础数据：custom_table
   * 变更数据：custom_change
   */
}
const App: React.FC<Props> = ({ name }) => {
  //导入数据
  const [jsonContent, setJsonContent] = useState(null);

  //选中数据
  const handleFileChange = (event: any) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const content = e.target.result;
      const jsonData = JSON.parse(content);
      setJsonContent(jsonData); //保存数据
    };
    reader.readAsText(file);
  };

  //保存到数据库
  const importData = () => {
    const jsonString = JSON.stringify(jsonContent);
    importSQLData(name, jsonString);
  };

  //导出数据
  const downloadData = async () => {
    const jsonData = await exportSQLData(name);
    const jsonString = JSON.stringify(jsonData.data);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    if (name == "custom_table") {
      link.download = "硬件管理数据-导出文件.json";
    }

    if (name == "custom_change") {
      link.download = "硬件变更数据-导出文件.json";
    }
    link.click();

    // 等待一段时间后释放 URL 对象
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };
  return (
    <Space>
      <input type="file" accept=".json" onChange={handleFileChange} />
      <Button type="text" onClick={importData}>
        导入
      </Button>
      <Button type="text" onClick={downloadData}>
        导出
      </Button>
    </Space>
  );
};

export default App;
