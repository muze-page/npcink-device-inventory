import type { AutoChangeParams } from "@/services/auto";
import type { ManualChangeParams } from "@/services/manual";
import type { PcListParams } from "@/services/pc";
import type { StyleListParams } from "@/services/style";

export const queryKeys = {
  pcCategories: ["pc", "categories"] as const,
  pcList: (params: PcListParams) => ["pc", "list", params] as const,
  pcDetailSummary: (uuid: string) => ["pc", "detail", "summary", uuid] as const,
  pcDetailFull: (uuid: string) => ["pc", "detail", "full", uuid] as const,
  styleCategories: ["style", "categories"] as const,
  styleList: (params: StyleListParams) => ["style", "list", params] as const,
  styleDetailSummary: (uuid: string) =>
    ["style", "detail", "summary", uuid] as const,
  styleDetailFull: (uuid: string) =>
    ["style", "detail", "full", uuid] as const,
  manualChanges: (params: ManualChangeParams) =>
    ["changes", "manual", params] as const,
  autoChanges: (params: AutoChangeParams) =>
    ["changes", "auto", params] as const,
};
