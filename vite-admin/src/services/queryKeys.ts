import type { AutoChangeParams } from "@/services/auto";
import type { ManualChangeParams } from "@/services/manual";
import type { PcListParams } from "@/services/pc";
import type { StyleListParams } from "@/services/style";

export const queryKeys = {
  pcCategories: ["pc", "categories"] as const,
  pcList: (params: PcListParams) => ["pc", "list", params] as const,
  pcDetail: (uuid: string) => ["pc", "detail", uuid] as const,
  styleCategories: ["style", "categories"] as const,
  styleList: (params: StyleListParams) => ["style", "list", params] as const,
  styleDetail: (uuid: string) => ["style", "detail", uuid] as const,
  manualChanges: (params: ManualChangeParams) =>
    ["changes", "manual", params] as const,
  autoChanges: (params: AutoChangeParams) =>
    ["changes", "auto", params] as const,
};
