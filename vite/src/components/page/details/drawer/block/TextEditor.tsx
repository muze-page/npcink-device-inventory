/**
 * 修改值
 * 需要：默认值、UUID、要修改的字段
 *  {data.styleName ?? "暂无备注"}
 */
import { useState, useContext } from "react";
import { Input } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { AppContext } from "@/store/setingContext";
import { changeMySql } from "@/store/axios";
interface PropsEditor {
  defaults: string; //初始值
  uuid: string; //标识符
  type: string; //字段名
}
const TextEditor: React.FC<PropsEditor> = ({ defaults, uuid, type }) => {
  const [editing, setEditing] = useState(false); //编辑状态
  const [text, setText] = useState(defaults || "暂无备注"); //保存值
  const [editedText, setEditedText] = useState(""); //保存输入框中的值

  const { handleTypeUpdate } = useContext(AppContext);

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
    handleTypeUpdate && handleTypeUpdate(type, editedText); //修改当前的值
    changeMySql(editedText, uuid, type); //修改数据库的值
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

export default TextEditor;
