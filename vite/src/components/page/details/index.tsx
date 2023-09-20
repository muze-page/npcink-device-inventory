/**
 * 详情
 */
import DetailsList from "@/components/block/detailsList";
const App: React.FC = () => {
  const rtElements = [];

  for (let i = 0; i < 6; i++) {
    rtElements.push(<DetailsList key={i} />);
  }
  return (
    <>
      <div className="mt-1 flex content-start items-center flex-wrap w-[728px]">
        {/**开始循环 */}
        {rtElements}
      </div>
    </>
  );
};

export default App;
