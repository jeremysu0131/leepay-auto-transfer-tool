import axios from "axios";
const service = axios.create({
  baseURL: process.env.VUE_APP_BANK_RISK_URL,
  timeout: 15000
});

// Request interceptors
service.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptors
service.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default service;
