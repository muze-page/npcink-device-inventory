import axios from "axios";
import { message } from "antd";
// 创建 axios 实例
export const instance = axios.create({
  //baseURL: Ajaxurl, // 设置请求的基础URL
});

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    // 检查响应数据中是否有消息需要显示
    if (response.data && response.data.data && response.data.data.message) {
      if (response.data.success) {
        message.success(response.data.data.message);
      } else {
        message.error(response.data.data.message);
      }
    }
    return response;
  },
  (error) => {
    // 检查是否有返回错误信息，有的话展示，没有就显示默认错误信息
    let errorMessage = "请求出错";

    if (error.response) {
      // 服务器返回了错误状态码
      if (
        error.response.data &&
        error.response.data.data &&
        error.response.data.data.message
      ) {
        // 优先使用服务器返回的错误消息
        errorMessage = error.response.data.data.message;
      } else if (
        error.response.data &&
        error.response.data.data &&
        error.response.data.data.error
      ) {
        // 其次使用服务器返回的错误信息
        errorMessage = error.response.data.data.error;
      } else {
        // 默认使用状态文本
        errorMessage = `请求失败: ${error.response.status} ${error.response.statusText}`;
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorMessage = "网络错误，请检查网络连接";
    } else {
      // 其他错误
      errorMessage = error.message || "未知错误";
    }

    message.error(errorMessage);
    console.error("请求错误:", error);
    return Promise.reject(error);
  }
);

/**
 * 检查它们的值是否为 undefined 并据此决定是否将它们添加到 URLSearchParams 实例中
 * 默认情况下，若不传值，则会输出 undefined字符串
 * @param params 实例
 * @param key 关键词
 * @param value 值
 */
export const addParamIfDefined = (
  params: URLSearchParams,
  key: string,
  value: any
) => {
  if (value !== undefined) {
    params.append(key, value);
  }
};
