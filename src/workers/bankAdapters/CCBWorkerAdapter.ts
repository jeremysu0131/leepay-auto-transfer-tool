import dayjs, { Dayjs } from "dayjs";
import { WebDriver } from "selenium-webdriver";
import { IWorkerAdapter } from "../IWorkerAdapter";
import RemitterAccountModel from "../models/remitterAccountModel";
import TaskDetailModel from "../models/taskDetailModel";
import * as KeySender from "../utils/keySender";
import { executeJavaScript } from "../utils/seleniumHelper";
import * as WindowFocusTool from "../utils/windowFocusTool";

export class CCBWorkerAdapter implements IWorkerAdapter {
  private driver: WebDriver;
  private bankUrl: string;
  // private card: any;
  private task: TaskDetailModel;
  private remitterAccount: RemitterAccountModel;
  private charge: string;
  private transactionTime: Dayjs;
  private bankMappingList: any;

  constructor(remitterAccount : RemitterAccountModel) {
    this.driver = {} as WebDriver;
    this.bankUrl = "http://www.ccb.com/cn/jump/personal_loginbank.html";
    // this.card = {};
    this.remitterAccount = remitterAccount;
    this.task = {} as TaskDetailModel;
    this.charge = "";
    this.transactionTime = dayjs();
    this.bankMappingList = {
      中国工商银行: "中国工商银行",
      中国农业银行: "中国农业银行",
      中国银行: "中国银行",
      中国建设银行: "中国建设银行",
      中国邮政储蓄银行: "中国邮政储蓄银行",
      招商银行: "招商银行",
      中信银行: "中信银行",
      民生银行: "中国民生银行",
      兴业银行: "兴业银行",
      浦东发展银行: "浦东发展银行",
      光大银行: "中国光大银行",
      平安银行: "平安银行",
      华夏银行: "华夏银行",
      广发银行: "广发银行",
      北京银行: "北京银行",
      上海银行: "上海银行",
      江苏银行股份有限公司: "江苏银行股份有限公司",
      恒丰银行: "恒丰银行",
      浙商银行: "浙商银行",
      南京银行: "南京银行",
      广州发展银行: "广州发展银行",
      浦发银行: "浦东发展银行"
    };
  }

  getDriver(): WebDriver {
    return this.driver;
  }
  setDriver(driver: WebDriver): void {
    this.driver = driver;
  }
  getTask(): TaskDetailModel {
    return this.task;
  }
  setTask(task: TaskDetailModel): void {
    this.task = task;
  }
  async launchSelenium(): Promise<void> {
    await this.driver.get(this.bankUrl);
  }
  async inputSignInInformation(): Promise<void> {
    // 輸入登入帳號
    await this.focusLoginFrameFieldById("USERID");
    if (this.remitterAccount.loginName) {
      WindowFocusTool.focusAndCheckIE();
      await KeySender.sendText(this.remitterAccount.loginName, 3 * 1000, 250);
    } else {
      throw new Error("Account name is null");
    }
    
    // 輸入登入密碼
    // await this.focusLoginFrameFieldById("LOGPASS");
    // if (this.remitterAccount.loginName) {
    //   WindowFocusTool.focusAndCheckIE();
    //   await KeySender.sendText(this.remitterAccount.loginName, 3 * 1000, 250);
    // } else {
    //   throw new Error("Account name is null");
    // }
  }

  async focusLoginFrameFieldById(id: string) {
    console.log("id=" + id);
    // const result = await this.driver.wait(
    //   until.elementLocated(By.id(id)),
    //   20 * 1000
    // );
    // console.log(result);
    await executeJavaScript(
      this.driver,
      `focus input id (${id})`,
      "window.frames[0].document.getElementById(\"USERID\");"
    );
  }

  checkSignInInformationCorrectly(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  submitToSignIn(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  sendUSBKey(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  checkIfLoginSuccess(globalState: {
    isManualLogin: boolean;
  }): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  getCookie(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  goTransferPage(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  checkIfInTransferPage(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  fillTransferForm(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  checkTransferInformationCorrectly(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  submitTransaction(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  fillNote(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  checkIfNoteFilled(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  checkBankReceivedTransferInformation(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  sendPasswordToPerformTransaction(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  sendUsbPasswordToPerformTransaction(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  checkIfTransactionSuccess(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  getBalance(): Promise<number> {
    throw new Error("Method not implemented.");
  }
}
