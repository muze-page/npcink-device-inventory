import axios from "axios";
import { message } from "antd";
// 创建 axios 实例
export const instance = axios.create({
  //baseURL: Ajaxurl, // 设置请求的基础URL
});

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    const responseData = response.data;
    if (responseData.success) {
      message.success(responseData.data.message);
    } else {
      message.error(responseData.data.message);
    }
    return responseData;
  },
  (error) => {
    //检查，有没有返回错误信息，有的话展示，没有就做其他的

    const errorMessage =
      error.response && error.response.status
        ? `出错： ${error.response.data.data.error}`
        : `出错：${error.message}`;
    message.error(errorMessage);
    console.error(errorMessage);
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
