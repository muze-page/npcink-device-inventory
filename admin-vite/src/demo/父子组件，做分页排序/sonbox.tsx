import { FC } from "react";

interface Item {
  id: number;
  name: string;
  category: string;
  score: number;
}

interface Props {
  data: Item[]; // 当前页数据
  onUpdate: (id: number, patch: Partial<Item>) => void;
}

const ChildTable: FC<Props> = ({ data, onUpdate }) => (
  <table border={1}>
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Category</th>
        <th>Score</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody>
      {data.map((v) => (
        <tr key={v.id}>
          <td>{v.id}</td>
          <td>{v.name}</td>
          <td>{v.category}</td>
          <td>{v.score}</td>
          <td>
            <button onClick={() => onUpdate(v.id, { score: v.score + 10 })}>
              +10
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default ChildTable;
