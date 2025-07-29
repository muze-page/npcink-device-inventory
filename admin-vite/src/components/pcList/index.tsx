/**
 * 设备列表
 * TODO:翻页时才获取数据，一开始仅获取两页的数据
 */
import { SetStateAction, useState } from "react";
import { Pagination, Empty } from "antd";
import { dataMySql } from "@/store";
import DetailsList from "@/components/pcList/detailsList";
import Screen from "@/components/pcList/screen";
import Drawer from "@/components/pcList/drawer";
import { MysqlDeviceChangeMeat, } from "@/store/interface";
//选项
import { defaultOption } from "@/store";
//公共方法
import { AppContext } from "@/components/pcList/Context";

//导入处理工具
import { updateOSType } from "@/store/tool";

const App: React.FC = () => {

  //将拿到的数据进行排序，再添加需要的meat信息
  const DataMeatArray = updateOSType(dataMySql);

  //数据处理
  const [listData, setListData] = useState<MysqlDeviceChangeMeat[]>(DataMeatArray);

  //共享弹窗状态
  const [active, setActive] = useState(false);

  //修改弹窗状态
  const changeActive = () => {
    setActive(!active);
  };

  //当前选中弹窗的数据
  const [drawerData, setDrawerData] = useState({} as MysqlDeviceChangeMeat);

  //筛选后的值
  const [screenData, setScreenData] = useState(listData);

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

  //隐藏姓名
  const [isName, setIsName] = useState(true);

  //切换姓名显示状态
  const toggleStyle = () => {
    setIsName((prevIsActive) => !prevIsActive);
  };

  //当前页码
  const [currentPage, setCurrentPage] = useState(1);

  //每页展示数量
  const pageSize = defaultOption.device_show_number;

  //设置页码
  const handlePageChange = (page: SetStateAction<number>) => {
    setCurrentPage(page);
  };

  //计算需要显示的数据
  //如果数据量大于每页大小，则进行分页处理
  //如果数据量小于每页大小，则显示全部数据
  const dataAxios = screenData.length > pageSize ? screenData.slice((currentPage - 1) * pageSize, currentPage * pageSize) : screenData;
  const displayData = screenData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <AppContext.Provider
      value={{
       
        setListData,
        drawerData,
        setDrawerData,
        handleTypeUpdate,
        deltArrData,
        toggleStyle,
        isName,
      }}
    >
      <div className="pb-6 px-5">
        <Screen data={listData} onSet={setScreenData} />
        <div className="flex content-start items-center flex-wrap w-full">
          {/**开始循环 */}
          {listData.map((tab, index) => (
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
        <Drawer active={active} onActive={() => changeActive()} />
      </div>
    </AppContext.Provider>
  );
};

export default App;
