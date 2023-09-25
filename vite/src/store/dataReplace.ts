import { Replacements } from "@/store/interface";

/**
 * 主板品牌
 */
export const replaceBaseboard: Replacements = {
  "Apple Inc.": "Apple",
  "Colorful Technology And Development Co.,LTD": "七彩虹",
  "Dell Inc.": "戴尔",
  // 其他需要替换的字符串
};



/**
 * 硬件变更替换表
 */

export const replacements: Replacements = {
  "os.distro": "系统版本",
  "diskLayout.1.size": "主硬盘大小",
  "baseboard.model": "主板型号",
  // 其他需要替换的字符串
};
