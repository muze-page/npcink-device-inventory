/**
 * 设备列表
 * TODO:翻页时才获取数据，一开始仅获取两页的数据
 */
import { SetStateAction, useState, useEffect } from "react";
import { Pagination, Flex } from "antd";
import type { PaginationProps } from "antd";
import {
  MysqlDeviceChangeMeat,
  FilterData,
  PCCategoryType,
} from "@/type/index";
import { getDeviceCategory, getPcList } from "@/services/index";

//展示列表
import DetailsList from "@/pages/pcList/detailsList";

//筛选
import Screen from "@/pages/pcList/screen";

//弹窗
import Drawer from "@/pages/pcList/drawer";

//筛序和搜索无结果时的提示
import SearchNoData from "@/components/searchNoData";

//公共方法
import { DevieContext } from "@/context/DeviceContext";

//导入处理工具
import { updateOSType } from "@/utils/tool";

const App: React.FC = () => {
  //获取设备状态和分类
  const [deviceCategoryOption, setDeviceCategoryOption] =
    useState<PCCategoryType>({
      states: [], //状态
      departments: [], //部门
    });

  //获取设备状态和部门分类数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await getDeviceCategory();
        //存入分类数据
        setDeviceCategoryOption(categories);
      } catch (error) {
        console.error("获取设备分类失败:", error);
      }
    };

    fetchCategories();
  }, []);

  //设置列表数据
  const [listData, setListData] = useState<MysqlDeviceChangeMeat[]>([]);
  const [total, setTotal] = useState(0);

  //筛选条件
  const [filter, setFilter] = useState<FilterData>({
    //筛选条件默认值
    state: "all", //状态
    department: "all", //部门
  });

  /* 搜索关键字 */
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  //每页展示数量
  const [PAGE_SIZE, setPAGE_SIZE] = useState(10); //每页展示数量

  //当前页码
  const [pageNumber, setPageNumber] = useState(1); // 当前页码（从 1 开始）

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    setPageNumber(1);
  }, [filter, debouncedKeyword, PAGE_SIZE]);

  useEffect(() => {
    const fetchList = async () => {
      try {
        const response = await getPcList({
          page: pageNumber,
          per_page: PAGE_SIZE,
          search: debouncedKeyword || undefined,
          state: filter.state !== "all" ? filter.state : undefined,
          department:
            filter.department !== "all" ? filter.department : undefined,
        });
        const updated = updateOSType(response.items);
        setListData(updated);
        setTotal(response.total);
      } catch (error) {
        console.error("获取设备列表失败:", error);
        setListData([]);
        setTotal(0);
      }
    };

    fetchList();
  }, [pageNumber, PAGE_SIZE, filter, debouncedKeyword]);

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
  //console.log("当前总数", total);
  //共享弹窗状态
  const [active, setActive] = useState(false);

  //修改弹窗状态
  const changeActive = () => {
    setActive(!active);
  };

  //当前选中弹窗的数据
  const [drawerData, setDrawerData] = useState({} as MysqlDeviceChangeMeat);

  //隐藏姓名
  const [isName, setIsName] = useState(true);

  return (
    <DevieContext.Provider
      value={{
        setListData,
        drawerData,
        setDrawerData,
        isName,
        setActive,
        deviceCategoryOption,
      }}
    >
      <div className="pb-6 px-5">
        <Screen
          filterData={filter}
          onChange={setFilter}
          keyword={keyword}
          setKeyword={setKeyword}
          onName={setIsName}
        />
        <div className="flex content-start items-center flex-wrap w-full">
          {/**开始循环 */}
          <Flex wrap gap="large">
            {listData.map((tab: MysqlDeviceChangeMeat) => (
              <DetailsList
                key={tab.id}
                data={tab}
                onActive={() => changeActive()}
                onDrawerData={() => setDrawerData(tab)}
              />
            ))}
          </Flex>
        </div>
        {/**没有数据 */}
        {listData.length === 0 && <SearchNoData />}

        {/**分页 */}
        {total > PAGE_SIZE && (
          <div className="mt-4 float-right">
            <Pagination
              current={pageNumber} //当前页数
              pageSize={PAGE_SIZE} //每页条数
              total={total} //数据总数
              onChange={handlePageChange} //页码或 pageSize 改变的回调，参数是改变后的页码及每页条数
              showSizeChanger //显示每页展示数据数量切换器
              onShowSizeChange={onShowSizeChange} //每页数量改变的回调
              showQuickJumper //显示快速跳转
            />
          </div>
        )}

        {/**弹窗 */}
        <Drawer
          active={active}
          onActive={() => changeActive()}
          data={drawerData}
        />
      </div>
    </DevieContext.Provider>
  );
};

export default App;
