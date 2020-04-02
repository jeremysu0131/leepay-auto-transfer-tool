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
import TaskModel from "../../models/taskModel";
import { TaskModule } from "./task";
import TaskDetailModel from "../../models/taskDetailModel";

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
  SET_WORKER(worker: BankWorker) {
    this.worker = worker;
  }
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
  public async SetWorker(taskDetail: TaskDetailModel) {
    try {
      console.log(taskDetail);
      var bankWorker = new BankWorker(taskDetail);
      console.log("worker factory", bankWorker);
      this.SET_WORKER(bankWorker);
      // commit("SET_WORKFLOW", getters.card.selectedDetail.accountCode);
    } catch (error) {
      console.log(error);
    }
  }
  @Action
  async RunAutoLoginFlows() {
    AppModule.HANDLE_TASK_AUTO_PROCESS(true);
    AppModule.HANDLE_ACCOUNT_PROCESSING_SIGN_IN(true);
    try {
      await this.SetIEEnviroment();
      // await this.SetProxy");
      await this.LaunchSelenium();
      await this.InputSignInInformation();
      await this.SubmitToSignIn();
      await this.SendUSBKey();
      await this.CheckIfLoginSuccess();
    } catch (error) {
      LogModule.SetLog({ message: error, level: "error" });
      LogModule.SetConsole({
        level: "error",
        message:
          'Error happened during login, please login manually and click "confirm" button below when complete Note: the "auto process task" has been turned off as the result'
      });
    } finally {
      AppModule.HANDLE_ACCOUNT_PROCESSING_SIGN_IN(false);
    }
  }

  @Action
  async RunManualLoginFlows() {
    AppModule.HANDLE_ACCOUNT_PROCESSING_SIGN_IN(true);
    try {
      // await this.SetIEEnviroment();
      await this.SetProxy();
      await this.LaunchSelenium();
    } catch (error) {
      return LogModule.SetLog({ message: error, level: "error" });
    } finally {
      AppModule.HANDLE_ACCOUNT_PROCESSING_SIGN_IN(false);
    }
  }

  @Action
  async SetIEEnviroment() {
    // if (!(await this.worker.setIEEnvironment())) {
    //   throw new Error("Set IE enviroment fail");
    // }
  }
  @Action
  async UnsetWorker() {
    await this.CloseSelenium();
    this.SET_WORKER({} as BankWorker);
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
  async SetProxy() {
    if (!(await this.worker.setProxy())) {
      throw new Error("Set proxy fail");
    }
  }
  @Action
  async UnsetProxy() {
    try {
      // await this.unsetProxy();
    } catch (error) {
      return LogModule.SetConsole({ message: error, level: "error" });
    }
  }
  @Action
  async LaunchSelenium() {
    await this.worker.launchSelenium();
  }
  @Action
  async CloseSelenium() {
    if (this.worker) await this.worker.closeSelenium();
  }
  @Action
  async InputSignInInformation() {
    await this.worker.inputSignInInformation();
  }
  @Action
  async SubmitToSignIn() {
    await this.worker.submitToSignIn();
  }
  @Action
  async SendUSBKey() {
    await this.worker.sendUSBKey();
  }
  @Action
  async CheckIfLoginSuccess() {
    const isManualLogin = AppModule.isManualLogin;
    if (await this.worker.checkIfLoginSuccess({ isManualLogin })) {
      AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("bank-card-search");
      AppModule.HANDLE_ACCOUNT_SIGN_IN_SUCCESS(true);
      AppModule.SET_SIGN_IN_SUCCESS_TIME(new Date());
      AppModule.HANDLE_TASK_VISIBLE(true);
      AppModule.HANDLE_TASK_FETCHABLE(true);
      AppModule.HANDLE_SHOWING_TAB("tasks");

      // If selected card is empty, means this is called by relogin
      if (AccountModule.selected.id) {
        // AccountModule.SetCurrentCard();
      }
      await Promise.all([this.GetBankBalance(), TaskModule.GetAll()]);
    }
  }
  @Action
  async GetCookie() {
    try {
      await this.worker.getCookie();
    } catch (error) {
      LogModule.SetLog({ message: error, level: "error" });
      throw error;
    }
  }
  @Action
  async GetBankBalance() {
    try {
      await this.worker.getBalance();
    } catch (error) {
      LogModule.SetLog({ level: "error", message: "Fail to get balance" });
      LogModule.SetLog({ level: "error", message: error });
    }
  }
  @Action
  async GoTransferPage() {
    await this.worker.goTransferPage();
  }
  @Action
  async FillTransferFrom() {
    await this.worker.fillTransferFrom();
  }
  @Action
  async FillNote() {
    await this.worker.fillNote();
  }
  @Action
  async ConfirmTransaction() {
    await this.worker.confirmTransaction();
  }
  @Action
  async CheckIfSuccess() {
    await this.worker.checkIfSuccess();
  }
  @Action
  async RunSelectedFlow(flowName: WorkflowEnum) {
    /* eslint-disable no-return-await */
    switch (flowName) {
      case WorkflowEnum.SET_IE_ENVIRONMENT:
        return await this.SetIEEnviroment();
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
