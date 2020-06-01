import axios from "axios";
import qs from "qs";
import { Message, MessageBox } from "element-ui";
import { UserModule } from "@/store/modules/user";
import http from "http";
import https from "https";

const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: 15000,
  headers: {
    Accept: "application/json;charset=utf-8"
  },
  // keepAlive pools and reuses TCP connections, so it's faster
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),

  // follow up to 10 HTTP 3xx redirects
  maxRedirects: 10,

  // cap the maximum content length we'll accept to 50MBs, just in case
  maxContentLength: 50 * 1000 * 1000,
  paramsSerializer: function(params) {
    return qs.stringify(params, { arrayFormat: "brackets" });
  }
});

// Request interceptors
service.interceptors.request.use(
  config => {
    // Add X-Access-Token header to every request, you can add other custom headers here
    if (UserModule.leepayToken) {
      config.headers["Authorization"] = UserModule.leepayToken;
    }
    return config;
  },
  error => {
    Promise.reject(error);
  }
);

// Response interceptors
service.interceptors.response.use(
  response => {
    // code == 1: success
    // Some example codes here:
    // code == 50001: invalid access token
    // code == 50002: already login in other place
    // code == 50003: access token expired
    // code == 50004: invalid user (user not exist)
    // code == 50005: username or password is incorrect
    // You can change this part for your own usage.
    const res = response.data;

    // if (res.code !== 1) {
    //   Message({
    //     message: res.message || "Error",
    //     type: "error",
    //     duration: 5 * 1000
    //   });
    // if (res.code === 50008 || res.code === 50012 || res.code === 50014) {
    //   MessageBox.confirm(
    //     "You have been logged out, try to login again.",
    //     "Log out",
    //     {
    //       confirmButtonText: "Relogin",
    //       cancelButtonText: "Cancel",
    //       type: "warning"
    //     }
    //   ).then(() => {
    //     UserModule.ResetToken();
    //     location.reload(); // To prevent bugs from vue-router
    //   });
    // }
    // return Promise.reject(new Error(res.message || "Error"));
    // } else {
    return response;
    // }
  },
  error => {
    Message({
      message: error.message,
      type: "error",
      duration: 5 * 1000
    });
    return Promise.reject(error);
  }
);

export default service;
