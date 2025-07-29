/**
 * 设备详情 - 设置
 */
import { useContext, useEffect } from "react";
import { Form, Button, Input, InputNumber, Select, message } from "antd";
import { AppContext } from "@/components/pcList/Context";
import { deltSQLData, changeMySql } from "@/axios";
import { MysqlDeviceData } from "@/store/interface";
import { device_status } from "@/store/dataReplace";
import { defaultOption } from "@/store";
import {
  changeSelectData,
  totalResidualValue,
  getPercentage,
} from "@/store/tool";

//调试用
import PrintData from "@/block/printData";

//部门下拉筛选 - 准备部门筛选数据
const getSelectData = changeSelectData(defaultOption.department);

// IPv4 正则表达式
const ipv4Regex =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

// 自定义校验规则
const validateIPv4 = (_: any, value: string) => {
  if (!value || ipv4Regex.test(value)) {
    return Promise.resolve();
  }
  return Promise.reject(new Error("请输入正确的IP v4 地址"));
};

const App: React.FC = () => {
  //接收上下文中的值
  const { setListData, drawerData, setDrawerData,setActive } = useContext(AppContext);

  /*
   * form 变量用于操作表单实例，
   */
  const [form] = Form.useForm();
  //const [_formData, setFormData] = useState(null);

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
  htmlType="submit"
  */
  const onFinish = (_values: any) => {
    //console.log("Received values:", values);
    //setFormData(values); // 将表单数据存储在状态中
  };

  //接收上下文中的值
  //const { changeReal } = useContext(DeviceContext);

  //存储原始表单数据
  //const [_initialData, setInitialData] = useState(drawerData);

  //拿到最新值
  //useEffect(() => {
  //  setInitialData(drawerData);
  //}, [drawerData]);

  //保存设置信息
  const saveData = async () => {
    //获取表单数据
    const fieldsValue = form.getFieldsValue();
    const state = await changeMySql(drawerData.uuid, fieldsValue);

    //准备需要保存的数据
    const valuesData = {
      ...drawerData,
      name: fieldsValue.name, // 姓名
      number: fieldsValue.number, // 编号
      state: fieldsValue.state, // 状态
      department: fieldsValue.department, // 部门
      ip: fieldsValue.ip, // IP 地址
      purchase: fieldsValue.purchase, // 采购价
      depreciation: fieldsValue.depreciation, // 二手价
    };

    if (state) {
      console.log("修改成功" + JSON.stringify(fieldsValue));
      //alert("修改成功");
      //setDrawerData(valuesData); //更新弹窗数据
      //handleUpdateData(uuid, valuesData); //调用父组件的更新方法
      setDrawerData(valuesData); //更新弹窗数据
      //更新列表数据
      setListData((prevData) =>
        prevData.map((item) =>
          item.uuid === drawerData.uuid ? { ...item, ...valuesData } : item
        )
      );
      //console.log("更新列表数据成功" + JSON.stringify(listData));
    } else {
      alert("修改失败");
    }

    //获取设置数据，一次性更新
  };

  //移除设备
  const deltData = () => {
    //二次确认
    if (window.confirm("您确定要移除此设备吗？")) {
      setListData((prevData) =>
        prevData.filter((item) => item.uuid !== drawerData.uuid)
      ); //更新列表数据，移除当前设备
      deltSQLData(drawerData.uuid); //删除数据库数据
      setActive(false); //关闭弹窗
    } else {
      message.warning("已取消");
    }
  };

  //理论折旧值 - 根据设定的折旧年限和残值率算出
  const residualValue = totalResidualValue([drawerData]);

  return (
    <>
      <Form
        form={form}
        onFinish={onFinish}
        labelAlign="left"
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        style={{ maxWidth: 600 }}
        initialValues={drawerData}
      >
        <Form.Item<MysqlDeviceData> label="姓名" name="name">
          <Input placeholder="设备使用者" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item<MysqlDeviceData> label="编号" name="number">
          <Input placeholder="设备唯一标识编号" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item<MysqlDeviceData> label="状态" name="state">
          <Select style={{ width: 180 }} options={device_status} />
        </Form.Item>
        <Form.Item<MysqlDeviceData> label="部门" name="department">
          <Select style={{ width: 180 }} options={getSelectData} />
        </Form.Item>
        <Form.Item<MysqlDeviceData>
          label="IP 地址"
          name="ip"
          rules={[{ validator: validateIPv4 }]}
        >
          <Input placeholder="分配的唯一 IP 地址" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item<MysqlDeviceData> label="采购价" name="purchase">
          <InputNumber
            style={{ width: 180 }}
            addonAfter="￥"
            placeholder="采购时的价格"
          />
        </Form.Item>
        <Form.Item<MysqlDeviceData> label="二手价" name="depreciation">
          <InputNumber
            style={{ width: 180 }}
            addonAfter="￥"
            placeholder="二手市场的价格"
          />
        </Form.Item>
        <Form.Item<MysqlDeviceData> label="相关参数">
          <table>
            <thead>
              <tr>
                <th className="w-28 text-center">二手折旧率</th>
                <th className="w-28 text-center">残值</th>
                <th className="w-28 text-center">残值率</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className="w-28 text-center">
                  {/* 为啥可能是字符串 */}
                  {getPercentage(
                    Number(drawerData.depreciation),
                    Number(drawerData.purchase)
                  )}
                </td>
                <td className="w-28 text-center">{residualValue}元</td>
                <td className="w-28 text-center">
                  {getPercentage(residualValue, drawerData.purchase)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="text-sm text-right py-2">
                  以上数据仅供参考
                </td>
              </tr>
            </tfoot>
          </table>
        </Form.Item>

        <Form.Item>
          <Button type="primary" onClick={saveData}>
            保存设置
          </Button>
        </Form.Item>
        <Form.Item>
          <Button color="red" variant="text" onClick={deltData}>
            移除设备
          </Button>
        </Form.Item>
        {/* 打印当前表单信息 */}
        <PrintData data={form.getFieldsValue()} title="打印当前表单信息" />
      </Form>
    </>
  );
};
export default App;
