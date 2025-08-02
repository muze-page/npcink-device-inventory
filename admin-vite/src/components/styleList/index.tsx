/**
 * 自定义设备类型
 */
import { useState, useMemo, SetStateAction } from "react";

import { Pagination } from "antd";
import type { PaginationProps } from "antd";

//数据渲染组件
import DataList from "@/components/styleList/dataList";

//拿到自定义设备数据类型
import { StyleDevice, FilterStyleData } from "@/store/interface";

//跨组件提供方法
import { StyleContext } from "@/components/styleList/styleContext";

//拿到弹窗组件
import Drawer from "@/components/styleList/drawer/index";

//拿到顶部组件
import Header from "@/components/styleList/header";

//筛序和搜索无结果时的提示
import SearchNoData from "@/block/searchNoData";

//拿到通过接口传来的数据
import { dataStyle } from "@/store/index";

const App: React.FC = () => {
  //在设备展示列表和删除设备两个组件间同步设备数据（添加、删除设备后更新设备列表）
  const [devices, setDevices] = useState<StyleDevice[]>(dataStyle);

  //共享弹窗状态
  const [active, setActive] = useState(false);
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
    platform: "all", //采购平台
    payMethod: "all", //支付方式
  });

  /* 搜索关键字 */
  const [keyword, setKeyword] = useState("");

  //每页展示数量
  const [PAGE_SIZE, setPAGE_SIZE] = useState(10); //每页展示数量

  //当前页码
  const [pageNumber, setPageNumber] = useState(1); // 当前页码（从 1 开始）

  /* 3. 计算最终展示页数据（useMemo 避免重复计算） */
  const filteredList = useMemo(() => {
    let data = [...devices];

    //筛选状态
    if (filter.state && filter.state != "all")
      data = data.filter((v) => v.state === filter.state);

    //筛选采购平台
    if (filter.platform && filter.platform != "all")
      data = data.filter((v) => v.data.platform === filter.platform);

    //筛选付款方式
    if (filter.payMethod && filter.payMethod != "all")
      data = data.filter((v) => v.data.pay_method === filter.payMethod);

    //筛选姓名、产品名称、订单号
    if (keyword.trim()) {
      const k = keyword.toLowerCase();

      //查找使用人姓名、设备名称、订单号、采购人姓名、TODO:加入模糊搜索
      data = data.filter(
        (v) =>
          v.name.toLowerCase().includes(k) ||
          v.data.title.toLowerCase().includes(k) ||
          v.data.order.toLowerCase().includes(k) ||
          v.data.purchaser.toLowerCase().includes(k)
      );
      //console.log("筛选后的data值：" + data);
    }
    return data;
  }, [devices, filter, keyword]);

  // 计算分页后的数据
  const pagedFilteredList = useMemo(() => {
    /* 3-3 分页切片 */
    const startIndex = (pageNumber - 1) * PAGE_SIZE;
    //截取数据
    return filteredList.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredList, pageNumber, PAGE_SIZE]);

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
          {/**开始循环 */}
          {pagedFilteredList.map((tab) => (
            <DataList
              key={tab.id}
              data={tab}
              onActive={() => changeActive()}
              onDrawerData={() => setDrawerData(tab)}
            />
          ))}
        </div>

        {/**没有数据 */}
        {pagedFilteredList.length === 0 && <SearchNoData />}

        {/**分页 */}
        {filteredList.length > PAGE_SIZE && (
          <div className="mt-4 float-right">
            <Pagination
              current={pageNumber} //当前页数
              pageSize={PAGE_SIZE} //每页条数
              total={filteredList.length} //数据总数
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
