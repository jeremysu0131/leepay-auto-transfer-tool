import BankWorker from "@/workers/BankWorker";
import { VuexModule, Module, Mutation, Action, getModule } from "vuex-module-decorators";
import store from "@/store";
import {
  WorkflowEnum,
  manualSignInWorkflowEnum,
  autoSignInWorkflowEnum,
  transferWorkflowEnum
} from "../../workers/utils/workflowHelper";
import { LogModule } from "./log";
import { AppModule } from "./app";
import { TaskModule } from "./task";
import { transponder } from "../../electron-communicator";
import { ipcRenderer, screen } from "electron";
import RemitterAccountModel from "@/models/remitterAccountModel";
import WorkflowStatusEnum from "../../enums/WorkflowStatusEnum";
import { AccountModule } from "./account";
import FlowResponseModel from "@/models/flowResponseModel";
import WorkerBalanceResponseModel from "@/workers/models/workerBalanceResponseModel";
import WorkerResponseModel from "@/workers/models/workerResponseModel";

export interface IWorkerState {
  worker: BankWorker;
  workflow: any[];
}

@Module({ dynamic: true, store, name: "worker" })
class Worker extends VuexModule implements IWorkerState {
  public workflow = [] as any[];
  public worker = {} as BankWorker;

  @Mutation
  UNSET_WORKFLOW() {
    this.workflow = [];
  }
  @Mutation
  SET_AUTO_SIGN_IN_WORKFLOW() {
    this.workflow = autoSignInWorkflowEnum();
  }
  @Mutation
  SET_MANUAL_SIGN_IN_WORKFLOW() {
    this.workflow = manualSignInWorkflowEnum();
  }
  @Mutation
  SET_TRANSFER_WORKFLOW(accountCode: string) {
    this.workflow = JSON.parse(JSON.stringify(transferWorkflowEnum(accountCode)));
  }
  @Mutation
  UPDATE_FLOW_STATUS(data: { name: WorkflowEnum; status: WorkflowStatusEnum }) {
    this.workflow.forEach(flow => {
      if (flow.name === data.name) {
        flow.status = data.status;
      }
    });
    // var workflow = this.workflow;
    // this.workflow = [];
    // this.workflow = workflow;
  }
  // SET_WORKFLOW: (state, bankCode) => {
  //   state.workflow = workflowEnum(bankCode);
  // },
  @Action
  public async SetWorker(remitterAccount: RemitterAccountModel) {
    try {
      await this.RunFlow({
        name: WorkflowEnum.SET_WORKER,
        args: remitterAccount
      });
      //  await transponder(ipcRenderer, WorkflowEnum.SET_WORKER, remitterAccount);
    } catch (error) {
      LogModule.SetLog({ level: "error", message: error.stack });
    }
  }

  @Action
  async RunAutoReLoginFlows() {
    AccountModule.SET_SELECTED(AccountModule.current);
    WorkerModule.SET_AUTO_SIGN_IN_WORKFLOW();
    AppModule.HANDLE_SHOWING_TAB("accounts");
    AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("sign-in-to-bank");
    await this.RunFlow({ name: WorkflowEnum.CLOSE_SELENIUM });
    let result = await this.RunAutoLoginFlows();
    return result;
  }

  @Action({ rawError: true })
  async RunAutoLoginFlows() {
    this.SET_AUTO_SIGN_IN_WORKFLOW();
    this.beforeExecuteLogin();
    try {
      await this.RunFlow({ name: WorkflowEnum.SET_IE_ENVIRONMENT });
      await this.RunFlow({ name: WorkflowEnum.SET_PROXY });
      await this.RunFlow({ name: WorkflowEnum.LAUNCH_SELENIUM, args: screen.getPrimaryDisplay().size });
      await this.RunFlow({ name: WorkflowEnum.INPUT_SIGN_IN_INFORMATION });
      await this.RunFlow({ name: WorkflowEnum.SUBMIT_TO_SIGN_IN });
      await this.RunFlow({ name: WorkflowEnum.SEND_USB_KEY });
      if (await this.CheckIfLoginSuccess()) {
        this.HandleSignInSuccess();
      }
    } catch (error) {
      LogModule.SetLog({ message: error, level: "error" });
      LogModule.SetConsole({
        level: "error",
        message:
          'Error happened during login, please login manually and click "confirm" button below when complete Note: the "auto process task" has been turned off as the result'
      });
      this.HandleSignInFail();
      return false;
    } finally {
      this.afterExecuteLogin();
    }
  }
  @Action
  async RunManualLoginFlows() {
    this.SET_MANUAL_SIGN_IN_WORKFLOW();
    this.beforeExecuteLogin();
    try {
      await this.RunFlow({ name: WorkflowEnum.SET_IE_ENVIRONMENT });
      await this.RunFlow({ name: WorkflowEnum.SET_PROXY });
      await this.RunFlow({ name: WorkflowEnum.LAUNCH_SELENIUM, args: screen.getPrimaryDisplay().size });
      await this.RunFlow({ name: WorkflowEnum.INPUT_SIGN_IN_INFORMATION });
    } catch (error) {
      LogModule.SetLog({ message: error, level: "error" });
    } finally {
      this.afterExecuteLogin();
    }
  }
  @Action
  async RunAutoTransferFlows() {
    try {
      await this.RunFlow({
        name: WorkflowEnum.SET_TASK,
        args: TaskModule.selectedDetail
      });
      await this.RunFlow({ name: WorkflowEnum.GO_TRANSFER_PAGE });
      await this.RunFlow({ name: WorkflowEnum.FILL_TRANSFER_INFORMATION });
      await this.RunFlow({ name: WorkflowEnum.FILL_NOTE });
      return await this.RunFlow({ name: WorkflowEnum.CONFIRM_TRANSACTION });
    } catch (error) {
      LogModule.SetConsole({ level: "error", message: error });
      return { success: false, message: error };
    }
  }
  @Action
  async RunManualTransferFlows() {
    try {
      await this.RunFlow({ name: WorkflowEnum.GO_TRANSFER_PAGE });
      await this.RunFlow({ name: WorkflowEnum.FILL_TRANSFER_INFORMATION });
    } catch (error) {
      LogModule.SetConsole({ level: "error", message: error });
    }
  }

  @Action({ rawError: true })
  async RunFlow<T = WorkerResponseModel>(flow: { name: WorkflowEnum; args?: object }): Promise<T> {
    if (flow.name !== WorkflowEnum.CHECK_IF_IE_CLOSED) {
      let message = `Flow start, name: ${flow.name}`;
      // Do not record parameters in the production environment
      // to prevent the display of private information.
      if (process.env.NODE_ENV !== "production") {
        message += `, parameters: ${JSON.stringify(flow.args)}`;
      }
      LogModule.SetLog({ level: "info", message });
    }

    this.UPDATE_FLOW_STATUS({
      name: flow.name,
      status: WorkflowStatusEnum.RUNNING
    });

    /* eslint-disable no-return-await */
    switch (flow.name) {
      case flow.name: {
        const executedResponse = await transponder<T>(ipcRenderer, flow.name, flow.args);
        const { success, message } = executedResponse;
        if (flow.name !== WorkflowEnum.CHECK_IF_IE_CLOSED) {
          LogModule.SetLog({
            level: "info",
            message: `Flow end, name: ${flow.name}, executed result: ${success}`
          });
        }

        this.UPDATE_FLOW_STATUS({
          name: flow.name,
          status: success ? WorkflowStatusEnum.SUCCESS : WorkflowStatusEnum.FAIL
        });
        if (!success) throw new Error(`Flow error message: ${message}`);
        return (executedResponse as unknown) as T;
      }

      default:
        throw new Error("No such workflow");
    }
    /* eslint-enable no-return-await */
  }
  // TODO
  @Action
  async UnsetWorker() {
    try {
      WorkerModule.UNSET_WORKFLOW();
      this.RunFlow({ name: WorkflowEnum.UNSET_WORKER });
    } catch (error) {
      return LogModule.SetConsole({ level: "error", message: error });
    }
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
  async HandleSignInSuccess() {
    AppModule.HANDLE_ACCOUNT_SIGN_IN_TO_BANK(true);
    AppModule.HANDLE_TASK_TAB_VISIBLE(true);
    AppModule.HANDLE_TASK_ABLE_FETCH(true);
    AppModule.HANDLE_SHOWING_TAB("tasks");
    AppModule.HANDLE_ACCOUNT_PROCESSING_SIGN_IN(false);
    // This for destroy sign in page
    AppModule.HANDLE_ACCOUNT_SHOWING_PAGE("account-search");

    AccountModule.SET_SIGN_IN_SUCCESS_TIME(new Date());
    AccountModule.SET_CURRENT(AccountModule.selected);
    // Unset select account
    AccountModule.SET_SELECTED(new RemitterAccountModel());

    WorkerModule.UNSET_WORKFLOW();
    WorkerModule.SET_TRANSFER_WORKFLOW(AccountModule.current.code);

    await Promise.all([TaskModule.GetAll(AccountModule.current.id)]);
  }
  @Action
  HandleSignInFail() {
    AppModule.HANDLE_ACCOUNT_SIGN_IN_TO_BANK(false);
    AppModule.HANDLE_ACCOUNT_PROCESSING_SIGN_IN(false);
    AppModule.HANDLE_TASK_PROCESSING(false);
    AppModule.HANDLE_TASK_AUTO_PROCESS(false);

    AppModule.HANDLE_TASK_TAB_VISIBLE(true);
    AppModule.HANDLE_TASK_ABLE_FETCH(true);
    AccountModule.SET_SELECTED(new RemitterAccountModel());
  }
  @Action({ rawError: true })
  async CheckIfLoginSuccess(): Promise<boolean> {
    const isManualLogin = AppModule.isManualLogin;
    try {
      let { success, message } = await this.RunFlow({
        name: WorkflowEnum.CHECK_IF_LOGIN_SUCCESS,
        args: { isManualLogin }
      });
      return success;
    } catch (error) {
      return false;
    }
  }
  @Action
  private beforeExecuteLogin() {
    AppModule.HANDLE_ACCOUNT_SIGN_IN_TO_BANK(false);
    AppModule.HANDLE_ACCOUNT_PROCESSING_SIGN_IN(true);
    AppModule.HANDLE_TASK_ABLE_FETCH(false);
  }
  @Action
  private afterExecuteLogin() {
    AppModule.HANDLE_ACCOUNT_PROCESSING_SIGN_IN(false);
  }
}
export const WorkerModule = getModule(Worker);
