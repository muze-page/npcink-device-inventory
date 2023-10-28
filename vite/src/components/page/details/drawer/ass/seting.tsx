/**
 * 设备详情 - 设置
 */
import { useContext } from "react";
import { Form, Button } from "antd";
import { AppContext } from "@/store/setingContext";
import { deltSQLData } from "@/store/axios";

interface Props {
  data: string; //UUID
}
const App: React.FC<Props> = ({ data }) => {
  const { deltArrData } = useContext(AppContext);
  const deltData = () => {
    deltArrData && deltArrData(), deltSQLData; //删除本地数据
    deltSQLData(data); //删除数据库数据
  };
  return (
    <>
      <Form
        labelAlign="left"
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        style={{ maxWidth: 600 }}
      >
        <Form.Item label="删除">
          <Button type="primary" danger onClick={deltData}>
            删除此设备
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};
export default App;
