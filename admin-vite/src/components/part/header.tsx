//标题
interface Props {
  title: string;
}
const App: React.FC<Props> = ({ title }) => {
  return (
    <>
      <div className="flex justify-between items-center my-4">
        <div className="text-base font-black flex items-center text-zinc-900">
          {title}
        </div>
      </div>
    </>
  );
};
export default App;
