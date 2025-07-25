/**
 * 广告内容
 * @returns
 */
const App = () => {
    return (
      <div className="w-[calc(100%-48px)] absolute left-6 bottom-6 h-[76px] px-6 py-4 flex items-center justify-between mt-6 bg-orange-50">
        {/**第一部分 */}
        <div>
          <div className="text-sm font-normal leading-[22px] text-amber-950">
            专业定制
          </div>
          <div className="text-xs font-normal leading-[22px] text-amber-950">
            为您添加个性化数据大盘，针对性提升运维效率。
          </div>
        </div>
        {/**第二部分 */}
        <div className="w-[104px] h-8 leading-8 rounded-sm bg-orange-300 text-xs font-normal text-center text-amber-950 cursor-pointer ">
          <a
            href="https://www.npc.ink/277900.html"
            target="_blank"
            className="text-amber-950"
          >
            {" "}
            选择专业
          </a>
        </div>
      </div>
    );
  };

  export default App;