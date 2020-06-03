import { VuexModule, Module, Mutation, Action, getModule } from "vuex-module-decorators";
import { getSidebarStatus, setSidebarStatus } from "@/utils/cookies";
import store from "@/store";

export enum DeviceType {
  Mobile,
  Desktop
}

export interface IAppState {
  device: DeviceType;
  platform: string;
  sidebar: {
    opened: boolean;
    withoutAnimation: boolean;
  };
  tabs: {
    showing: string;
    isTaskEnable: boolean;
  };
  task: {
    isAbleFetch: boolean;
    isFetching: boolean;
    isAutoProcess: boolean;
    isProcessing: boolean;
    isShowMarkAsSuccessDialog: boolean;
    isShowMarkAsFailDialog: boolean;
    isShowCheckProcessDialog: boolean;
  };
  account: {
    isFetching: boolean;
    isSignInToBank: boolean;
    isProcessingSignIn: boolean;
  };
}

@Module({ dynamic: true, store, name: "app" })
class App extends VuexModule implements IAppState {
  public sidebar = {
    opened: getSidebarStatus() !== "closed",
    withoutAnimation: false
  };
  public device = DeviceType.Desktop;
  public platform = "skypay";
  public isManualLogin = true;
  public isProxySet = false;
  public tabs = {
    isTaskEnable: false,
    isAccountEnable: false,
    showing: "accounts"
  };
  public task = {
    isAbleFetch: true,
    isFetching: false,
    isShowMarkAsFailDialog: false,
    isShowMarkAsSuccessDialog: false,
    isShowCheckProcessDialog: false,
    isAutoProcess: false,
    isProcessing: false
  };
  public account = {
    isFetching: false,
    showingPage: "account-search",
    isSignInToBank: false,
    isProcessingSignIn: false
  };

  @Mutation
  public HANDLE_SHOWING_TAB(tabName: string | "accounts" | "tasks") {
    this.tabs.showing = tabName;
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
  public HANDLE_TASK_TAB_VISIBLE(status: boolean) {
    this.tabs.isTaskEnable = status;
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
  public HANDLE_TASK_ABLE_FETCH(status: boolean) {
    this.task.isAbleFetch = status;
  }
  @Mutation
  public HANDLE_TASK_FETCHING(status: boolean) {
    this.task.isFetching = status;
  }

  @Mutation
  // Account
  public HANDLE_ACCOUNT_SHOWING_PAGE(status: "account-search" | "select-sign-in-type" | "sign-in-to-bank") {
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
  public HANDLE_ACCOUNT_SIGN_IN_TO_BANK(status: boolean) {
    this.account.isSignInToBank = status;
  }
  @Mutation public RESET_APP_STATE() {
    this.platform = "leepay";
    this.isManualLogin = true;
    this.isProxySet = false;
    this.tabs = {
      showing: "accounts",
      isTaskEnable: true,
      isAccountEnable: false
    };
    this.task = {
      isAbleFetch: true,
      isFetching: false,
      isShowMarkAsFailDialog: false,
      isShowMarkAsSuccessDialog: false,
      isShowCheckProcessDialog: false,
      isAutoProcess: false,
      isProcessing: false
    };
    this.account = {
      isFetching: false,
      showingPage: "account-search",
      isSignInToBank: false,
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
  public async UnsetApp() {
    this.RESET_APP_STATE();
  }
}

export const AppModule = getModule(App);
