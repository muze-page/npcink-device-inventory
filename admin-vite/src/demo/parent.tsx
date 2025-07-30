// src/App.tsx
import { useState, useMemo } from 'react';
import SearchBar      from './SearchBar';
import FilterSortBar  from './FilterSortBar';
import PaginationTable from './PaginationTable';

export interface Item {
  id: number;
  name: string;
  category: string;
  score: number;
}

const PAGE_SIZE = 10;

/* 模拟 30 条假数据 */
const mockData: Item[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: `Item-${i + 1}`,
  category: ['cat1', 'cat2', 'cat3'][i % 3],
  score: Math.floor(Math.random() * 100),
}));

export default function App() {
  const [sourceList, setSourceList] = useState<Item[]>(mockData);

  /* 搜索关键字 */
  const [keyword, setKeyword] = useState('');
  /* 筛选/排序条件 */
  const [filter, setFilter] = useState({
    category: '',
    sortKey: 'score' as 'name' | 'score',
    sortOrder: 'desc' as 'asc' | 'desc',
  });
  /* 当前页码 */
  const [page, setPage] = useState(1);

  /* 计算：搜索 → 类别 → 排序 → 分页 */
  const [displayList, total] = useMemo(() => {
    let data = [...sourceList];

    /* ① 搜索（本地实时） */
    if (keyword.trim()) {
      const k = keyword.toLowerCase();
      data = data.filter(v => v.name.toLowerCase().includes(k));
    }

    /* ② 类别筛选 */
    if (filter.category) {
      data = data.filter(v => v.category === filter.category);
    }

    /* ③ 排序 */
    data.sort((a, b) => {
      const x = a[filter.sortKey];
      const y = b[filter.sortKey];
      const factor = filter.sortOrder === 'asc' ? 1 : -1;
      return typeof x === 'string'
        ? x.localeCompare(y) * factor
        : (Number(x) - Number(y)) * factor;
    });

    return [data, data.length];
  }, [sourceList, keyword, filter]);

  /* 修改单条数据 */
  const updateItem = (id: number, patch: Partial<Item>) =>
    setSourceList(prev => prev.map(v => (v.id === id ? { ...v, ...patch } : v)));

  return (
    <div style={{ padding: 24 }}>
      <h2>搜索 + 筛选 + 排序 + 分页 Demo</h2>

      {/* 搜索 */}
      <SearchBar value={keyword} onChange={kw => { setKeyword(kw); setPage(1); }} />

      {/* 筛选 + 排序 */}
      <FilterSortBar value={filter} onChange={f => { setFilter(f); setPage(1); }} />

      {/* 分页展示 */}
      <PaginationTable
        list={displayList}
        total={total}
        pageSize={PAGE_SIZE}
        page={page}
        setPage={setPage}
        onUpdate={updateItem}
      />
    </div>
  );
}