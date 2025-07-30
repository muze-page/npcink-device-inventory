import { useState, useMemo, FC } from 'react';
import ChildTable from '@/demo/sonbox';

interface Item {
  id: number;
  name: string;
  category: string;
  score: number;
}

// 每页展示数量
const PAGE_SIZE = 2;

const Parent: FC = () => {
  /* 1. 原始数据源（可来自 props / context / api） */
  const [sourceList, setSourceList] = useState<Item[]>([
    /* 示例数据：实际可来自接口 */
    { id: 1, name: 'A', category: 'cat1', score: 90 },
    { id: 2, name: 'B', category: 'cat2', score: 80 },
    { id: 3, name: 'C', category: 'cat1', score: 70 },
    { id: 4, name: 'D', category: 'cat2', score: 60 },
    { id: 5, name: 'E', category: 'cat1', score: 50 },
    { id: 6, name: 'F', category: 'cat2', score: 40 },
    { id: 7, name: 'G', category: 'cat1', score: 30 },
    { id: 8, name: 'H', category: 'cat2', score: 20 },
    { id: 9, name: 'I', category: 'cat1', score: 10 },
    { id: 10, name: 'J', category: 'cat2', score: 0 },
    /* ...... */
  ]);

  /* 2. 筛选项状态 */
  const [filterCategory, setFilterCategory] = useState<string>(''); // 类别筛选
  const [sortKey, setSortKey] = useState<'score' | 'name'>('score'); // 排序字段
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // 升/降
  const [page, setPage] = useState(1); // 当前页码（从 1 开始）

  /* 3. 计算最终展示页数据（useMemo 避免重复计算） */
  const displayData = useMemo(() => {
    let data = [...sourceList];

    /* 3-1 筛选 */
    if (filterCategory) {
      data = data.filter(v => v.category === filterCategory);
    }

    /* 3-2 排序 */
    data.sort((a, b) => {
      const x = a[sortKey];
      const y = b[sortKey];
      if (typeof x === 'string') {
        return sortOrder === 'asc' ? x.localeCompare(y) : y.localeCompare(x);
      }
      return sortOrder === 'asc' ? x - y : y - x;
    });

    /* 3-3 分页切片 */
    const startIndex = (page - 1) * PAGE_SIZE;
    return data.slice(startIndex, startIndex + PAGE_SIZE);
  }, [sourceList, filterCategory, sortKey, sortOrder, page]);

  /* 4. 子组件更新数据后回调 */
  const updateItem = (id: number, patch: Partial<Item>) => {
    setSourceList(prev =>
      prev.map(v => (v.id === id ? { ...v, ...patch } : v))
    );
  };

  /* 5. 页码总数（用于分页器） */
  const totalFiltered = useMemo(() => {
    let data = [...sourceList];
    if (filterCategory) data = data.filter(v => v.category === filterCategory);
    return data.length;
  }, [sourceList, filterCategory]);

  /* 6. 渲染筛选栏 + 分页器 + 子组件 */
  return (
    <div>
      {/* 筛选栏 */}
      <div style={{ marginBottom: 16 }}>
        <label>
          类别：
          <select
            value={filterCategory}
            onChange={e => {
              setFilterCategory(e.target.value);
              setPage(1); // 切换筛选项时回到第 1 页
            }}
          >
            <option value="">全部</option>
            <option value="cat1">类别1</option>
            <option value="cat2">类别2</option>
          </select>
        </label>

        <label style={{ marginLeft: 16 }}>
          排序：
          <select
            value={`${sortKey}-${sortOrder}`}
            onChange={e => {
              const [key, order] = e.target.value.split('-');
              setSortKey(key as 'score' | 'name');
              setSortOrder(order as 'asc' | 'desc');
              setPage(1);
            }}
          >
            <option value="score-desc">分数 ↓</option>
            <option value="score-asc">分数 ↑</option>
            <option value="name-asc">名称 A-Z</option>
            <option value="name-desc">名称 Z-A</option>
          </select>
        </label>
      </div>

      {/* 子组件：展示 + 修改 */}
      <ChildTable data={displayData} onUpdate={updateItem} />

      {/* 分页器 */}
      <div style={{ marginTop: 16 }}>
        <button
          disabled={page === 1}
          onClick={() => setPage(p => Math.max(p - 1, 1))}
        >
          上一页
        </button>
        <span style={{ margin: '0 8px' }}>
          第 {page} 页 / 共 {Math.ceil(totalFiltered / PAGE_SIZE)} 页
        </span>
        <button
          disabled={page >= Math.ceil(totalFiltered / PAGE_SIZE)}
          onClick={() => setPage(p => Math.min(p + 1, Math.ceil(totalFiltered / PAGE_SIZE)))}
        >
          下一页
        </button>
      </div>
    </div>
  );
};

export default Parent;