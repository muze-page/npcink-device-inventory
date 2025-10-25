/**
 * 替换数组
 */


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
