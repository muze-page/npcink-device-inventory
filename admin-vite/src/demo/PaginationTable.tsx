// src/PaginationTable.tsx
import { FC } from 'react';

interface Item {
  id: number;
  name: string;
  category: string;
  score: number;
}

interface Props {
  list: Item[];        // 已筛选排序后的完整列表
  total: number;       // 总条数
  pageSize: number;
  page: number;        // 当前页
  setPage: (p: number) => void;
  onUpdate: (id: number, patch: Partial<Item>) => void;
}

const PaginationTable: FC<Props> = ({
  list,
  total,
  pageSize,
  page,
  setPage,
  onUpdate,
}) => {
  const startIndex = (page - 1) * pageSize;
  const pageData = list.slice(startIndex, startIndex + pageSize);
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
          {pageData.map(v => (
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

      {totalPages > 1 && (
        <div style={{ marginTop: 8 }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </button>
          <span style={{ margin: '0 8px' }}>
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </>
  );
};

export default PaginationTable;