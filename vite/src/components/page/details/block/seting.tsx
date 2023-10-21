import { useContext } from "react";
import { Form, Button } from "antd";
import { AppContext } from "@/store/setingContext";

const App: React.FC = () => {
  const { deltArrData } = useContext(AppContext);
  return (
    <>
      <Form
        labelAlign="left"
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        style={{ maxWidth: 600 }}
      >
        <Form.Item label="删除">
          <Button type="primary" danger onClick={deltArrData}>
            删除此设备
          </Button>
        </Form.Item>
      </Form>
      
    </>
  );
};
export default App;
