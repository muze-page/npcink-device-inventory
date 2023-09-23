//替换列表

/**
 * 硬件变更替换表
 */
interface Replacements {
  [key: string]: string;
}

export const replacements: Replacements = {
  "os.distro": "系统版本",
  "diskLayout.1.size": "主硬盘大小",
  "baseboard.model": "主板型号",
  // 其他需要替换的字符串
};
