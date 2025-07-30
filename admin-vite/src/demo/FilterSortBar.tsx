// FilterSortBar.tsx
import { FC } from "react";

interface Filter {
  category: string;
  sortKey: "name" | "score";
  sortOrder: "asc" | "desc";
}

interface Props {
  value: Filter;
  onChange: (next: Filter) => void;
}

const FilterSortBar: FC<Props> = ({ value, onChange }) => (
  <div style={{ marginBottom: 16 }}>
    <label>
      类别：
      <select
        value={value.category}
        onChange={(e) => onChange({ ...value, category: e.target.value })}
      >
        <option value="">全部</option>
        <option value="cat1">类别1</option>
        <option value="cat2">类别2</option>
      </select>
    </label>

    <label style={{ marginLeft: 16 }}>
      排序：
      <select
        value={`${value.sortKey}-${value.sortOrder}`}
        onChange={(e) => {
          const [k, o] = e.target.value.split("-");
          onChange({ ...value, sortKey: k as any, sortOrder: o as any });
        }}
      >
        <option value="score-desc">分数 ↓</option>
        <option value="score-asc">分数 ↑</option>
        <option value="name-asc">名称 A-Z</option>
        <option value="name-desc">名称 Z-A</option>
      </select>
    </label>
  </div>
);

export default FilterSortBar;
