/**
 * 设置
 */
import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  Switch,
  InputNumber,
  Select,
  message,
  Popconfirm,
} from "antd";
import { defaultOption, Site } from "@/store";
import { saveSQLData } from "@/store/axios";

import ImportExport from "@/components/config/importExport";
import { OptionType } from "@/store/interface";

const App: React.FC = () => {
  //传来的默认选项
  const [option, setOption] = useState<OptionType>(defaultOption);
  /**
   * form 变量用于操作表单实例，
   * 而 formData 状态变量用于存储表单数据。

   */
  const [form] = Form.useForm();

  //TODO:最开始，没有设置选项咋办？
  // 当 option 发生变化时更新表单的默认值
  useEffect(() => {
    form.setFieldsValue(option);
  }, [option, form]);

  //保存选项动作
  const postData = async (optionObj: object) => {
    const state = saveSQLData(optionObj);
    if (await state) {
      message.success("保存成功");
    } else {
      message.error("保存失败");
    }
  };

  //数据验证成功回调
  const onFinish = (values: OptionType) => {
    postData(values); //保存选项
    console.log("Received values:", values);
  };

  //数据验证失败回调
  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  //拼接路由TODO:内容验证
  const RouteData = Form.useWatch("route", form);

  const routerMsg = () => {
    return Site + "/wp-json/npcink/v1/" + RouteData;
  };

  /**
   * 添加部门
   */
  const [newDepartment, setNewDepartment] = useState(""); // 新增部门输入框的值

  //添加部门
  const handleAddDepartment = () => {
    setNewDepartment("");
    setOption({
      ...option,
      department: [...option.department, newDepartment],
    });
  };

  //删除部门
  //下拉筛选 - 准备筛选数据
  const getSelectData = () => {
    return option.department.map((str) => ({
      value: str,
      label: str,
    }));
  };

  const [selectedDepartment, setSelectedDepartment] = useState<string>("默认");

  //移除选择部门
  const handleDeleteDepartment = () => {
    const newDepartmentList = option.department.filter(
      (dep) => dep !== selectedDepartment
    );
    setOption((prevOption) => ({
      ...prevOption,
      department: newDepartmentList,
    }));
    setSelectedDepartment(""); // 清空下拉框选中的内容
  };

  //删除的二次确认
  const confirm = () => {
    //console.log(e);
    //移除选中部门
    if (selectedDepartment === "") {
      return message.error("请选择部门");
    } else {
      handleDeleteDepartment();
      message.success("已移除此部门");
    }
  };

  const cancel = () => {
    //e: React.MouseEvent<HTMLElement>
    //console.log(e);
    message.error("已取消");
  };

  return (
    <>
      <Form
        form={form}
        onFinish={onFinish}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        initialValues={option} //默认选项值
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item
          label="路由"
          name="route"
          rules={[{ required: true, message: "客户端传输数据时的地址" }]}
          extra={
            <>
              客户端数据传输地址：
              <pre>{routerMsg()}</pre>
            </>
          }
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[{ required: true, message: "客户端传输数据时的验证码" }]}
          extra={"客户端传输数据时的验证码"}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label="删除插件数据"
          name="delete_mysql"
          valuePropName="checked"
          extra={"删除插件的同时，删除数据库和设置"}
        >
          <Switch className=" bg-[#e3eaf2]" />
        </Form.Item>
        <Form.Item
          label="设备数量"
          name="device_show_number"
          extra={"设备详情页展示的数量，默认 8"}
        >
          <InputNumber min={4} max={80} defaultValue={8} />
        </Form.Item>

        <Form.Item label="基础数据" extra={"方便数据迁移操作"}>
          <ImportExport name="custom_table" />
        </Form.Item>
        <Form.Item label="变更数据" extra={"方便数据迁移操作"}>
          <ImportExport name="custom_change" />
        </Form.Item>

        <Form.Item label="添加部门" style={{ width: "100%" }} name="department">
          <Input
            style={{ width: "70%" }}
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
          />
          <Button style={{ width: "30%" }} onClick={handleAddDepartment}>
            添加
          </Button>
          {option.department}
        </Form.Item>

        <Form.Item label="删除部门" name="department">
          <Select
            value={selectedDepartment}
            style={{ width: "70%" }}
            options={getSelectData()}
            onChange={(value) => setSelectedDepartment(value)}
          />
          <Popconfirm
            title="移除此部门"
            description="您确定要移除此部门吗？"
            onConfirm={confirm}
            onCancel={cancel}
            okText="是的"
            cancelText="我再想想"
          >
            <Button>删除</Button>
          </Popconfirm>
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit" className=" bg-[#1677ff]">
            保存
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default App;
