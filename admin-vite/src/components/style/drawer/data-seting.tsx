/**
 * 自定义设备信息 - 设置
 */
import { Button } from "antd";
import { StyleDevice } from "@/store/interface";
import { deleteStyleDeviceData } from "@/axios";
interface Props {
  data: StyleDevice;
  onActive: () => void; //修改弹窗状态
  onDelete: (uuid: string) => void; //根据指定UUID删除设备
}
const App: React.FC<Props> = ({ data, onDelete, onActive }) => {
  //拿到UUID
  const uuid = data.uuid;

  //删除动作
  const onDeleteData = async () => {
    if (!uuid) {
      alert("设备UUID不存在");
      return;
    }
    // 删除数据
    const state = await deleteStyleDeviceData(uuid);

    //成功删除则清除输入框
    if (state) {
      alert("删除成功");
      onDelete(uuid); //调用父组件的删除方法
      //1秒后关闭弹窗
      setTimeout(() => {
        onActive();
      }, 1000);
    } else {
      alert("删除失败");
    }
  };
  return (
    <>
      <Button type="primary" onClick={onDeleteData}>
        删除
      </Button>
    </>
  );
};

export default App;
