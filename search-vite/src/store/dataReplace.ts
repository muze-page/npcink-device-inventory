/**
 * 替换数组
 */

export const device_status = [
  { value: "apply", label: "使用" },
  { value: "idie", label: "闲置" },
  { value: "fault", label: "故障" },
  { value: "repair", label: "维修" },
  { value: "scrap", label: "报废" },
];

/**
 * 筛选数组
 */

//硬件详细配置表头
export const columnsTable = [
  {
    title: "序号",
    dataIndex: "index",
    key: "index",
    /**自定义序号 */
    render: (_text: any, _record: any, index: number) => index + 1,
  },
  {
    title: "属性",
    dataIndex: "label",
    key: "label",
  },
  {
    title: "配置",
    dataIndex: "value",
    key: "value",
  },
];
