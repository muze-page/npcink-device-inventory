/**
 * 自定义设备信息 - 设置
 */
import { useContext } from "react";
import { StyleContext } from "@/components/style/styleContext";
import { Form, Button, Input, Radio } from "antd";
import type { FormProps } from "antd";
import { StyleDevice } from "@/store/interface";
import { deleteStyleDeviceData, updateStyleDeviceData } from "@/axios";
import { device_status } from "@/store/dataReplace";
interface Props {
  data: StyleDevice; //设备数据
  onActive: () => void; //修改弹窗状态
}
const App: React.FC<Props> = ({ data, onActive }) => {
  //拿到父组件传入的删除方法
  const { setDrawerData, handleDeleteData, handleUpdateData } =
    useContext(StyleContext);
  //拿到UUID
  const uuid = data.uuid || "";
  //删除动作
  const onDeleteData = async () => {
    if (!uuid) {
      alert("设备UUID不存在");
      return;
    }

    //二次确认
    if (!window.confirm("确定要删除此设备吗？")) {
      return;
    }
    // 删除数据
    const state = await deleteStyleDeviceData(uuid);

    //成功删除则清除输入框
    if (state) {
      alert("删除成功");
      handleDeleteData(uuid); //调用父组件的删除方法
      //1秒后关闭弹窗
      setTimeout(() => {
        onActive();
      }, 1000);
    } else {
      alert("删除失败");
    }
  };

  //准备表单数据类型
  type FieldType = {
    name: string; //使用人
    purpose: string; //用途
    state: string; //设备状态
  };
  //准备表单默认值
  const defaultValue: FieldType = {
    name: data.name,
    purpose: data.purpose,
    state: data.state,
  };

  //修改数据
  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    //准备数据
    const valuesData = {
      uuid: uuid,
      name: values.name,
      purpose: values.purpose,
      state: values.state,
      data: data.data, //保留原有数据
    };

    const state = await updateStyleDeviceData(uuid, valuesData);
    if (state) {
      alert("修改成功");
      setDrawerData(valuesData); //更新弹窗数据
      handleUpdateData(uuid, valuesData); //调用父组件的更新方法
    } else {
      alert("修改失败");
    }
    console.log("更新表单提交的值:", values);
  };
  //提交失败
  const onFinishFailed: FormProps<FieldType>["onFinishFailed"] = (
    errorInfo
  ) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <>
      <Form
        name="update"
        labelAlign="left"
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        style={{ maxWidth: 600 }}
        initialValues={defaultValue}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item<FieldType> label="使用人" name="name">
          <Input />
        </Form.Item>

        <Form.Item<FieldType>
          label="用途"
          name="purpose"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item<FieldType> label="设备状态：" name="state">
          <Radio.Group options={device_status} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            更新信息
          </Button>
        </Form.Item>
        <Form.Item>
          <Button color="red" variant="text" onClick={onDeleteData}>
            移除设备
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default App;
