// Parent.tsx
import { useState, useMemo } from "react";
import FilterSortBar from "./FilterSortBar";
import PaginationTable from "./PaginationTable";

interface Item {
  id: number;
  name: string;
  category: string;
  score: number;
}

const PAGE_SIZE = 5;

export default function Parent() {
  /* 原始数据（可被任意子组件修改） */
  const [sourceList, setSourceList] = useState<Item[]>([
    { id: 1, name: "A", category: "cat1", score: 90 },
    { id: 2, name: "B", category: "cat2", score: 80 },
    { id: 3, name: "C", category: "cat1", score: 70 },
    { id: 4, name: "D", category: "cat2", score: 60 },
    { id: 5, name: "E", category: "cat1", score: 50 },
    { id: 6, name: "F", category: "cat2", score: 40 },
    { id: 7, name: "G", category: "cat1", score: 30 },
    { id: 8, name: "H", category: "cat2", score: 20 },
    { id: 9, name: "I", category: "cat1", score: 10 },
    { id: 10, name: "J", category: "cat2", score: 5 },
    /* …更多… */
  ]);

  /* 1. 筛选/排序条件由 FilterSortBar 控制 */
  const [filter, setFilter] = useState({
    category: "",
    sortKey: "score",
    sortOrder: "desc",
  });

  /* 2. 统一计算：筛选 → 排序 → 总条数 */
  const [filteredList, total] = useMemo(() => {
    let data = [...sourceList];
    if (filter.category)
      data = data.filter((v) => v.category === filter.category);
    data.sort((a, b) => {
      const x = a[filter.sortKey];
      const y = b[filter.sortKey];
      const factor = filter.sortOrder === "asc" ? 1 : -1;
      return typeof x === "string"
        ? x.localeCompare(y) * factor
        : (x - y) * factor;
    });
    return [data, data.length];
  }, [sourceList, filter]);

  /* 3. 更新单条数据（供 PaginationTable 调用） */
  const updateItem = (id: number, patch: Partial<Item>) =>
    setSourceList((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...patch } : v))
    );

  return (
    <>
      {/* 筛选排序栏 */}
      <FilterSortBar value={filter} onChange={setFilter} />

      {/* 分页展示 */}
      <PaginationTable
        list={filteredList}
        total={total}
        pageSize={PAGE_SIZE}
        onUpdate={updateItem}
      />
    </>
  );
}

/**
 * Parent
 ├─ FilterSortBar  → setFilter → 重新计算 filteredList
 └─ PaginationTable
      ├─ 接收 filteredList + total
      ├─ 内部维护 page
      └─ 修改单条数据 → onUpdate → Parent 更新 sourceList → 重新计算
      FilterSortBar 只负责 条件输入；
PaginationTable 只负责 分页展示 + 单条更新；
Parent 只做 状态托管和计算。
 */
