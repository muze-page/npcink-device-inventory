/**
 * 表头
 * @returns
 */
interface Props {
  items: {
    key: string;//key
    label: string;//标题
    sum: number;//数值
    color: string;//背景颜色
    activeColor: string;//激活的tab颜色
    children: React.ReactElement;//子组件
  }[];
  handleTabClick: Function;//点击tab的回调
  activeTab: number;//激活的tab索引
}

const App: React.FC<Props> = ({ items, handleTabClick, activeTab }) => {
  return (
    <div className="flex items-center">
      {items.map((tab, index) => (
        <div
          className={`w-calc-1/4 first:ml-0 ml-4 cursor-pointer relative h-[6em] rounded-xl px-5 py-4  bg-gradient-to-br   w-full 
           

            ${index === activeTab ? tab.activeColor : tab.color}
            
            `}
          key={index}
          onClick={() => handleTabClick(index)}
        >
          {/**className={`tab ${index === activeTab ? "active" : ""}`} */}
          <div className="text-xs font-normal text-zinc-900">{tab.label}</div>
          <div className="text-2xl font-normal text-zinc-900">{tab.sum}</div>
        </div>
      ))}
    </div>
  );
};

export default App;
