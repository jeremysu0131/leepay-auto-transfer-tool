import IWorkerFactory from "./IWorkerFactory";
import { screen } from "electron";
import { Builder } from "selenium-webdriver";
import {
  setLog,
  setCookieAndSession,
  updateFlowStatus,
  updateSignInFlowStatus,
  getSelectedTaskDetail,
  markTaskSuccess,
  getSelectedCardDetail,
  getCurrentCardDetail
} from "./utils/storeHelper";
import { setProxy, unsetProxy, setIEEnviroment } from "./utils/regeditTool";
import { workflowEnum, workflowStatusEnum } from "./utils/workflowHelper";
import { MessageBox } from "element-ui";
import ABCWorker from "./ABCWorker";
import BCMWorker from "./BCMWorker";
import BOCWorker from "./BOCWorker";
import CCBWorker from "./CCBWorker";
import CITICWorker from "./CITICWorker";
import CMBCWorker from "./CMBCWorker";
import ICBCWorker from "./ICBCWorker";
import JZBWorker from "./JZBWorker";
import PSBCWorker from "./PSBCWorker";
import HRBBWorker from "./HRBBWorker";
import PINGANWorker from "./PINGANWorker";
import BOBWorker from "./BOBWorker";

function createWorker(accountCode: string) {
  if (accountCode.indexOf("ABC") !== -1) return new ABCWorker();
  else if (accountCode.indexOf("BCM") !== -1) return new BCMWorker();
  else if (accountCode.indexOf("BOB") !== -1) return new BOBWorker();
  else if (accountCode.indexOf("BOC") !== -1) return new BOCWorker();
  else if (accountCode.indexOf("CCB") !== -1) return new CCBWorker();
  else if (accountCode.indexOf("CITIC") !== -1) return new CITICWorker();
  else if (accountCode.indexOf("CMBC") !== -1) return new CMBCWorker();
  else if (accountCode.indexOf("HRBB") !== -1) return new HRBBWorker();
  else if (accountCode.indexOf("ICBC") !== -1) return new ICBCWorker();
  else if (accountCode.indexOf("JZB") !== -1) return new JZBWorker();
  else if (accountCode.indexOf("PINGAN") !== -1) return new PINGANWorker();
  else if (accountCode.indexOf("PSBC") !== -1) return new PSBCWorker();
  else throw new Error("No such bank rule");
}

export default class WorkerFactory implements IWorkerFactory {
  private taskStartAt: Date;
  private worker: any;
  private card: any;

  constructor(data: {
    accountCode: string;
    bankCode: string;
    accountName: string;
    accountPassword: string;
    usbPassword: string;
    proxy: string;
  }) {
    this.taskStartAt = new Date();
    this.worker = createWorker(data.accountCode);
    this.card = getSelectedCardDetail();
  }

  // async setIEEnviroment() {
  //   updateSignInFlowStatus({
  //     name: workflowEnum().SET_IE_ENVIROMENT,
  //     status: workflowStatusEnum.RUNNING
  //   });

  //   var isSet = await setIEEnviroment();

  //   updateSignInFlowStatus({
  //     name: workflowEnum().SET_IE_ENVIROMENT,
  //     status: isSet ? workflowStatusEnum.SUCCESS : workflowStatusEnum.FAIL
  //   });
  //   return isSet;
  // }

  async setProxy() {
    try {
      updateSignInFlowStatus({
        name: workflowEnum().SET_PROXY,
        status: workflowStatusEnum.RUNNING
      });

      await setProxy(this.card.proxy);

      updateSignInFlowStatus({
        name: workflowEnum().SET_PROXY,
        status: workflowStatusEnum.SUCCESS
      });

      return true;
    } catch (error) {
      updateSignInFlowStatus({
        name: workflowEnum().SET_PROXY,
        status: workflowStatusEnum.FAIL
      });
      setLog({ message: error, level: "error" });
      return false;
    }
  }

  async unsetProxy() {
    await unsetProxy();
    setLog({ message: "Proxy unset", level: "info" });
  }

  async launchSelenium() {
    try {
      updateSignInFlowStatus({
        name: workflowEnum().LAUNCH_SELENIUM,
        status: workflowStatusEnum.RUNNING
      });

      this.instance.driver = await new Builder()
        .withCapabilities({
          ignoreZoomSetting: true
          // requireWindowFocus: true
        })
        .forBrowser("ie")
        .build();

      const { width, height } = screen.getPrimaryDisplay().workAreaSize;
      await this.instance.driver
        .manage()
        .window()
        .setSize(width * (1 / 2), height);
      await this.instance.driver
        .manage()
        .window()
        .setPosition(0, 0);

      await this.instance.launchSelenium();

      updateSignInFlowStatus({
        name: workflowEnum().LAUNCH_SELENIUM,
        status: workflowStatusEnum.SUCCESS
      });
      setLog({ message: "Selenium launched", level: "info" });
    } catch (error) {
      updateSignInFlowStatus({
        name: workflowEnum().LAUNCH_SELENIUM,
        status: workflowStatusEnum.FAIL
      });
      throw error;
    }
  }

  async closeSelenium() {
    if (this.instance.driver) await this.instance.driver.quit();

    setLog({ message: "Selenium closed", level: "info" });
  }

  async inputSignInInformation(useCurrentAccount: any) {
    try {
      updateSignInFlowStatus({
        name: workflowEnum().INPUT_SIGN_IN_INFORMATION,
        status: workflowStatusEnum.RUNNING
      });
      this.instance.card = useCurrentAccount
        ? getCurrentCardDetail()
        : getSelectedCardDetail();
      await this.instance.inputSignInInformation();

      updateSignInFlowStatus({
        name: workflowEnum().INPUT_SIGN_IN_INFORMATION,
        status: workflowStatusEnum.SUCCESS
      });
    } catch (error) {
      updateSignInFlowStatus({
        name: workflowEnum().INPUT_SIGN_IN_INFORMATION,
        status: workflowStatusEnum.FAIL
      });
      throw error;
    }
  }

  async submitToSignIn() {
    try {
      updateSignInFlowStatus({
        name: workflowEnum().SUBMIT_TO_SIGN_IN,
        status: workflowStatusEnum.RUNNING
      });
      await this.instance.submitToSignIn();

      updateSignInFlowStatus({
        name: workflowEnum().SUBMIT_TO_SIGN_IN,
        status: workflowStatusEnum.SUCCESS
      });
      setLog({ message: "Bank Logged In", level: "info" });
    } catch (error) {
      updateSignInFlowStatus({
        name: workflowEnum().SUBMIT_TO_SIGN_IN,
        status: workflowStatusEnum.FAIL
      });
      throw error;
    }
  }

  async sendUSBKey() {
    try {
      updateSignInFlowStatus({
        name: workflowEnum().SEND_USB_KEY,
        status: workflowStatusEnum.RUNNING
      });

      await this.instance.sendUSBKey();

      updateSignInFlowStatus({
        name: workflowEnum().SEND_USB_KEY,
        status: workflowStatusEnum.SUCCESS
      });
      setLog({ message: "USB key sent", level: "info" });
    } catch (error) {
      updateSignInFlowStatus({
        name: workflowEnum().SEND_USB_KEY,
        status: workflowStatusEnum.FAIL
      });
      throw error;
    }
  }

  /**
   *
   * @param {Object} globalState
   * @param {Boolean} globalState.isManualLogin
   */
  async checkIfLoginSuccess(globalState: any) {
    const workflowName = workflowEnum().CHECK_IF_LOGIN_SUCCESS;
    try {
      updateSignInFlowStatus({
        name: workflowName,
        status: workflowStatusEnum.RUNNING
      });

      const isLoginSuccess = await this.instance.checkIfLoginSuccess(
        globalState
      );

      updateSignInFlowStatus({
        name: workflowName,
        status: isLoginSuccess
          ? workflowStatusEnum.SUCCESS
          : workflowStatusEnum.FAIL
      });

      return isLoginSuccess;
    } catch (error) {
      setLog({ level: "error", message: error });
      return false;
    }
  }

  async getCookie() {
    try {
      updateFlowStatus({
        name: workflowEnum().GET_COOKIE,
        status: workflowStatusEnum.RUNNING
      });

      setCookieAndSession(await this.instance.getCookie());

      updateFlowStatus({
        name: workflowEnum().GET_COOKIE,
        status: workflowStatusEnum.SUCCESS
      });

      setLog({ message: "Got cookie and session", level: "info" });
    } catch (error) {
      updateFlowStatus({
        name: workflowEnum().GET_COOKIE,
        status: workflowStatusEnum.FAIL
      });
      throw error;
    }
  }

  async goTransferPage() {
    this.taskStartAt = new Date();
    updateFlowStatus({
      name: workflowEnum().GO_TRANSFER_PAGE,
      status: workflowStatusEnum.RUNNING
    });
    try {
      await this.instance.goTransferPage();

      updateFlowStatus({
        name: workflowEnum().GO_TRANSFER_PAGE,
        status: workflowStatusEnum.SUCCESS
      });
      setLog({ message: "Redirected to transfer page", level: "info" });
    } catch (error) {
      updateFlowStatus({
        name: workflowEnum().GO_TRANSFER_PAGE,
        status: workflowStatusEnum.FAIL
      });
      throw error;
    }
  }

  async fillTransferFrom() {
    updateFlowStatus({
      name: workflowEnum().FILL_TRANSFER_INFORMATION,
      status: workflowStatusEnum.RUNNING
    });
    try {
      var taskDetail = getSelectedTaskDetail();
      if (taskDetail === null) throw new Error("You didn't select the task");

      await this.instance.fillTransferFrom();

      updateFlowStatus({
        name: workflowEnum().FILL_TRANSFER_INFORMATION,
        status: workflowStatusEnum.SUCCESS
      });
      setLog({ message: "Transfer form filled", level: "info" });
    } catch (error) {
      updateFlowStatus({
        name: workflowEnum().FILL_TRANSFER_INFORMATION,
        status: workflowStatusEnum.FAIL
      });
      throw error;
    }
  }

  async fillNote() {
    updateFlowStatus({
      name: workflowEnum().FILL_NOTE,
      status: workflowStatusEnum.RUNNING
    });
    try {
      await this.instance.fillNote();

      updateFlowStatus({
        name: workflowEnum().FILL_NOTE,
        status: workflowStatusEnum.SUCCESS
      });
      setLog({ message: "Note filled", level: "info" });
    } catch (error) {
      updateFlowStatus({
        name: workflowEnum().FILL_NOTE,
        status: workflowStatusEnum.FAIL
      });
      throw error;
    }
  }
  async confirmTransaction() {
    updateFlowStatus({
      name: workflowEnum().CONFIRM_TRANSACTION,
      status: workflowStatusEnum.RUNNING
    });
    try {
      await this.instance.confirmTransaction();

      updateFlowStatus({
        name: workflowEnum().CONFIRM_TRANSACTION,
        status: workflowStatusEnum.SUCCESS
      });
      setLog({ message: "Transaction confirmed", level: "info" });
    } catch (error) {
      updateFlowStatus({
        name: workflowEnum().CONFIRM_TRANSACTION,
        status: workflowStatusEnum.FAIL
      });
      throw error;
    }
  }

  async checkIfSuccess() {
    updateFlowStatus({
      name: workflowEnum().CHECK_IF_SUCCESS,
      status: workflowStatusEnum.RUNNING
    });
    try {
      var isCheckSuccess = await this.instance.checkIfSuccess();
      calculateTransferTime(this.taskStartAt);
      updateFlowStatus({
        name: workflowEnum().CHECK_IF_SUCCESS,
        status: isCheckSuccess
          ? workflowStatusEnum.SUCCESS
          : workflowStatusEnum.FAIL
      });
      if (isCheckSuccess) {
        await markTaskSuccess(this.instance.charge);
        setLog({
          message: "Transfer success, you can start next transaction",
          level: "info"
        });
        return true;
      } else {
        setLog({
          level: "warn",
          message:
            "System can't check the transfer result, please check it manually"
        });
        return false;
      }
    } catch (error) {
      setLog({ message: error, level: "error" });
      return false;
    }
  }

  async getBalance() {
    await this.instance.getBalance();
    setLog({ message: "Balance got", level: "info" });
  }
}

/**
 * Record how long was task finish
 * @param {Date} taskStartAt
 */
function calculateTransferTime(taskStartAt: Date) {
  // var now = new Date().getTime();
  // var executedTime = parseInt((now - taskStartAt) / 1000).toFixed(0);
  // setLog({ level: "info", message: `Task executed for ${executedTime} seconds` });
}
