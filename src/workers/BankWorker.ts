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
    try {
      if (task.amount === 0) throw new Error("Task amount not able to 0");
      this.instance.setTask(task);
      return { isFlowExecutedSuccess: true };
    } catch (error) {
      Logger({ level: "error", message: error });
      return { isFlowExecutedSuccess: false, message: error };
    }
  }

  async setIEEnvironment(): Promise<WorkerResponseModel> {
    try {
      await setIEEnvironment();
      return { isFlowExecutedSuccess: true };
    } catch (error) {
      Logger({ level: "error", message: error });
      return { isFlowExecutedSuccess: false, message: error };
    }
  }

  async setProxy(): Promise<WorkerResponseModel> {
    try {
      await setProxy(this.instance.getRemitterAccount().proxy);
      await setProxyWhiteList(
        process.env.NODE_ENV === "production"
          ? "www.tcgpayment.com"
          : "localhost;192.168.0.27;10.8.95.22;"
      );

      return { isFlowExecutedSuccess: true };
    } catch (error) {
      Logger({ message: error, level: "error" });
      return { isFlowExecutedSuccess: false, message: error };
    }
  }

  async unsetProxy(): Promise<WorkerResponseModel> {
    try {
      await unsetProxy();
      Logger({ message: "Proxy unset", level: "info" });
      return { isFlowExecutedSuccess: true };
    } catch (error) {
      return { isFlowExecutedSuccess: false, message: error };
    }
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
      // this.instance.setTask(this.taskDetail);

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

      Logger({ level: "debug", message: "Selenium launched" });
      return { isFlowExecutedSuccess: true };
  }

  async closeSelenium(): Promise<WorkerResponseModel> {
    if (this.instance.getDriver()) await this.instance.getDriver().quit();
    Logger({ message: "Selenium closed", level: "info" });
    return { isFlowExecutedSuccess: true };
  }

  async inputSignInInformation(): Promise<WorkerResponseModel> {
    try {
      // this.instance.card = useCurrentAccount
      //   ? getCurrentCardDetail()
      //   : getSelectedCardDetail();
      await this.instance.inputSignInInformation();
      return { isFlowExecutedSuccess: true };
    } catch (error) {
      Logger({ level: "error", message: error.toString() });
      return { isFlowExecutedSuccess: false, message: error };
    }
  }

  async submitToSignIn(): Promise<WorkerResponseModel> {
    try {
      await this.instance.submitToSignIn();

      Logger({ message: "Bank Logged In", level: "info" });
      return { isFlowExecutedSuccess: true };
    } catch (error) {
      Logger({ level: "error", message: error.toString() });
      return { isFlowExecutedSuccess: false, message: error };
    }
  }

  async sendUSBKey(): Promise<WorkerResponseModel> {
    try {
      await this.instance.sendUSBKey();

      Logger({ message: "USB key sent", level: "info" });
      return { isFlowExecutedSuccess: true };
    } catch (error) {
      Logger({ level: "error", message: error.toString() });
      return { isFlowExecutedSuccess: false, message: error };
    }
  }

  /**
   *
   * @param {Object} globalState
   * @param {Boolean} globalState.isManualLogin
   */
  async checkIfLoginSuccess(globalState: any): Promise<WorkerResponseModel> {
    const workflowName = WorkflowEnum.CHECK_IF_LOGIN_SUCCESS;
    try {
      const isLoginSuccess = await this.instance.checkIfLoginSuccess(
        globalState
      );

      return isLoginSuccess
        ? { isFlowExecutedSuccess: true }
        : { isFlowExecutedSuccess: false, message: "Login In to Bank Fail" };
    } catch (error) {
      Logger({ level: "error", message: error });
      return { isFlowExecutedSuccess: false, message: error };
    }
  }

  async getCookie(): Promise<WorkerResponseModel> {
    try {
      //   store.commit("SET_COOKIE", data.cookie);
      //   store.commit("SET_SESSION", data.session);
      // setCookieAndSession(await this.instance.getCookie());

      Logger({ message: "Got cookie and session", level: "info" });
      return { isFlowExecutedSuccess: true };
    } catch (error) {
      Logger({ level: "error", message: error });
      return { isFlowExecutedSuccess: false, message: error };
    }
  }

  async goTransferPage(): Promise<WorkerResponseModel> {
    this.taskStartAt = new Date();

    try {
      await this.instance.goTransferPage();
      await this.instance.checkIfInTransferPage();

      Logger({
        message: "Redirected to transfer page",
        level: "info"
      });
      return { isFlowExecutedSuccess: true };
    } catch (error) {
      Logger({ level: "error", message: error });
      return { isFlowExecutedSuccess: false, message: error };
    }
  }

  async fillTransferFrom(): Promise<WorkerResponseModel> {
    try {
      await this.instance.fillTransferForm();
      await this.instance.checkTransferInformationCorrectly();

      Logger({ message: "Transfer form filled", level: "info" });
      return { isFlowExecutedSuccess: true };
    } catch (error) {
      Logger({ level: "error", message: error });
      return { isFlowExecutedSuccess: false, message: error };
    }
  }

  async fillNote(): Promise<WorkerResponseModel> {
    try {
      await this.instance.fillNote();
      await this.instance.checkIfNoteFilled();

      Logger({ message: "Note filled", level: "info" });
      return { isFlowExecutedSuccess: true };
    } catch (error) {
      Logger({ level: "error", message: error });
      return { isFlowExecutedSuccess: false, message: error };
    }
  }
  async confirmTransaction(): Promise<WorkerResponseModel> {
    try {
      await this.instance.checkBankReceivedTransferInformation();
      await this.instance.sendPasswordToPerformTransaction();
      await this.instance.sendUsbPasswordToPerformTransaction();

      Logger({ message: "Transaction confirmed", level: "info" });
      return { isFlowExecutedSuccess: true };
    } catch (error) {
      Logger({ level: "error", message: error });
      return { isFlowExecutedSuccess: false, message: error };
    }
  }

  async checkIfTransactionSuccess(): Promise<WorkerResponseModel> {
    try {
      var isCheckSuccess = await this.instance.checkIfTransactionSuccess();
      calculateTransferTime(this.taskStartAt);

      if (isCheckSuccess) {
        // await markTaskSuccess(this.instance.charge);
        Logger({
          message: "Transfer success, you can start next transaction",
          level: "info"
        });
        return { isFlowExecutedSuccess: true };
      } else {
        Logger({
          level: "warn",
          message:
            "System can't check the transfer result, please check it manually"
        });
        return {
          isFlowExecutedSuccess: false,
          message: "Fail to check if transaction success"
        };
      }
    } catch (error) {
      Logger({ message: error, level: "error" });
      return { isFlowExecutedSuccess: false, message: error };
    }
  }

  async getBalance(): Promise<BalanceModel> {
    const balance = await this.instance.getBalance();
    Logger({ message: "Balance got", level: "info" });
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
