import request from "@/utils/request";
import requestSkypay from "@/utils/requestSkypay";
export function login({ username, password }: { username: string; password: string }) {
  return request({
    url: "/ps-ops-mgmt/api/operator_sessions",
    method: "POST",
    data: {
      operatorName: username,
      password
    }
  });
}

export function signInSkypay({ username, password }: { username: string; password: string }) {
  return requestSkypay({
    url: "/aLogin!login.do",
    method: "POST",
    data: {
      username,
      password
    }
  });
}

export function sendOTP(otp: string) {
  return request({
    url: "/ps-ops-mgmt/api/auth/google/valid-otp?otp=" + otp,
    method: "POST"
  });
}

export function logout() {
  return request({
    url: "/ps-ops-mgmt/api/operator_sessions/logout",
    method: "DELETE"
  });
}

// export const getUserInfo = (data: any) =>
//   request({
//     url: "/users/info",
//     method: "post",
//     data
//   });

// export const login = (data: any) =>
//   request({
//     url: "/aLogin!login.do",
//     method: "post",
//     data
//   });

// export const logout = () =>
//   request({
//     url: "/aLogin!logout.do",
//     method: "post"
//   });
