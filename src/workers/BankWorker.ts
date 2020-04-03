import { screen } from "electron";
import { Builder } from "selenium-webdriver";
import { setProxy, unsetProxy, setIEEnvironment } from "./utils/regeditTool";
import { WorkflowEnum, WorkflowStatusEnum } from "./utils/workflowHelper";
import { WorkerAdapterFactory } from "./WorkerAdapterFactory";
import { IWorkerAdapter } from "./IWorkerAdapter";
import TaskDetailModel from "./models/taskDetailModel";
import logger from "./utils/logger";
import RemitterAccountModel from "./models/remitterAccountModel";

/**
 * Bank Worker
 * 提供各種銀行操作功能
 */
export default class BankWorker {
  private taskStartAt: Date;
  private instance: IWorkerAdapter;
  private remitterAccount:RemitterAccountModel;
  private taskDetail: TaskDetailModel;

  constructor(remitterAccount: RemitterAccountModel) {
    this.instance = WorkerAdapterFactory.createWorkerAdapter(
      remitterAccount.code
    );
    this.taskStartAt = new Date();
    this.remitterAccount = remitterAccount;
    this.taskDetail = new TaskDetailModel();
  }

  async setIEEnvironment(): Promise<boolean> {
    try {
      await setIEEnvironment();
      return true;
    } catch (error) {
      logger.log({ level: "error", message: error });
      return false;
    }
  }

  async setProxy(): Promise<boolean> {
    try {
      await setProxy(this.remitterAccount.proxy);

      return true;
    } catch (error) {
      logger.log({ message: error, level: "error" });
      return false;
    }
  }

  async unsetProxy(): Promise<boolean> {
    try {
    await unsetProxy();
    logger.log({ message: "Proxy unset", level: "info" });
    return true;
    } catch (error) {
     return false; 
    }
  }

  async launchSelenium(): Promise<boolean> {
    try {
      const driver = await new Builder()
        .withCapabilities({
          ignoreZoomSetting: true
          // requireWindowFocus: true
        })
        .forBrowser("ie")
        .build();
      this.instance.setDriver(driver);
      this.instance.setTask(this.taskDetail);

      const { width, height } = screen.getPrimaryDisplay().workAreaSize;
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

      logger.debug("Selenium launched");
      return true;
    } catch (error) {
      logger.error(error);
      return false;
    }
  }

  async closeSelenium(): Promise<boolean> {
    if (this.instance.getDriver()) await this.instance.getDriver().quit();
    logger.log({ message: "Selenium closed", level: "info" });
    return true;
  }

  async inputSignInInformation(): Promise<boolean> {
    try {
      // this.instance.card = useCurrentAccount
      //   ? getCurrentCardDetail()
      //   : getSelectedCardDetail();
      await this.instance.inputSignInInformation();
      return true;
    } catch (error) {
      logger.log({ level: "error", message: error.toString() });
      return false;
    }
  }

  async submitToSignIn(): Promise<boolean> {
    try {
      await this.instance.submitToSignIn();

      logger.log({ message: "Bank Logged In", level: "info" });
      return true;
    } catch (error) {
      logger.log({ level: "error", message: error.toString() });
      return false;
    }
  }

  async sendUSBKey(): Promise<boolean> {
    try {
      await this.instance.sendUSBKey();

      logger.log({ message: "USB key sent", level: "info" });
      return true;
    } catch (error) {
      logger.log({ level: "error", message: error.toString() });
      return false;
    }
  }

  /**
   *
   * @param {Object} globalState
   * @param {Boolean} globalState.isManualLogin
   */
  async checkIfLoginSuccess(globalState: any): Promise<boolean> {
    const workflowName = WorkflowEnum.CHECK_IF_LOGIN_SUCCESS;
    try {
      const isLoginSuccess = await this.instance.checkIfLoginSuccess(
        globalState
      );

      return isLoginSuccess;
    } catch (error) {
      logger.log({ level: "error", message: error });
      return false;
    }
  }

  async getCookie(): Promise<boolean> {
    try {
      //   store.commit("SET_COOKIE", data.cookie);
      //   store.commit("SET_SESSION", data.session);
      // setCookieAndSession(await this.instance.getCookie());

      logger.log({ message: "Got cookie and session", level: "info" });
      return true;
    } catch (error) {
      logger.log({ level: "error", message: error });
      return false;
    }
  }

  async goTransferPage(): Promise<boolean> {
    this.taskStartAt = new Date();

    try {
      await this.instance.goTransferPage();

      logger.log({
        message: "Redirected to transfer page",
        level: "info"
      });
      return true;
    } catch (error) {
      logger.log({ level: "error", message: error });
      return false;
    }
  }

  async fillTransferFrom(): Promise<boolean> {
    try {
      if (this.taskDetail === null) {
        throw new Error("You didn't select the task");
      }

      await this.instance.fillTransferForm();

      logger.log({ message: "Transfer form filled", level: "info" });
      return true;
    } catch (error) {
      logger.log({ level: "error", message: error });
      return false;
    }
  }

  async fillNote(): Promise<boolean> {
    try {
      await this.instance.fillNote();

      logger.log({ message: "Note filled", level: "info" });
      return true;
    } catch (error) {
      logger.log({ level: "error", message: error });
      return false;
    }
  }
  async confirmTransaction(): Promise<boolean> {
    try {
      await this.instance.checkBankReceivedTransferInformation();
      await this.instance.sendPasswordToPerformTransaction();
      await this.instance.sendUsbPasswordToPerformTransaction();

      logger.log({ message: "Transaction confirmed", level: "info" });
      return true;
    } catch (error) {
      logger.log({ level: "error", message: error });
      return false;
    }
  }

  async checkIfSuccess(): Promise<boolean> {
    try {
      var isCheckSuccess = await this.instance.checkIfTransactionSuccess();
      calculateTransferTime(this.taskStartAt);

      if (isCheckSuccess) {
        // await markTaskSuccess(this.instance.charge);
        logger.log({
          message: "Transfer success, you can start next transaction",
          level: "info"
        });
        return true;
      } else {
        logger.log({
          level: "warn",
          message:
            "System can't check the transfer result, please check it manually"
        });
        return false;
      }
    } catch (error) {
      logger.log({ message: error, level: "error" });
      return false;
    }
  }

  async getBalance(): Promise<boolean> {
    await this.instance.getBalance();
    logger.log({ message: "Balance got", level: "info" });
    return true;
  }
}

/**
 * Record how long was task finish
 * @param {Date} taskStartAt
 */
function calculateTransferTime(taskStartAt: Date) {
  // var now = new Date().getTime();
  // var executedTime = parseInt((now - taskStartAt) / 1000).toFixed(0);
  // logger.log({ level: "info", message: `Task executed for ${executedTime} seconds` });
}
