import axios from "axios";
import { Site } from "@/utils/index";

const textEncoder = new TextEncoder();

const hexEncode = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const sha256Hex = async (value: string) =>
  hexEncode(await crypto.subtle.digest("SHA-256", textEncoder.encode(value)));

const randomNonce = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const parseClientToken = (value: string) => {
  const parts = value.trim().split("_");
  if (parts.length !== 3 || parts[0] !== "mda" || !parts[1] || !parts[2]) {
    return null;
  }

  return {
    id: parts[1],
    secret: parts[2],
  };
};

const buildQueryAuthHeaders = async (credential: string, query: string) => {
  const token = parseClientToken(credential);
  if (!token) {
    return {
      "x-npcink-password": credential,
    };
  }

  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("当前浏览器不支持安全签名，请改用现代浏览器或旧查询密码");
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomNonce();
  const bodyHash = await sha256Hex("");
  const queryHash = await sha256Hex(`${query}\n1`);
  const signingPayload = `${timestamp}\n${nonce}\n${bodyHash}\nquery\n${queryHash}`;
  const keyHash = await sha256Hex(token.secret);
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(keyHash),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder.encode(signingPayload)
  );

  return {
    "x-npcink-device-token-id": token.id,
    "x-npcink-device-timestamp": timestamp,
    "x-npcink-device-nonce": nonce,
    "x-npcink-device-signature": `sha256=${hexEncode(signature)}`,
  };
};
/**
 * 获取返回值
 */

/**
 *@param password 密码
 * @param id 姓名或编号
 *
 */
export const fetchData = async (password: string, id: string) => {
  const safePassword = password.trim();
  const safeId = id.trim();

  if (!safePassword || !safeId) {
    alert("请输入密码和设备号/姓名");
    return null;
  }

  try {
    const headers = await buildQueryAuthHeaders(safePassword, safeId);
    // 发送 GET 请求到指定的 URL
    const response = await axios.get(Site + "/wp-json/npcink/v1/query", {
      headers,
      params: {
        data: safeId,
        detail: 1,
      },
    });
    //console.log(response);

    // 更新状态以显示响应数据
    return response?.data?.data?.data ?? null;
  } catch (error: any) {
    const status = error?.response?.status;
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.data?.error ||
      error?.message ||
      "请求失败";
    alert(`${status ?? "请求失败"}：${message}`);
    // 捕获错误并处理
    // console.error("错误原因: ", error);

    return null; // 或者 return null; 或者 throw error;
  }
};
