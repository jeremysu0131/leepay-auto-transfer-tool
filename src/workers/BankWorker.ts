import { Builder } from "selenium-webdriver";
import { IWorkerAdapter } from "./IWorkerAdapter";
import { BalanceModel } from "./models/BalanceModel";
import RemitterAccountModel from "./models/remitterAccountModel";
import TaskDetailModel from "./models/taskDetailModel";
import { WorkerResponseModel } from "./models/workerResponseModel";
import Logger from "./utils/logger";
import {
  setIEEnvironment,
  setProxy,
  unsetProxy,
  setProxyWhiteList
} from "./utils/regeditTool";
import { WorkflowEnum } from "./utils/workflowHelper";
import { WorkerAdapterFactory } from "./WorkerAdapterFactory";
/**
 * Bank Worker
 * 提供各種銀行操作功能
 */
export default class BankWorker {
  private taskStartAt: Date;
  private instance: IWorkerAdapter;

  constructor(remitterAccount: RemitterAccountModel) {
    this.instance = WorkerAdapterFactory.createWorkerAdapter(
      remitterAccount.code
    );
    this.instance.setRemitterAccount(remitterAccount);
    this.taskStartAt = new Date();
  }

  setTask(task: TaskDetailModel): WorkerResponseModel {
    if (task.amount === 0) throw new Error("Task amount not able to 0");
    this.instance.setTask(task);
    return { isFlowExecutedSuccess: true };
  }

  async setIEEnvironment(): Promise<WorkerResponseModel> {
    await setIEEnvironment();
    return { isFlowExecutedSuccess: true };
  }

  async setProxy(): Promise<WorkerResponseModel> {
    await setProxy(this.instance.getRemitterAccount().proxy);
    await setProxyWhiteList(
      process.env.NODE_ENV === "production"
        ? "www.tcgpayment.com;risk.payment.com;"
        : "localhost;192.168.0.27;10.8.95.22;risk.payment.com;"
    );

    return { isFlowExecutedSuccess: true };
  }

  async unsetProxy(): Promise<WorkerResponseModel> {
    await unsetProxy();
    return { isFlowExecutedSuccess: true };
  }

  async launchSelenium(displaySize: {
    width: number;
    height: number;
  }): Promise<WorkerResponseModel> {
    const driver = await new Builder()
      .withCapabilities({
        ignoreZoomSetting: true
      })
      .forBrowser("ie")
      .build();
    this.instance.setDriver(driver);

    const { width, height } = displaySize;
    await this.instance
      .getDriver()
      .manage()
      .window()
      .setSize(width * (1 / 2), height);
    await this.instance
      .getDriver()
      .manage()
      .window()
      .setPosition(0, 0);

    await this.instance.launchSelenium();

    return { isFlowExecutedSuccess: true };
  }

  async closeSelenium(): Promise<WorkerResponseModel> {
    if (this.instance.getDriver()) await this.instance.getDriver().quit();
    return { isFlowExecutedSuccess: true };
  }

  async inputSignInInformation(): Promise<WorkerResponseModel> {
    // this.instance.card = useCurrentAccount
    //   ? getCurrentCardDetail()
    //   : getSelectedCardDetail();
    await this.instance.inputSignInInformation();
    return { isFlowExecutedSuccess: true };
  }

  async submitToSignIn(): Promise<WorkerResponseModel> {
    await this.instance.submitToSignIn();
    return { isFlowExecutedSuccess: true };
  }

  async sendUSBKey(): Promise<WorkerResponseModel> {
    await this.instance.sendUSBKey();

    return { isFlowExecutedSuccess: true };
  }

  /**
   *
   * @param {Object} globalState
   * @param {Boolean} globalState.isManualLogin
   */
  async checkIfLoginSuccess(globalState: any): Promise<WorkerResponseModel> {
    return (await this.instance.checkIfLoginSuccess(globalState))
      ? { isFlowExecutedSuccess: true }
      : { isFlowExecutedSuccess: false, message: "Login In to Bank Fail" };
  }

  async getCookie(): Promise<WorkerResponseModel> {
    // setCookieAndSession(await this.instance.getCookie());

    return { isFlowExecutedSuccess: true };
  }

  async goTransferPage(): Promise<WorkerResponseModel> {
    this.taskStartAt = new Date();

    await this.instance.goTransferPage();

    return (await this.instance.checkIfInTransferPage())
      ? { isFlowExecutedSuccess: true }
      : { isFlowExecutedSuccess: false };
  }

  async fillTransferFrom(): Promise<WorkerResponseModel> {
    await this.instance.fillTransferForm();
    return (await this.instance.checkTransferInformationCorrectly())
      ? { isFlowExecutedSuccess: true }
      : { isFlowExecutedSuccess: false };
  }

  async fillNote(): Promise<WorkerResponseModel> {
    await this.instance.fillNote();
    return (await this.instance.checkIfNoteFilled())
      ? { isFlowExecutedSuccess: true }
      : { isFlowExecutedSuccess: false };
  }
  async confirmTransaction(): Promise<WorkerResponseModel> {
    await this.instance.checkBankReceivedTransferInformation();
    await this.instance.sendPasswordToPerformTransaction();
    await this.instance.sendUsbPasswordToPerformTransaction();

    return { isFlowExecutedSuccess: true };
  }

  async checkIfTransactionSuccess(): Promise<WorkerResponseModel> {
    var isCheckSuccess = await this.instance.checkIfTransactionSuccess();
    calculateTransferTime(this.taskStartAt);

    if (isCheckSuccess) return { isFlowExecutedSuccess: true };
    else {
      return {
        isFlowExecutedSuccess: false,
        message:
          "System can't check the transfer result, please check it manually"
      };
    }
  }

  async getBalance(): Promise<BalanceModel> {
    const balance = await this.instance.getBalance();
    return { isFlowExecutedSuccess: true, balance };
  }
}

/**
 * Record how long was task finish
 * @param {Date} taskStartAt
 */
function calculateTransferTime(taskStartAt: Date) {
  // var now = new Date().getTime();
  // var executedTime = parseInt((now - taskStartAt) / 1000).toFixed(0);
  // Logger({ level: "info", message: `Task executed for ${executedTime} seconds` });
}
