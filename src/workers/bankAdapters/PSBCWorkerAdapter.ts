import dayjs, { Dayjs } from "dayjs";
import * as fs from "fs";
import { By, Locator, until, WebDriver, WebElement, WebElementPromise } from "selenium-webdriver";
import { IWorkerAdapter } from "../IWorkerAdapter";
import RemitterAccountModel from "../models/remitterAccountModel";
import TaskDetailModel from "../models/taskDetailModel";
import * as ActivexTool from "../utils/bankActivexTool";
import Logger from "../utils/logger";
import * as RegexHelper from "../utils/regexHelper";
import { executeJavaScript, getElementValue, isElementExist, sendKeysV2, waitPageLoad, waitPageLoadCondition, waitUtilGetText } from "../utils/seleniumHelper";

export class PSBCWorkerAdapter implements IWorkerAdapter {
  private driver: WebDriver;
  private bankUrl: string;
  private task: TaskDetailModel;
  private remitterAccount: RemitterAccountModel;
  private charge: string;
  private transactionTime: Dayjs;
  private bankMappingList: any;
  private bankCode: string;
  private readonly wattingTime = 10 * 1000;

  constructor() {
    this.bankCode = "PSBC";
    this.driver = {} as WebDriver;
    this.bankUrl = "https://pbank.psbc.com/perbank/html/system/login.html";
    this.remitterAccount = new RemitterAccountModel();
    this.task = {} as TaskDetailModel;
    this.charge = "";
    this.transactionTime = dayjs();
    this.bankMappingList = {
      中国邮政储蓄银行: "中国邮政",
      中国工商银行: "中国工商银行",
      中国农业银行: "中国农业银行",
      中国银行: "中国银行",
      中国建设银行: "中国建设银行",
      招商银行: "招商银行",
      中信银行: "中信银行",
      民生银行: "中国民生银行",
      兴业银行: "兴业银行",
      浦东发展银行: "上海浦东发展",
      光大银行: "中国光大银行",
      平安银行: "平安银行",
      华夏银行: "华夏银行",
      广发银行: "广发银行",
      北京银行: "北京银行",
      上海银行: "上海银行",
      江苏银行: "江苏银行",
      恒丰银行: "恒丰银行",
      浙商银行: "浙商银行",
      南京银行: "南京银行",
      广州发展银行: "广发银行",
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
    this.sleep(5);
  }
  async inputSignInInformation(): Promise<void> {
    try {
      // await sendKeysV2(this.driver, this.driver.wait(until.elementLocated(By.id("logonId")), this.wattingTime), {
      //   text: this.getRemitterAccount().loginName
      // });
      await this.driver.wait(until.elementLocated(By.id("logonId")), 15000).click();
      await executeJavaScript(
        this.driver,
        "choose  login by username",
        `document.getElementById('logonId').value ='${this.getRemitterAccount().loginName}'`,
        500
      );
      if (!(await this.inputLoginPassword())) {
        throw new Error("input password fail!");
      }
      await (await this.driver.wait(until.elementLocated(By.id("checkCode")), 3000)).click();
      this.logDebug("wait for user input...");
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  async inputLoginPassword(): Promise<boolean> {
    this.logDebug("start input login password - " + this.remitterAccount.loginPassword);
    var result = await ActivexTool.execute(
      this.bankCode,
      "INPUT_LOGIN_PASSWORD",
      this.remitterAccount.loginPassword
    );
    this.logDebug("input login password finished - " + result);
    return result === 1;
  }

  async checkSignInInformationCorrectly(): Promise<boolean> {
    return true;
  }
  async submitToSignIn(): Promise<void> { }
  async sendUSBKey(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async checkIfLoginSuccess(globalState: { isManualLogin: boolean }): Promise<boolean> {
    this.logInfo("check login status");
    let wait = this.wattingTime;
    if (globalState.isManualLogin) {
      wait = 30;
    } else {
      try {
        await waitPageLoadCondition("home page", this.driver, until.elementLocated(By.linkText("首页")));
        this.logInfo("login success");
        return true;
      } catch (error) {
        return false;
      }
    }
    const container = await this.driver.wait(until.elementLocated(By.linkText("首页")), wait);
    return !!container;
  }
  async getCookie(): Promise<void> {
    const cookie: string = await this.driver.executeScript("return document.cookie");

    if (!cookie || cookie.length === 0) throw new Error("get cookie failure!");
    this.logDebug("cookie got - " + cookie);
  }
  async goTransferPage(): Promise<void> {
    await executeJavaScript(this.driver, "change page", "document.getElementById('firsrMenu').getElementsByTagName('li')[2].click()", 500);
    await this.driver.wait(until.elementLocated(By.id("recAccountName")), 20 * 1000);
    await waitPageLoad(this.driver);
    this.logDebug("click go to transfer button");
  }

  async goTransationDetailPage(): Promise<void> {
    await executeJavaScript(this.driver, "change page", "document.getElementById('firsrMenu').getElementsByTagName('li')[1].click()", 500);
    // wait loading page
    await waitPageLoad(this.driver);
    const leftMenuArea = await this.locateElement("leftMenuArea", By.id("leftMenuArea"));
    const list = await leftMenuArea.findElements(By.tagName("a"));
    let detailBtn;
    for (const a of list) {
      const text = await a.getText();
      this.logDebug(`href found (${text})`);
      if (text === "明细查询") {
        detailBtn = a;
        break;
      }
    }
    if (!detailBtn) throw new Error("not fount transaction detail page button");
    await detailBtn.click();
    this.logInfo("in transaction detail page");
    await waitPageLoad(this.driver);
  }

  async checkIfInTransferPage(): Promise<boolean> {
    await this.driver.wait(until.elementLocated(By.id("recAccountName")), 20 * 1000);
    return true;
  }

  async fillTransferForm(): Promise<void> {
    const task = this.getTask();
    // 驗證task 資訊
    if (!task) throw new Error("task is not defined");
    if (!task.id) throw new Error("task id is not defined");
    if (!task.amount || task.amount < 0) throw new Error("task amount error");
    if (!task.payeeAccount) throw new Error("task payee account is null");
    if (!task.payeeAccount.holderName) throw new Error("task payee holderName is null");
    if (!task.payeeAccount.cardNumber) throw new Error("task payee cardNumber is null");
    if (!task.payeeAccount.bank) throw new Error("task bank data invalidate");
    if (!task.payeeAccount.bank.chineseName) throw new Error("task payee bank chineseName invalidate");

    this.logInfo("start to fill transfer form");
    try {
      const curBalance = await this.getBalanceInTransferPage();
      if (task.amount > curBalance) throw new Error(`Insufficient balance cur (${curBalance}) task amount (${task.amount})`);

      await sendKeysV2(this.driver, this.driver.wait(until.elementLocated(By.id("recAccountName")), 20 * 1000), {
        text: this.task.payeeAccount.holderName
      });
      this.logDebug("after fill holder name");
      await sendKeysV2(this.driver, this.driver.wait(until.elementLocated(By.id("recAccountshow")), 5 * 1000), {
        text: this.task.payeeAccount.cardNumber,
        replaceRule: RegexHelper.removeSpace
      });
      this.logDebug("after fill account number");
      await sendKeysV2(this.driver, this.driver.wait(until.elementLocated(By.id("transferSum")), 5 * 1000), {
        text: this.task.amount.toFixed(2),
        replaceRule: /,/g
      });
      this.logDebug("after fill transfer amount");

      await sendKeysV2(this.driver, this.driver.wait(until.elementLocated(By.id("payUseShow")), 5 * 1000), {
        text: this.task.id.toString()
      });
      this.logDebug("after fill note");

      // Search bank
      var bankField = this.driver.wait(until.elementLocated(By.id("recAccountOpenBank")), 5000);
      var bank = await getElementValue(bankField);
      // If not able auto select bank, manual select it
      if (!bank || bank.indexOf(this.task.payeeAccount.bank.chineseName as string) === -1) {
        bank = await this.getBankFromBankSelection(bankField);
      }

      this.logInfo("after bank selected - " + bank);

      // submit
      await executeJavaScript(this.driver, "submit transfer ", "document.getElementById('nextBut').click()", 1000);

      await this.checkErrorBox();

      this.logInfo("in check transfer page");
      this.logInfo("please insert mobile code and password");
      await this.driver.wait(until.elementLocated(By.id("mobileVerifyCode")), 30 * 1000);
    } catch (error) {
      this.logError("fill transfer form fail - " + error);
      throw error;
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  async getBankFromBankSelection(bankField: WebElementPromise): Promise<string> {
    this.logInfo("select bank from list");
    if (!this.task.payeeAccount.bank.chineseName) {
      throw new Error("can not get bank list from recAccountOpenBank and payeeAccount chinese bank name is undefined");
    }
    let bankChineseName = this.task.payeeAccount.bank.chineseName!;
    let bankName = this.bankMappingList[bankChineseName] || bankChineseName;
    this.logDebug("try to select bank");

    // 进行点击
    await executeJavaScript(this.driver, "trigger search", "document.getElementById('recAccountOpenBank').click()", 0);

    await sendKeysV2(this.driver, this.driver.wait(until.elementLocated(By.id("queryBank")), 10 * 1000), {
      text: bankName
    });
    // 查询
    await executeJavaScript(this.driver, "click search", "document.getElementById('query').click()", 0);
    await this.driver.wait(until.elementLocated(By.id("reList")), 5 * 1000);
    // 点击元素
    await executeJavaScript(
      this.driver,
      "choose bank ",
      "document.getElementById('reList').getElementsByTagName('li')[0].getElementsByTagName('a')[0].click()",
      0
    );

    let bank = await getElementValue(bankField);
    if (!bank) throw new Error("Select bank fail");
    this.logDebug("select bank success");
    return bank;
  }

  async checkTransferInformationCorrectly(): Promise<boolean> {
    this.logInfo("check transaction page start");
    var amount = await waitUtilGetText(this.driver, until.elementLocated(By.css("i#transferSum")));
    amount = amount.replace(/,/g, "");
    this.logInfo(`amount cur: (${amount}) ,task: (${this.task.amount})`);
    if (Number.parseFloat(amount.trim()) !== this.task.amount) {
      throw new Error(`Amount is not right! cur (${amount}) ,task (${this.task.amount})`);
    }

    var name = await this.driver.findElement(By.css("div.e-sure>div:nth-child(3)>div.card-main>p.e-fz-16.mt-25.ml-10")).getText();
    this.logInfo(`name cur: (${name}) ,task: (${this.task.payeeAccount.holderName})`);
    if (name.trim() !== this.task.payeeAccount.holderName.trim()) {
      throw new Error("Receiver name is not right!");
    }

    var card = await this.driver.findElement(By.css("div.e-sure>div:nth-child(3)>div.card-main>div.card-query>ul>li>i")).getText();
    this.logInfo(`card cur: (${card}) ,task: (${this.task.payeeAccount.cardNumber})`);
    if (card !== this.task.payeeAccount.cardNumber) {
      throw new Error("Card number is not right!");
    }
    this.logInfo("transfer data is correct...");
    return true;
  }
  async submitTransaction(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async fillNote(): Promise<void> { }
  async checkIfNoteFilled(): Promise<boolean> {
    return true;
  }
  /**
   * 等待輸入完驗證碼及手機驗證碼, 進入轉帳結果頁面
   */
  async checkBankReceivedTransferInformation(): Promise<boolean> {
    await this.waitUntilTransactionSuccess();
    // take screen shot save result page
    const base64Png = await this.driver.takeScreenshot();
    if (base64Png) {
      this.logWarn("can not take Screenshot");
      const fileName = `PSBC-result-${this.getTask().id}.png`;
      const screenshotPath = `./logs/${fileName}`;
      this.logInfo(`check result page in file name ${fileName}`);
      fs.writeFileSync(screenshotPath, base64Png.replace(/^data:image\/png;base64,/, ""), { encoding: "base64" });
    }
    this.logInfo("check recrive success");
    return true;
  }

  async waitUntilTransactionSuccess(): Promise<string> {
    const maxRetry = 15;
    let retryCount = 0;
    while (retryCount < maxRetry) {
      // #stepDivaccountTransferview_result
      await waitPageLoadCondition(
        "success page result",
        this.driver,
        until.elementLocated(By.id("stepDivaccountTransferview_result")),
        36,
        5
      );
      const resultDiv = await this.locateElement("result div", By.id("stepDivaccountTransferview_result"));
      const resultTitleElement = await resultDiv.findElement(By.id("name"));
      let resultText = await resultTitleElement.getText();
      // this.logDebug(`result text: (${resultText})`);
      resultText = resultText.trim();
      if (resultText && resultText.length > 0 && resultText.indexOf(this.task.payeeAccount.holderName) > -1) {
        this.logInfo(`transaction success (${resultText})`);
        return resultText;
      }
      this.logInfo(`transaction success text not found text: (${resultText})`);
      retryCount++;
      await this.sleep(2);
    }
    throw new Error("result not found error");
  }

  async sendPasswordToPerformTransaction(): Promise<void> { }
  async sendUsbPasswordToPerformTransaction(): Promise<void> { }
  async checkIfTransactionSuccess(): Promise<boolean> {
    // check transaction list
    await this.goTransationDetailPage();
    await waitPageLoadCondition("query button", this.driver, until.elementLocated(By.id("queryButton")));
    const searchBtn = await this.locateElement("query button", By.id("queryButton"));
    await searchBtn.click();
    await this.sleep(3);
    const aList = await this.driver.wait(
      until.elementsLocated(By.css("table#transList > tbody#bg-tr > tr > td > span > a.table-btn")),
      this.wattingTime
    );
    if (!aList || aList.length === 0) throw new Error("not found any record");
    for (const a of aList) {
      const contentStr = await a.getAttribute("content");
      const obj = JSON.parse(contentStr);
      const remark = obj["rem"];
      this.logDebug(`found remark: (${remark})`);
      if (remark && +remark === +this.task.id) {
        this.logInfo("found transaction record");
        this.logInfo(`record data: ${contentStr}`);
        return true;
      }
    }
    throw new Error("not found current transaction record in transaction list");
  }
  async getBalance(): Promise<number> {
    try {
      await this.goTransferPage();
      // balance is load by http request, so it need to wait until the value is loaded
      let balance = await (
        await this.driver.wait(until.elementTextContains(this.driver.findElement(By.id("balance")), "."), 2 * 1000)
      ).getText();
      this.logDebug("get balance - " + balance);
      balance = balance.replace(/,/g, "");
      return Number.parseFloat(balance);
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  async getBalanceInTransferPage() {
    let balance = await (
      await this.driver.wait(until.elementTextContains(this.driver.findElement(By.id("balance")), "."), 2 * 1000)
    ).getText();
    this.logDebug("get balance - " + balance);
    balance = balance.replace(/,/g, "");
    return Number.parseFloat(balance);
  }

  logDebug(message: string): void {
    Logger({ level: "debug", message });
  }

  logInfo(message: string): void {
    Logger({ level: "info", message });
  }

  logWarn(message: string): void {
    Logger({ level: "warn", message });
  }

  logError(message: string): void {
    Logger({ level: "error", message });
  }

  async sleep(s: number = 7) {
    await new Promise(resolve => setTimeout(resolve, s * 1000));
  }

  async locateElement(name: string, locator: Locator): Promise<WebElement> {
    try {
      this.logDebug(`locating (${name})`);
      const element = await this.driver.wait(until.elementLocated(locator), this.wattingTime);
      this.logDebug(`located (${name}) success`);
      return element;
    } catch (e) {
      this.logError(`locate (${name}) error, (${e})`);
      throw e;
    }
  }

  async checkErrorBox() {
    // 確認是否有錯誤視窗跳出 #alertFram1
    const isError = await isElementExist(this.driver, By.className("wrong_box"));
    if (isError) {
      const dialogDivs = await this.driver.wait(until.elementsLocated(By.className("ma_c")));
      let tempText = "";
      for (const div of dialogDivs) {
        const text = await div.getText();
        tempText = tempText.concat(text.trim());
        this.logError(`error text (${text})`);
      }
      throw new Error(tempText);
    }
  }
}
