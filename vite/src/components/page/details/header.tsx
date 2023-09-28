/**
 * 设备详情 - 顶部筛选
 * TODO:搜索备注名或者昵称或编号
 */
import { useState } from "react";
import { Space, Select, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { MysqlDeviceChangeMeat } from "@/store/interface";

//系统数组
const osList = [
  { value: "all", label: "全部" },
  { value: "Windows 11", label: "Windows 11" },
  { value: "Windows 10", label: "Windows 10" },
  { value: "mac", label: "Apple" },
  { value: "linux", label: "Linux" },
  { value: "more", label: "其他" },
];

//内存数组
const memoryList = [
  { value: "all", label: "全部" },
  { value: "8", label: "8G" },
  { value: "16", label: "16G" },
  { value: "32", label: "32G" },
  { value: "64", label: "64G" },
  { value: "128", label: "128G" },
  { value: "more", label: "其他" },
];

//硬盘数组
const diskList = [
  { value: "all", label: "全部" },
  { value: "120", label: "120G" },
  { value: "250", label: "250G" },
  { value: "512", label: "512G" },
  { value: "1024", label: "1T" },
  { value: "2048", label: "2T" },
  { value: "more", label: "其他" },
];

//处理硬盘
const processA = (a: number) => {
  if (a <= 120) return 120;
  if (a <= 250) return 250;
  if (a <= 512) return 512;
  if (a <= 1024) return 1024;
  if (a <= 2048) return 2048;
  return a;
};

interface Props {
  data: MysqlDeviceChangeMeat[];
  onSet: Function;
}
const App: React.FC<Props> = ({ data, onSet }) => {
  console.log(data);

  //选择系统
  const osChange = (value: string) => {
    if (value === "all") {
      return onSet(data);
    }
    if (value === "more") {
      const hasMatch = data.filter((item) => {
        return !osList.some((list) => item.meat.ostype.includes(list.value));
      });
      console.log(hasMatch);
      return onSet(hasMatch);
    }

    const arr = data.filter((item) => item.meat.ostype.includes(value));
    onSet(arr); // 传值
  };

  //选择内存
  const handleChange = (value: string) => {
    if (value === "all") {
      return onSet(data);
    }
    if (value === "more") {
      const hasMatch = data.filter((item) => {
        return !memoryList.some(
          (list) => list.value === item.meat.memory.toString()
        );
      });
      return onSet(hasMatch);
    }
    const arr = data.filter((item) =>
      item.meat.memory.toString().includes(value)
    );

    onSet(arr); //传值
  };

  //选择硬盘
  const diskChange = (value: string) => {
    if (value === "all") {
      return onSet(data); //传值
    }

    if (value === "more") {
      const hasMatch = data.filter((item) => {
        const datas = processA(item.meat.disk);
        return !diskList.some(
          (list) => list.value === datas.toString()
        );
      });
      return onSet(hasMatch);
    }

    const arr = data.filter((item) => {
      const data = processA(item.meat.disk);
      return data.toString().includes(value);
    });
    onSet(arr); //传值
  };

  return (
    <>
      <div className="mt-6 flex justify-between items-center">
        <p className="text-base font-bold text-[#222] m-0">资产信息</p>
        <div className="w-fit flex items-center">
          <Space wrap>系统：
            <Select
              defaultValue="all"
              style={{ width: 120 }}
              onChange={osChange}
              options={osList}
            />内存：
            <Select
              defaultValue="all"
              style={{ width: 120 }}
              onChange={handleChange}
              options={memoryList}
            />
            硬盘：
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
