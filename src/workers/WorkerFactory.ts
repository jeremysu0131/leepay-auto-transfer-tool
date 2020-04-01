import IWorkerFactory from "./IWorkerFactory";
import { screen } from "electron";
import { Builder } from "selenium-webdriver";
import { setProxy, unsetProxy, setIEEnviroment } from "./utils/regeditTool";
import { WorkflowEnum, WorkflowStatusEnum } from "./utils/workflowHelper";
import ABCWorker from "./ABCWorker";
import { LogModule } from "../store/modules/log";
import { AccountModule } from "../store/modules/account";
import { WorkerModule } from "../store/modules/worker";
import TaskDetailModel from "../models/taskDetailModel";

export default class WorkerFactory implements IWorkerFactory {
  private taskStartAt: Date;
  private instance: any;
  private card: any;
  private taskDetail: TaskDetailModel;

  constructor(taskDetail: TaskDetailModel) {
    this.taskStartAt = new Date();
    this.instance = this.createWorker(taskDetail.remitterAccount.code);
    this.taskDetail = taskDetail;
    this.card = AccountModule.selectedDetail;
  }
  private createWorker(accountCode: string) {
    if (accountCode.indexOf("ICBC") !== -1) return new ABCWorker();
    // if (accountCode.indexOf("ABC") !== -1) return new ABCWorker();
    // else if (accountCode.indexOf("BCM") !== -1) return new BCMWorker();
    // else if (accountCode.indexOf("BOB") !== -1) return new BOBWorker();
    // else if (accountCode.indexOf("BOC") !== -1) return new BOCWorker();
    // else if (accountCode.indexOf("CCB") !== -1) return new CCBWorker();
    // else if (accountCode.indexOf("CITIC") !== -1) return new CITICWorker();
    // else if (accountCode.indexOf("CMBC") !== -1) return new CMBCWorker();
    // else if (accountCode.indexOf("HRBB") !== -1) return new HRBBWorker();
    // else if (accountCode.indexOf("ICBC") !== -1) return new ICBCWorker();
    // else if (accountCode.indexOf("JZB") !== -1) return new JZBWorker();
    // else if (accountCode.indexOf("PINGAN") !== -1) return new PINGANWorker();
    // else if (accountCode.indexOf("PSBC") !== -1) return new PSBCWorker();
    else throw new Error("No such bank rule");
  }

  async setIEEnviroment() {
    WorkerModule.UPDATE_FLOW_STATUS({
      name: WorkflowEnum.SET_IE_ENVIROMENT,
      status: WorkflowStatusEnum.RUNNING
    });

    var isSet = await setIEEnviroment();

    WorkerModule.UPDATE_FLOW_STATUS({
      name: WorkflowEnum.SET_IE_ENVIROMENT,
      status: isSet ? WorkflowStatusEnum.SUCCESS : WorkflowStatusEnum.FAIL
    });
    return isSet;
  }

  async setProxy() {
    try {
      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.SET_PROXY,
        status: WorkflowStatusEnum.RUNNING
      });

      await setProxy(this.card.proxy);

      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.SET_PROXY,
        status: WorkflowStatusEnum.SUCCESS
      });

      return true;
    } catch (error) {
      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.SET_PROXY,
        status: WorkflowStatusEnum.FAIL
      });
      LogModule.SetLog({ message: error, level: "error" });
      return false;
    }
  }

  async unsetProxy() {
    await unsetProxy();
    LogModule.SetLog({ message: "Proxy unset", level: "info" });
  }

  async launchSelenium() {
    try {
      console.log("call");
      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.LAUNCH_SELENIUM,
        status: WorkflowStatusEnum.RUNNING
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

      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.LAUNCH_SELENIUM,
        status: WorkflowStatusEnum.SUCCESS
      });
      LogModule.SetLog({ message: "Selenium launched", level: "info" });
    } catch (error) {
      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.LAUNCH_SELENIUM,
        status: WorkflowStatusEnum.FAIL
      });
      throw error;
    }
  }

  async closeSelenium() {
    if (this.instance.driver) await this.instance.driver.quit();

    LogModule.SetLog({ message: "Selenium closed", level: "info" });
  }

  async inputSignInInformation(): Promise<void> {
    try {
      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.INPUT_SIGN_IN_INFORMATION,
        status: WorkflowStatusEnum.RUNNING
      });
      // this.instance.card = useCurrentAccount
      //   ? getCurrentCardDetail()
      //   : getSelectedCardDetail();
      await this.instance.inputSignInInformation();

      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.INPUT_SIGN_IN_INFORMATION,
        status: WorkflowStatusEnum.SUCCESS
      });
    } catch (error) {
      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.INPUT_SIGN_IN_INFORMATION,
        status: WorkflowStatusEnum.FAIL
      });
      throw error;
    }
  }

  async submitToSignIn() {
    try {
      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.SUBMIT_TO_SIGN_IN,
        status: WorkflowStatusEnum.RUNNING
      });
      await this.instance.submitToSignIn();

      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.SUBMIT_TO_SIGN_IN,
        status: WorkflowStatusEnum.SUCCESS
      });
      LogModule.SetLog({ message: "Bank Logged In", level: "info" });
    } catch (error) {
      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.SUBMIT_TO_SIGN_IN,
        status: WorkflowStatusEnum.FAIL
      });
      throw error;
    }
  }

  async sendUSBKey() {
    try {
      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.SEND_USB_KEY,
        status: WorkflowStatusEnum.RUNNING
      });

      await this.instance.sendUSBKey();

      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.SEND_USB_KEY,
        status: WorkflowStatusEnum.SUCCESS
      });
      LogModule.SetLog({ message: "USB key sent", level: "info" });
    } catch (error) {
      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.SEND_USB_KEY,
        status: WorkflowStatusEnum.FAIL
      });
      throw error;
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
      WorkerModule.UPDATE_FLOW_STATUS({
        name: workflowName,
        status: WorkflowStatusEnum.RUNNING
      });

      const isLoginSuccess = await this.instance.checkIfLoginSuccess(
        globalState
      );

      WorkerModule.UPDATE_FLOW_STATUS({
        name: workflowName,
        status: isLoginSuccess
          ? WorkflowStatusEnum.SUCCESS
          : WorkflowStatusEnum.FAIL
      });

      return isLoginSuccess;
    } catch (error) {
      LogModule.SetLog({ level: "error", message: error });
      return false;
    }
  }

  async getCookie() {
    try {
      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.GET_COOKIE,
        status: WorkflowStatusEnum.RUNNING
      });

      //   store.commit("SET_COOKIE", data.cookie);
      //   store.commit("SET_SESSION", data.session);
      // setCookieAndSession(await this.instance.getCookie());

      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.GET_COOKIE,
        status: WorkflowStatusEnum.SUCCESS
      });

      LogModule.SetLog({ message: "Got cookie and session", level: "info" });
    } catch (error) {
      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.GET_COOKIE,
        status: WorkflowStatusEnum.FAIL
      });
      throw error;
    }
  }

  async goTransferPage() {
    this.taskStartAt = new Date();
    WorkerModule.UPDATE_FLOW_STATUS({
      name: WorkflowEnum.GO_TRANSFER_PAGE,
      status: WorkflowStatusEnum.RUNNING
    });
    try {
      await this.instance.goTransferPage();

      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.GO_TRANSFER_PAGE,
        status: WorkflowStatusEnum.SUCCESS
      });
      LogModule.SetLog({
        message: "Redirected to transfer page",
        level: "info"
      });
    } catch (error) {
      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.GO_TRANSFER_PAGE,
        status: WorkflowStatusEnum.FAIL
      });
      throw error;
    }
  }

  async fillTransferFrom() {
    WorkerModule.UPDATE_FLOW_STATUS({
      name: WorkflowEnum.FILL_TRANSFER_INFORMATION,
      status: WorkflowStatusEnum.RUNNING
    });
    try {
      if (this.taskDetail === null) {
        throw new Error("You didn't select the task");
      }

      await this.instance.fillTransferFrom();

      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.FILL_TRANSFER_INFORMATION,
        status: WorkflowStatusEnum.SUCCESS
      });
      LogModule.SetLog({ message: "Transfer form filled", level: "info" });
    } catch (error) {
      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.FILL_TRANSFER_INFORMATION,
        status: WorkflowStatusEnum.FAIL
      });
      throw error;
    }
  }

  async fillNote() {
    WorkerModule.UPDATE_FLOW_STATUS({
      name: WorkflowEnum.FILL_NOTE,
      status: WorkflowStatusEnum.RUNNING
    });
    try {
      await this.instance.fillNote();

      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.FILL_NOTE,
        status: WorkflowStatusEnum.SUCCESS
      });
      LogModule.SetLog({ message: "Note filled", level: "info" });
    } catch (error) {
      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.FILL_NOTE,
        status: WorkflowStatusEnum.FAIL
      });
      throw error;
    }
  }
  async confirmTransaction() {
    WorkerModule.UPDATE_FLOW_STATUS({
      name: WorkflowEnum.CONFIRM_TRANSACTION,
      status: WorkflowStatusEnum.RUNNING
    });
    try {
      await this.instance.confirmTransaction();

      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.CONFIRM_TRANSACTION,
        status: WorkflowStatusEnum.SUCCESS
      });
      LogModule.SetLog({ message: "Transaction confirmed", level: "info" });
    } catch (error) {
      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.CONFIRM_TRANSACTION,
        status: WorkflowStatusEnum.FAIL
      });
      throw error;
    }
  }

  async checkIfSuccess() {
    WorkerModule.UPDATE_FLOW_STATUS({
      name: WorkflowEnum.CHECK_IF_SUCCESS,
      status: WorkflowStatusEnum.RUNNING
    });
    try {
      var isCheckSuccess = await this.instance.checkIfSuccess();
      calculateTransferTime(this.taskStartAt);
      WorkerModule.UPDATE_FLOW_STATUS({
        name: WorkflowEnum.CHECK_IF_SUCCESS,
        status: isCheckSuccess
          ? WorkflowStatusEnum.SUCCESS
          : WorkflowStatusEnum.FAIL
      });
      if (isCheckSuccess) {
        // await markTaskSuccess(this.instance.charge);
        LogModule.SetLog({
          message: "Transfer success, you can start next transaction",
          level: "info"
        });
        return true;
      } else {
        LogModule.SetLog({
          level: "warn",
          message:
            "System can't check the transfer result, please check it manually"
        });
        return false;
      }
    } catch (error) {
      LogModule.SetLog({ message: error, level: "error" });
      return false;
    }
  }

  async getBalance() {
    await this.instance.getBalance();
    LogModule.SetLog({ message: "Balance got", level: "info" });
  }
}

/**
 * Record how long was task finish
 * @param {Date} taskStartAt
 */
function calculateTransferTime(taskStartAt: Date) {
  // var now = new Date().getTime();
  // var executedTime = parseInt((now - taskStartAt) / 1000).toFixed(0);
  // LogModule.SetLog({ level: "info", message: `Task executed for ${executedTime} seconds` });
}
