import { Builder, By, until, WebDriver } from "selenium-webdriver";
import cheerio from "cheerio";
import * as KeySender from "../utils/keySender";
import * as UsbTrigger from "../utils/usbTrigger";
import * as RegexHelper from "../utils/regexHelper";
import * as FormatHelper from "../utils/formatHelper";
import {
  executeJavaScript,
  waitPageLoad,
  getElementValue,
  waitUtilGetText,
  sendKeysV2
} from "../utils/seleniumHelper";
import * as WindowFocusTool from "../utils/windowFocusTool";
import { IWorkerAdapter } from "../IWorkerAdapter";
import dayjs, { Dayjs } from "dayjs";
import Logger from "../utils/logger";
import TaskDetailModel from "../models/taskDetailModel";
import RemitterAccountModel from "../models/remitterAccountModel";

/**
 * ABC 銀行 Woker Adapter
 */
export class ABCWorkerAdapter implements IWorkerAdapter {
  private driver: WebDriver;
  private bankUrl: string;
  // private card: any;
  private task: TaskDetailModel;
  private remitterAccount: RemitterAccountModel;
  private charge: string;
  private transactionTime: Dayjs;
  private bankMappingList: any;

  constructor() {
    this.driver = {} as WebDriver;
    this.bankUrl = "https://perbank.abchina.com/EbankSite/startup.do";
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
  setRemitterAccount(remitterAccount: RemitterAccountModel): void {
    this.remitterAccount = remitterAccount;
  }
  getTask(): TaskDetailModel {
    return this.task;
  }
  setTask(task: TaskDetailModel): void {
    this.task = task;
  }
  async checkSignInInformationCorrectly(): Promise<boolean> {
    // throw new Error("Method not implemented.");
    return true;
  }
  async checkIfInTransferPage(): Promise<boolean> {
    // throw new Error("Method not implemented.");
    return true;
  }
  async fillTransferForm(): Promise<void> {
    try {
      await this.driver
        .switchTo()
        .frame(
          this.driver.wait(
            until.elementLocated(By.id("contentFrame")),
            60 * 1000
          )
        );

      // account
      await sendKeysV2(
        this.driver,
        this.driver.wait(until.elementLocated(By.id("toAcctNo")), 5 * 1000),
        {
          text: this.task.payeeAccount.cardNumber
        }
      );

      // name
      await sendKeysV2(
        this.driver,
        this.driver.wait(
          until.elementLocated(By.id("toAcctNameKey")),
          5 * 1000
        ),
        {
          text: this.task.payeeAccount.holderName
        }
      );

      // amount
      await sendKeysV2(
        this.driver,
        this.driver.wait(until.elementLocated(By.id("transAmt")), 5 * 1000),
        {
          text: FormatHelper.amount(this.task.amount),
          replaceRule: /,/g
        }
      );

      await this.waitUntilBankSelected();
      // submit
      await executeJavaScript(
        this.driver,
        "click submit button",
        "document.getElementById('transferNext').click()",
        0
      );
      await this.driver.wait(
        until.elementLocated(By.id("agreeBtn")),
        30 * 1000
      );
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }
  async checkTransferInformationCorrectly(): Promise<boolean> {
    // throw new Error("Method not implemented.");
    return true;
  }
  async submitTransaction(): Promise<void> {
    // throw new Error("Method not implemented.");
    // return true;
  }
  async checkIfNoteFilled(): Promise<void> {
    // throw new Error("Method not implemented.");
    // return true;
  }
  async checkBankReceivedTransferInformation(): Promise<boolean> {
    try {
      await this.driver
        .switchTo()
        .frame(
          this.driver.wait(
            until.elementLocated(By.id("contentFrame")),
            60 * 1000
          )
        );

      await this.driver.wait(until.elementLocated(By.id("agreeBtn")));
      return await this.checkSubmittedValue();
      // TODO: Get transfer fee here
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }
  async sendPasswordToPerformTransaction(): Promise<void> {
    try {
      await this.driver
        .switchTo()
        .frame(
          this.driver.wait(
            until.elementLocated(By.id("contentFrame")),
            60 * 1000
          )
        );

      await this.driver.wait(until.elementLocated(By.id("agreeBtn")));
      await this.sendQueryPassword();
      // TODO: Get transfer fee here
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }
  async sendUsbPasswordToPerformTransaction(): Promise<void> {
    await this.sendUSBPasswordForTransfer();
    await this.waitUSBPress();
  }
  async checkIfTransactionSuccess(): Promise<boolean> {
    // Check customer advice first
    // If check fail then check transaction detail
    try {
      // Wait page load and also improve success rate of check customer advice
      await this.driver.sleep(3 * 1000);
      await waitPageLoad(this.driver);

      await this.getTransactionTime();

      // 跳转到打印回单页面
      if (await this.goCustomerAdvice()) {
        // 检查打印回单页面，如果交易状态为成功则直接标识任务为成功
        if (await this.checkCustomerAdvice()) return true;
      }

      // 若检查回单页面失败，则检查交易记录
      // 如果没有获取交易时间，则无法确认交易
      // 跳转到转账记录
      await this.goTransferRecordPage();
      await this.queryTransferRecord();
      // 检查转账记录
      if (await this.checkTransferRecord()) return true;
      return false;
    } catch (error) {
      Logger({ level: "error", message: error });
      return false;
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  public getDriver(): WebDriver {
    return this.driver;
  }
  public setDriver(driver: WebDriver): void {
    this.driver = driver;
  }

  async launchSelenium() {
    await this.driver.get(this.bankUrl);
  }

  async inputSignInInformation() {
    var retryTimes = 3;
    await this.focusPasswordField();
    while (retryTimes >= 0) {
      try {
        await this.inputPassword();
        if (await this.checkIfInputPasswordCorrectly()) break;
        await this.deletePassword();

        if (retryTimes === 0) {
          throw new Error("Send login password fail, please retry to login");
        }
      } finally {
        retryTimes--;
      }
    }
  }
  async focusPasswordField() {
    await this.driver.wait(
      until.elementLocated(By.id("PowerEnterDiv_powerpass_2")),
      20 * 1000
    );
    await executeJavaScript(
      this.driver,
      "focus password box",
      "document.getElementById('PowerEnterDiv_powerpass_2').focus();"
    );
  }
  async inputPassword() {
    if (this.remitterAccount.loginPassword) {
      WindowFocusTool.focusAndCheckIE();
      await KeySender.sendText(
        this.remitterAccount.loginPassword,
        3 * 1000,
        250
      );
    } else {
      throw new Error("Account password is null");
    }
  }
  async checkIfInputPasswordCorrectly() {
    WindowFocusTool.focusAndCheckIE();
    await KeySender.sendKey(KeySender.KeyEnum.RETURN, 2 * 1000);

    var passwordMessage = await this.driver
      .wait(
        until.elementLocated(By.id("PowerEnterDiv_powerpass_2_Msg")),
        2 * 1000
      )
      .getText();
    if (passwordMessage) {
      Logger({
        level: "warn",
        message:
          "Login password sent length incorrectly. Message on bank: " +
          passwordMessage
      });
      return false;
    }
    return true;
  }
  async deletePassword() {
    for (let index = 0; index < 8; index++) {
      await KeySender.sendKey(KeySender.KeyEnum.BACKSPACE, 200);
    }
  }
  async submitToSignIn() {}

  async sendUSBKey() {}

  async checkIfLoginSuccess(globalState: { isManualLogin: boolean }) {
    try {
      const element = until.elementLocated(By.id("contentFrame"));
      if (globalState.isManualLogin) {
        await this.driver.wait(element, 5 * 1000);
      } else {
        await this.driver.wait(element, 30 * 1000);
        await waitPageLoad(this.driver);
      }
      Logger({ message: "Signed in.", level: "info" });
      return true;
    } catch (error) {
      if (error.name === "TimeoutError") {
        Logger({ message: "Sign in fail.", level: "info" });
        return false;
      }
      throw error;
    }
  }

  async getCookie() {
    const cookie: string = await this.driver.executeScript(
      "return document.cookie"
    );
    if (!cookie || cookie.length === 0) throw new Error("get cookie failure!");
    // return { cookie, session: null };
  }
  resetVariables() {
    this.charge = "0";
    this.transactionTime = dayjs();
  }
  async goTransferPage() {
    this.resetVariables();
    try {
      WindowFocusTool.focusAndCheckIE();
      await this.getBalance();

      await executeJavaScript(
        this.driver,
        "switch to transfer page",
        "document.querySelector('#menuNav > ul > li:nth-child(4) > ul > li').click();",
        500
      );
      // This wait until transfer page load
      // Switch to iframe
      await this.driver
        .switchTo()
        .frame(
          this.driver.wait(
            until.elementLocated(By.id("contentFrame")),
            60 * 1000
          )
        );
      await this.driver.wait(
        until.elementIsVisible(
          await this.driver.wait(
            until.elementLocated(By.id("fromAcctBalance")),
            60 * 1000
          )
        ),
        60 * 1000
      );
      await this.driver.wait(
        until.elementIsVisible(
          await this.driver.wait(
            until.elementLocated(By.id("toAcctNo")),
            60 * 1000
          )
        ),
        60 * 1000
      );
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  async waitUntilBankSelected() {
    var retryTimes = 3;
    while (retryTimes >= 0) {
      try {
        if (retryTimes === 0) {
          const errorMessage = "wait until bank selected fail";
          Logger({
            level: "error",
            message: errorMessage
          });
          throw new Error(errorMessage);
        }
        var bankField = this.driver.wait(
          until.elementLocated(By.id("bankKey")),
          100
        );
        var isBankSelected = await getElementValue(bankField);
        // this field  have value mean choose bank successful
        if (isBankSelected.trim()) {
          Logger({ level: "info", message: "Bank selected success" });
          break;
        }
        var bankName = this.task.payeeAccount.bank.chineseName
          ? this.bankMappingList[this.task.payeeAccount.bank.chineseName]
          : this.task.payeeAccount.bank.chineseName;

        await sendKeysV2(this.driver, bankField, { text: bankName });
        await executeJavaScript(
          this.driver,
          "choose bank",
          "if(document.querySelectorAll('#bankRst>table>tbody>tr>td').length)  document.querySelector('#bankRst>table>tbody>tr>td').click()",
          0
        );
        await this.driver.sleep(100);
      } catch (error) {
        if (
          error.name === "OperationalError" ||
          error.name === "JavascriptError"
        ) {
          Logger({
            level: "warn",
            message: `wait until bank selected fail, ${retryTimes} times, Error: ${error}`
          });
          continue;
        }
        throw error;
      } finally {
        retryTimes--;
      }
    }
  }

  // 检测页面最终获得的值 大多数第3行是金额 有时第三行是 实时转账
  async checkSubmittedValue() {
    var nameCardLine = await this.driver
      .wait(
        until.elementLocated(
          By.css(
            "table.table.table-centre>tbody>tr:nth-child(2)>td:nth-child(2)"
          )
        ),
        1 * 1000
      )
      .getText();

    var thirdLine = await this.driver
      .wait(
        until.elementLocated(
          By.css(
            "table.table.table-centre>tbody>tr:nth-child(3)>td:nth-child(2)"
          )
        ),
        1 * 1000
      )
      .getText();

    var amountLine = thirdLine;
    if (thirdLine.indexOf("实时") > -1) {
      amountLine = await this.driver
        .wait(
          until.elementLocated(
            By.css(
              "table.table.table-centre>tbody>tr:nth-child(4)>td:nth-child(2)"
            )
          ),
          1 * 1000
        )
        .getText();
    }

    var amount = amountLine.replace(/[^0-9.]/gi, "").trim();
    amount = amount.replace(/,/g, "");
    if (FormatHelper.amount(amount) !== FormatHelper.amount(this.task.amount)) {
      throw new Error("Amount is not right!");
    }

    var name = nameCardLine.split("/")[0];
    if (name !== this.task.payeeAccount.holderName) {
      throw new Error("Payee name is not right!");
    }

    var card = nameCardLine.split("/")[1];
    if (card !== this.task.payeeAccount.cardNumber) {
      throw new Error("Card number is not right!");
    }

    return true;
  }

  async fillNote() {}

  async confirmTransaction() {}

  async sendQueryPassword() {
    var retryTimes = 3;
    while (retryTimes >= 0) {
      try {
        if (retryTimes === 0) {
          throw new Error("Send query password fail, please restart the task");
        }

        WindowFocusTool.focusAndCheckIE();

        // This for focus password field
        await executeJavaScript(
          this.driver,
          "Focus password box",
          "document.getElementById('agreeBtn').click();"
        );
        await KeySender.sendText(this.remitterAccount.usbPassword);
        await KeySender.sendKey(KeySender.KeyEnum.RETURN, 1000);

        var passwordMessage = await this.driver
          .wait(until.elementLocated(By.css("#powerpass_ieMsg")), 5 * 1000)
          .getText();
        if (passwordMessage === "密码输入长度不足") {
          for (let index = 0; index < 10; index++) {
            await KeySender.sendKey(KeySender.KeyEnum.BACKSPACE, 100);
          }
          Logger({
            level: "warn",
            message: "Query password sent length incorrectly"
          });
        } else {
          await this.confirmSameTransaction();
          break;
        }
      } catch (error) {
        // this means usb password showed, so the password input correctly
        if (error.name === "UnexpectedAlertOpenError") {
          // Logger({ level: "warn", message: "Catch dialog popup" });
          Logger({ level: "info", message: "Query password sent" });
          break;
        }
        throw error;
      } finally {
        retryTimes--;
      }
    }
  }

  async confirmSameTransaction() {
    try {
      // Check if need to confirm
      await this.driver.wait(
        until.elementLocated(By.id("popupbox-confirm-0")),
        5 * 1000
      );

      // If yes, focus password field again
      await executeJavaScript(
        this.driver,
        "focus passwprd box ",
        "document.getElementById('powerpass_ie').focus();"
      );

      // Press enter to send usb password
      await KeySender.sendKey(KeySender.KeyEnum.RETURN, 1000);

      Logger({
        level: "info",
        message: "Detected confirm prompt and confirm it"
      });
    } catch (error) {
      if (error.name === "TimeoutError") {
        return Logger({
          level: "info",
          message: "Not detected confirm prompt'"
        });
      }
      throw error;
    }
  }

  /**
   * This to check if show the confirm message box
   */
  // FIXME: 有時不需要輸入這個欄位, 可以增加一個判斷是否已經到轉帳成功頁面
  async sendUSBPasswordForTransfer() {
    await KeySender.sendText(this.remitterAccount.usbPassword, 3 * 3000);
    await KeySender.sendKey(KeySender.KeyEnum.RETURN);
    Logger({
      level: "info",
      message: "Send USB password success"
    });
  }

  async waitUSBPress() {
    var retryTimes = 20;
    while (retryTimes >= 0) {
      try {
        if (retryTimes === 0) {
          throw new Error("USB didn't press, please restart the task");
        }

        await this.driver.sleep(3 * 1000);
        UsbTrigger.run(this.remitterAccount.code);
        await this.driver.sleep(3 * 1000);
        // TODO: wait if page load
        // this wait 10 sec it because we need to wait the success page
        var message = await this.driver.wait(
          until.elementLocated(By.id("trnTips")),
          10 * 1000
        );

        if (message) {
          Logger({ level: "info", message: "USB pressed" });
          break;
        }
      } catch (error) {
        if (error.name === "UnexpectedAlertOpenError") {
          Logger({
            level: "warn",
            message: `Waiting for usb press, remaining times: ${retryTimes}`
          });
          continue;
        } else if (error.name === "TimeoutError") {
          Logger({
            level: "warn",
            message: "Can't get the element 'trnTips'"
          });
          break;
        } else throw error;
      } finally {
        retryTimes--;
      }
    }
  }

  async getTransactionTime() {
    try {
      this.transactionTime = dayjs();
      await this.driver
        .switchTo()
        .frame(
          this.driver.wait(
            until.elementLocated(By.id("contentFrame")),
            60 * 1000
          )
        );

      // 回单时间与交易时间会不同
      const transactionTime = await this.driver
        .wait(
          until.elementLocated(
            By.css(
              "#trnSuccess > .m-serialnumberbox > .m-serialnumberright > span"
            )
          ),
          5 * 1000
        )
        .getText();
      this.transactionTime = dayjs(transactionTime, "YYYY/MM/DD HH:mm:ss");
    } catch (error) {
      if (error.name === "TimeoutError") {
        return Logger({
          level: "warn",
          message: "Get the transaction time fail"
        });
      }
      throw error;
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  // 跳转到打印回单页面
  async goCustomerAdvice() {
    try {
      await this.driver
        .switchTo()
        .frame(
          this.driver.wait(
            until.elementLocated(By.id("contentFrame")),
            60 * 1000
          )
        );

      await this.driver.wait(
        until.elementLocated(By.id("printBtn")),
        20 * 1000
      );
      await executeJavaScript(
        this.driver,
        "change page to print table  ",
        "document.querySelector('#printBtn').click()",
        0
      );
      await this.driver.wait(
        until.elementIsVisible(
          await this.driver.wait(
            until.elementLocated(By.css("table.printTable")),
            20 * 1000
          )
        ),
        20 * 1000
      );
      Logger({
        level: "info",
        message: "Go customer advice success"
      });
      return true;
    } catch (error) {
      if (error.name === "TimeoutError") {
        Logger({
          level: "warn",
          message: "Go customer advice error"
        });
        return false;
      }
      throw error;
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  // 检测打印回单里的信息
  async checkCustomerAdvice() {
    try {
      await this.driver.wait(
        until.elementLocated(By.id("contentFrame")),
        10 * 1000
      );

      await this.driver
        .switchTo()
        .frame(
          this.driver.wait(
            until.elementLocated(By.id("contentFrame")),
            60 * 1000
          )
        );

      var adviceTitle = await this.driver
        .wait(
          until.elementLocated(By.css("table.printTable>thead>tr>td")),
          1 * 1000
        )
        .getText();

      const transactionTime = await this.driver
        .wait(
          until.elementLocated(
            By.css("table.printTable>tbody>tr:nth-child(1)>td>span")
          ),
          1 * 1000
        )
        .getText();

      this.transactionTime = dayjs(transactionTime.replace("交易时间：", ""));

      var amount = await this.driver
        .wait(
          until.elementLocated(
            By.css("table.printTable>tbody>tr:nth-child(5)>td:nth-child(2)")
          ),
          1 * 1000
        )
        .getText();
      amount = FormatHelper.amount(amount);

      this.charge = await this.driver
        .wait(
          until.elementLocated(
            By.css("table.printTable>tbody>tr:nth-child(5)>td:nth-child(4)")
          ),
          1 * 1000
        )
        .getText();
      this.charge = FormatHelper.amount(this.charge);

      Logger({
        level: "info",
        message: `Customer advice - status: ${adviceTitle}, amount: ${amount}, charge: ${
          this.charge
        }, time: ${this.transactionTime.format("HH:mm:ss")}`
      });
      // If the result shows success, than stop doing following job
      if (adviceTitle.indexOf("成功") !== -1) return true;
      else {
        Logger({
          level: "warn",
          message: "Fail to check if task success in advice"
        });
        return false;
      }
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  async goTransferRecordPage() {
    try {
      await executeJavaScript(
        this.driver,
        "change page to transfer ",
        "document.querySelector('#menuNav > ul > li:nth-child(4) > ul > li').click();",
        500
      );

      await this.driver.sleep(1000);
      await waitPageLoad(this.driver);
      await this.driver.wait(
        until.elementLocated(By.id("contentFrame")),
        30 * 1000
      );

      await this.driver
        .switchTo()
        .frame(
          this.driver.wait(
            until.elementLocated(By.id("contentFrame")),
            60 * 1000
          )
        );

      await this.driver.wait(
        until.elementLocated(By.css(".tabs-head>li:nth-child(3)>a")),
        5 * 1000
      );

      await this.waitUntilTransactionPageLoaded();

      Logger({
        level: "info",
        message: "Go transfer record page success"
      });
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  async waitUntilTransactionPageLoaded() {
    var retryTimes = 20;
    while (retryTimes >= 0) {
      try {
        if (retryTimes === 0) {
          throw new Error("Wait until transaction page loaded fail");
        }

        if (retryTimes % 5 === 0) {
          await executeJavaScript(
            this.driver,
            "Go transfer record page",
            "document.querySelector('.tabs-head>li:nth-child(3)>a').click()",
            0
          );
          await this.driver.sleep(1000);
          await waitPageLoad(this.driver);
        }

        var startDateField = this.driver.wait(
          until.elementLocated(By.id("startDate")),
          1 * 1000
        );
        var endDateField = this.driver.wait(
          until.elementLocated(By.id("endDate")),
          1 * 1000
        );
        var queryButton = this.driver.wait(
          until.elementLocated(By.id("qryTrnDetail")),
          1 * 1000
        );
        var [startDate, endDate] = await Promise.all([
          getElementValue(startDateField),
          getElementValue(endDateField),
          queryButton
        ]);

        if (
          typeof startDate === "string" &&
          typeof endDate === "string" &&
          startDate.replace(RegexHelper.removeSpace, "") &&
          endDate.replace(RegexHelper.removeSpace, "")
        ) {
          break;
        }

        Logger({
          level: "warn",
          message: `Go transfer record page fail, ${retryTimes} times, No error.`
        });
      } catch (error) {
        if (error.name === "TimeoutError") {
          Logger({
            level: "warn",
            message: `Go transfer record page fail, ${retryTimes} times, Error: ${error}`
          });
          continue;
        }
        throw error;
      } finally {
        retryTimes--;
      }
    }
  }

  async queryTransferRecord() {
    try {
      await this.driver.wait(
        until.elementLocated(By.id("contentFrame")),
        10 * 1000
      );

      await this.driver
        .switchTo()
        .frame(
          this.driver.wait(
            until.elementLocated(By.id("contentFrame")),
            60 * 1000
          )
        );
      await this.waitUntilTransactionDetailLoaded();

      Logger({
        level: "info",
        message: "Query transfer record success"
      });
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  async waitUntilTransactionDetailLoaded() {
    var retryTimes = 20;
    while (retryTimes >= 0) {
      try {
        if (retryTimes === 0) {
          throw new Error("Query transaction detail loaded fail");
        }

        if (retryTimes % 5 === 0) {
          // click 查詢
          await executeJavaScript(
            this.driver,
            "click qryTrnDetail button ",
            "document.querySelector('#qryTrnDetail').click()",
            0
          );
          await this.driver.sleep(1000);
          await waitPageLoad(this.driver);
        }

        await this.driver.wait(
          until.elementLocated(
            By.css("table.table.table-striped.table-hover>tbody")
          ),
          1 * 1000
        );
        return;
      } catch (error) {
        if (error.name === "TimeoutError") {
          Logger({
            level: "warn",
            message: `Queried search detail fail, ${retryTimes} times.`
          });
          continue;
        }
        throw error;
      } finally {
        retryTimes--;
      }
    }
  }

  async checkTransferRecord() {
    try {
      await this.driver.wait(
        until.elementLocated(By.id("contentFrame")),
        10 * 1000
      );

      await this.driver
        .switchTo()
        .frame(
          this.driver.wait(
            until.elementLocated(By.id("contentFrame")),
            60 * 1000
          )
        );
      var tableElement = await this.driver.wait(
        until.elementLocated(
          By.css("table.table.table-striped.table-hover>tbody")
        ),
        10 * 1000
      );
      var tableHtml = await tableElement.getAttribute("outerHTML");

      const $ = cheerio.load(tableHtml, {
        xmlMode: true
      });

      const transactions = $("tbody > tr");
      let isTransferSuccess = false;

      transactions.each((_, transaction) => {
        const date = transaction.children[0].children[0].children[0].data;
        const time = transaction.children[0].children[1].children[0].data;
        const startTime = dayjs(
          `${date} ${time}`,
          "YYYY-MM-DD HH:mm:ss"
        ).subtract(10, "second");
        const endTime = dayjs(`${date} ${time}`, "YYYY-MM-DD HH:mm:ss").add(
          10,
          "second"
        );

        const receiverInfo =
          transaction.children[2].children[0].children[0].data;

        let receiverName = "";
        let receiverAccount = "";
        if (receiverInfo) {
          receiverName = receiverInfo.split("/")[0];
          receiverAccount = receiverInfo.split("/")[1];
        }

        let amount = transaction.children[3].children[0].data || "";
        amount = FormatHelper.amount(amount);

        const status = transaction.children[5].children[0].data;

        if (
          this.transactionTime.isAfter(startTime) &&
          this.transactionTime.isBefore(endTime) &&
          // receiverName === this.task.receiverName &&
          // receiverAccount === this.task.bank.cardNumber &&
          // amount === FormatHelper.amount(this.task.requestAmount) &&
          status === "成功"
        ) {
          Logger({
            level: "info",
            message:
              `Transfer Record - status: ${status}, amount: ${amount}, ` +
              `time: ${this.transactionTime.format("HH:mm:ss")}`
          });
          isTransferSuccess = true;
        }
      });
      if (isTransferSuccess) return true;
      else {
        Logger({
          level: "info",
          message:
            // `Transfer record match fail, request amount: ${this.task.requestAmount}, ` +
            `transaction time: ${this.transactionTime.format("HH:mm:ss")}`
        });

        throw new Error("Check transfer record fail");
      }
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  async getBalance(): Promise<number> {
    try {
      await executeJavaScript(
        this.driver,
        "查询余额",
        "document.getElementById('menuNav').getElementsByTagName('li')[0].click()",
        0
      );
      await this.driver.sleep(3 * 1000);

      await this.driver.wait(
        until.elementLocated(By.id("contentFrame")),
        10 * 1000
      );

      await this.driver
        .switchTo()
        .frame(
          this.driver.wait(
            until.elementLocated(By.id("contentFrame")),
            60 * 1000
          )
        );

      var balance = await waitUtilGetText(
        this.driver,
        until.elementLocated(By.id("dnormal"))
      );
      return +FormatHelper.amount(balance);
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }
}
