/**
 * 设备详情 - 顶部筛选
 * TODO:搜索备注名或者昵称或编号，只能单次筛选，无法搜索其他数据，
 */
import { useState, useEffect } from "react";
import { Space, Select, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { MysqlDeviceChangeMeat } from "@/store/interface";

import {
  osScreenList,
  memoryScreenList,
  diskScreenList,
} from "@/store/dataReplace";

interface Props {
  data: MysqlDeviceChangeMeat[]; //筛选用数据
  onSet: Function; //传递筛选后的数据
}
const App: React.FC<Props> = ({ data, onSet }) => {
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
      } else if (disk === "other") {
        sizeCondition = meatDisk > 2048;
      }
    }

    //处理内存
    const memoryData = item.meat.memory.toString();

    return (
      sizeCondition &&
      (!os || os === "" || item.meat.ostype === os) &&
      (!memory || memoryData === "" || memoryData === memory)
    );
  });

  //避免死循环
  const [isUpdating, setIsUpdating] = useState(false);

  //监听，更新最新值
  useEffect(() => {
    if (isUpdating) {
      onSet(filteredData);
      setIsUpdating(false);
    }
  }, [filteredData, isUpdating]);

  return (
    <>
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
              options={osScreenList}
            />
            内存：
            <Select
              defaultValue=""
              style={{ width: 120 }}
              onChange={(value: any) => {
                setMemory(value), setIsUpdating(true);
              }}
              options={memoryScreenList}
            />
            硬盘：
            <Select
              defaultValue=""
              style={{ width: 120 }}
              onChange={(value: any) => {
                setDisk(value), setIsUpdating(true);
              }}
              options={diskScreenList}
            />
            {false && (
              <Button
                type="primary"
                shape="circle"
                icon={<ReloadOutlined />}
                className="bg-[#1677ff]"
              />
            )}
          </Space>
        </div>
      </div>
    </>
  );
};

export default App;
