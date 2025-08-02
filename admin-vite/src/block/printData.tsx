//传入值和标题，进行打印
import { Button } from "antd";
import { devStatus } from "@/store/tool";
interface Props {
  title: string;
  data: any;
}
const App: React.FC<Props> = ({ title, data }) => {
  //打印传入的值
  const printData = () => {
    console.log(title + "-", data);
  };
  return (
    <>
      {devStatus && (
        <Button type="default" onClick={printData} className="m-4" style={{ marginLeft: 8 }}>
          {title}
        </Button>
      )}
    </>
  );
};
export default App;
