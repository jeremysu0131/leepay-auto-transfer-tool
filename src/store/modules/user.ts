import { VuexModule, Module, Action, Mutation, getModule } from "vuex-module-decorators";
import { login, logout, sendOTP, signInSkypay } from "@/api/users";
import { getToken, setToken, removeToken } from "@/utils/cookies";
import { IUserData } from "@/api/types";
import store from "@/store";
import { AccountModule } from "./account";
import { TaskModule } from "./task";
import { WorkerModule } from "./worker";
import { LogModule } from "./log";
import { AppModule } from "./app";

export interface IUserState {
  leepayToken: string;
  skypayToken: string;
  name: string;
  avatar: string;
  introduction: string;
  roles: string[];
}

@Module({ dynamic: true, store, name: "user" })
class User extends VuexModule implements IUserState {
  public leepayToken = getToken("LEEPAY") || "";
  public skypayToken = getToken("SKYPAY") || "";
  public id = 0;
  public name = "";
  public avatar = "";
  public introduction = "";
  public roles: string[] = [];

  @Mutation
  private SET_LEEPAY_TOKEN(token: string) {
    this.leepayToken = token;
  }
  @Mutation
  private SET_SKYPAY_TOKEN(token: string) {
    this.skypayToken = token;
  }

  @Mutation
  private SET_NAME(name: string) {
    this.name = name;
  }

  @Mutation
  private SET_ID(id: number) {
    this.id = id;
  }

  @Mutation
  private SET_AVATAR(avatar: string) {
    this.avatar = avatar;
  }

  @Mutation
  private SET_INTRODUCTION(introduction: string) {
    this.introduction = introduction;
  }

  @Mutation
  private SET_ROLES(roles: string[]) {
    this.roles = roles;
  }

  @Action({ rawError: true })
  public async Login(userInfo: { username: string; password: string }) {
    let { username, password } = userInfo;
    username = username.trim();
    this.SET_LEEPAY_TOKEN("");
    try {
      const response = await login({ username, password });
      const data = response.data;
      const token = data.token;
      this.SET_LEEPAY_TOKEN(token);

      // this.SET_ID(userData.id);
      this.SET_NAME(data.username);
      return { isSignIn: true, message: undefined };
    } catch (error) {
      const message = error.response.data.message || error;
      // LogModule.SetLog( { level: "warn", message });
      return { isSignIn: false, message };
    }
  }
  @Action
  async SendOTP(otp: string) {
    return new Promise((resolve, reject) => {
      sendOTP(otp)
        .then(response => {
          const isSuccess = response.data.success;
          if (isSuccess) {
            resolve();
          } else {
            throw new Error("Authentication Code Fail");
          }
        })
        .catch(error => {
          // if send OTP fail, clean token
          this.SET_LEEPAY_TOKEN("");
          this.SET_NAME("");
          removeToken("LEEPAY");
          removeToken("SKYPAY");
          reject(error);
        });
    });
  }
  @Action
  async SignInSkypay(userInfo: { username: string; password: string }) {
    let { username, password } = userInfo;
    username = username.trim();
    removeToken("SKYPAY");
    this.SET_SKYPAY_TOKEN("");

    try {
      let { data } = await signInSkypay({ username, password });
      const token = data.data.token;
      this.SET_SKYPAY_TOKEN(token);
      setToken("SKYPAY", token);

      return { isSignIn: true, message: undefined };
    } catch (error) {
      LogModule.SetLog({ level: "warn", message: error });
      return { isSignIn: false, message: error };
    }
  }

  @Action
  public ResetToken() {
    removeToken("LEEPAY");
    removeToken("SKYPAY");
    this.SET_SKYPAY_TOKEN("");
    this.SET_SKYPAY_TOKEN("");
    this.SET_ROLES([]);
  }

  // @Action
  // public async GetUserInfo() {
  //   if (this.leepayToken === "") {
  //     throw Error("GetUserInfo: token is undefined!");
  //   }
  //   const { data } = await getUserInfo({
  //     /* Your params here */
  //   });
  //   if (!data) {
  //     throw Error("Verification failed, please Login again.");
  //   }
  //   const { roles, name, avatar, introduction } = data.user;
  //   // roles must be a non-empty array
  //   if (!roles || roles.length <= 0) {
  //     throw Error("GetUserInfo: roles must be a non-null array!");
  //   }
  //   this.SET_ROLES(roles);
  //   this.SET_NAME(name);
  //   this.SET_AVATAR(avatar);
  //   this.SET_INTRODUCTION(introduction);
  // }

  @Action
  public async LogOut() {
    if (this.leepayToken === "") {
      throw Error("LogOut: token is undefined!");
    }
    await logout();
    removeToken("LEEPAY");
    removeToken("SKYPAY");
    this.SET_LEEPAY_TOKEN("");
    this.SET_SKYPAY_TOKEN("");
    this.SET_ROLES([]);

    AppModule.UnsetApp();
    AccountModule.UnsetAccount();
    TaskModule.UnsetTask();
    WorkerModule.UnsetWorker();
    LogModule.UnsetLog();
  }
}

export const UserModule = getModule(User);
