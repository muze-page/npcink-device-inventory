/**
 * 设备列表
 * TODO:翻页时才获取数据，一开始仅获取两页的数据
 */
import { SetStateAction, useState, useMemo, useEffect } from "react";
import { Pagination, Flex } from "antd";
import type { PaginationProps } from "antd";
import { dataMySql } from "@/store";
import { MysqlDeviceChangeMeat, FilterData, DataItemArr } from "@/type/index";
import { getDeviceCategory } from "@/axios/index";
//模糊搜索
import Fuse from "fuse.js";

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
import { updateOSType, devStatus } from "@/store/tool";

const App: React.FC = () => {
  //获取设备分类
  const [deviceCategoryOption, setDeviceCategoryOption] = useState<
    DataItemArr[]
  >([{ label: "", value: "" }]);

  //将拿到的数据进行排序，再添加需要的meat信息
  const DataMeatArray = updateOSType(dataMySql);

  //打印对象数据
  if (devStatus) {
    console.log("原始数据：");
    console.dir(dataMySql);
    console.log("处理后的数据：");
    console.dir(DataMeatArray);
  }

  //获取设备分类数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await getDeviceCategory();
        if (Array.isArray(categories)) {
          setDeviceCategoryOption(categories);
        }
      } catch (error) {
        console.error("获取设备分类失败:", error);
      }
    };

    fetchCategories();
  }, []);

  //设置列表数据
  const [listData, setListData] =
    useState<MysqlDeviceChangeMeat[]>(DataMeatArray);

  //筛选条件
  const [filter, setFilter] = useState<FilterData>({
    //筛选条件默认值
    state: "all", //状态
    department: "all", //部门
  });

  /* 搜索关键字 */
  const [keyword, setKeyword] = useState("");

  //每页展示数量
  const [PAGE_SIZE, setPAGE_SIZE] = useState(10); //每页展示数量

  //当前页码
  const [pageNumber, setPageNumber] = useState(1); // 当前页码（从 1 开始）

  /* 3. 计算最终展示页数据（useMemo 避免重复计算） */
  const filteredList = useMemo(() => {
    let data = [...listData];

    //筛选状态
    if (filter.state && filter.state != "all")
      data = data.filter((v) => v.state === filter.state);

    //筛选部门
    if (filter.department && filter.department != "all")
      data = data.filter((v) => v.department === filter.department);

    //console.log("部门筛选后的数据：");
    //console.dir(data);
    return data;
  }, [listData, filter]);

  /* Fuse 配置：可按需调阈值、权重等 */
  /**
   * 使用 useMemo 来创建 fuse 实例，这样当 filteredList 变化时，fuse 也会重新创建
   */
  const fuse = useMemo(
    () =>
      new Fuse(filteredList, {
        keys: ["name", "number", "ip", "mac"], // 允许在这两个字段里模糊搜
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

    //筛选姓名、编号、MAC地址、IP地址
    if (lowerKeyword) {
      //console.log("lowerKeyword", lowerKeyword);
      //精确匹配
      const exactMatches = data.filter(
        (v) =>
          v.name.toLowerCase().includes(lowerKeyword) ||
          v.number.toLowerCase().includes(lowerKeyword) ||
          v.mac.some((mac) => mac.toLowerCase().includes(lowerKeyword)) || // 优化点：逐个检查 MAC 地址
          v.ip.toLowerCase().includes(lowerKeyword)
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
    }
    //console.log("搜索结果：");
    //console.dir(data);
    return data;
  }, [filteredList, filter, keyword]);

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

  //console.log("当前页码", pageNumber);
  //console.log("每页展示数量", PAGE_SIZE);
  //console.log("未筛选的数据总数", listData.length);
  //console.log("筛选后的数据总数", searchList.length);
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
            {pagedFilteredList.map((tab: MysqlDeviceChangeMeat) => (
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
          active={active}
          onActive={() => changeActive()}
          data={drawerData}
        />
      </div>
      {/**
       * <Demo />
       */}
    </DevieContext.Provider>
  );
};

export default App;
