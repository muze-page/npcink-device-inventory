//导入导出变更数据
import { useState } from "react";
import { Space, Button, message, Modal } from "antd";
import { exportSQLData, importSQLData } from "@/axios";
import {
  TableDataName,
  TableChangeName,
  TableStyleDataName,
  Site,
} from "@/store/index";
import { exportTable } from "@/store/tool";
import { ImportListData } from "@/store/interface";
interface Props {
  name: string; //数据库表名
  /**
   * 基础数据：npcink_device_data
   * 变更数据：npcink_device_change
   * 自定义设备数据：npcink_device_style
   */
}
const App: React.FC<Props> = ({ name }) => {
  //导入数据
  const [jsonContent, setJsonContent] = useState<ImportListData>();

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
    if (jsonContent) {
      //弹窗提示
      Modal.confirm({
        title: "确认导入信息",
        content: (
          <div>
            <p>数据导出时间：{jsonContent.time}</p>
            <p>数据导出网址：{jsonContent.site}</p>
            <p className="text-red-600">确定要导入此数据吗？</p>
          </div>
        ),
        onOk() {
          //console.log("用户点击了“确定”按钮");
          // 在这里处理确认逻辑
          const jsonString = JSON.stringify(jsonContent); //格式化数据
          importSQLData(name, jsonString); //传递
        },
        onCancel() {
          //console.log("用户点击了“取消”按钮");
          // 在这里处理取消逻辑
        },
      });
    } else {
      message.error("请选择文件或文件内容为空");
      return;
    }
  };

  //导出数据
  const downloadData = async () => {
    const jsonData = await exportSQLData(name);
    // 如果没有拿到值，就此结束
    if (!jsonData) {
      return;
    }

    // 添加时间键值对
    const currentTime = new Date().toLocaleString();

    //添加网址
    const dataWithTime = { site: Site, time: currentTime, data: jsonData };

    // 将数据转换为 JSON 字符串
    const jsonString = JSON.stringify(dataWithTime);

    // 创建 Blob 对象
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    if (name == TableDataName) {
      link.download = "硬件基础数据_导出文件_" + Site + ".json";
    }
    if (name == TableStyleDataName) {
      link.download = "自定义设备数据_导出文件_" + Site + ".json";
    }
    if (name == TableChangeName) {
      link.download = "硬件变更数据_导出文件_" + Site + ".json";
    }

    link.click();

    // 等待一段时间后释放 URL 对象
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };
  //导出表格
  const exportTableData = async () => {
    const jsonData = await exportSQLData(name);

    //准备导出文件名
    let tableName = "暂无";

    if (name === TableDataName) {
      tableName = "硬件基础数据_导出文件";
    }
    if (name === TableStyleDataName) {
      tableName = "自定义设备基础数据_导出文件";
    }

    if (name === TableChangeName) {
      tableName = "硬件变更数据_导出文件";
    }
    // 如果没有拿到值，就此结束
    exportTable(jsonData, tableName);
  };
  return (
    <Space>
      <input type="file" accept=".json" onChange={handleFileChange} />
      <Button onClick={importData}>导入</Button>
      <Button onClick={downloadData}>导出</Button>
      <Button onClick={exportTableData}>导出表格</Button>
    </Space>
  );
};

export default App;
