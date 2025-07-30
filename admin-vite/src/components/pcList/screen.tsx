/**
 * 设备详情 - 顶部筛选
 */
import { useContext } from "react";
import { Space, Select, Button, Tooltip } from "antd";
import {
  ReloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { FilterData } from "@/store/interface";
import { defaultOption } from "@/store";
import { changeSelectData } from "@/store/tool";
import { device_status } from "@/store/dataReplace";
import Search from "@/components/pcList/search";
import Header from "@/block/tab-header";

interface Props {
  filterData: FilterData; //当前筛选条件
  onChange: (next: FilterData) => void; //更新筛选条件
  keyword: string; //搜索关键字
  setKeyword: (value: string) => void; //修改搜索关键字
  onName: (value: boolean) => void; //传递隐藏姓名状态
}
import { AppContext } from "@/components/pcList/Context";

/**
 * 准备部门
 */
const departmentData = changeSelectData(defaultOption.department);

const App: React.FC<Props> = ({
  filterData,
  onChange,
  keyword,
  setKeyword,
  onName,
}) => {
  //拿到是否隐藏姓名的状态
  const { isName } = useContext(AppContext);

  //处理状态选项，添加全部选项
  const stateOptions = [{ label: "全部", value: "all" }, ...device_status];

  //处理部门选项，添加全部选项
  const departmentOptions = [
    { label: "全部", value: "all" },
    ...departmentData,
  ];

  /**
   * 重置按钮,
   */
  const restSelect = () => {
    //传递筛选用
    setKeyword("");
    onChange({
      //筛选条件默认值
      state: "all", //状态
      department: "all", //部门
    });
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <Header title="电脑设备资产信息" />
        <Space size={"middle"} wrap className="mb-4">
          <div>
            状态：
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
            部门：
            <Select
              value={filterData.department || "all"} // 使用value属性，从filterData获取当前值
              style={{ width: 120 }}
              onChange={(value: any) => {
                onChange({ ...filterData, department: value });
              }}
              options={departmentOptions}
            />
          </div>
          <div>
            <Search
              value={keyword}
              onChange={(kw) => {
                setKeyword(kw);
              }}
            />
          </div>

          {true && (
            <div>
              <Tooltip title="重置筛选条件">
                <Button
                  type="primary"
                  shape="circle"
                  icon={<ReloadOutlined />}
                  className="bg-[#1677ff]"
                  onClick={restSelect}
                />
              </Tooltip>
            </div>
          )}

          <Tooltip title="隐藏姓名">
            <Button
              type="primary"
              shape="circle"
              icon={isName ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              className="bg-[#1677ff]"
              onClick={() => onName(!isName)}
            />
          </Tooltip>
        </Space>
      </div>
    </>
  );
};

export default App;
