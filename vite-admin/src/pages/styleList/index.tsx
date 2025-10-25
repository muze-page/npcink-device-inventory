/**
 * 自定义设备类型
 */
import { useState, useMemo, SetStateAction, useEffect } from "react";
import { Pagination, Flex } from "antd";
import type { PaginationProps } from "antd";

//自定义产品分类获取方法
import { getStyleDeviceCategory } from "@/services/index";
//模糊搜索
import Fuse from "fuse.js";

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

//拿到通过接口传来的数据
import { dataStyle } from "@/utils/index";

const App: React.FC = () => {
  //在设备展示列表和删除设备两个组件间同步设备数据（添加、删除设备后更新设备列表）
  const [devices, setDevices] = useState<StyleDevice[]>(dataStyle);

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
  };
  //删除指定UUID的设备
  const handleDeleteData = (uuid: string) => {
    setDevices((prev) => prev.filter((d) => d.uuid !== uuid));
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

  //每页展示数量
  const [PAGE_SIZE, setPAGE_SIZE] = useState(6); //每页展示数量

  //当前页码
  const [pageNumber, setPageNumber] = useState(1); // 当前页码（从 1 开始）

  /* 3. 计算最终展示页数据（useMemo 避免重复计算） */
  const filteredList = useMemo(() => {
    let data = [...devices];

    //筛选状态
    if (filter.state && filter.state != "all")
      data = data.filter((v) => v.state === filter.state);

    //筛选分类
    if (filter.category && filter.category != "all")
      data = data.filter((v) => v.category === filter.category);

    //筛选采购平台
    if (filter.platform && filter.platform != "all")
      data = data.filter((v) => v.data.platform === filter.platform);

    //筛选付款方式
    if (filter.payMethod && filter.payMethod != "all")
      data = data.filter((v) => v.data.pay_method === filter.payMethod);

    return data;
  }, [devices, filter]);

  /* Fuse 配置：可按需调阈值、权重等 */
  /**
   * 使用 useMemo 来创建 fuse 实例，这样当 filteredList 变化时，fuse 也会重新创建
   */
  const fuse = useMemo(
    () =>
      new Fuse(filteredList, {
        //使用人、用途、设备名称、订单号、采购人姓名
        keys: ["name", "purpose", "data.title", "data.order", "data.purchaser"], // 允许在这五个字段里模糊搜
        threshold: 0.4, // 0=精确 1=极宽松
        shouldSort: true,
        includeScore: true,
      }),
    [filteredList]
  );

  /* 4. 模糊搜索（useMemo 避免重复计算） */
  //先精确搜索，再模糊搜索
  const searchList = useMemo(() => {
    let data = [...filteredList];
    //关键字转小写，减低搜索出错概率
    const lowerKeyword = keyword.toLowerCase();
    //console.log("拿到的列表值", data);
    //console.dir(data);
    //console.log("keyword", keyword);

    //查找使用人姓名、设备名称、订单号、采购人姓名
    //精确匹配
    const exactMatches = data.filter(
      (v) =>
        (v.name && v.name.toLowerCase().includes(lowerKeyword)) ||
        (v.data.title && v.data.title.toLowerCase().includes(lowerKeyword)) ||
        (v.data.order && v.data.order.toLowerCase().includes(lowerKeyword)) ||
        (v.data.purchaser &&
          v.data.purchaser.toLowerCase().includes(lowerKeyword))
    );

    if (exactMatches.length > 0) {
      data = exactMatches;
      //console.log("精确匹配的data值：");
      //console.dir(data);
    } else {
      //模糊搜索
      data = fuse.search(keyword).map((r) => r.item); //搜索出结果
      //console.log("模糊搜索匹配的data值：");
      //console.dir(data);
    }
    return data;
  }, [filteredList, keyword]);

  // 计算分页后的数据
  const pagedFilteredList = useMemo(() => {
    /* 3-3 分页切片 */
    const startIndex = (pageNumber - 1) * PAGE_SIZE;
    //截取数据
    return searchList.slice(startIndex, startIndex + PAGE_SIZE);
  }, [searchList, pageNumber, PAGE_SIZE]);

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
            {pagedFilteredList.map((tab) => (
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
        {pagedFilteredList.length === 0 && <SearchNoData />}

        {/**分页 */}
        {searchList.length > PAGE_SIZE && (
          <div className="mt-4 float-right">
            <Pagination
              current={pageNumber} //当前页数
              pageSize={PAGE_SIZE} //每页条数
              total={searchList.length} //数据总数
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
