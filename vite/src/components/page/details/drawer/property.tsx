/**
 * 设备详情 - 展开
 */
import { useState } from "react";
import { Input, Tabs } from "antd";
import {
  CodepenOutlined,
  ApartmentOutlined,
  EditOutlined,
} from "@ant-design/icons";

import type { TabsProps } from "antd";
import Info from "@/components/page/details/block/info";
import Change from "@/components/page/details/block/change";
import MacOs from "@/assets/macos.png";
import Win from "@/assets/windows_s.png";
import User from "@/assets/user.svg";

import { MysqlDeviceChangeMeat } from "@/store/interface";
import { changeMySql } from "@/store/axios";

interface Props {
  data: MysqlDeviceChangeMeat;
}
const App: React.FC<Props> = ({ data }) => {
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: (
        <span>
          <CodepenOutlined />
          硬件信息
        </span>
      ),
      children: <Info data={data.dataNew} />,
    },
    {
      key: "2",
      label: (
        <span>
          <ApartmentOutlined />
          变更记录
        </span>
      ),
      children: <Change data={data.uuid} />,
    },
  ];

  const osTypes = [
    { id: 1, name: "mac", image: MacOs },
    { id: 2, name: "Windows", image: Win },
  ];

  return (
    <>
      {/**品牌标志 */}
      {osTypes
        .filter((osType) => data.meat.ostype.includes(osType.name))
        .map((osType) => (
          <div key={osType.id} className="flex">
            {/**LOGO */}
            <Mark osType={osType} />
            {/**详细内容 */}
            <Msg osType={osType} data={data} />
          </div>
        ))}

      <Tabs defaultActiveKey="1" items={items} />
    </>
  );
};

export default App;
/**
 * 标识
 */
interface osTypeData {
  id: number;
  name: string;
  image: string;
}

interface PropsMark {
  osType: osTypeData;
}
const Mark: React.FC<PropsMark> = ({ osType }) => (
  <div
    className={`rounded-l-[4px] py-[22px] px-[10px] 
${
  (osType.name === "Windows" && "bg-[#356dee]") ||
  (osType.name === "mac" && "Mac_icon_background_color")
}
`}
  >
    <img src={osType.image} className="w-[110px] h-[110px]" />
  </div>
);

//相关信息
interface PropsMsg {
  osType: osTypeData;
  data: MysqlDeviceChangeMeat;
}
const Msg: React.FC<PropsMsg> = ({ osType, data }) => (
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
        <TextEditor defaults={data.styleName} uuid={data.uuid} type="name" />
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
      <p className="flex items-center">
        <img src={User} className="svg svgReversal" />
        <span>{data.name ?? "暂无昵称"}</span>
      </p>
      <div className="flex items-center ml-8 m-0">
        编号：
        <TextEditor
          defaults={data.styleNumber}
          uuid={data.uuid}
          type="number"
        />
      </div>
      <div className="flex items-center ml-8 m-0">
        状态：{data.is_enabled == "1" ? "正常" : "停用"}
      </div>
    </div>
  </div>
);

/**
 * 修改值
 * 需要：默认值、UUID、要修改的字段
 *  {data.styleName ?? "暂无备注"}
 */
interface PropsEditor {
  defaults: string; //初始值
  uuid: string; //标识符
  type: string; //字段名
}
const TextEditor: React.FC<PropsEditor> = ({ defaults, uuid, type }) => {
  const [editing, setEditing] = useState(false); //编辑状态
  const [text, setText] = useState(defaults || "暂无备注"); //保存值
  const [editedText, setEditedText] = useState(""); //保存输入框中的值

  //开始编辑
  const handleEditClick = () => {
    setEditedText(text);
    setEditing(true);
  };

  //取消编辑
  const handleCancelClick = () => {
    setEditing(false);
    setEditedText("");
  };

  //保存
  const handleSaveClick = () => {
    setText(editedText);
    setEditing(false);
    setEditedText("");
    changeMySql(editedText, uuid, type); //修改值
  };

  //将值存入变量中
  const handleChange = (e: any) => {
    setEditedText(e.target.value);
  };

  return (
    <div>
      {editing ? (
        <>
          <Input
            style={{ width: "50%" }}
            value={editedText}
            onChange={handleChange}
          />
          <button onClick={handleSaveClick} className="bt">
            保存
          </button>
          <button onClick={handleCancelClick} className="bt">
            取消
          </button>
        </>
      ) : (
        <div>
          <span>{text}</span>
          <button onClick={handleEditClick} className="ml-2">
            <EditOutlined twoToneColor="#fff" />
          </button>
        </div>
      )}
    </div>
  );
};
