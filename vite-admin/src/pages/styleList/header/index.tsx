/**
 * 自定义设备信息列表 - 顶部
 */
import { useState, useContext, useEffect } from "react";
import { Space, Select, Button, Tooltip, Input } from "antd";
import type { SearchProps } from "antd/es/input/Search";
import {
  ReloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  PlusOutlined,
} from "@ant-design/icons";

//导入类型
import { FilterStyleData } from "@/type/index";

//导入设备状态类型
import { device_status } from "@/utils/replace";

//跨组件提供方法
import { StyleContext } from "@/context/StyleContext";

//准备采购平台,付款方式
import { stylePlatform } from "@/utils/replace";

//引入数据填写弹窗表单
import Add from "@/pages/styleList/header/add";

//引入头部模块
import Header from "@/components/tabHeader";

interface Props {
  filterData: FilterStyleData; //当前筛选条件
  onChange: (next: FilterStyleData) => void; //更新筛选条件
  keyword: string; //搜索关键字
  setKeyword: (value: string) => void; //修改搜索关键字
  onName: (value: boolean) => void; //传递隐藏姓名状态
}

//准备搜索框
const { Search } = Input;

//处理状态选项，添加全部选项
const stateOptions = [{ label: "全部", value: "all" }, ...device_status];

//处理采购平台选项，添加全部选项
const stylePlatformOptions = [
  { label: "全部", value: "all" },
  ...stylePlatform,
];

//处理付款平台
//const payPlatformOptions = [{ label: "全部", value: "all" }, ...stylePayType];

const App: React.FC<Props> = ({
  filterData,
  onChange,
  keyword,
  setKeyword,
  onName,
}) => {
  //拿到是否隐藏姓名的状态和分类选项
  const { isName, styleCategoryOption } = useContext(StyleContext);

  //信息录入弹窗状态
  const [isModalOpen, setIsModalOpen] = useState(false);

  //准备分类选项
  const styleCategoryOptions = [
    { label: "全部", value: "all" },
    ...styleCategoryOption,
  ];

  //展示弹窗
  const showModal = () => {
    setIsModalOpen(true);
  };

  //隐藏弹窗
  const handleOk = () => {
    setIsModalOpen(false);
  };

  /**
   * 筛选和搜索
   */
  //重置按钮,
  const restSelect = () => {
    //重置输入框
    setKeyword("");
    //重置筛选条件
    onChange({
      //筛选条件默认值
      state: "all", //状态
      category: "all", //设备类别
      platform: "all", //平台
      payMethod: "all", //付款方式
    });
  };

  /**
   * 搜索关键字
   */
  //存储输入框中的值
  const [inputValue, setInputValue] = useState<string>(keyword);

  // 同步外部输入内容变化
  useEffect(() => {
    setInputValue(keyword);
  }, [keyword]);
  //搜索动作
  const onSearch: SearchProps["onSearch"] = (value, _e, _info) => {
    setKeyword(value); //搜索
    //console.log("搜索的值：" + data);
  };

  //同步输入框变化
  const handleChange: SearchProps["onChange"] = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <Header title="其他资产" />
        <Space align="center" size={"middle"} wrap>
          <div>
            设备状态：
            <Select
              value={filterData.state || "all"} // 使用value属性，从filterData获取当前值
              style={{ width: 80 }}
              onChange={(value: any) => {
                onChange({ ...filterData, state: value });
              }}
              options={stateOptions}
            />
          </div>

          <div>
            分类：
            <Select
              value={filterData.category || "all"} // 使用value属性，从filterData获取当前值
              style={{ width: 100 }}
              onChange={(value: string) => {
                onChange({ ...filterData, category: value });
              }}
              options={styleCategoryOptions}
            />
          </div>

          <div>
            采购平台：
            <Select
              value={filterData.platform || "all"} // 使用value属性，从filterData获取当前值
              style={{ width: 100 }}
              onChange={(value: string) => {
                onChange({ ...filterData, platform: value });
              }}
              options={stylePlatformOptions}
            />
          </div>
          {/**
             * 
            <div>
            付款方式：
            <Select
              value={filterData.payMethod || "all"} // 使用value属性，从filterData获取当前值
              style={{ width: 100 }}
              onChange={(value: string) => {
                onChange({ ...filterData, payMethod: value });
              }}
              options={payPlatformOptions}
            />
          </div>
             */}

          <Search
            placeholder="搜索姓名、订单号、产品名称" //添加说明
            allowClear // 可以点击清除图标删除内容
            value={inputValue} // 使用本地状态
            onChange={handleChange} // 输入回调
            onSearch={onSearch} //搜索回调
            style={{ width: 260, lineHeight: "inherit", minHeight: "10px" }}
            className="searchInput"
          />

          <Tooltip title="隐藏姓名">
            <Button
              type="primary"
              shape="circle"
              icon={isName ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              className="bg-[#1677ff]"
              onClick={() => onName(!isName)}
            />
          </Tooltip>

          <Tooltip title="添加设备">
            <Button
              type="primary"
              shape="circle"
              icon={<PlusOutlined />}
              className="bg-[#1677ff]"
              onClick={showModal}
            />
          </Tooltip>

          <Tooltip title="重置筛选">
            <Button
              type="primary"
              shape="circle"
              icon={<ReloadOutlined />}
              className="bg-[#1677ff]"
              onClick={restSelect}
            />
          </Tooltip>
        </Space>
        <Add isModalOpen={isModalOpen} handleOk={handleOk} />
      </div>
    </>
  );
};

export default App;
