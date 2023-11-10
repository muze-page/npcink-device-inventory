/**
 * 详情
 * TODO:翻页时才获取数据，一开始仅获取两页的数据
 */
import { SetStateAction, useState } from "react";
import { Pagination, Empty } from "antd";
import { dataMySql } from "@/store";
import DetailsList from "@/components/page/details/block/detailsList";
import Header from "@/components/page/details/block/header";
import Drawer from "@/components/page/details/drawer";
import {
  MysqlDeviceChangeMeat,
  MysqlDeviceChange,
  ComputerRam,
  ComputerDevice,
} from "@/store/interface";

//公共方法
import { AppContext } from "@/store/setingContext";

//替换用数组
import { osReplace, memoryReplace } from "@/store/dataReplace";

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
const replaceString = (input: string, obj: any[]) => {
  const match = obj.find(({ name }) => input.includes(name));
  if (match) {
    return match.data;
  }
  //return input;
  return "unknown"; //没有在上述系统数据中的，替换为more（方便其他筛选）
};

//添加需要的筛选标记数据
const updateOSType = (
  dataArrays: MysqlDeviceChange[]
): MysqlDeviceChangeMeat[] => {
  const updatedData = dataArrays.map((obj: MysqlDeviceChange) => {
    const parsedData = obj.dataNew; //拿到对象
    const memory = calculateTotalSize(parsedData.memLayout); //内存数组
    const disk = calculateTotalSize(parsedData.diskLayout); //硬盘数组
    //整理添加的信息
    const meat = {
      ostype: replaceString(parsedData.os.distro, osReplace), //系统版本
      cpu: parsedData.cpu.manufacturer, //CPU
      model: parsedData.system.model, //型号
      memory: replaceString(Math.floor(memory).toString(), memoryReplace), //GB 取整
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
  //拿到数据
  const data = dataMySql;

  //处理后的数据
  const updatedDataArray = updateOSType(data);

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
  const pageSize = 8;

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
      <Header data={updatedDataArray} onSet={setScreenData} />
      <div className="mt-1 flex content-start items-center flex-wrap w-full">
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
      {screenData.length === 0 && <Empty className="mt-10" />}

      {/**分页 */}
      {screenData.length > pageSize && (
        <div className="mt-2">
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
    </AppContext.Provider>
  );
};

export default App;
