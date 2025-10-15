/**
 * 自定义设备信息 - 设置
 */
import { useContext, useEffect } from "react";
import { StyleContext } from "@/components/styleList/styleContext";
import { Form, Button, Input, Radio } from "antd";
import type { FormProps } from "antd";
import { deleteStyleDeviceData, updateStyleDeviceData } from "@/axios";
import { device_status } from "@/store/dataReplace";
import { StyleDeviceSeting } from "@/store/interface";
const { TextArea } = Input;
interface Props {
  onActive: () => void; //修改弹窗状态
}
const App: React.FC<Props> = ({ onActive }) => {
  //拿到父组件传入的删除方法
  const { drawerData, setDrawerData, handleDeleteData, handleUpdateData } =
    useContext(StyleContext);

  //拿到UUID
  const uuid = drawerData.uuid || "";
  //删除动作
  const onDeleteData = async () => {
    if (!uuid) {
      alert("设备UUID不存在");
      return;
    }

    //二次确认
    if (!window.confirm("您确定要删除此设备吗？\n相关变更记录将一并删除！")) {
      return;
    }
    // 删除数据
    const state = await deleteStyleDeviceData(uuid);

    //成功删除则清除输入框
    if (state) {
      //alert("删除成功");
      handleDeleteData(uuid); //调用父组件的删除方法
      //1秒后关闭弹窗
      setTimeout(() => {
        onActive();
      }, 1000);
    } else {
      alert("删除失败");
    }
  };

  // 创建 Form 实例
  const [form] = Form.useForm();
  // 当 drawerData 变化时更新表单值
  useEffect(() => {
    form.setFieldsValue({
      name: drawerData.name,
      purpose: drawerData.purpose,
      state: drawerData.state,
    });
  }, [drawerData, form]);

  //修改数据
  const onFinish: FormProps<StyleDeviceSeting>["onFinish"] = async (values) => {
    //准备数据
    const valuesData = {
      id: drawerData.id,
      number: values.number,
      category: values.category,
      uuid: uuid,
      created_at:drawerData.created_at,
      name: values.name,
      purpose: values.purpose,
      state: values.state,
      data: drawerData.data, //保留原有数据
    };

    const state = await updateStyleDeviceData(uuid, valuesData);
    if (state) {
      //alert("修改成功");
      setDrawerData(valuesData); //更新弹窗数据
      handleUpdateData(uuid, valuesData); //调用父组件的更新方法
    } else {
      alert("修改失败");
    }
  };
  //提交失败
  const onFinishFailed: FormProps<StyleDeviceSeting>["onFinishFailed"] = (
    errorInfo
  ) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <>
      <Form
        form={form}
        name="update"
        labelAlign="left"
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        style={{ maxWidth: 600 }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item<StyleDeviceSeting> label="使用人" name="name">
          <Input />
        </Form.Item>

        <Form.Item<StyleDeviceSeting> label="设备状态：" name="state">
          <Radio.Group options={device_status} />
        </Form.Item>

        <Form.Item<StyleDeviceSeting>
          label="用途"
          name="purpose"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <TextArea rows={3} />
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
