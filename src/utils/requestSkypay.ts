import axios, { AxiosRequestConfig } from "axios";
import qs from "qs";
import store from "../store";
import logger from "./logger";
import { MessageBox } from "element-ui";

// 创建axios实例
const service = axios.create({
  baseURL: process.env.VUE_APP_SKYPAY_API, // api的base_url
  timeout: 15000, // 请求超时时间
  transformRequest: data => {
    return qs.stringify(data);
  }
  // paramsSerializer: function(params) {
  //   return qs.stringify(params, { arrayFormat: "brackets" });
  // },
});

/**
 * Strip baseURL from URL
 *
 * @param {AxiosRequestConfig} config
 * @returns String
 */
function getUrl(config: AxiosRequestConfig) {
  if (config.baseURL && config.url) {
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
    if (config.method) {
      logger.log({
        level: "info",
        message: "request | " + config.method.toUpperCase() + " | " + getUrl(config)
      });
    }
    return config;
  },
  error => Promise.reject(error)
);

// respone拦截器
service.interceptors.response.use(
  response => {
    logger.log({
      level: "info",
      message: "response | " + response.status + " | " + getUrl(response.config)
    });
    return response;
  },
  error => {
    logger.log({
      level: "error",
      message:
        "response | " +
        error.response.status +
        " | " +
        getUrl(error.response.config) +
        " | " +
        JSON.stringify(error.response.data)
    });
    if (error) {
      MessageBox.confirm("You have been log out by system, please re-login again", "Token Expired", {
        type: "error",
        confirmButtonText: "OK",
        cancelButtonText: "Cancel"
      }).then(() => {
        store.dispatch("FedSignOut");
      });
    }
    return Promise.reject(error);
  }
);

export default service;
