/**
 * 自定义筛选项
 * 可以输入，也可以筛选
 */
import React, { useState } from "react";
import { AutoComplete } from "antd";

import {DataItemArr} from "@/type/index"


interface Props {
  defaultValue: string; // 默认值
  onChange: (data: string) => void; // 筛选数据改变的回调
  options: DataItemArr[]; // 设备分类选项
}

const CategoryFilter: React.FC<Props> = ({
  defaultValue,
  onChange,
  options,
}) => {
  const [inputValue, setInputValue] = useState(defaultValue || ""); // 输入框的值

  // 将预设选项转换为 AutoComplete 需要的格式
  const autoCompleteOptions = options.map((option) => ({
    value: option.value,
    label: option.label,
  }));

  // 如果当前值不在预设选项中，添加到选项列表
  const getOptions = () => {
    const currentInput = inputValue || "";
    if (
      currentInput &&
      !options.some((opt) => opt.value === currentInput)
    ) {
      return [
        { value: currentInput, label: ` ${currentInput}` },
        ...autoCompleteOptions,
      ];
    }
    return autoCompleteOptions;
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    // 实时更新到父组件
    onChange(value);
  };

  const handleSelect = (value: string) => {
    // 当用户从下拉列表选择时，更新状态
    setInputValue(value);
    onChange(value);
  };

  return (
    <AutoComplete
      value={inputValue}
      options={getOptions()}
      style={{ width: "100%" }}
      onChange={handleInputChange}
      onSelect={handleSelect}
      onSearch={(value) => {
        setInputValue(value);
        // 搜索时也更新到父组件
        onChange(value);
      }}
      placeholder="选择或输入"
      allowClear
    />
  );
};

export default CategoryFilter;