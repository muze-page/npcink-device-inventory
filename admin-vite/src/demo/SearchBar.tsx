// src/SearchBar.tsx
import { useState, useEffect, FC } from 'react';

interface Props {
  value: string;
  onChange: (kw: string) => void;
}

const SearchBar: FC<Props> = ({ value, onChange }) => {
  const [input, setInput] = useState(value);

  /* 500 ms 防抖 */
  useEffect(() => {
    const timer = setTimeout(() => onChange(input), 500);
    return () => clearTimeout(timer);
  }, [input, onChange]);

  return (
    <input
      type="text"
      placeholder="搜索名称..."
      value={input}
      onChange={e => setInput(e.target.value)}
      style={{ width: 200, marginRight: 16 }}
    />
  );
};

export default SearchBar;