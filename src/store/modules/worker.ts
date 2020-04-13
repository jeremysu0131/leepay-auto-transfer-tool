import BankWorker from "@/workers/BankWorker";
import {
  VuexModule,
  Module,
  Mutation,
  Action,
  getModule
} from "vuex-module-decorators";
import store from "@/store";
import {
  signInWorkflowEnum,
  WorkflowEnum
} from "../../workers/utils/workflowHelper";
import { LogModule } from "./log";
import { AppModule } from "./app";
import { TaskModule } from "./task";
import { transponder } from "../../electron-communicator";
import { ipcRenderer } from "electron";
import RemitterAccountModel from "../../workers/models/remitterAccountModel";
import WorkflowStatusEnum from "../../models/WorkflowStatusEnum";

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
  @Mutation
  UPDATE_FLOW_STATUS(data: { name: WorkflowEnum; status: WorkflowStatusEnum }) {
    this.signInWorkflow.forEach(flow => {
      if (flow.name === data.name) {
        flow.status = data.status;
      }
    });
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
      await this.RunFlow(WorkflowEnum.SET_IE_ENVIRONMENT);
      await this.RunFlow(WorkflowEnum.SET_PROXY);
      await this.RunFlow(WorkflowEnum.LAUNCH_SELENIUM);
      await this.RunFlow(WorkflowEnum.INPUT_SIGN_IN_INFORMATION);
      await this.RunFlow(WorkflowEnum.SUBMIT_TO_SIGN_IN);
      await this.RunFlow(WorkflowEnum.SEND_USB_KEY);
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
      await this.RunFlow(WorkflowEnum.SET_IE_ENVIRONMENT);
      await this.RunFlow(WorkflowEnum.SET_PROXY);
      await this.RunFlow(WorkflowEnum.LAUNCH_SELENIUM);
    } catch (error) {
      LogModule.SetLog({ message: error, level: "error" });
    } finally {
      AppModule.HANDLE_ACCOUNT_PROCESSING_SIGN_IN(false);
    }
  }
  @Action
  async RunAutoTransferFlows() {
    try {
      await this.RunFlow(WorkflowEnum.GO_TRANSFER_PAGE);
      await this.RunFlow(WorkflowEnum.FILL_TRANSFER_INFORMATION);
      await this.RunFlow(WorkflowEnum.FILL_NOTE);
      await this.RunFlow(WorkflowEnum.CONFIRM_TRANSACTION);
      return await this.RunFlow(WorkflowEnum.CHECK_IF_SUCCESS);
    } catch (error) {
      LogModule.SetConsole({ level: "error", message: error });
      return false;
    }
  }
  @Action
  public async RunManualTransferFlows() {
    try {
      await this.RunFlow(WorkflowEnum.GO_TRANSFER_PAGE);
      await this.RunFlow(WorkflowEnum.FILL_TRANSFER_INFORMATION);
    } catch (error) {
      LogModule.SetConsole({ level: "error", message: error });
    }
  }

  @Action
  private async RunFlow(flowName: WorkflowEnum) {
    this.UPDATE_FLOW_STATUS({
      name: flowName,
      status: WorkflowStatusEnum.RUNNING
    });

    var { isFlowExecutedSuccess, message } = await transponder(
      ipcRenderer,
      flowName
    );

    this.UPDATE_FLOW_STATUS({
      name: flowName,
      status: isFlowExecutedSuccess
        ? WorkflowStatusEnum.SUCCESS
        : WorkflowStatusEnum.FAIL
    });

    if (!isFlowExecutedSuccess) throw new Error(message);
  }
  // TODO
  @Action
  async UnsetWorker() {
    await this.CloseSelenium();
    // commit("SET_WORKFLOW", null);
  }
  // TODO
  @Action
  async CheckIsProxySet() {
    try {
      // this.HANDLE_PROXY_STATE (await checkIsProxySet());
    } catch (error) {
      return LogModule.SetConsole({ message: error, level: "error" });
    }
  }
  @Action
  private async CloseSelenium() {
    // if (this.worker) await this.worker.closeSelenium();
    await transponder(ipcRenderer, WorkflowEnum.CLOSE_SELENIUM);
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
  async GetBankBalance() {
    try {
      await transponder(ipcRenderer, WorkflowEnum.GET_BALANCE);
    } catch (error) {
      LogModule.SetLog({ level: "error", message: "Fail to get balance" });
      LogModule.SetLog({ level: "error", message: error });
    }
  }
  @Action
  async RunSelectedFlow(flowName: WorkflowEnum) {
    /* eslint-disable no-return-await */
    switch (flowName) {
      case flowName:
        return this.RunFlow(flowName);
      default:
        throw new Error("No such workflow");
    }
    /* eslint-enable no-return-await */
  }
}
export const WorkerModule = getModule(WorkerModuleStatic);
