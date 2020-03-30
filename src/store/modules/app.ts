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
    isShowMarkAsFailDialog: boolean;
    isShowMarkAsSuccessDialog: boolean;
    isShowCheckProcessDialog: boolean;
    isTaskHandling: boolean;
    fetchTimer: number;
    isAutoProcess: boolean;
    isProcessing: boolean;
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
  public showingTab = "tasks";
  public isManualLogin = true;
  public isProxySet = false;
  public task = {
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
  public account = {
    showingPage: "bank-card-search",
    signInSuccessAt: new Date(),
    isSignInSuccess: false,
    isProcessingSignIn: false
  };

  @Mutation
  private HANDLE_SHOWING_TAB(tabName: string) {
    this.showingTab = tabName;
  }
  @Mutation
  private HANDLE_MANUAL_LOGIN(status: boolean) {
    this.isManualLogin = status;
  }
  @Mutation
  private HANDLE_PROXY_STATE(status: boolean) {
    this.isProxySet = status;
  }
  @Mutation
  private HANDLE_MARK_AS_SUCCESS_DIALOG(status: boolean) {
    this.task.isShowMarkAsSuccessDialog = status;
  }
  @Mutation
  private HANDLE_MARK_AS_FAIL_DIALOG(status: boolean) {
    this.task.isShowMarkAsFailDialog = status;
  }
  @Mutation
  private HANDLE_TASK_CHECK_PROCESS_DIALOG(status: boolean) {
    this.task.isShowCheckProcessDialog = status;
  }
  @Mutation
  HANDLE_TASK_VISIBLE(status: boolean) {
    this.task.isVisible = status;
  }
  @Mutation
  private HANDLE_TASK_AUTO_PROCESS(status: boolean) {
    this.task.isAutoProcess = status;
  }
  @Mutation
  private HANDLE_TASK_PROCESSING(status: boolean) {
    this.task.isProcessing = status;
  }
  @Mutation
  private HANDLE_TASK_FETCHABLE(status: boolean) {
    this.task.isFetchable = status;
  }
  @Mutation
  private HANDLE_TASK_FETCHING(status: boolean) {
    this.task.isFetching = status;
  }
  @Mutation private MINUS_TASK_FETCH_TIMER() {
    this.task.fetchTimer--;
  }
  @Mutation
  private RESET_TASK_FETCH_TIMER(time = 9) {
    this.task.fetchTimer = time;
  }
  @Mutation
  private HANDLE_TASK_HANDLING(status: boolean) {
    this.task.isTaskHandling = status;
  }

  @Mutation
  // Account
  // bank-card-search, select-sign-in-type, sign-in-to-bank
  private HANDLE_ACCOUNT_SHOWING_PAGE(status = "bank-card-search") {
    this.account.showingPage = status;
  }
  @Mutation
  // This means system is processing sign in operator
  private HANDLE_ACCOUNT_PROCESSING_SIGN_IN(status: boolean) {
    this.account.isProcessingSignIn = status;
  }
  @Mutation
  private HANDLE_ACCOUNT_SIGN_IN_SUCCESS(status: boolean) {
    this.account.isSignInSuccess = status;
  }
  @Mutation
  private SET_SIGN_IN_SUCCESS_TIME(time: Date) {
    this.account.signInSuccessAt = time;
  }
  @Mutation private RESET_APP_STATE() {
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
      showingPage: "bank-card-search",
      signInSuccessAt: new Date(),
      isSignInSuccess: false,
      isProcessingSignIn: false
    };
  }

  @Mutation
  private TOGGLE_SIDEBAR(withoutAnimation: boolean) {
    this.sidebar.opened = !this.sidebar.opened;
    this.sidebar.withoutAnimation = withoutAnimation;
    if (this.sidebar.opened) {
      setSidebarStatus("opened");
    } else {
      setSidebarStatus("closed");
    }
  }

  @Mutation
  private CLOSE_SIDEBAR(withoutAnimation: boolean) {
    this.sidebar.opened = false;
    this.sidebar.withoutAnimation = withoutAnimation;
    setSidebarStatus("closed");
  }

  @Mutation
  private TOGGLE_DEVICE(device: DeviceType) {
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
        // dispatch("UnsetCard"),
        // dispatch("UnsetLog"),
        // dispatch("UnsetTask"),
        // dispatch("UnsetWorker"),
      ]);
    } catch (error) {
      // return dispatch("SetConsole", { level: "error", message: error.toString() });
    }
  }
}

export const AppModule = getModule(App);
