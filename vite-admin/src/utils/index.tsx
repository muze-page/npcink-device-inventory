type AdminLabels = {
  assets?: string;
  client_tokens?: string;
  settings?: string;
};

type DataLocal = {
  site?: string;
  rest_url?: string;
  rest_nonce?: string;
  locale?: string;
  labels?: AdminLabels;
};

const getLocalizedData = (): DataLocal => {
  const value = (
    window as Window & { npcinkDeviceInventoryData?: DataLocal }
  ).npcinkDeviceInventoryData;
  return value && typeof value === "object" ? value : {};
};

const localizedData = getLocalizedData();

export const Site = localizedData.site || "";
export const RestUrl = localizedData.rest_url || (Site ? `${Site}/wp-json/npcink/v1` : "/wp-json/npcink/v1");
export const RestNonce = localizedData.rest_nonce || "";
export const Locale = localizedData.locale || "zh_CN";

export const AdminText: Required<AdminLabels> = {
  assets: localizedData.labels?.assets || "资产台账",
  client_tokens: localizedData.labels?.client_tokens || "客户端令牌",
  settings: localizedData.labels?.settings || "设置",
};
