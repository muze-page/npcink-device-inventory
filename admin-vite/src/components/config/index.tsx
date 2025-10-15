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
import { PlusCircleFilled, MinusCircleFilled } from "@ant-design/icons";

import { defaultOption, Site, sqlTableName } from "@/store";
import { saveSQLData, remove_department, addPublicSearchPage } from "@/axios";

import ImportExport from "@/components/config/importExport";
import { OptionType } from "@/type/index";
import { changeSelectData } from "@/store/tool";
import Header from "@/block/tab-header";

const App: React.FC = () => {
  //传来的默认选项
  const [option, setOption] = useState<OptionType>(defaultOption);

  //若密码有值，则设为已设定，后端不会更新密码
  useEffect(() => {
    if (option.password) {
      setOption((prevOption) => ({
        ...prevOption,
        password: "已设定",
      }));
    }
  }, [option.password]); // 仅在 option.password 发生变化时执行

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
    //判断
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
    //判断，若传来的是空值或空数组，则自己创建一个数组
    const newDepartmentArr =
      depArr && depArr.length === 0
        ? [newDepartment]
        : [newDepartment, ...(depArr || [])];

    setNewDepartment(""); //清空输入框

    //更新选项中的部门数组，直接使用setOption 可能无法通过option拿到最新值
    const newOption = {
      ...option,
      department: newDepartmentArr,
    };
    setOption(newOption); //保存数据

    //保存选项
    postData(newOption);
  };

  //当前部门信息
  const DepartmentState =
    option.department && option.department.length > 0
      ? option.department.join("，")
      : "暂无部门信息";

  //删除部门
  //下拉筛选 - 准备筛选数据
  const getSelectData = changeSelectData(option.department);

  const [selectedDepartment, setSelectedDepartment] = useState<string>("默认");

  //移除选中的部门
  const removeData = async (data: string) => {
    await remove_department(data); //服务器端移除
    //更新数据
    const newDepartmentList = option.department.filter(
      (dep) => dep !== selectedDepartment
    );
    const newOption = {
      ...option,
      department: newDepartmentList,
    };
    //console.log(newOption);
    setOption(newOption); //设定值
    postData(newOption); //保存选项
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
  const addPage = async () => {
    //检查输入框是否为空
    if (publicSearch.trim() === "") {
      return message.error("请输入公共查询页面路由地址");
    }
    const state = await addPublicSearchPage(publicSearch); //添加页面
    if (state) {
      const newOption = {
        ...option,
        public_search_route: publicSearch,
      };
      setOption(newOption); //设定值
      postData(newOption); //保存选项
      return;
    }
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
      <div className="pb-6 px-5">
        <Header title="设置" />
        <Form
          form={form}
          onFinish={onFinish}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
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
            <Input style={{ width: "300px" }} />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: "客户端传输数据时的密码" }]}
            extra={"客户端传输数据时的验证码，重新设定即可重置"}
          >
            <Input style={{ width: "300px" }} />
          </Form.Item>
          <Form.Item
            label="删除插件数据"
            name="delete_mysql"
            valuePropName="checked"
            extra={"删除插件的同时，删除数据库和设置信息"}
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label="折旧年限"
            name="depreciation_year"
            extra={"例如三年共36个月，36个月后折旧完毕，用回本了"}
          >
            <InputNumber addonAfter="月" style={{ width: "120px" }} />
          </Form.Item>
          <Form.Item
            label="残值率"
            name="residual_value_rate"
            extra={"例如 5% ，用了三年后，最少也值采购价的 5% "}
          >
            <InputNumber addonAfter="%" style={{ width: "120px" }} />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 2, span: 22 }}>
            <Button type="primary" htmlType="submit" className=" bg-[#1677ff]">
              保存
            </Button>
          </Form.Item>

          <Header title="其他设置" />
          <Form.Item
            label="添加部门"
            style={{ width: "100%" }}
            name="department"
            extra={DepartmentState}
          >
            <div>
              <Input
                style={{ width: "180px" }}
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
              />
              <Button
                icon={<PlusCircleFilled />}
                style={{ width: "90px", marginLeft: "30px" }}
                onClick={handleAddDepartment}
              >
                添加
              </Button>
            </div>
          </Form.Item>

          <Form.Item label="移除部门" name="department">
            <div>
              <Select
                value={selectedDepartment}
                style={{ width: "180px" }}
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
                <Button
                  icon={<MinusCircleFilled />}
                  style={{ width: "90px", marginLeft: "30px" }}
                >
                  移除
                </Button>
              </Popconfirm>
            </div>
          </Form.Item>
          <Form.Item
            label="公共查询页面"
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
                style={{ width: "180px" }}
                value={publicSearch}
                placeholder="填写页面路由"
                onChange={(e) => setPublicSearch(e.target.value)}
              />
              <Button
                icon={<PlusCircleFilled />}
                style={{ width: "90px", marginLeft: "30px" }}
                onClick={addPage}
              >
                添加
              </Button>
            </div>
          </Form.Item>

          <Header title="导入导出" />

          <Form.Item label="电脑设备数据" className="mt-4">
            <ImportExport name={sqlTableName.pcData} />
          </Form.Item>
          <Form.Item label="自定义设备数据">
            <ImportExport name={sqlTableName.styleData} />
          </Form.Item>

          <Form.Item label="手动变更数据">
            <ImportExport name={sqlTableName.changeManualData} />
          </Form.Item>
          <Form.Item label="自动变更数据">
            <ImportExport name={sqlTableName.changeAutoData} />
          </Form.Item>
        </Form>
      </div>
    </>
  );
};

export default App;
