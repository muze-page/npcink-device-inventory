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
      const errorMessage =
        error.response && error.response.status
          ? `出错：服务器返回状态码 ${error.response.status}`
          : `出错：${error.message}`;
      message.error(errorMessage);
      console.error(errorMessage);
      return Promise.reject(error);
    }
  );

