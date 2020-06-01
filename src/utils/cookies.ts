import Cookies from "js-cookie";

// App
const sidebarStatusKey = "sidebar_status";
export const getSidebarStatus = () => Cookies.get(sidebarStatusKey);
export const setSidebarStatus = (sidebarStatus: string) => Cookies.set(sidebarStatusKey, sidebarStatus);

export const getToken = (tokenKey: "SKYPAY" | "LEEPAY") => Cookies.get(tokenKey);
export const setToken = (tokenKey: "SKYPAY" | "LEEPAY", token: string) => Cookies.set(tokenKey, token);
export const removeToken = (tokenKey: "SKYPAY" | "LEEPAY") => Cookies.remove(tokenKey);
