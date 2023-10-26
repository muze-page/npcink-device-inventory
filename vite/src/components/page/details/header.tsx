/**
 * 设备详情 - 顶部筛选
 * TODO:搜索备注名或者昵称或编号，只能单次筛选
 */
import { useState, useEffect } from "react";
import { Space, Select, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { MysqlDeviceChangeMeat } from "@/store/interface";
import Demo from "@/components/page/details/demo";

//系统数组
const osList = [
  { value: "", label: "全部" },
  { value: "Windows 11", label: "Windows 11" },
  { value: "Windows 10", label: "Windows 10" },
  { value: "macOS", label: "Apple" },
  { value: "linux", label: "Linux" },
  { value: "more", label: "其他" },
];

//系统替换数组
const osObj = [
  { name: "Windows 11", data: "Windows 11" },
  { name: "Windows 10", data: "Windows 10" },
  { name: "linux", data: "linux" },
  { name: "macOS", data: "macOS" },
];

//内存数组
const memoryList = [
  { value: "", label: "全部" },
  { value: "8", label: "8G" },
  { value: "16", label: "16G" },
  { value: "32", label: "32G" },
  { value: "64", label: "64G" },
  { value: "128", label: "128G" },
  { value: "more", label: "其他" },
];

//内存替换数组
const memoryObj = [
  { name: "8", data: "8" },
  { name: "16", data: "16" },
  { name: "32", data: "32" },
  { name: "64", data: "64" },
  { name: "128", data: "128" },
];

//硬盘数组
const diskList = [
  { value: "", label: "全部" },
  { value: "120", label: "120G" },
  { value: "250", label: "250G" },
  { value: "512", label: "512G" },
  { value: "1024", label: "1T" },
  { value: "2048", label: "2T" },
  { value: "more", label: "其他" },
];

/**
 * 检查是否有指定字符串，有则整段替换
 * @param dataArrays
 * @returns
 */
const replaceString = (input: string , obj: any[]) => {
  const match = obj.find(({ name }) => input.includes(name));
  if (match) {
    return match.data;
  }
  //return input;
  return "more"; //没有在上述系统数据中的，替换为more
};

interface Props {
  data: MysqlDeviceChangeMeat[];
  onSet: Function;
}
const App: React.FC<Props> = ({ data, onSet }) => {
  console.log(data);

  //以下功能做参数，由唯一函数决定输出值

  //存储选项值
  const [os, setOs] = useState(null);
  const [memory, setMemory] = useState(null);
  const [disk, setDisk] = useState(null);

  //根据条件对原始数据进行筛选
  const filteredData = data.filter((item) => {
    let meatDisk = item.meat.disk;
    let sizeCondition = true;

    if (disk) {
      if (disk === "120") {
        sizeCondition = meatDisk <= 120;
      } else if (disk === "250") {
        sizeCondition = meatDisk > 120 && meatDisk <= 250;
      } else if (disk === "512") {
        sizeCondition = meatDisk > 250 && meatDisk <= 512;
      } else if (disk === "1024") {
        sizeCondition = meatDisk > 512 && meatDisk <= 1024;
      } else if (disk === "2048") {
        sizeCondition = meatDisk > 1024 && meatDisk <= 2048;
      } else if (disk === "more") {
        sizeCondition = meatDisk > 2048;
      }
    }

    return (
      sizeCondition &&
      (!os || os === "" || replaceString(item.meat.ostype, osObj) === os) &&
      (!memory ||
        item.meat.memory.toString() === "" ||
        replaceString(item.meat.memory.toString(), memoryObj) === memory)
    );
  });

  //避免死循环
  const [isUpdating, setIsUpdating] = useState(false);
  useEffect(() => {
    if (isUpdating) {
      onSet(filteredData);
      setIsUpdating(false);
    }
  }, [filteredData, isUpdating]);

  return (
    <>
      <Demo />
      <div className="mt-6 flex justify-between items-center">
        <p className="text-base font-bold text-[#222] m-0">资产信息</p>
        <div className="w-fit flex items-center">
          <Space wrap>
            系统：
            <Select
              defaultValue=""
              style={{ width: 120 }}
              onChange={(value: any) => {
                setOs(value);
                setIsUpdating(true);
              }}
              options={osList}
            />
            内存：
            <Select
              defaultValue=""
              style={{ width: 120 }}
              onChange={(value: any) => {
                setMemory(value), setIsUpdating(true);
              }}
              options={memoryList}
            />
            硬盘：
            <Select
              defaultValue=""
              style={{ width: 120 }}
              onChange={(value: any) => {
                setDisk(value), setIsUpdating(true);
              }}
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
