/**
 * 设备详情 - 顶部筛选
 */
import { useContext, useState, useEffect } from "react";
import { Space, Select, Button, Tooltip, Input } from "antd";
import type { SearchProps } from "antd/es/input/Search";
import {
  ReloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { FilterData } from "@/type/index";
import { normalize } from "@/utils/tool";
import Header from "@/components/tabHeader";
import { DevieContext } from "@/context/DeviceContext";
interface Props {
  filterData: FilterData; //当前筛选条件
  onChange: (next: FilterData) => void; //更新筛选条件
  keyword: string; //搜索关键字
  setKeyword: (value: string) => void; //修改搜索关键字
  onName: (value: boolean) => void; //传递隐藏姓名状态
}

//准备搜索框
const { Search } = Input;


const App: React.FC<Props> = ({
  filterData,
  onChange,
  keyword,
  setKeyword,
  onName,
}) => {
  //拿到是否隐藏姓名的状态和部门选项
  const { isName, deviceCategoryOption } = useContext(DevieContext);

    //准备状态筛选用选项
  const pcStateOptions = [
    { label: "全部", value: "all" },
    ...deviceCategoryOption.states,
  ];

  //准备部门筛选用选项
  const deviceCategoryOptions = [
    { label: "全部", value: "all" },
    ...deviceCategoryOption.departments,
  ];

  //重置按钮,
  const restSelect = () => {
    //重置输入框
    setKeyword("");
    //重置筛选条件
    onChange({
      //筛选条件默认值
      state: "all", //状态
      department: "all", //部门
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
    //正则处理，处理 mac 地址格式，方便搜索
    let data = normalize(value);
    setKeyword(data); //搜索
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
        <Header title="电脑资产" />
        <Space size={"middle"} wrap>
          <div>
            状态：
            <Select
              value={filterData.state || "all"} // 使用value属性，从filterData获取当前值
              style={{ width: 140 }}
              onChange={(value: any) => {
                onChange({ ...filterData, state: value });
              }}
              options={pcStateOptions}
            />
          </div>
          <div>
            部门：
            <Select
              value={filterData.department || "all"} // 使用value属性，从filterData获取当前值
              style={{ width: 140 }}
              onChange={(value: any) => {
                onChange({ ...filterData, department: value });
              }}
              options={deviceCategoryOptions}
            />
          </div>

          <Search
            placeholder="搜索名字、编号、IP或MAC地址" //添加说明
            allowClear // 可以点击清除图标删除内容
            value={inputValue} // 使用本地状态
            onChange={handleChange} // 输入回调
            onSearch={onSearch} //搜索回调
            style={{ width: 280, lineHeight: "inherit", minHeight: "10px" }}
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
          <Tooltip title="重置筛选条件">
            <Button
              type="primary"
              shape="circle"
              icon={<ReloadOutlined />}
              className="bg-[#1677ff]"
              onClick={restSelect}
            />
          </Tooltip>
        </Space>
      </div>
    </>
  );
};

export default App;
