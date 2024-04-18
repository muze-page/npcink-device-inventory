//导入导出变更数据
import { useState } from "react";
import { Space, Button, message } from "antd";
import { exportSQLData, importSQLData } from "@/store/axios";
import {TableDataName,TableChangeName} from "@/store/index";
interface Props {
  name: string; //数据库表名
  /**
   * 基础数据：npcink_device_data
   * 变更数据：npcink_device_change
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
    if (jsonContent === null) {
      message.error("请选择文件或文件内容为空");
      return;
    } else {
      const jsonString = JSON.stringify(jsonContent);
      importSQLData(name, jsonString);
      return;
    }
  };

  //导出数据
  const downloadData = async () => {
    const jsonData = await exportSQLData(name);
    //如果没有拿到值，就此结束
    if (!jsonData) {
      return;
    }

    const jsonString = JSON.stringify(jsonData);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    if (name == TableDataName) {
      link.download = "硬件基础数据-导出文件.json";
    }

    if (name == TableChangeName) {
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
      <Button onClick={importData}>导入</Button>
      <Button onClick={downloadData}>导出</Button>
    </Space>
  );
};

export default App;
