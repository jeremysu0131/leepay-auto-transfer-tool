import {
  VuexModule,
  Module,
  Mutation,
  Action,
  getModule
} from "vuex-module-decorators";
import { getSidebarStatus, setSidebarStatus } from "@/utils/cookies";
import store from "@/store";

export enum DeviceType {
  Mobile,
  Desktop
}

export interface IAppState {
  device: DeviceType;
  sidebar: {
    opened: boolean;
    withoutAnimation: boolean;
  };
  task: {
    isVisible: boolean;
    isFetchable: boolean;
    isFetching: boolean;
    isShowMarkAsSuccessDialog: boolean;
    isShowMarkAsFailDialog: boolean;
    isShowCheckProcessDialog: boolean;
    isTaskHandling: boolean;
    fetchTimer: number;
    isAutoProcess: boolean;
    isProcessing: boolean;
  };
   account : {
     isFetching:boolean;
    showingPage: string,
    signInSuccessAt: Date,
    isSignInSuccess: boolean,
    isProcessingSignIn:boolean
  };
}

@Module({ dynamic: true, store, name: "app" })
class App extends VuexModule implements IAppState {
  public sidebar = {
    opened: getSidebarStatus() !== "closed",
    withoutAnimation: false
  };
  public device = DeviceType.Desktop;
  public platform = "leepay";
  public showingTab = "accounts";
  public isManualLogin = true;
  public isProxySet = false;
  public task = {
    isVisible: false,
    isFetchable: true,
    isFetching: false,
    isShowMarkAsFailDialog: false,
    isShowMarkAsSuccessDialog: false,
    isShowCheckProcessDialog: false,
    isTaskHandling: false,
    fetchTimer: 9,
    isAutoProcess: false,
    isProcessing: false
  };
  public account = {
    isFetching: false,
    showingPage: "account-search",
    signInSuccessAt: new Date(),
    isSignInSuccess: false,
    isProcessingSignIn: false
  };

  @Mutation
  public HANDLE_SHOWING_TAB(tabName: string) {
    this.showingTab = tabName;
  }
  @Mutation
  public HANDLE_MANUAL_LOGIN(status: boolean) {
    this.isManualLogin = status;
  }
  @Mutation
  public HANDLE_PROXY_STATE(status: boolean) {
    this.isProxySet = status;
  }
  @Mutation
  public HANDLE_MARK_AS_SUCCESS_DIALOG(status: boolean) {
    this.task.isShowMarkAsSuccessDialog = status;
  }
  @Mutation
  public HANDLE_MARK_AS_FAIL_DIALOG(status: boolean) {
    this.task.isShowMarkAsFailDialog = status;
  }
  @Mutation
  public HANDLE_TASK_CHECK_PROCESS_DIALOG(status: boolean) {
    this.task.isShowCheckProcessDialog = status;
  }
  @Mutation
  HANDLE_TASK_VISIBLE(status: boolean) {
    this.task.isVisible = status;
  }
  @Mutation
  public HANDLE_TASK_AUTO_PROCESS(status: boolean) {
    this.task.isAutoProcess = status;
  }
  @Mutation
  public HANDLE_TASK_PROCESSING(status: boolean) {
    this.task.isProcessing = status;
  }
  @Mutation
  public HANDLE_TASK_FETCHABLE(status: boolean) {
    this.task.isFetchable = status;
  }
  @Mutation
  public HANDLE_TASK_FETCHING(status: boolean) {
    this.task.isFetching = status;
  }
  @Mutation public MINUS_TASK_FETCH_TIMER() {
    this.task.fetchTimer--;
  }
  @Mutation
  public RESET_TASK_FETCH_TIMER(time = 9) {
    this.task.fetchTimer = time;
  }
  @Mutation
  public HANDLE_TASK_HANDLING(status: boolean) {
    this.task.isTaskHandling = status;
  }

  @Mutation
  // Account
  // account-search, select-sign-in-type, sign-in-to-bank
  public HANDLE_ACCOUNT_SHOWING_PAGE(status = "account-search") {
    this.account.showingPage = status;
  }
  @Mutation
  // This means system is processing sign in operator
  public HANDLE_ACCOUNT_PROCESSING_SIGN_IN(status: boolean) {
    this.account.isProcessingSignIn = status;
  }
  @Mutation
  public HANDLE_ACCOUNT_IS_FETCHING(status: boolean) {
    this.account.isFetching = status;
  }
  @Mutation
  public HANDLE_ACCOUNT_SIGN_IN_SUCCESS(status: boolean) {
    this.account.isSignInSuccess = status;
  }
  @Mutation
  public SET_SIGN_IN_SUCCESS_TIME(time: Date) {
    this.account.signInSuccessAt = time;
  }
  @Mutation public RESET_APP_STATE() {
    this.platform = "leepay";
    this.showingTab = "accounts";
    this.isManualLogin = true;
    this.isProxySet = false;
    this.task = {
      isVisible: false,
      isFetchable: false,
      isFetching: false,
      isShowMarkAsFailDialog: false,
      isShowMarkAsSuccessDialog: false,
      isShowCheckProcessDialog: false,
      isTaskHandling: false,
      fetchTimer: 9,
      isAutoProcess: false,
      isProcessing: false
    };
    this.account = {
      showingPage: "account-search",
      signInSuccessAt: new Date(),
      isSignInSuccess: false,
      isProcessingSignIn: false
    };
  }

  @Mutation
  public TOGGLE_SIDEBAR(withoutAnimation: boolean) {
    this.sidebar.opened = !this.sidebar.opened;
    this.sidebar.withoutAnimation = withoutAnimation;
    if (this.sidebar.opened) {
      setSidebarStatus("opened");
    } else {
      setSidebarStatus("closed");
    }
  }

  @Mutation
  public CLOSE_SIDEBAR(withoutAnimation: boolean) {
    this.sidebar.opened = false;
    this.sidebar.withoutAnimation = withoutAnimation;
    setSidebarStatus("closed");
  }

  @Mutation
  public TOGGLE_DEVICE(device: DeviceType) {
    this.device = device;
  }

  @Action
  public ToggleSideBar(withoutAnimation: boolean) {
    this.TOGGLE_SIDEBAR(withoutAnimation);
  }

  @Action
  public CloseSideBar(withoutAnimation: boolean) {
    this.CLOSE_SIDEBAR(withoutAnimation);
  }

  @Action
  public ToggleDevice(device: DeviceType) {
    this.TOGGLE_DEVICE(device);
  }
  @Action
  public async ResetSystem() {
    try {
      this.RESET_APP_STATE();

      await Promise.all([
        // this.UnsetCard"),
        // this.UnsetLog"),
        // this.UnsetTask"),
        // this.UnsetWorker"),
      ]);
    } catch (error) {
      // return this.SetConsole", { level: "error", message: error.toString() });
    }
  }
}

export const AppModule = getModule(App);
