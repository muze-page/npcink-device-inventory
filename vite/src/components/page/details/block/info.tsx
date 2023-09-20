/**
 * 设备详情 - 详细信息
 */

const App: React.FC = () => {
  const renderDivs = () => {
    const divs = [];
    for (let i = 0; i < 16; i++) {
      divs.push(
        <div
          className={`
          mb-2 w-[49.6%] h-[70px] py-4 px-5 rounded border bg-gradient-to-r

          
          

          ${i % 4 === 0 || i % 4 === 3 || i % 4 === 4 ? "bg_blue" : "bg_yellow"}
          
           `}
          key={i}
        >
          <p className="text-sm text-zinc-600">计算机型号</p>
          <p className="mt-1 text-base text-zinc-600">Macmini9,1</p>
        </div>
      );
    }
    return divs;
  };

  return (
    <>
      <div className="mt-1 flex justify-between items-center flex-wrap">
        {/**开始循环 */}
        {renderDivs()}
      </div>
    </>
  );
};

export default App;
