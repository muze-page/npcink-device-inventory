/**
 * 设备列表
 * TODO:翻页时才获取数据，一开始仅获取两页的数据
 */
import {
  SetStateAction,
  Dispatch,
  useState,
  useEffect,
  useMemo,
  useRef,
  lazy,
  Suspense,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pagination, Flex, message } from "antd";
import type { PaginationProps } from "antd";
import { FixedSizeGrid as Grid, type GridChildComponentProps } from "react-window";
import {
  MysqlDeviceChangeMeat,
  FilterData,
  PCCategoryType,
} from "@/type/index";
import { getDeviceCategory, getPcDetail, getPcList } from "@/services/index";
import { queryKeys } from "@/services/queryKeys";
import { useElementSize } from "@/hooks/useElementSize";
import { updateOSType } from "@/utils/tool";

//展示列表
import DetailsList from "@/pages/pcList/detailsList";

//筛选
import Screen from "@/pages/pcList/screen";

const loadDrawer = () => import("@/pages/pcList/drawer");
const Drawer = lazy(loadDrawer);

//筛序和搜索无结果时的提示
import SearchNoData from "@/components/searchNoData";

//公共方法
import { DevieContext } from "@/context/DeviceContext";

const App: React.FC = () => {
  const queryClient = useQueryClient();
  const VIRTUALIZE_THRESHOLD = 200;
  const ITEM_WIDTH = 224;
  const ITEM_HEIGHT = 312;
  const GRID_GAP = 16;

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

  const listParams = {
    page: pageNumber,
    per_page: PAGE_SIZE,
    search: debouncedKeyword || undefined,
    state: filter.state !== "all" ? filter.state : undefined,
    department: filter.department !== "all" ? filter.department : undefined,
  };

  const listQuery = useQuery({
    queryKey: queryKeys.pcList(listParams),
    queryFn: () => getPcList(listParams),
    keepPreviousData: true,
  });

  const listData = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const shouldVirtualize = listData.length > VIRTUALIZE_THRESHOLD;

  const setListData: Dispatch<SetStateAction<MysqlDeviceChangeMeat[]>> = (
    value
  ) => {
    queryClient.setQueryData(queryKeys.pcList(listParams), (old: any) => {
      if (!old) return old;
      const prevItems: MysqlDeviceChangeMeat[] = old.items || [];
      const nextItems =
        typeof value === "function"
          ? value(prevItems)
          : (value as MysqlDeviceChangeMeat[]);
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
  const [isOpening, setIsOpening] = useState(false);
  const openingUuidRef = useRef<string | null>(null);
  const drawerPrefetchRef = useRef<Promise<unknown> | null>(null);

  //当前选中弹窗的数据
  const [drawerData, setDrawerData] = useState({} as MysqlDeviceChangeMeat);

  //隐藏姓名
  const [isName, setIsName] = useState(true);

  const detailLoading = isOpening;

  const prefetchDrawer = () => {
    if (!drawerPrefetchRef.current) {
      drawerPrefetchRef.current = loadDrawer().catch(() => null);
    }
    return drawerPrefetchRef.current;
  };

  useEffect(() => {
    if (typeof window === "undefined" || listData.length === 0) {
      return;
    }
    const startPrefetch = () => {
      void prefetchDrawer();
    };
    const runtime = globalThis as unknown as {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (runtime.requestIdleCallback) {
      const id = runtime.requestIdleCallback(startPrefetch);
      return () => {
        runtime.cancelIdleCallback?.(id);
      };
    }
    const timer = setTimeout(startPrefetch, 200);
    return () => clearTimeout(timer);
  }, [listData.length]);

  const categoryQuery = useQuery({
    queryKey: queryKeys.pcCategories,
    queryFn: getDeviceCategory,
    staleTime: 5 * 60 * 1000,
  });

  const deviceCategoryOption: PCCategoryType =
    categoryQuery.data || ({
      states: [],
      departments: [],
    } as PCCategoryType);

  const listContainerRef = useRef<HTMLDivElement>(null);
  const { width: listWidth } = useElementSize(listContainerRef);
  const [gridHeight, setGridHeight] = useState(640);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const updateHeight = () => {
      setGridHeight(Math.max(360, window.innerHeight - 280));
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const columnCount = useMemo(() => {
    if (!listWidth) return 1;
    return Math.max(1, Math.floor(listWidth / ITEM_WIDTH));
  }, [listWidth, ITEM_WIDTH]);
  const rowCount = Math.ceil(listData.length / columnCount);

  const renderGridCell = ({
    columnIndex,
    rowIndex,
    style,
  }: GridChildComponentProps) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= listData.length) {
      return null;
    }
    const item = listData[index];
    return (
      <div style={{ ...style, padding: GRID_GAP / 2 }}>
        <DetailsList
          key={item.id}
          data={item}
          onOpen={() => openDrawer(item)}
        />
      </div>
    );
  };

  const openDrawer = async (item: MysqlDeviceChangeMeat) => {
    if (!item?.uuid) {
      message.error("设备信息异常，请刷新后重试");
      return;
    }
    const targetUuid = item.uuid;
    openingUuidRef.current = targetUuid;
    setIsOpening(true);
    const loadingKey = "pc-detail-loading";
    message.loading({
      content: "正在加载设备详情...",
      key: loadingKey,
      duration: 0,
    });
    try {
      const [fullDetail] = await Promise.all([
        queryClient.fetchQuery({
          queryKey: queryKeys.pcDetailFull(targetUuid),
          queryFn: () => getPcDetail(targetUuid, "full"),
        }),
        prefetchDrawer(),
      ]);
      if (openingUuidRef.current !== targetUuid) {
        return;
      }
      const computed = updateOSType([
        {
          ...(fullDetail as MysqlDeviceChangeMeat),
          data: fullDetail.data,
        },
      ])[0];
      const merged = {
        ...item,
        ...fullDetail,
        meat: item.meat,
        mac: item.mac,
        ...(computed?.meat ? { meat: computed.meat } : {}),
        ...(computed?.mac ? { mac: computed.mac } : {}),
      };
      setDrawerData(merged);
      queryClient.setQueryData(
        queryKeys.pcDetailSummary(targetUuid),
        (prev: typeof merged | undefined) => (prev ? { ...prev, ...merged } : merged)
      );
      setActive(true);
    } catch (error) {
      if (openingUuidRef.current === targetUuid) {
        message.error("设备详情获取失败，请稍后再试");
      }
    } finally {
      if (openingUuidRef.current === targetUuid) {
        openingUuidRef.current = null;
        setIsOpening(false);
        message.destroy(loadingKey);
      }
    }
  };

  const closeDrawer = () => {
    setActive(false);
    openingUuidRef.current = null;
    setIsOpening(false);
  };

  return (
    <DevieContext.Provider
      value={{
        setListData,
        drawerData,
        setDrawerData,
        isName,
        setActive,
        detailLoading,
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
        <div
          className="flex content-start items-center flex-wrap w-full"
          ref={listContainerRef}
        >
          {/**开始循环 */}
          {shouldVirtualize && listWidth > 0 ? (
            <Grid
              height={gridHeight}
              width={Math.max(listWidth, ITEM_WIDTH)}
              columnWidth={ITEM_WIDTH}
              rowHeight={ITEM_HEIGHT}
              columnCount={columnCount}
              rowCount={rowCount}
            >
              {renderGridCell}
            </Grid>
          ) : (
            <Flex wrap gap="large">
              {listData.map((tab: MysqlDeviceChangeMeat) => (
                <DetailsList
                  key={tab.id}
                  data={tab}
                  onOpen={() => openDrawer(tab)}
                />
              ))}
            </Flex>
          )}
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
        {active ? (
          <Suspense fallback={null}>
            <Drawer
              active={active}
              onActive={closeDrawer}
              data={drawerData}
            />
          </Suspense>
        ) : null}
      </div>
    </DevieContext.Provider>
  );
};

export default App;
