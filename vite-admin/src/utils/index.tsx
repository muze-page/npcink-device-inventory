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

const getDataLocal = (): DataLocal => {
  const value = (window as Window & { dataLocal?: DataLocal }).dataLocal;
  return value && typeof value === "object" ? value : {};
};

const dataLocal = getDataLocal();

export const Site = dataLocal.site || "";
export const RestUrl = dataLocal.rest_url || (Site ? `${Site}/wp-json/npcink/v1` : "/wp-json/npcink/v1");
export const RestNonce = dataLocal.rest_nonce || "";
export const Locale = dataLocal.locale || "zh_CN";

export const AdminText: Required<AdminLabels> = {
  assets: dataLocal.labels?.assets || "资产台账",
  client_tokens: dataLocal.labels?.client_tokens || "客户端令牌",
  settings: dataLocal.labels?.settings || "设置",
};
