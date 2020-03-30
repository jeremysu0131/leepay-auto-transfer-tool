import axios from "axios";
import qs from "qs";
import store from "../store";
import logger from "./logger";
import { MessageBox } from "element-ui";

// 创建axios实例
const service = axios.create({
  baseURL: process.env.SKYPAY_URL, // api的base_url
  timeout: 15000, // 请求超时时间
  transformRequest: data => {
    return qs.stringify(data);
  },
  // paramsSerializer: function(params) {
  //   return qs.stringify(params, { arrayFormat: "brackets" });
  // },
});

// This for handling async request, to prevent that if token was expired then show multiple message boxes
var isTokenExpired = false;
/**
 * Strip baseURL from URL
 *
 * @param {AxiosRequestConfig} config
 * @returns String
 */
function getUrl(config) {
  if (config.baseURL) {
    return config.url.replace(config.baseURL, "");
  }
  return config.url;
}

// request拦截器
service.interceptors.request.use(
  config => {
    if (store.getters.skypayToken) {
      config.headers["Cookie"] = store.getters.skypayToken; // 让每个请求携带自定义token 请根据实际情况自行修改
    }
    // logger.log({
    //   level: "info",
    //   message: {
    //     method: config.method.toUpperCase(),
    //     url: getUrl(config),
    //   },
    // });
    return config;
  },
  error => Promise.reject(error),
);

// respone拦截器
service.interceptors.response.use(
  response => {
    // logger.log({
    //   level: "info",
    //   message: {
    //     url: getUrl(response.config),
    //     status: response.status,
    //   },
    // });

    return response;
  },
  error => {
    if (error) {
      logger.log({ level: "error", message: error });
      MessageBox.confirm(
        "You have been log out by system, please re-login again",
        "Token Expired",
        {
          type: "error",
          confirmButtonText: "OK",
          cancelButtonText: "Cancel",
        },
      ).then(() => {
        store.dispatch("FedSignOut");
      });
    }
    return Promise.reject(error);
  },
);

export default service;
