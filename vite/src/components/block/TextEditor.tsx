import { useState, useContext, useEffect } from "react";
import { Input } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { AppContext } from "@/store/setingContext";
import { changeMySql } from "@/store/axios";

interface PropsEditor {
  default_start?: string; // 初始值
  uuid: string; // 标识符列表的唯一标识key
  type: string; // 字段名
  default_value: string; // 默认值
}

const TextEditor: React.FC<PropsEditor> = ({
  default_start,
  uuid,
  type,
  default_value,
}) => {
  const [editing, setEditing] = useState(false); // 编辑状态
  const [text, setText] = useState(default_start || default_value); // 保存值

  const { handleTypeUpdate } = useContext(AppContext);

  // 监听 default_start 变化，更新 text 值
  useEffect(() => {
    if (!editing) {
      setText(default_start || default_value);
    }
  }, [default_start, default_value, editing]);

  // 开始编辑
  const handleEditClick = () => {
    setEditing(true);
  };

  // 取消编辑
  const handleCancelClick = () => {
    setEditing(false);
    setText(default_start || default_value); // 恢复为默认值
  };

  // 保存
  const handleSaveClick = () => {
    setEditing(false);
    handleTypeUpdate && handleTypeUpdate(type, text); // 修改当前的值
    changeMySql(text, uuid, type); // 修改数据库的值
  };

  // 将值存入变量中
  const handleChange = (e: any) => {
    setText(e.target.value);
  };

  return (
    <div key={uuid}>
      {
        //保持重载，避免状态继承造成数据更新不及时
      }
      {editing ? (
        <>
          <Input
            style={{ width: "50%" }}
            value={text}
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
          <button onClick={handleEditClick} className="ml-2 bg-inherit">
            <EditOutlined twoToneColor="#fff" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TextEditor;
