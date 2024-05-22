/**
 * 设备详情 - 顶部筛选
 * TODO:搜索备注名或编号
 */
import { useState, useEffect,useContext } from "react";
import { Space, Select, Button, Tooltip } from "antd";
import {
  ReloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { MysqlDeviceChangeMeat } from "@/store/interface";
import { defaultOption } from "@/store";
import { changeSelectData } from "@/store/tool";
import { device_status } from "@/store/dataReplace";
import Search from "@/components/details/search";
import Header from "@/components/part/header";
interface Props {
  data: MysqlDeviceChangeMeat[]; //筛选用数据
  onSet: Function; //传递筛选后的数据
}
import { AppContext } from "@/store/setingContext";

/**
 * 准备部门
 */
const departmentData = changeSelectData(defaultOption.department);

const App: React.FC<Props> = ({ data, onSet }) => {
  //以下功能做参数，由唯一函数决定输出值

  //存储选项值
  const [state, setState] = useState(String); //状态

  const [memory, _setMemory] = useState(null); //内存
  //const [disk, setDisk] = useState(null); //硬盘
  const [department, setDepartment] = useState(null); //cpu

  //根据条件对原始数据进行筛选
  const filteredData = data.filter((item) => {
    //let meatDisk = item.meat.disk;
    let sizeCondition = true;

    //if (disk) {
    //  if (disk === "120") {
    //    sizeCondition = meatDisk <= 120;
    //  } else if (disk === "250") {
    //    sizeCondition = meatDisk > 120 && meatDisk <= 250;
    //  } else if (disk === "512") {
    //    sizeCondition = meatDisk > 250 && meatDisk <= 512;
    //  } else if (disk === "1024") {
    //    sizeCondition = meatDisk > 512 && meatDisk <= 1024;
    //  } else if (disk === "2048") {
    //    sizeCondition = meatDisk > 1024 && meatDisk <= 2048;
    //  } else if (disk === "other") {
    //    sizeCondition = meatDisk > 2048;
    //  }
    //}

    //处理内存
    const memoryData = item.meat.memory.toString();

    return (
      sizeCondition &&
      (!memory || memoryData === "" || memoryData === memory) && //内存
      (!state || item.state === "" || item.state === state) && //状态
      (!department || item.department === "" || item.department === department) //
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

  /**
   * 重置按钮
   */
  const restSelect = () => {
    //重置筛选条件

    //重置列表数据
    //onSet(data);
    //console.log("重置");
    location.reload();
  };

  //拿到需要的状态和方法
  const { isName,toggleStyle } = useContext(AppContext);

  return (
    <>
      <div className="flex justify-between items-center">
        <Header title="资产信息" />
        <Space size={"middle"} wrap className="mb-4">
          <div>
            状态：
            <Select
              defaultValue="全部"
              style={{ width: 80 }}
              onChange={(value: any) => {
                setState(value);
                setIsUpdating(true);
              }}
              options={device_status}
            />
          </div>
          <div>
            部门：
            <Select
              defaultValue="全部"
              style={{ width: 120 }}
              onChange={(value: any) => {
                setDepartment(value);
                setIsUpdating(true);
              }}
              options={departmentData}
            />
          </div>
          <div>
            <Search data={data} onSet={onSet} />
          </div>

          {true && (
            <div>
              <Tooltip title="重置筛选条件">
                <Button
                  type="primary"
                  shape="circle"
                  icon={<ReloadOutlined />}
                  className="bg-[#1677ff]"
                  onClick={restSelect}
                />
              </Tooltip>
            </div>
          )}

          <Tooltip title="隐藏姓名">
            <Button
              type="primary"
              shape="circle"
              icon={isName ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              className="bg-[#1677ff]"
              onClick={toggleStyle}
            />
          </Tooltip>
        </Space>
      </div>
    </>
  );
};

export default App;
