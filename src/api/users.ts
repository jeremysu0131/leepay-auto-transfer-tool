import request from "@/utils/request";

export const getUserInfo = (data: any) =>
  request({
    url: "/users/info",
    method: "post",
    data
  });

export const login = (data: any) =>
  request({
    url: "/aLogin!login.do",
    method: "post",
    data
  });

export const logout = () =>
  request({
    url: "/aLogin!logout.do",
    method: "post"
  });
