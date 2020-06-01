import {
  VuexModule,
  Module,
  Action,
  Mutation,
  getModule
} from "vuex-module-decorators";
import { login, logout, getUserInfo } from "@/api/users";
import { getToken, setToken, removeToken } from "@/utils/cookies";
import { IUserData } from "@/api/types";
import store from "@/store";
import { AccountModule } from "./account";
import { TaskModule } from "./task";
import { WorkerModule } from "./worker";
import { LogModule } from "./log";
import { AppModule } from "./app";

export interface IUserState {
  token: string;
  name: string;
  avatar: string;
  introduction: string;
  roles: string[];
}

@Module({ dynamic: true, store, name: "user" })
class User extends VuexModule implements IUserState {
  public token = getToken() || "";
  public id = 0;
  public name = "";
  public avatar = "";
  public introduction = "";
  public roles: string[] = [];

  @Mutation
  private SET_TOKEN(token: string) {
    this.token = token;
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

  @Action
  public async Login(userInfo: { username: string; password: string }) {
    let { username, password } = userInfo;
    username = username.trim();
    this.SET_TOKEN("");
    try {
      const { data } = await login({ username, password });

      const token = data.data.token;
      this.SET_TOKEN(token);

      const userData: IUserData = data.data.admin;
      this.SET_ID(userData.id);
      this.SET_NAME(userData.username);
      TaskModule.GetAll();
      return { isSignIn: true, message: undefined };
    } catch (error) {
      const message = error.response.data.message || error;
      // LogModule.SetLog( { level: "warn", message });
      return { isSignIn: false, message };
    }
  }

  @Action
  public ResetToken() {
    removeToken();
    this.SET_TOKEN("");
    this.SET_ROLES([]);
  }

  @Action
  public async GetUserInfo() {
    if (this.token === "") {
      throw Error("GetUserInfo: token is undefined!");
    }
    const { data } = await getUserInfo({
      /* Your params here */
    });
    if (!data) {
      throw Error("Verification failed, please Login again.");
    }
    const { roles, name, avatar, introduction } = data.user;
    // roles must be a non-empty array
    if (!roles || roles.length <= 0) {
      throw Error("GetUserInfo: roles must be a non-null array!");
    }
    this.SET_ROLES(roles);
    this.SET_NAME(name);
    this.SET_AVATAR(avatar);
    this.SET_INTRODUCTION(introduction);
  }

  @Action
  public async LogOut() {
    if (this.token === "") {
      throw Error("LogOut: token is undefined!");
    }
    await logout();
    removeToken();
    this.SET_TOKEN("");
    this.SET_ROLES([]);

    AppModule.UnsetApp();
    AccountModule.UnsetAccount();
    TaskModule.UnsetTask();
    WorkerModule.UnsetWorker();
    LogModule.UnsetLog();
  }
}

export const UserModule = getModule(User);
