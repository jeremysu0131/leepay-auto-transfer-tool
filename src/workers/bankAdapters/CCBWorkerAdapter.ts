import dayjs, { Dayjs } from "dayjs";
import { By, until, WebDriver } from "selenium-webdriver";
import { IWorkerAdapter } from "../IWorkerAdapter";
import RemitterAccountModel from "../models/remitterAccountModel";
import TaskDetailModel from "../models/taskDetailModel";
import * as FormatHelper from "../utils/formatHelper";
import Logger from "../utils/logger";
import { executeJavaScript, sendKeysV2, waitPageLoad, waitPageLoadCondition, waitUtilGetText } from "../utils/seleniumHelper";
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
  private readonly wattingTime = 10 * 1000;

  constructor() {
    this.driver = {} as WebDriver;
    this.bankUrl = "http://www.ccb.com/cn/jump/personal_loginbank.html";
    // this.card = {};
    this.remitterAccount = new RemitterAccountModel();
    this.task = {} as TaskDetailModel;
    this.charge = "";
    this.transactionTime = dayjs();
    this.bankMappingList = {
      中国建设银行: "getBankInfo('ccb','中国建设银行')",
      中国工商银行: "getBankInfo('102100099996','中国工商银行') ",
      中国农业银行: "getBankInfo('103100000026','中国农业银行')",
      中国银行: "getBankInfo('104000000000','中国银行')",
      交通银行: "getBankInfo('301290000007','交通银行')",
      招商银行: "getBankInfo('308584000013','招商银行')",
      民生银行: "getBankInfo('305100000013','中国民生银行')",
      中国邮政储蓄银行: "getBankInfo('403100000004','邮政储蓄银行')",
      中信银行: "getBankInfo('302100011000','中信银行')",
      光大银行: "getBankInfo('303100000006','光大银行')",
      兴业银行: "getBankInfo('309391000011','兴业银行')",
      华夏银行: "getBankInfo('304100040000','华夏银行')",
      广发银行: "getBankInfo('306581000003','广发银行')",
      平安银行: "getBankInfo('307584007998','平安银行')",
      上海银行: "getBankInfo('325290000012','上海银行')",
      江苏银行: "getBankInfo('313301099999','江苏银行)",
      渤海银行: "getBankInfo('318110000014','渤海银行')",
      广西北部湾银行:
        "getBankInfo('313611001018','广西北部湾银行股份有限公司')",
      浦东发展银行: "getBankInfo('310290000013','上海浦东发展银行')",
      西安银行: "getBankInfo('313791000015','西安银行')"
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
    // 確認頁面載入
    await waitPageLoad(this.driver);
    // 切換frame 到登入
    this.logInfo("switch to login iframe");
    let frame = await this.driver.wait(
      until.elementLocated(By.id(this.loginFrame)),
      10 * 1000
    );
    await this.driver.switchTo().frame(frame);
    // validate login info data
    if (!this.remitterAccount.loginName) {
      throw new Error("Account name is null");
    }
    if (!this.remitterAccount.loginPassword) {
      throw new Error("Password name is null");
    }

    while (retryTimes < MaxRetry) {
      this.logInfo(`start to fill login info retry times (${retryTimes})`);
      // 輸入登入帳號
      WindowFocusTool.focusAndCheckIE();
      await sendKeysV2(
        this.driver,
        this.driver.wait(until.elementLocated(By.id("USERID")), 20 * 1000),
        { text: this.remitterAccount.loginName }
      );

      // 輸入登入密碼
      WindowFocusTool.focusAndCheckIE();
      await sendKeysV2(
        this.driver,
        this.driver.wait(until.elementLocated(By.id("LOGPASS")), 20 * 1000),
        { text: this.remitterAccount.loginPassword }
      );

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
    this.logInfo("fill login info success");
  }

  public async checkSignInInformationCorrectly(): Promise<boolean> {
    // 確認頁面載入
    await waitPageLoad(this.driver);
    this.logInfo("start check input value");
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

  public async submitToSignIn(): Promise<void> {
    this.logInfo("login submit");
    try {
      const webElement = await this.driver.wait(
        until.elementLocated(By.id("loginButton"))
      );
      await webElement.click();
      // 確認頁面載入
      await waitPageLoad(this.driver);
    } catch (e) {
      throw new Error("can not find submit button");
    }
    await waitPageLoadCondition(
      this.driver,
      until.elementLocated(By.id("idxmaincontainer"))
    );
  }

  sendUSBKey(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async checkIfLoginSuccess(globalState: {
    isManualLogin: boolean;
  }): Promise<boolean> {
    // 確認頁面載入
    // await waitPageLoad(this.driver);
    this.logInfo("check login status");
    const container = await this.driver.wait(
      until.elementLocated(By.id("idxmaincontainer")),
      this.wattingTime
    );
    return !!container;
  }

  async getCookie(): Promise<void> {
    // FIXME 定義回傳介面
    const cookie = (await this.driver.executeScript(
      "return document.cookie"
    )) as any;
    if (!cookie || cookie.length === 0) throw new Error("get cookie failure!");
    // return { cookie, session: null };
  }

  async goTransferPage(): Promise<void> {
    // 確認頁面載入
    await waitPageLoad(this.driver);
    // button id 'MENUV6030104' , go transfer page
    this.logInfo("start to go transfer page");
    WindowFocusTool.focusAndCheckIE();
    const pageButton = this.driver.wait(
      until.elementLocated(By.id("MENUV6030104"))
    );

    if (!pageButton) throw new Error("page button not found");
    await executeJavaScript(
      this.driver,
      "go transfer page",
      'document.getElementById("MENUV6030104").click()'
    );
    // 等待 txmainfrm frame 被載入
    await waitPageLoadCondition(
      this.driver,
      until.elementLocated(By.id("txmainfrm"))
    );
  }

  async checkIfInTransferPage(): Promise<boolean> {
    // switch to frame txmainfrm
    this.logInfo("check if receiver name input exist");
    let frame = await this.driver.wait(
      until.elementLocated(By.id("txmainfrm")),
      10 * 1000
    );
    if (!frame) throw new Error("can not found transfer frame (txmainfrm)");
    await this.driver.switchTo().frame(frame);

    const receiverNameInput = await this.driver.wait(
      until.elementLocated(By.id("TR_SKZHMC")), this.wattingTime
    );
    if (!receiverNameInput) throw new Error("transfer page check element (TR_SKZHMC) not found");
    await this.driver.switchTo().defaultContent();
    return !!receiverNameInput;
  }

  async setInputByParentTrID(
    name: string,
    id: string,
    text: string
  ): Promise<string> {
    const trElement = await this.driver.wait(
      until.elementLocated(By.id(id)),
      this.wattingTime
    );
    if (!trElement) throw new Error(`not found ${name} input column in view`);
    // const input = this.driver.findElement(By.tagName("input"));
    await sendKeysV2(this.driver, trElement.findElement(By.tagName("input")), {
      text, replaceRule: new RegExp(/\s/g)
    });
    const value = await trElement.findElement(By.tagName("input"));
    const valueText = await value.getAttribute("value");
    return valueText;
  }

  async fillTransferForm(): Promise<void> {
    await waitPageLoad(this.driver);

    // switch to frame txmainfrm
    this.logInfo("check if receiver name input exist");
    let frame = await this.driver.wait(
      until.elementLocated(By.id("txmainfrm")),
      10 * 1000
    );
    if (!frame) throw new Error("can not found transfer frame (txmainfrm)");
    await this.driver.switchTo().frame(frame);
    const task = this.getTask();
    // 驗證task 資訊
    if (!task) throw new Error("task is null");
    if (!task.amount || task.amount < 0) throw new Error("task amount error");
    if (!task.payeeAccount) throw new Error("task payee account is null");
    if (!task.payeeAccount.holderName) {
      throw new Error("task payee holderName is null");
    }
    if (!task.payeeAccount.cardNumber) {
      throw new Error("task payee cardNumber is null");
    }

    // TR_SKZHMC 姓名 tr id
    await this.setInputByParentTrID(
      "User name",
      "TR_SKZHMC",
      task.payeeAccount.holderName
    );
    // TR_SKZH 帳號 tr id
    await this.setInputByParentTrID(
      "User card number",
      "TR_SKZH",
      task.payeeAccount.cardNumber
    );
    
    // RECVBRANCH1 bank value 選擇轉出銀行
    await this.waitUntilBankSelected();

    // txtTranAmt 目標金額 input id
    await sendKeysV2(
      this.driver,
      this.driver.wait(
        until.elementLocated(By.id("txtTranAmt")),
        this.wattingTime
      ),
      { text: task.amount.toString() }
    );
    
    // subBut 下一步
    const nextButton = this.driver.wait(until.elementLocated(By.id("subBut")));
    if (!nextButton) throw new Error("transfer next step Button is not found");
    await executeJavaScript(
      this.driver,
      "click submit button",
      "document.getElementById('subBut').click()"
    );
    await this.driver.switchTo().defaultContent();
    // 等待載入, 確認進到下一個頁面
    const trxFrameCondition = until.elementLocated(By.id("txmainfrm"));
    await waitPageLoadCondition(this.driver, trxFrameCondition);
    const trxFrame = await this.driver.wait(await trxFrameCondition, this.wattingTime);
    await this.driver.switchTo().frame(trxFrame);
    await waitPageLoad(this.driver);
    const checkTransactionPage = await this.driver.wait(
      until.elementLocated(By.className("pbd_table_step_title_no_line")),
      5 * 1000
    );
    // check U 盾 id SafeTypeU switchAuthType(this.id);checkU();
    if (!checkTransactionPage) {
      throw new Error("not exist transaction check page");
    }
    await this.driver.switchTo().defaultContent();
  }

  async waitUntilBankSelected() {
    let retryTimes = 0;
    const MaxRetry = 3;

    // 檢查銀行名稱是否存在
    if (
      !this.getTask() ||
      !this.getTask().payeeAccount ||
      !this.getTask().payeeAccount.bank ||
      !this.getTask().payeeAccount.bank.chineseName
    ) {
      throw new Error(
        "task bank name is not defind : " + JSON.stringify(this.getTask())
      );
    }
    const backName = this.task.payeeAccount.bank.chineseName as string;
    while (retryTimes < MaxRetry) {
      try {
        var selectedBank = await waitUtilGetText(
          this.driver,
          until.elementLocated(By.id("cbankname"))
        );
        if (selectedBank.indexOf("请选择银行") < 0) {
          this.logInfo("wait until bank selected success");
          break;
        }
        await executeJavaScript(
          this.driver,
          "select bank",
          this.bankMappingList[backName],
          100
        );
      } catch (error) {
        if (error.name === "JavascriptError" || error.name === "TimeoutError") {
          this.logWarn(
            `wait until bank selected fail, ${retryTimes} times, Error: ${error}`
          );
          continue;
        }
        throw error;
      } finally {
        retryTimes++;
      }
    }

    if (retryTimes === 3) {
      throw new Error("wait until bank selected fail");
    }
  }
  // 已經在輸入的時候就完成檢測了
  async checkTransferInformationCorrectly(): Promise<boolean> {
    return true;
  }
  submitTransaction(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async fillNote(): Promise<void> {
    // not necessary
    this.logInfo("skip fill note");
  }
  async checkIfNoteFilled(): Promise<void> {
    this.logInfo("skip fill note");
  }
  async checkBankReceivedTransferInformation(): Promise<boolean> {
    const task = this.getTask();
    // 切換到目標 iframe 
    const transactionFrame = await until.elementLocated(By.id("txmainfrm")); 
    const trxFrame = await this.driver.wait(transactionFrame, this.wattingTime);
    await this.driver.switchTo().frame(trxFrame);
    // 取得所有帳號欄位 card_menoy1 在做塞選
    const accountElement = await this.driver.wait(until.elementsLocated(By.className("card_menoy1")), this.wattingTime);
    const accounts = await Promise.all(accountElement.map(async x => x.getText()));
    const distAccount = accounts.find(x => x.replace(/\s/g, "") === task.payeeAccount.cardNumber);
    if (!distAccount) throw new Error("not equals dist account");
    // 取得所有轉帳金額欄位
    const amountElement = await this.driver.wait(until.elementsLocated(By.className("font_money")), this.wattingTime);
    const amounts = await Promise.all(amountElement.map(async x => x.getText()));
    const amount = amounts.find(x => +FormatHelper.amount(x) === task.amount);
    if (!amount) throw new Error("not equals dist amount");
    return true;
  }
  /**
   *  CCB 不需要再次輸入密碼 
   * */
  async sendPasswordToPerformTransaction(): Promise<void> {
  }
  
  async sendUsbPasswordToPerformTransaction(): Promise<void> {
    
  }
  checkIfTransactionSuccess(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  async getBalance(): Promise<number> {
    // 跳賺到我的帳戶頁面
    this.logInfo("start to go balance page");
    WindowFocusTool.focusAndCheckIE();
    await executeJavaScript(
      this.driver,
      "go balance page",
      'document.getElementById("MENUV6020101").click()'
    );
    await waitPageLoadCondition(
      this.driver,
      until.elementLocated(By.id("txmainfrm"))
    );
    this.logInfo("start to go balance iframe first");
    // 切換到餘額結果的 iframe
    let frame = await this.driver.wait(
      until.elementLocated(By.id("txmainfrm")),
      10 * 1000
    );
    if (!frame) throw new Error("can not found balance id (txmainfrm) element");
    await this.driver.switchTo().frame(frame);

    this.logInfo("start to go balance iframe second");
    frame = await this.driver.wait(
      until.elementLocated(By.id("result")),
      10 * 1000
    );
    if (!frame) throw new Error("can not found balance (result) element");

    this.logInfo("start to go balance iframe third");
    await this.driver.switchTo().frame(frame);
    frame = await this.driver.wait(
      until.elementLocated(By.id("result")),
      10 * 1000
    );
    if (!frame) throw new Error("can not found balance (result) element - 1");
    await this.driver.switchTo().frame(frame);
    this.logInfo("try to go balance element");
    await this.sleep(1);
    const balanceText = await waitUtilGetText(
      this.driver,
      until.elementLocated(By.className("font_money table_th_money"))
    );
    const balance = +FormatHelper.amount(balanceText);
    this.logInfo(`balance value (${balance})`);
    await this.driver.switchTo().defaultContent();
    return balance;
  }

  async sleep(s: number = 7) {
    await new Promise(resolve => setTimeout(resolve, s * 1000));
  }

  logInfo(message: string): void {
    Logger({ level: "info", message: message });
  }

  logWarn(message: string): void {
    Logger({ level: "warn", message: message });
  }
}
