/**
 * 设备详情 - 详细信息
 */

const App: React.FC = () => {
  const renderDivs = () => {
    const divs = [];
    for (let i = 0; i < 9; i++) {
      divs.push(
        <div
          className="
          mb-2 w-[49.6%] h-[70px] py-4 px-5 rounded border bg-gradient-to-r
           odd:border-gray-300  odd:from-[#fcfcfc] odd:to-[#f7f7f7]
           even:from-[rgba(250,251,254,0.66)] even:to-[#f2f5fb]   even:border-blue-400 even:border-opacity-25
          
          "
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
