/**
 * 表头
 * @returns
 */
interface Props {
  items: {
    key: string;
    label: string;
    sum: number;
    color: string;
    activeColor: string;
    children: React.ReactElement;
  }[];
  handleTabClick: Function;
  activeTab: number;
}

const App: React.FC<Props> = ({ items, handleTabClick, activeTab }) => {
  return (
    <div className="flex items-center">
      {items.map((tab, index) => (
        <div
          className={`w-calc-1/4 first:ml-0 ml-4 cursor-pointer relative h-[6em] rounded-xl px-5 py-4  bg-gradient-to-br   w-full ${tab.color}`}
          key={index}
          onClick={() => handleTabClick(index)}
        >
          {/**className={`tab ${index === activeTab ? "active" : ""}`} */}
          <div className="text-xs font-normal text-zinc-900">{tab.label}</div>
          <div className="text-2xl font-normal text-zinc-900">{tab.sum}</div>
          {/*下横线*/}
          {index === activeTab && (
            <div
              className={`w-full h-[2px] rounded-sm  absolute bottom-0 left-0 z-10 ${tab.activeColor}`}
            ></div>
          )}
        </div>
      ))}
    </div>
  );
};

export default App;
