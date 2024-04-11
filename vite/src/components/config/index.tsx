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
import {
  saveSQLData,
  remove_department,
  addPublicSearchPage,
} from "@/store/axios";

import ImportExport from "@/components/config/importExport";
import { OptionType } from "@/store/interface";
import { changeSelectData } from "@/store/tool";

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
    await saveSQLData(optionObj);
    //console.log(Data);
  };

  //数据验证成功回调
  const onFinish = (values: OptionType) => {
    postData(values); //保存选项
    //console.log("Received values:", values);
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

  //添加部门TODO:检查，保存的数据必须符合对应格式

  const depArr = option.department; //传来的部门数组
  const handleAddDepartment = () => {
    //先检查输入框的值是否为空
    if (newDepartment.trim() === "") {
      message.error("请输入部门名称");
      return;
    }
    //使用传来的值组成数组，将输入框中的值添加进数组前面
    const newDepartmentArr = [newDepartment, ...depArr];
    setNewDepartment(""); //清空输入框

    //更新选项中的部门数组，直接使用setOption 可能无法通过option拿到最新值
    const newOption = {
      ...option,
      department: newDepartmentArr,
    };
    setOption(newOption); //保存数据TODO:这里直接获取选项值

    //保存选项
    postData(newOption).then(() => {
      message.success("已添加此部门");
    });
  };

  //删除部门
  //下拉筛选 - 准备筛选数据
  const getSelectData = changeSelectData(option.department);

  const [selectedDepartment, setSelectedDepartment] = useState<string>("默认");

  //移除选中的部门
  const removeData = async (data: string) => {
    await remove_department(data);//移除
    //更新数据
    const newDepartmentList = option.department.filter(
      (dep) => dep !== selectedDepartment
    );
    setOption((prevOption) => ({
      ...prevOption,
      department: newDepartmentList,
    }));
    setSelectedDepartment(""); // 清空下拉框选中的内容
    return;
  };

  //删除的二次确认
  const confirm = () => {
    switch (selectedDepartment) {
      case "":
        message.error("请选择要移除的部门");
        break;
      case "默认":
        message.error("保留用，请不要移除此部门");
        break;
      default:
        //移除
        const fieldsValue = form.getFieldsValue(); // 获取所有字段的值
        postData(fieldsValue); //保存选项
        removeData(selectedDepartment); //删除操作
    }
  };

  const cancel = () => {
    //e: React.MouseEvent<HTMLElement>
    //console.log(e);
    message.warning("已取消");
  };

  //公共查询页面
  const [publicSearch, setPublicSearch] = useState(""); // 公共查询输入框的值

  //添加页面
  const addPage = () => {
    //修改状态和路由
    //保存选项
    addPublicSearchPage(publicSearch).then((res) => {
      //打印信息
      message.success(res.message);
    });
  };

  //拼接公共搜索路由
  const routerSearch = () => {
    return Site + "/" + publicSearch;
  };

  // 在组件加载时设置输入框的默认值
  useEffect(() => {
    // 检查默认选项中是否有公共查询页面的默认值
    if (option.public_search_route) {
      // 如果有，默认值为默认选项中的值
      setPublicSearch(option.public_search_route);
    } else {
      // 否则，设置一个默认的默认值
      setPublicSearch("public_search_route");
    }
  }, [option]);

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
          <InputNumber min={4} max={80} />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit" className=" bg-[#1677ff]">
            保存
          </Button>
        </Form.Item>

        <Form.Item
          label="基础数据"
          extra={"仅导入当前没有的设备数据，导出全部数据"}
        >
          <ImportExport data="custom_table" />
        </Form.Item>
        <Form.Item
          label="变更数据"
          extra={"仅导入当前没有的设备数据，导出全部数据"}
        >
          <ImportExport data="custom_change" />
        </Form.Item>

        <Form.Item
          label="添加部门"
          style={{ width: "100%" }}
          name="department"
          extra={option.department.join("，")}
        >
          <div>
            <Input
              style={{ width: "80%" }}
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
            />
            <Button style={{ width: "20%" }} onClick={handleAddDepartment}>
              添加
            </Button>
          </div>
        </Form.Item>

        <Form.Item label="删除部门" name="department">
          <div>
            <Select
              value={selectedDepartment}
              style={{ width: "80%" }}
              options={getSelectData}
              onChange={(value) => setSelectedDepartment(value)}
            />
            <Popconfirm
              title="移除此部门"
              description="您确定要移除此部门吗？"
              onConfirm={confirm}
              onCancel={cancel}
              okText="移除"
              cancelText="我再想想"
            >
              <Button style={{ width: "20%" }}>移除</Button>
            </Popconfirm>
          </div>
        </Form.Item>
        <Form.Item
          label="添加公共查询页面"
          name="public_search_route"
          extra={
            <>
              公共查询页面地址：
              <pre>{routerSearch()}</pre>
            </>
          }
        >
          <div>
            <Input
              style={{ width: "80%" }}
              value={publicSearch}
              placeholder="填写页面路由"
              onChange={(e) => setPublicSearch(e.target.value)}
            />
            <Button style={{ width: "20%" }} onClick={addPage}>
              添加
            </Button>
          </div>
        </Form.Item>
      </Form>
    </>
  );
};

export default App;
