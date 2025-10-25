/**
 * 自定义设备信息 - 设置
 */
import { useContext, useEffect } from "react";
import { StyleContext } from "@/context/StyleContext";
import { Form, Button, Input, Radio } from "antd";
import type { FormProps } from "antd";
import { deleteStyleDeviceData, updateStyleDeviceData } from "@/services/index";
import { StyleDeviceSeting } from "@/type/index";
//选择输入框
import SelectInput from "@/components/selectInput";
const { TextArea } = Input;
interface Props {
  onActive: () => void; //修改弹窗状态
}
const App: React.FC<Props> = ({ onActive }) => {
  //拿到父组件传入的方法
  const {
    drawerData,
    setDrawerData,
    handleDeleteData,
    handleUpdateData,
    styleCategoryOption,
  } = useContext(StyleContext);

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
      number: drawerData.number,
      category: drawerData.category,
      purpose: drawerData.purpose,
      state: drawerData.state,
    });
  }, [drawerData, form]);

  //修改数据
  const onFinish: FormProps<StyleDeviceSeting>["onFinish"] = async (values) => {
    //准备数据
    const valuesData = {
      id: drawerData.id,
      number: values.number, //设备编号
      category: values.category, //设备分类
      uuid: uuid,
      created_at: drawerData.created_at, //保留创建时间
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
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        style={{ maxWidth: 480 }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item<StyleDeviceSeting>
          label="使用人"
          name="name"
          rules={[{ required: true, message: "您的设备使用人" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item<StyleDeviceSeting>
          label="编号"
          name="number"
          rules={[{ required: true, message: "您的设备编号" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item<StyleDeviceSeting>
          label="分类"
          name="category"
          rules={[{ required: true, message: "您的设备分类" }]}
        >
          <SelectInput
            options={styleCategoryOption.categories}
            defaultValue={drawerData.category}
            onChange={(value) => form?.setFieldsValue({ category: value })}
          />
        </Form.Item>

        <Form.Item<StyleDeviceSeting>
          label="设备状态："
          name="state"
          rules={[{ required: true, message: "您的设备状态" }]}
        >
          <SelectInput
            options={styleCategoryOption.states}
            defaultValue={drawerData.state}
            onChange={(value) => form?.setFieldsValue({ state: value })}
          />
        </Form.Item>

        <Form.Item<StyleDeviceSeting>
          label="用途"
          name="purpose"
          rules={[{ required: true, message: "您的设备用途" }]}
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
