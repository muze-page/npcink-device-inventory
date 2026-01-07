/**
 * 自定义设备类型
 */
import {
  useState,
  SetStateAction,
  useEffect,
  lazy,
  Suspense,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pagination, Flex } from "antd";
import type { PaginationProps } from "antd";

//自定义产品分类获取方法
import {
  getStyleDeviceCategory,
  getStyleDetail,
  getStyleList,
} from "@/services/index";
import { queryKeys } from "@/services/queryKeys";

//数据渲染组件
import DataList from "@/pages/styleList/dataList";

//拿到自定义设备数据类型
import { StyleDevice, FilterStyleData, StyleCategoryType } from "@/type/index";

//跨组件提供方法
import { StyleContext } from "@/context/StyleContext";

const Drawer = lazy(() => import("@/pages/styleList/drawer/index"));

//拿到顶部组件
import Header from "@/pages/styleList/header";

//筛序和搜索无结果时的提示
import SearchNoData from "@/components/searchNoData";


const App: React.FC = () => {
  const queryClient = useQueryClient();

  //共享弹窗状态
  const [active, setActive] = useState(false);

  //修改弹窗状态
  const changeActive = () => {
    setActive(!active);
  };

  //当前选中弹窗的数据
  const [drawerData, setDrawerData] = useState({} as StyleDevice);

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

  const listParams = {
    page: pageNumber,
    per_page: PAGE_SIZE,
    search: debouncedKeyword || undefined,
    state: filter.state !== "all" ? filter.state : undefined,
    category: filter.category !== "all" ? filter.category : undefined,
    platform: filter.platform !== "all" ? filter.platform : undefined,
    pay_method: filter.payMethod !== "all" ? filter.payMethod : undefined,
  };

  const listQuery = useQuery({
    queryKey: queryKeys.styleList(listParams),
    queryFn: () => getStyleList(listParams),
    keepPreviousData: true,
  });

  const devices = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;

  const updateListCache = (
    updater: (items: StyleDevice[]) => StyleDevice[]
  ) => {
    queryClient.setQueryData(queryKeys.styleList(listParams), (old: any) => {
      if (!old) return old;
      const prevItems: StyleDevice[] = old.items || [];
      const nextItems = updater(prevItems);
      const delta = nextItems.length - prevItems.length;
      const nextTotal = Math.max(0, (old.total || 0) + delta);
      return {
        ...old,
        items: nextItems,
        total: nextTotal,
        total_pages:
          old.per_page > 0 ? Math.ceil(nextTotal / old.per_page) : old.total_pages,
      };
    });
  };

  //添加自定义设备
  const handleAddDevice = (device: StyleDevice) => {
    updateListCache((items) => [device, ...items]);
  };
  //删除指定UUID的设备
  const handleDeleteData = (uuid: string) => {
    updateListCache((items) => items.filter((d) => d.uuid !== uuid));
  };

  //修改自定义设备数据
  const handleUpdateData = (uuid: string, device: StyleDevice) => {
    updateListCache((items) =>
      items.map((d) => (d.uuid === uuid ? device : d))
    );
  };

  const detailQuery = useQuery({
    queryKey: queryKeys.styleDetail(drawerData.uuid || ""),
    queryFn: () => getStyleDetail(drawerData.uuid),
    enabled: active && Boolean(drawerData.uuid),
  });

  const detailLoading = detailQuery.isLoading || detailQuery.isFetching;

  useEffect(() => {
    if (detailQuery.data) {
      setDrawerData((prev) => ({ ...prev, ...detailQuery.data }));
    }
  }, [detailQuery.data]);

  const categoryQuery = useQuery({
    queryKey: queryKeys.styleCategories,
    queryFn: getStyleDeviceCategory,
    staleTime: 5 * 60 * 1000,
  });

  const styleCategoryOption: StyleCategoryType =
    categoryQuery.data || ({
      states: [],
      categories: [],
      platforms: [],
      pay_methods: [],
    } as StyleCategoryType);

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
        detailLoading,
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
            {devices.map((tab: StyleDevice) => (
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
        {active ? (
          <Suspense fallback={null}>
            <Drawer
              data={drawerData}
              active={active}
              onActive={() => changeActive()}
            />
          </Suspense>
        ) : null}
      </div>
    </StyleContext.Provider>
  );
};
export default App;
