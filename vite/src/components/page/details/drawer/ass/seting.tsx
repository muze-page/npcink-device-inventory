/**
 * 设备详情 - 设置
 */
import { useContext, useState, useEffect } from "react";
import { Form, Button, Input, Select } from "antd";
import { AppContext } from "@/store/setingContext";
import { deltSQLData } from "@/store/axios";
import { MysqlDeviceChange } from "@/store/interface";
import { changeMySql } from "@/store/axios";
interface Props {
  data: MysqlDeviceChange; //UUID
}

//设备状态
const stateArr = [
  { value: "apply", label: "使用" },
  { value: "idie", label: "闲置" },
  { value: "fault", label: "故障" },
  { value: "scrap", label: "报废" },
];
const App: React.FC<Props> = ({ data }) => {
  const { deltArrData } = useContext(AppContext);

  /*form 变量用于操作表单实例，
  而 formData 状态变量用于存储表单数据。
  */
  const [form] = Form.useForm();
  const [_formData, setFormData] = useState(null);

  // 当 data 发生变化时更新表单的默认值
  useEffect(() => {
    form.setFieldsValue(data);
  }, [data, form]);

  /*
  说明：提交表单且数据验证成功后回调事件
  在 onFinish 回调函数中，通过调用 
  setFormData 函数将表单数据存储在 formData 状态变量中，
  以便在组件中进行进一步处理或展示。
  htmlType="submit"
  */
  const onFinish = (values: any) => {
    console.log("Received values:", values);
    setFormData(values); // 将表单数据存储在状态中
  };

  //保存设置信息
  const saveData = () => {
    //获取表单数据

    const fieldsValue = form.getFieldsValue();
    console.log(fieldsValue);
    //与默认数据对比，有变化则存入数据库
    // 比较对象 a 和 b
    for (const key in fieldsValue) {
      if (fieldsValue[key] !== undefined && data[key] !== undefined) {
        // 如果 fieldsValue 和 data 中对应键的值不同，则进行处理
        if (fieldsValue[key] !== data[key]) {
          console.log("a 对象中键值对不同:", key, fieldsValue[key]);
          const uuid = data.uuid;
          changeMySql(uuid, key, fieldsValue[key]);
        }
        alert("已保存");
      } else {
        alert("没有变化");
      }
    }
  };

  //移除设备
  const deltData = () => {
    //二次确认
    if (window.confirm("您确定要移除此设备吗？")) {
      deltArrData && deltArrData(), deltSQLData; //删除本地数据
      deltSQLData(data.uuid); //删除数据库数据
    } else {
    }
  };
  return (
    <>
      <Form
        form={form}
        onFinish={onFinish}
        labelAlign="left"
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        style={{ maxWidth: 600 }}
        initialValues={data}
      >
        <Form.Item label="姓名" name="name">
          <Input placeholder="设备使用者" />
        </Form.Item>
        <Form.Item label="编号" name="number">
          <Input placeholder="设备唯一标识编号" />
        </Form.Item>
        <Form.Item label="状态" name="state">
          <Select style={{ width: 120 }} options={stateArr} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={saveData}>
            保存
          </Button>
        </Form.Item>
        <Form.Item>
          <Button type="primary" danger onClick={deltData}>
            移除此设备
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};
export default App;
