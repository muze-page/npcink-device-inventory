/**
 * 设备详情 - 顶部筛选
 * TODO:搜索备注名或者昵称或编号
 */
import { Space, Select, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

//系统数组
const osList = [
  { value: "all", label: "操作系统" },
  { value: "w12", label: "Windows 12" },
  { value: "w10", label: "Windows 10" },
  { value: "apple", label: "Apple" },
  { value: "linux", label: "Linux" },
  { value: "about", label: "其他" },
];
//选择系统
const osChange = (value: string) => {
  console.log(`selected ${value}`);
};

//内存数组
const memoryList = [
  { value: "all", label: "内存规格" },
  { value: "8", label: "8G" },
  { value: "16", label: "16G" },
  { value: "32", label: "32G" },
  { value: "64", label: "64G" },
];
//选择内存
const handleChange = (value: string) => {
  console.log(`selected ${value}`);
};

//硬盘数组
const diskList = [
  { value: "all", label: "硬盘规格" },
  { value: "120", label: "120G" },
  { value: "256", label: "256G" },
  { value: "512", label: "512G" },
  { value: "1024", label: "1T" },
  { value: "2048", label: "2T" },
  { value: "top", label: "2T以上" },
];
//选择内存
const diskChange = (value: string) => {
  console.log(`selected ${value}`);
};

const App: React.FC = () => {
  return (
    <>
      <div className="mt-6 flex justify-between items-center">
        <p className="text-base font-bold text-[#222] m-0">资产信息</p>
        <div className="w-fit flex items-center">
          <Space wrap>
            <Select
              defaultValue="all"
              style={{ width: 120 }}
              onChange={osChange}
              options={osList}
            />
            <Select
              defaultValue="all"
              style={{ width: 120 }}
              onChange={handleChange}
              options={memoryList}
            />
            <Select
              defaultValue="all"
              style={{ width: 120 }}
              onChange={diskChange}
              options={diskList}
            />
            <Button
              type="primary"
              shape="circle"
              icon={<ReloadOutlined />}
              className="bg-[#1677ff]"
            />
          </Space>
        </div>
      </div>
    </>
  );
};

export default App;
