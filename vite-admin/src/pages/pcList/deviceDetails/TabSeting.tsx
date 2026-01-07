/**
 * 设备详情 - 设置
 */
import { useContext, useEffect } from "react";
import { Form, Button, Input, InputNumber, Modal } from "antd";
import { DevieContext } from "@/context/DeviceContext";
import { deltSQLData, changeMySql } from "@/services/index";
import { MysqlDeviceData } from "@/type/index";
import { totalResidualValue, validateIPv4 } from "@/utils/tool";
//选择输入框
import SelectInput from "@/components/selectInput";
/**残值组件 */
import Scrap from "@/pages/pcList/deviceDetails/block/scrap";
interface Props {
  onSaved?: () => void;
}

const App: React.FC<Props> = ({ onSaved }) => {
  //接收上下文中的值
  const {
    setListData,
    drawerData,
    setDrawerData,
    setActive,
    deviceCategoryOption,
  } = useContext(DevieContext);

  /*
   * form 变量用于操作表单实例，
   */
  const [form] = Form.useForm();

  /**
   * 当 drawerData 的值发生变化时更新表单的默认值
   * 让 Form 先挂载再调用
   */
  useEffect(() => {
    setTimeout(
      () =>
        form.setFieldsValue({
          name: drawerData.name, // 姓名
          number: drawerData.number, // 编号
          state: drawerData.state, // 状态
          department: drawerData.department, // 部门
          ip: drawerData.ip, // IP 地址
          purchase: drawerData.purchase, // 采购价
          depreciation: drawerData.depreciation, // 二手价
        }),
      0
    );
  }, [drawerData, form]);

  /*
  说明：提交表单且数据验证成功后回调事件
  在 onFinish 回调函数中，通过调用 
  setFormData 函数将表单数据存储在 formData 状态变量中，
  以便在组件中进行进一步处理或展示。
  保存设置信息
  */
  const onFinish = async (values: MysqlDeviceData) => {
    const state = await changeMySql(drawerData.uuid, values);

    //准备需要保存的数据
    const valuesData = {
      ...drawerData,
      name: values.name, // 姓名
      state: values.state, // 状态
      number: values.number, // 编号
      department: values.department, // 部门
      purchase: values.purchase, // 采购价
      depreciation: values.depreciation, // 二手价
      ip: values.ip, // IP 地址
    };

    if (state) {
      //console.log("修改成功" + JSON.stringify(values));
      setDrawerData(valuesData); //更新弹窗数据
      //更新列表数据
      setListData((prevData) =>
        prevData.map((item) =>
          item.uuid === drawerData.uuid ? { ...item, ...valuesData } : item
        )
      );
      onSaved?.();
      //console.log("更新列表数据成功" + JSON.stringify(listData));
    }
  };

  //移除设备
  const deltData = () => {
    Modal.confirm({
      title: "确认删除",
      content: "您确定要删除此设备吗？相关变更记录将一并删除！",
      okText: "删除",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: () => {
        setListData((prevData) =>
          prevData.filter((item) => item.uuid !== drawerData.uuid)
        ); //更新列表数据，移除当前设备
        deltSQLData(drawerData.uuid); //删除数据库数据
        setActive(false); //关闭弹窗
      },
    });
  };

  //理论折旧值 - 根据设定的折旧年限和残值率算出
  const residualValue = totalResidualValue([drawerData]);

  return (
    <>
      <Form
        form={form}
        onFinish={onFinish}
        labelAlign="left"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        initialValues={drawerData}
      >
        <div className="flex gap-6 flex-wrap">
          <div className="flex-1">
            <Form.Item<MysqlDeviceData> label="姓名" name="name">
              <Input placeholder="设备使用者" />
            </Form.Item>
            <Form.Item<MysqlDeviceData> label="编号" name="number">
              <Input placeholder="设备唯一标识编号" />
            </Form.Item>
            <Form.Item<MysqlDeviceData> label="状态" name="state">
              <SelectInput
                options={deviceCategoryOption.states}
                defaultValue={drawerData.state}
                onChange={(value) => form?.setFieldsValue({ state: value })}
              />
            </Form.Item>
            <Form.Item<MysqlDeviceData> label="部门" name="department">
              <SelectInput
                options={deviceCategoryOption.departments}
                defaultValue={drawerData.department}
                onChange={(value) =>
                  form?.setFieldsValue({ department: value })
                }
              />
            </Form.Item>
          </div>
          <div className="flex-1">
            <Form.Item<MysqlDeviceData>
              label="IP 地址"
              name="ip"
              rules={[{ validator: validateIPv4 }]}
            >
              <Input placeholder="分配的唯一 IP 地址" />
            </Form.Item>
            <Form.Item<MysqlDeviceData> label="采购价" name="purchase">
              <InputNumber
                min={0}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                style={{ width: "100%" }}
                addonAfter="￥"
                placeholder="采购时的价格"
              />
            </Form.Item>
            <Form.Item<MysqlDeviceData> label="二手价" name="depreciation">
              <InputNumber
                min={0}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                style={{ width: "100%" }}
                addonAfter="￥"
                placeholder="二手市场的价格"
              />
            </Form.Item>
          </div>
        </div>
        {/**残值组件 */}
        <Form.Item<MysqlDeviceData> label="相关参数">
          <Scrap drawerData={drawerData} residualValue={residualValue} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            保存设置
          </Button>
        </Form.Item>
        <Form.Item>
          <Button color="red" variant="text" onClick={deltData}>
            移除设备
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};
export default App;
