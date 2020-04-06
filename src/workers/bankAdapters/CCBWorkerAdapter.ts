import dayjs, { Dayjs } from "dayjs";
import { By, until, WebDriver } from "selenium-webdriver";
import { IWorkerAdapter } from "../IWorkerAdapter";
import RemitterAccountModel from "../models/remitterAccountModel";
import TaskDetailModel from "../models/taskDetailModel";
import * as KeySender from "../utils/keySender";
import Logger from "../utils/logger";
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
  private readonly loginFrame = "fQRLGIN";

  constructor() {
    this.driver = {} as WebDriver;
    this.bankUrl = "http://www.ccb.com/cn/jump/personal_loginbank.html";
    // this.card = {};
    this.remitterAccount = new RemitterAccountModel();
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
  getRemitterAccount(): RemitterAccountModel {
    return this.remitterAccount;
  }
  setRemitterAccount(account: RemitterAccountModel): void {
    this.remitterAccount = account;
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
    let retryTimes = 0;
    let MaxRetry = 3;
    // 切換frame 到登入
    let frame = await this.driver.wait(
      until.elementLocated(By.id(this.loginFrame)),
      10 * 1000
    );
    await this.driver.switchTo().frame(frame);

    while (retryTimes < MaxRetry) {
      // 輸入登入帳號
      await this.focusLoginFrameFieldById("USERID");
      if (this.remitterAccount.loginName) {
        WindowFocusTool.focusAndCheckIE();
        await this.deleteInput();
        await KeySender.sendText(this.remitterAccount.loginName, 1 * 1000, 250);
      } else {
        throw new Error("Account name is null");
      }

      // 輸入登入密碼
      await this.focusLoginFrameFieldById("LOGPASS");
      if (this.remitterAccount.loginPassword) {
        WindowFocusTool.focusAndCheckIE();
        await this.deleteInput();
        await KeySender.sendText(
          this.remitterAccount.loginPassword,
          3 * 1000,
          250
        );
      } else {
        throw new Error("Account name is null");
      }

      // 確認輸入資訊
      const check = await this.checkSignInInformationCorrectly();
      if (check) {
        break;
      } else {
        retryTimes++;
      }
    }
    if (retryTimes === MaxRetry) {
      throw new Error(`"輸入資訊錯誤超過${MaxRetry}次`);
    }
  }

  async deleteInput() {
    for (let index = 0; index < 16; index++) {
      await KeySender.sendKey(KeySender.KeyEnum.BACKSPACE, 80);
    }
  }

  async focusLoginFrameFieldById(id: string) {
    await this.driver.wait(
      until.elementLocated(By.id(id)),
      20 * 1000
    );
    await executeJavaScript(
      this.driver,
      `focus input id (${id})`,
      `document.getElementById("${id}").focus();`
    );
  }

  async checkSignInInformationCorrectly(): Promise<boolean> {
    // 驗證帳號資訊
    const userElementId = "USERID";
    WindowFocusTool.focusAndCheckIE();

    var user = await this.driver.wait(
      until.elementLocated(By.id(userElementId)),
      20 * 1000
    );
    var userText = await user.getAttribute("value");
    if (userText !== this.remitterAccount.loginName) {
      Logger({
        level: "warn",
        message: `Login user account incorrectly. Message on bank: CCB value : (${userText})`
      });
      return false;
    }

    // 驗證密碼資訊

    const passwordElementId = "LOGPASS";
    WindowFocusTool.focusAndCheckIE();

    var password = await this.driver.wait(
      until.elementLocated(By.id(passwordElementId)),
      20 * 1000
    );
    var passwordText = await password.getAttribute("value");
    if (passwordText !== this.remitterAccount.loginPassword) {
      Logger({
        level: "warn",
        message: `Login password incorrectly. Message on bank: CCB value : (${passwordText})`
      });
      return false;
    }
    return true;
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
