//弹窗内容头部
import { useContext } from "react";
import { Switch } from "antd";

import { MysqlDeviceChangeMeat, PropBgColor } from "@/store/interface";

import { AppContext } from "@/store/setingContext";
import { changeMySql } from "@/store/axios";

import User from "@/assets/user.svg";

import TextEditor from "@/components/block/TextEditor";

interface Props {
  osType: PropBgColor;
  data: MysqlDeviceChangeMeat;
}

const App: React.FC<Props> = ({ osType, data }) => {
  const { handleTypeUpdate } = useContext(AppContext);
  //触发状态按钮
  const onChange = (checked: boolean) => {
    const newTypeValue = checked ? "1" : "0";
    //修改状态
    handleTypeUpdate && handleTypeUpdate("is_enabled", newTypeValue);
    //更新数据
    changeMySql(newTypeValue, data.uuid, "type");
  };

  return (
    <div
      className={`pt-6 pr-[17px] pb-6 pl-[23px] text-white text-sm flex-1 
  ${
    (osType.name === "Windows" && "Windows_content_background_color") ||
    (osType.name === "mac" && "Mac_content_background_color")
  }
  
  `}
    >
      {/**备注 */}
      <div className="flex justify-between">
        <div className="flex items-center text-lg">
          <TextEditor
            default_start={data.styleName}
            uuid={data.uuid}
            type="styleName"
            default_value="未有备注"
          />

          <div className="flex items-center ml-8 m-0">
            编号：
            <TextEditor
              default_start={data.styleNumber}
              uuid={data.uuid}
              type="styleNumber"
              default_value="未有编号"
            />
          </div>
        </div>
      </div>
      {/**操作系统 */}
      <p className="mt-2">{data.meat.model}</p>
      {/*大概配置信息 */}
      <p>
        {data.meat.cpu} / {data.meat.memory} G /{" "}
        {data.meat.disk > 1024
          ? (data.meat.disk / 1024).toFixed(2) + " T"
          : data.meat.disk + " G"}
      </p>

      {/**昵称 */}
      <div className="mt-5 flex items-center">
        <div className="flex items-center">
          <img src={User} className="svg svgReversal" />

          <TextEditor
            default_start={data.name}
            uuid={data.uuid}
            type="name"
            default_value="未有昵称"
          />
        </div>

        <div className="flex items-center ml-8 m-0">
          状态：
          <Switch
            defaultChecked={data.is_enabled == "1" ? true : false}
            checkedChildren="启用"
            unCheckedChildren="停用"
            onChange={onChange}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
