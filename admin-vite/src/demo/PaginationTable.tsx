// PaginationTable.tsx
import { FC, useState } from "react";

interface Item {
  id: number;
  name: string;
  category: string;
  score: number;
}

interface Props {
  list: Item[]; // 已筛选排序完的完整列表
  total: number;
  pageSize: number;
  onUpdate: (id: number, patch: Partial<Item>) => void;
}

const PaginationTable: FC<Props> = ({ list, total, pageSize, onUpdate }) => {
  const [page, setPage] = useState(1);

  /* 当前页数据 */
  const start = (page - 1) * pageSize;
  const pageData = list.slice(start, start + pageSize);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <table border={1} cellPadding={6}>
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
          {pageData.map((v) => (
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

      {/* 分页按钮 */}
      <div style={{ marginTop: 8 }}>
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          上一页
        </button>
        <span style={{ margin: "0 8px" }}>
          第 {page} / {totalPages} 页
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          下一页
        </button>
      </div>
    </>
  );
};

export default PaginationTable;
