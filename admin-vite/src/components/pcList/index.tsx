/**
 * 设备列表
 * TODO:翻页时才获取数据，一开始仅获取两页的数据
 */
import { SetStateAction, useState, useMemo } from "react";
import { Pagination, Empty } from "antd";
import type { PaginationProps } from "antd";
import { dataMySql } from "@/store";
import DetailsList from "@/components/pcList/detailsList";
import Screen from "@/components/pcList/screen";
import Drawer from "@/components/pcList/drawer";
import { MysqlDeviceChangeMeat } from "@/store/interface";
//公共方法
import { AppContext } from "@/components/pcList/Context";

//导入处理工具
import { updateOSType } from "@/store/tool";

import Demo from "@/demo/fabox";

const App: React.FC = () => {
  //将拿到的数据进行排序，再添加需要的meat信息
  const DataMeatArray = updateOSType(dataMySql);

  //设置列表数据
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

  //隐藏姓名
  const [isName, setIsName] = useState(true);

  //每页展示数量TODO:从配置中获取,去除此选项，改用分页器设置
  //const PAGE_SIZE = defaultOption.device_show_number;

  const [PAGE_SIZE, setPAGE_SIZE] = useState(10); //每页展示数量

  //当前页码
  const [pageNumber, setPageNumber] = useState(1); // 当前页码（从 1 开始）

  /* 3. 计算最终展示页数据（useMemo 避免重复计算） */
  const displayData = useMemo(() => {
    let data = [...listData];
    /* 3-3 分页切片 */
    const startIndex = (pageNumber - 1) * PAGE_SIZE;

    //截取数据
    return data.slice(startIndex, startIndex + PAGE_SIZE);
  }, [listData, pageNumber, PAGE_SIZE]);

  //设置当前页码
  const handlePageChange = (page: SetStateAction<number>) => {
    setPageNumber(page); // 设置当前页码
  };

  //设置每页展示数量
  const onShowSizeChange: PaginationProps["onShowSizeChange"] = (
    _current, //当前页码
    pageSize //每页展示数量
  ) => {
    setPAGE_SIZE(pageSize); // 设置每页展示的数量
    //console.log(current, pageSize);
  };

  //console.log("当前页码", pageNumber);
  //console.log("每页展示数量", PAGE_SIZE);
  //console.log("数据总数", displayData.length);
  //console.log("筛选后的数据", screenData);
  //console.log("当前展示数据", displayData);

  return (
    <AppContext.Provider
      value={{
        setListData,
        drawerData,
        setDrawerData,
        isName,
        setActive,
      }}
    >
      <Demo />
      <div className="pb-6 px-5">
        <Screen data={displayData} onSet={setScreenData} onName={setIsName} />
        <div className="flex content-start items-center flex-wrap w-full">
          {/**开始循环 */}
          {displayData.map((tab) => (
            <DetailsList
              key={tab.id}
              data={tab}
              onActive={() => changeActive()}
              onDrawerData={() => setDrawerData(tab)}
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
        {listData.length > PAGE_SIZE && (
          <div className="mt-4 float-right">
            <Pagination
              current={pageNumber} //当前页数
              pageSize={PAGE_SIZE} //每页条数
              total={listData.length} //数据总数
              onChange={handlePageChange} //页码或 pageSize 改变的回调，参数是改变后的页码及每页条数
              showSizeChanger //显示每页展示数据数量切换器
              onShowSizeChange={onShowSizeChange} //每页数量改变的回调
              showQuickJumper //显示快速跳转
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
