import BankWorker from "@/workers/BankWorker";
import {
  VuexModule,
  Module,
  Mutation,
  Action,
  getModule
} from "vuex-module-decorators";
import store from "@/store";
import { AccountModule } from "./account";
import {
  signInWorkflowEnum,
  WorkflowEnum
} from "../../workers/utils/workflowHelper";
import { LogModule } from "./log";
import { AppModule } from "./app";
import { TaskModule } from "./task";
import { transponder } from "../../electron-communicator";
import { ipcRenderer } from "electron";
import TaskDetailModel from "../../workers/models/taskDetailModel";
import RemitterAccountModel from "../../workers/models/remitterAccountModel";

export interface IWorkerState {
  worker: BankWorker;
  workflow: any[];
}

@Module({ dynamic: true, store, name: "worker" })
class WorkerModuleStatic extends VuexModule implements IWorkerState {
  public workflow = [] as any[];
  public signInWorkflow = [] as any[];
  public worker = {} as BankWorker;

  @Mutation
  SET_SIGN_IN_WORKFLOW(isManualSignIn: boolean) {
    this.signInWorkflow = signInWorkflowEnum(isManualSignIn);
  }
  // UPDATE_FLOW_STATUS(data: { name: any; status: any }) {
  //   this.signInWorkflow.forEach(flow => {
  //     if (flow.name === data.name) {
  //       flow.status = data.status;
  //     }
  //   });
  //   var signInWorkflow = this.signInWorkflow;
  //   this.signInWorkflow = [];
  //   this.signInWorkflow = signInWorkflow;
  // }
  @Mutation
  UPDATE_FLOW_STATUS(data: { name: any; status: any }) {
    this.workflow.forEach(flow => {
      if (flow.name === data.name) flow.status = data.status;
    });
    var workflow = this.workflow;
    this.workflow = [];
    this.workflow = workflow;
  }

  // SET_WORKFLOW: (state, bankCode) => {
  //   state.workflow = workflowEnum(bankCode);
  // },
  @Action
  public async SetWorker(remitterAccount: RemitterAccountModel) {
    try {
      transponder(ipcRenderer, WorkflowEnum.SET_WORKER, remitterAccount);
    } catch (error) {
      LogModule.SetLog({ level: "error", message: error });
    }
  }
  @Action
  async RunAutoLoginFlows() {
    AppModule.HANDLE_TASK_AUTO_PROCESS(true);
    AppModule.HANDLE_ACCOUNT_PROCESSING_SIGN_IN(true);
    this.SET_SIGN_IN_WORKFLOW(false);
    try {
      await this.SetIEEnvironment();
      await this.SetProxy();
      await this.LaunchSelenium();
      await this.InputSignInInformation();
      await this.SubmitToSignIn();
      await this.SendUSBKey();
      return await this.CheckIfLoginSuccess();
    } catch (error) {
      LogModule.SetLog({ message: error, level: "error" });
      LogModule.SetConsole({
        level: "error",
        message:
          'Error happened during login, please login manually and click "confirm" button below when complete Note: the "auto process task" has been turned off as the result'
      });
      return false;
    } finally {
      AppModule.HANDLE_ACCOUNT_PROCESSING_SIGN_IN(false);
    }
  }

  @Action
  async RunManualLoginFlows() {
    AppModule.HANDLE_ACCOUNT_PROCESSING_SIGN_IN(true);
    this.SET_SIGN_IN_WORKFLOW(true);
    try {
      // await this.SetIEEnviroment();
      // await this.SetProxy();
      await this.LaunchSelenium();
    } catch (error) {
      return LogModule.SetLog({ message: error, level: "error" });
    } finally {
      AppModule.HANDLE_ACCOUNT_PROCESSING_SIGN_IN(false);
    }
  }

  @Action
  async RunAutoTransferFlows() {
    try {
      await this.GoTransferPage();
      await this.FillTransferFrom();
      await this.FillNote();
      await this.ConfirmTransaction();
      return await this.CheckIfSuccess();
    } catch (error) {
      LogModule.SetConsole({ level: "error", message: error });
      return false;
    }
  }
  @Action
  public async RunManualTransferFlows() {
    try {
      await this.GoTransferPage();
      await this.FillTransferFrom();
    } catch (error) {
      LogModule.SetConsole({ level: "error", message: error });
    }
  }

  @Action
  private async SetIEEnvironment() {
    await transponder(ipcRenderer, WorkflowEnum.SET_IE_ENVIRONMENT);
    // if (!(await this.worker.setIEEnvironment())) {
    //   throw new Error("Set IE enviroment fail");
    // }
  }
  @Action
  async UnsetWorker() {
    await this.CloseSelenium();
    // commit("SET_WORKFLOW", null);
  }
  @Action
  async CheckIsProxySet() {
    try {
      // this.HANDLE_PROXY_STATE (await checkIsProxySet());
    } catch (error) {
      return LogModule.SetConsole({ message: error, level: "error" });
    }
  }
  @Action
  private async SetProxy() {
      var { isFlowExecutedSuccess, message } = await transponder(
        ipcRenderer,
        WorkflowEnum.SET_PROXY
      );
      if (!isFlowExecutedSuccess) {
        throw new Error("Set proxy fail");
      }
  }
  @Action
  private async UnsetProxy() {
    try {
      await transponder(ipcRenderer, WorkflowEnum.UNSET_PROXY);
      // await this.unsetProxy();
    } catch (error) {
      return LogModule.SetConsole({ message: error, level: "error" });
    }
  }
  @Action
  private async LaunchSelenium() {
    await transponder(ipcRenderer, WorkflowEnum.LAUNCH_SELENIUM);
  }
  @Action
  private async CloseSelenium() {
    // if (this.worker) await this.worker.closeSelenium();
    await transponder(ipcRenderer, WorkflowEnum.CLOSE_SELENIUM);
  }
  @Action
  private async InputSignInInformation() {
    await transponder(ipcRenderer, WorkflowEnum.INPUT_SIGN_IN_INFORMATION);
    // await this.worker.inputSignInInformation();
  }
  @Action
  private async SubmitToSignIn() {
    await transponder(ipcRenderer, WorkflowEnum.SUBMIT_TO_SIGN_IN);
    // await this.worker.submitToSignIn();
  }
  @Action
  private async SendUSBKey() {
    await transponder(ipcRenderer, WorkflowEnum.SEND_USB_KEY);
    // await this.worker.sendUSBKey();
  }
  @Action
  async CheckIfLoginSuccess() {
    const isManualLogin = AppModule.isManualLogin;
    var isLoginSuccess = await transponder(
      ipcRenderer,
      WorkflowEnum.CHECK_IF_LOGIN_SUCCESS,
      { isManualLogin }
    );

    if (isLoginSuccess) {
      AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("bank-card-search");
      AppModule.HANDLE_ACCOUNT_SIGN_IN_SUCCESS(true);
      AppModule.SET_SIGN_IN_SUCCESS_TIME(new Date());
      AppModule.HANDLE_TASK_VISIBLE(true);
      AppModule.HANDLE_TASK_FETCHABLE(true);
      AppModule.HANDLE_SHOWING_TAB("tasks");

      // If selected card is empty, means this is called by relogin
      // if (AccountModule.selected.id) {
      // AccountModule.SetCurrentCard();
      // }
      await Promise.all([this.GetBankBalance(), TaskModule.GetAll()]);
      return true;
    }
    return false;
  }
  @Action
  private async GetCookie() {
    try {
      await transponder(ipcRenderer, WorkflowEnum.GET_COOKIE);
    } catch (error) {
      LogModule.SetLog({ message: error, level: "error" });
      throw error;
    }
  }
  @Action
  async GetBankBalance() {
    try {
      await transponder(ipcRenderer, WorkflowEnum.GET_BALANCE);
    } catch (error) {
      LogModule.SetLog({ level: "error", message: "Fail to get balance" });
      LogModule.SetLog({ level: "error", message: error });
    }
  }
  @Action
  private async GoTransferPage() {
    await transponder(ipcRenderer, WorkflowEnum.GO_TRANSFER_PAGE);
  }
  @Action
  private async FillTransferFrom() {
    await transponder(ipcRenderer, WorkflowEnum.FILL_TRANSFER_INFORMATION);
  }
  @Action
  private async FillNote() {
    await transponder(ipcRenderer, WorkflowEnum.FILL_NOTE);
  }
  @Action
  private async ConfirmTransaction() {
    await transponder(ipcRenderer, WorkflowEnum.CONFIRM_TRANSACTION);
  }
  @Action
  private async CheckIfSuccess() {
    await transponder(ipcRenderer, WorkflowEnum.CHECK_IF_SUCCESS);
  }
  @Action
  async RunSelectedFlow(flowName: WorkflowEnum) {
    /* eslint-disable no-return-await */
    switch (flowName) {
      case WorkflowEnum.SET_IE_ENVIRONMENT:
        return await this.SetIEEnvironment();
      case WorkflowEnum.SET_PROXY:
        return await this.SetProxy();
      case WorkflowEnum.LAUNCH_SELENIUM:
        return await this.LaunchSelenium();
      case WorkflowEnum.CLOSE_SELENIUM:
        return await this.CloseSelenium();
      case WorkflowEnum.INPUT_SIGN_IN_INFORMATION:
        return await this.InputSignInInformation();
      case WorkflowEnum.SUBMIT_TO_SIGN_IN:
        return await this.SubmitToSignIn();
      case WorkflowEnum.SEND_USB_KEY:
        return await this.SendUSBKey();
      case WorkflowEnum.CHECK_IF_LOGIN_SUCCESS:
        return await this.CheckIfLoginSuccess();
      case WorkflowEnum.GET_COOKIE:
        return await this.GetCookie();
      case WorkflowEnum.GET_BALANCE:
        return await this.GetBankBalance();
      case WorkflowEnum.GO_TRANSFER_PAGE:
        return await this.GoTransferPage();
      case WorkflowEnum.FILL_TRANSFER_INFORMATION:
        return await this.FillTransferFrom();
      case WorkflowEnum.FILL_NOTE:
        return await this.FillNote();
      case WorkflowEnum.CONFIRM_TRANSACTION:
        return await this.ConfirmTransaction();
      case WorkflowEnum.CHECK_IF_SUCCESS:
        return await this.CheckIfSuccess();
      default:
        throw new Error("No such workflow");
    }
    /* eslint-enable no-return-await */
  }
}
export const WorkerModule = getModule(WorkerModuleStatic);
// const worker = {
//   state: { runner: null, workflow: [], signInWorkflow: [] },

//   mutations: {
//     // data: name, status
//     // data: name, status
//   actions: {
//     async RunAutoReloginFlows({ dispatch, commit }) {
//       commit("HANDLE_ACCOUNT_SIGN_IN_SUCCESS", false);
//       commit("HANDLE_ACCOUNT_PROCESSING_SIGN_IN", true);
//       commit("HANDLE_SHOWING_TAB", "accounts");
//       commit("HANDLE_ACCOUNT_SHOWING_PAGE", "sign-in-to-bank");
//       try {
//         await this.LaunchSelenium");
//         await this.InputSignInInformation", { useCurrent: true });
//         await this.SubmitToSignIn");
//         await this.SendUSBKey");
//         await this.CheckIfLoginSuccess");
//       } catch (error) {
//         return this.SetConsole", { message: error, level: "error" });
//       } finally {
//         commit("HANDLE_ACCOUNT_PROCESSING_SIGN_IN", false);
//       }
//     },
//     async RunAutoTransferFlows({ dispatch }) {
//       try {
//         await this.GoTransferPage");
//         await this.FillTransferFrom");
//         await this.FillNote");
//         await this.ConfirmTransaction");
//         return await this.CheckIfSuccess");
//       } catch (error) {
//         this.SetConsole", { message: error, level: "error" });
//         return false;
//       }
//     },
//     async RunManualTransferFlows({ dispatch }) {
//       try {
//         await this.GoTransferPage");
//         await this.FillTransferFrom");
//       } catch (error) {
//         return this.SetConsole", { message: error, level: "error" });
//       }
//     },
// };

// export default worker;
