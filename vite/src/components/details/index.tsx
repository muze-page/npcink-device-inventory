/**
 * 详情
 * TODO:翻页时才获取数据，一开始仅获取两页的数据
 */
import { SetStateAction, useState } from "react";
import { Pagination, Empty } from "antd";
import { dataMySql } from "@/store";
import DetailsList from "@/components/details/detailsList";
import Screen from "@/components/details/screen";
import Drawer from "@/components/part/drawer";

import {
  MysqlDeviceChangeMeat,
  MysqlDeviceChange,
  ComputerRam,
  ComputerDevice,
} from "@/store/interface";
//选项
import { defaultOption } from "@/store";
//公共方法
import { AppContext } from "@/store/setingContext";

//替换用数组
import { osReplace, osTypeReplace } from "@/store/dataReplace";

//收集数组中的指定键值的总和，并转为GB单位

type DataType = ComputerRam | ComputerDevice;

const calculateTotalSize = (dataArrays: DataType[]) => {
  const totalSize = dataArrays.reduce((sum: number, obj: { size: number }) => {
    return sum + obj.size;
  }, 0);
  return totalSize / (1024 * 1024 * 1024); // 将字节转换为GB
};

/**
 * 检查是否有指定字符串，有则整段替换，没有则表示为未知
 * @param dataArrays
 * @returns
 */
interface repType {
  value: string;
  label: string;
}
const replaceString = (input: string, obj: repType[]): string => {
  const filteredObjects = obj.filter((item) => input.includes(item.value));
  if (filteredObjects.length === 0) {
    // 如果没有找到匹配项，返回 "未收录"
    return "未收录";
  } else {
    // 使用map方法将符合条件的label值映射为一个字符串数组
    const labels = filteredObjects.map((item) => item.label);
    // 使用join方法将字符串数组连接成一个字符串，以逗号分隔
    return labels.join(", ");
  }
};

//添加需要的筛选标记数据
const updateOSType = (
  dataArrays: MysqlDeviceChange[]
): MysqlDeviceChangeMeat[] => {
  const updatedData = dataArrays.map((obj: MysqlDeviceChange) => {
    const parsedData = obj.data; //拿到对象
    const memory = calculateTotalSize(parsedData.memLayout); //内存数组
    const disk = calculateTotalSize(parsedData.diskLayout); //硬盘数组
    //整理添加的信息
    const meat = {
      os: replaceString(parsedData.os.distro, osTypeReplace), //系统型号
      ostype: replaceString(parsedData.os.platform, osReplace), //系统版本
      cpu: parsedData.cpu.manufacturer, //CPU
      model: parsedData.system.model, //型号
      memory: Math.floor(memory), //GB 取整
      disk: Math.floor(disk), //GB 取整
    };
    return { ...obj, meat };
  });
  //移除多余数组
  //const updatedData = updatedData.map((obj) => {
  //  const { dataNew,dataOld, ...rest } = obj;
  //  return rest;
  //});
  return updatedData;
};

const App: React.FC = () => {
  //拿到数据 dataMySql

  //处理后的数据
  const updatedDataArray = updateOSType(dataMySql);

  //共享弹窗状态
  const [active, setActive] = useState(false);

  //修改弹窗状态
  const changeActive = () => {
    setActive(!active);
  };

  //当前选中弹窗的数据
  const [drawerData, setDrawerData] = useState({} as MysqlDeviceChangeMeat);

  //筛选后的值
  const [screenData, setScreenData] = useState(updatedDataArray);

  //当前点击选中的数组index
  const [arrIndex, setArrIndex] = useState(0);

  //修改当前选中的设备状态TODO:优化为公共，方便复用在修改编号和昵称
  /**
   *
   * @param type 修改的属性名
   * @param newType 属性的值
   */
  const handleTypeUpdate = (type: string, newType: string) => {
    setScreenData((prevData) =>
      prevData.map((item, index) =>
        index === arrIndex ? { ...item, [type]: newType } : item
      )
    );
  };

  //删除当前选中的设备
  const deltArrData = () => {
    const data = [...screenData];
    data.splice(arrIndex, 1); // 删除第二个元素
    setScreenData(data); //保存
    changeActive(); //关闭弹窗
  };

  //当前页码
  const [currentPage, setCurrentPage] = useState(1);

  //每页展示数量
  const pageSize = defaultOption.device_show_number;

  //设置页码
  const handlePageChange = (page: SetStateAction<number>) => {
    setCurrentPage(page);
  };

  //获取待渲染的数据
  const displayData = screenData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <AppContext.Provider value={{ handleTypeUpdate, deltArrData }}>
      <div className="pb-6 px-5">
        <Screen data={updatedDataArray} onSet={setScreenData} />
        <div className="flex content-start items-center flex-wrap w-full">
          {/**开始循环 */}
          {displayData.map((tab, index) => (
            <DetailsList
              key={tab.id}
              data={tab}
              onActive={() => changeActive()}
              onDrawerData={() => (setDrawerData(tab), setArrIndex(index))}
            />
          ))}
        </div>
        {/**没有数据 */}
        {screenData.length === 0 && (
          <Empty
            className="mt-10"
            description={
              <span>
                暂无数据
                <br />
                请更换筛选条件
                <br />
                或搜索内容试试
              </span>
            }
          />
        )}

        {/**分页 */}
        {screenData.length > pageSize && (
          <div className="mt-4 float-right">
            <Pagination
              current={currentPage}
              onChange={handlePageChange}
              pageSize={pageSize}
              total={screenData.length}
            />
          </div>
        )}

        {/**弹窗 */}
        <Drawer
          data={drawerData}
          active={active}
          onActive={() => changeActive()}
        />
      </div>
    </AppContext.Provider>
  );
};

export default App;
