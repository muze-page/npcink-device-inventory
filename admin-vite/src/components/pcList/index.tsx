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
import { MysqlDeviceChangeMeat } from "@/store/interface";
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
  const [listData, setListData] =
    useState<MysqlDeviceChangeMeat[]>(DataMeatArray);

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

  // 删除当前选中的设备
  const deltArrData = () => {
    const data = [...screenData];
    data.splice(arrIndex, 1); // 删除指定元素
    setScreenData(data); // 保存更新后的数据
    changeActive(); // 关闭弹窗

    // 如果删除的是当前页的最后一个元素且不是第一页，返回上一页
    if (displayData.length === 1 && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
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

        deltArrData,
        toggleStyle,
        isName,
      }}
    >
      <div className="pb-6 px-5">
        <Screen data={listData} onSet={setScreenData} />
        <div className="flex content-start items-center flex-wrap w-full">
          {/**开始循环 */}
          {displayData.map((tab, index) => (
            <DetailsList
              key={tab.id}
              data={tab}
              onActive={() => changeActive()}
              onDrawerData={() => {
                // 计算在整个数据集中的真实索引
                const realIndex = (currentPage - 1) * pageSize + index;
                setDrawerData(tab);
                setArrIndex(realIndex);
              }}
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
