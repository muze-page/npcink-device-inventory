/**
 * 自定义设备类型
 */
import { useState, SetStateAction, useEffect } from "react";
import { Pagination, Flex } from "antd";
import type { PaginationProps } from "antd";

//自定义产品分类获取方法
import { getStyleDeviceCategory, getStyleList } from "@/services/index";

//数据渲染组件
import DataList from "@/pages/styleList/dataList";

//拿到自定义设备数据类型
import { StyleDevice, FilterStyleData, StyleCategoryType } from "@/type/index";

//跨组件提供方法
import { StyleContext } from "@/context/StyleContext";

//拿到弹窗组件
import Drawer from "@/pages/styleList/drawer/index";

//拿到顶部组件
import Header from "@/pages/styleList/header";

//筛序和搜索无结果时的提示
import SearchNoData from "@/components/searchNoData";


const App: React.FC = () => {
  //在设备展示列表和删除设备两个组件间同步设备数据（添加、删除设备后更新设备列表）
  const [devices, setDevices] = useState<StyleDevice[]>([]);
  const [total, setTotal] = useState(0);

  //共享弹窗状态
  const [active, setActive] = useState(false);

  //获取自定义设备的状态和分类
  const [styleCategoryOption, setStyleCategoryOption] =
    useState<StyleCategoryType>({
      states: [], //设备状态
      categories: [], //设备分类
      platforms: [], //采购平台
      pay_methods: [], //支付方式
    });

  //获取自定义设备分类数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await getStyleDeviceCategory();
        setStyleCategoryOption(categories);
      } catch (error) {
        console.error("获取设备分类失败:", error);
      }
    };

    fetchCategories();
  }, []);

  //修改弹窗状态
  const changeActive = () => {
    setActive(!active);
  };

  //当前选中弹窗的数据
  const [drawerData, setDrawerData] = useState({} as StyleDevice);

  //添加自定义设备
  const handleAddDevice = (device: StyleDevice) => {
    setDevices((prev) => [device, ...prev]);
    setTotal((prev) => prev + 1);
  };
  //删除指定UUID的设备
  const handleDeleteData = (uuid: string) => {
    setDevices((prev) => prev.filter((d) => d.uuid !== uuid));
    setTotal((prev) => Math.max(0, prev - 1));
  };

  //修改自定义设备数据
  const handleUpdateData = (uuid: string, device: StyleDevice) => {
    setDevices((prev) => prev.map((d) => (d.uuid === uuid ? device : d)));
  };

  /**
   * 筛选
   */
  //筛选条件
  const [filter, setFilter] = useState<FilterStyleData>({
    //筛选条件默认值
    state: "all", //设备状态
    category: "all", //设备分类
    platform: "all", //采购平台
    payMethod: "all", //支付方式
  });

  /* 搜索关键字 */
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  //每页展示数量
  const [PAGE_SIZE, setPAGE_SIZE] = useState(6); //每页展示数量

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
        const response = await getStyleList({
          page: pageNumber,
          per_page: PAGE_SIZE,
          search: debouncedKeyword || undefined,
          state: filter.state !== "all" ? filter.state : undefined,
          category: filter.category !== "all" ? filter.category : undefined,
          platform: filter.platform !== "all" ? filter.platform : undefined,
          pay_method: filter.payMethod !== "all" ? filter.payMethod : undefined,
        });
        setDevices(response.items);
        setTotal(response.total);
      } catch (error) {
        console.error("获取设备列表失败:", error);
        setDevices([]);
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

  //隐藏姓名
  const [isName, setIsName] = useState(true);

  return (
    <StyleContext.Provider
      value={{
        drawerData,
        setDrawerData,
        handleAddDevice,
        handleDeleteData,
        handleUpdateData,
        styleCategoryOption,
        isName,
      }}
    >
      <div className="pb-6 px-5">
        <Header
          filterData={filter}
          onChange={setFilter}
          keyword={keyword}
          setKeyword={setKeyword}
          onName={setIsName}
        />
        <div className="flex content-start items-center flex-wrap w-full">
          <Flex wrap gap="large">
            {/**开始循环 */}
            {devices.map((tab) => (
              <DataList
                key={tab.id}
                data={tab}
                onActive={() => changeActive()}
                onDrawerData={() => setDrawerData(tab)}
              />
            ))}
          </Flex>
        </div>

        {/**没有数据 */}
        {devices.length === 0 && <SearchNoData />}

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
          data={drawerData}
          active={active}
          onActive={() => changeActive()}
        />
      </div>
    </StyleContext.Provider>
  );
};
export default App;
