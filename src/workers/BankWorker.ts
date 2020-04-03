import { screen } from "electron";
import { Builder } from "selenium-webdriver";
import { setProxy, unsetProxy, setIEEnvironment } from "./utils/regeditTool";
import { WorkflowEnum, WorkflowStatusEnum } from "./utils/workflowHelper";
import { WorkerAdapterFactory } from "./WorkerAdapterFactory";
import { IWorkerAdapter } from "./IWorkerAdapter";
import TaskDetailModel from "../models/taskDetailModel";
import { Options } from "selenium-webdriver/ie";
import logger from "./utils/logger";
// var path = require("iedriver").path;

/**
 * Bank Worker
 * 提供各種銀行操作功能
 */
export default class BankWorker {
  private taskStartAt: Date;
  private instance: IWorkerAdapter;
  private card: any;
  private taskDetail: TaskDetailModel;

  constructor(taskDetail: TaskDetailModel) {
    this.taskStartAt = new Date();
    this.instance = WorkerAdapterFactory.createWorkerAdapter(
      taskDetail.remitterAccount.code
    );
    this.taskDetail = taskDetail;
    // this.card = null;
  }

  async setIEEnvironment() {
    var isSet = await setIEEnvironment();

    // WorkerModule.UPDATE_FLOW_STATUS({
    //   name: WorkflowEnum.SET_IE_ENVIRONMENT,
    //   status: isSet ? WorkflowStatusEnum.SUCCESS : WorkflowStatusEnum.FAIL
    // });
    return isSet;
  }

  async setProxy() {
    try {
      await setProxy(this.card.proxy);

      return true;
    } catch (error) {
      logger.log({ message: error, level: "error" });
      return false;
    }
  }

  async unsetProxy() {
    await unsetProxy();
    logger.log({ message: "Proxy unset", level: "info" });
  }

  async launchSelenium() {
    try {
      console.log("call");

      const driver = await new Builder()
        .withCapabilities({
          ignoreZoomSetting: true
          // requireWindowFocus: true
        })
        .forBrowser("ie")
        .build();
      console.log("call");
      this.instance.setDriver(driver);

      console.log("call");
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

      logger.log({ message: "Selenium launched", level: "info" });
    } catch (error) {
      console.log(error);

      throw error;
    }
  }

  async closeSelenium() {
    if (this.instance.getDriver()) await this.instance.getDriver().quit();

    logger.log({ message: "Selenium closed", level: "info" });
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

  async submitToSignIn() {
    try {
      await this.instance.submitToSignIn();

      logger.log({ message: "Bank Logged In", level: "info" });
    } catch (error) {
      logger.log({ level: "error", message: error.toString() });
      return false;
    }
  }

  async sendUSBKey() {
    try {
      await this.instance.sendUSBKey();

      logger.log({ message: "USB key sent", level: "info" });
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

  async getCookie() {
    try {
      //   store.commit("SET_COOKIE", data.cookie);
      //   store.commit("SET_SESSION", data.session);
      // setCookieAndSession(await this.instance.getCookie());

      logger.log({ message: "Got cookie and session", level: "info" });
    } catch (error) {
      logger.log({ level: "error", message: error });
      return false;
    }
  }

  async goTransferPage() {
    this.taskStartAt = new Date();

    try {
      await this.instance.goTransferPage();

      logger.log({
        message: "Redirected to transfer page",
        level: "info"
      });
    } catch (error) {
      logger.log({ level: "error", message: error });
      return false;
    }
  }

  async fillTransferFrom() {
    try {
      if (this.taskDetail === null) {
        throw new Error("You didn't select the task");
      }

      await this.instance.fillTransferForm();

      logger.log({ message: "Transfer form filled", level: "info" });
    } catch (error) {
      logger.log({ level: "error", message: error });
      return false;
    }
  }

  async fillNote() {
    try {
      await this.instance.fillNote();

      logger.log({ message: "Note filled", level: "info" });
    } catch (error) {
      logger.log({ level: "error", message: error });
      return false;
    }
  }
  async confirmTransaction() {
    try {
      await this.instance.checkBankReceivedTransferInformation();
      await this.instance.sendPasswordToPerformTransaction();
      await this.instance.sendUsbPasswordToPerformTransaction();

      logger.log({ message: "Transaction confirmed", level: "info" });
    } catch (error) {
      logger.log({ level: "error", message: error });
      return false;
    }
  }

  async checkIfSuccess() {
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

  async getBalance() {
    await this.instance.getBalance();
    logger.log({ message: "Balance got", level: "info" });
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
