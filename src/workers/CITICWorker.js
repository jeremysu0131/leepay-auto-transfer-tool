import { By, until } from "selenium-webdriver";
import * as KeySender from "./utils/keySender";
import {
  executeJavaScript,
  waitPageLoad,
  getElementValue,
  waitUtilGetText,
  sendKeysV2,
} from "./utils/seleniumHelper";
import {
  getCurrentCardDetail,
  getSelectedTaskDetail,
  setBankBalance,
  setLog,
} from "./utils/storeHelper";
import { OperationalError } from "./utils/workerErrorHandler";
import * as regexHelper from "./utils/regexHelper";

export default class {
  constructor() {
    this.driver = null;
    this.bankURL = "https://i.bank.ecitic.com/perbank6/signIn.do";
    this.card = getCurrentCardDetail();
    this.task = "";
    this.bankMapppingList = {
      中国邮政储蓄银行: "中国邮政",
    };
  }

  async launchSelenium() {
    try {
      await this.driver.get(this.bankURL);
    } catch (error) {
      throw new Error(error);
    }
  }

  async loginToBank() {
    await this.driver.wait(until.elementLocated(By.id("ocxEdit")), 30 * 1000);
    await executeJavaScript(
      this.driver,
      "focus password input",
      `document.getElementById('ocxEdit').focus()`,
    );
  }

  /**
   *
   * @param {Object} globalState
   * @param {Boolean} globalStore.isManualLogin
   */
  async checkIfLoginSuccess(globalState) {
    const element = until.elementLocated(By.linkText("首页"));
    if (globalState.isManualLogin) {
      await this.driver.wait(element, 5 * 1000);
    } else {
      await this.driver.wait(element, 120 * 1000);
    }
  }

  async getCookie() {
    const cookie = await this.driver.executeScript("return document.cookie");
    if (!cookie || cookie.length === 0) throw new Error("get cookie failure!");
    return { cookie, session: null };
  }

  async goTransferPage() {
    try {
      await executeJavaScript(
        this.driver,
        "change page",
        "document.querySelector('#m1_3').click()",
        0,
      );
      await executeJavaScript(
        this.driver,
        "change page",
        "document.querySelector('#m3_13').click()",
        700,
      );
      await this.driver.wait(
        until.elementIsVisible(await this.driver.findElement(By.id("mainframe"))),
        30 * 1000,
      );
      await this.driver.switchTo().frame("mainframe");
      await waitPageLoad(this.driver);
      await this.driver.wait(
        until.elementIsVisible(await this.driver.findElement(By.id("tranAmttxt"))),
        30 * 1000,
      );
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  async fillTransferFrom() {
    try {
      this.task = getSelectedTaskDetail();
      await this.driver.switchTo().frame("mainframe");
      // Amount
      await sendKeysV2(
        this.driver,
        this.driver.wait(until.elementLocated(By.id("tranAmttxt"), 5 * 1000)),
        {
          text: Number.parseFloat(this.task.requestAmount).toFixed(2),
          replaceRule: /,/g,
        },
      );

      await executeJavaScript(
        this.driver,
        "put receiverName",
        `document.getElementById('recNametxt').value ='${this.task.receiverName}'`,
        10,
      );
      await executeJavaScript(
        this.driver,
        "put cardNumber",
        `document.getElementById('recAcctxt').value ='${this.task.bank.cardNumber}'`,
        10,
      );
      await executeJavaScript(
        this.driver,
        "focus cardNumber",
        "document.getElementById('recAcctxt').focus()",
        10,
      );

      await executeJavaScript(
        this.driver,
        "click div",
        "document.getElementById('reqTable').click()",
        500,
      );
      if (this.task.bank.chineseName.indexOf("中信") < 0) {
        await this.waitUntilBankSelected();
      }

      await executeJavaScript(
        this.driver,
        "click submit button",
        "document.querySelector('#next').click()",
      );
      await this.driver.wait(until.elementLocated(By.id("SubUk"), 10 * 1000));
      await this.checkSubmitedValue();

      await executeJavaScript(
        this.driver,
        "click USB key choose",
        "document.querySelector('#SubUk').click()",
      );
      // 图形验证码
      await this.driver.wait(
        until.elementIsVisible(this.driver.findElement(By.id("verifyCode"))),
        5 * 1000,
      );
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }
  async waitUntilBankSelected() {
    var retryTimes = 5;
    var bankName = this.bankMapppingList[this.task.bank.chineseName] || this.task.bank.chineseName;
    while (retryTimes >= 0) {
      try {
        if (retryTimes === 0) {
          const errorMessage = "wait until bank selected fail";
          setLog({
            level: "error",
            message: errorMessage,
          });
          throw new Error(errorMessage);
        }
        await executeJavaScript(
          this.driver,
          "click div",
          "document.getElementById('reqTable').click()",
        );
        //獲取 自動感應到的銀行
        var selectedBank = await getElementValue(
          this.driver.wait(until.elementLocated(By.id("bankNameText")), 1000),
        );
        // 如果沒有感應到 就輸入
        if (selectedBank.indexOf("请选择或手工输入") > 0) {
          await this.driver.wait(
            until.elementIsVisible(
              await this.driver.wait(until.elementLocated(By.id("pyaIbpsBankNameText")), 20 * 1000),
            ),
            20 * 1000,
          );
          await sendKeysV2(
            this.driver,
            this.driver.wait(until.elementLocated(By.id("pyaIbpsBankNameText"), 5 * 1000)),
            { text: bankName },
          );
          //選擇 下拉表單的第一個值
          await executeJavaScript(
            this.driver,
            "click bank",
            "document.querySelector('ul#pyaIbpsBankTxtUl>li>a').click()",
          );
        } else {
          setLog({ level: "info", message: "wait until bank selected success" });
          break;
        }
      } catch (error) {
        if (error.name === "JavascriptError" || error.name === "TimeoutError") {
          setLog({
            level: "warn",
            message: `wait until bank selected fail, ${retryTimes} times, Error: ${error}`,
          });
          continue;
        }
        throw error;
      } finally {
        retryTimes--;
      }
    }
  }
  // 检测页面最终获得的值
  async checkSubmitedValue() {
    var amount = await this.driver.findElement(By.css("span#tranAmtCfm")).getText();
    amount = amount.replace("元", "");
    amount = amount.replace(/,/g, "").trim();
    if (parseFloat(amount) != parseFloat(this.task.requestAmount)) {
      throw new Error("Amount is not right!");
    }
    var name = await this.driver.findElement(By.css("span#recAccNameCfm")).getText();
    if (name != this.task.receiverName) {
      throw new Error("Receiver name is not right!");
    }
    var card = await this.driver.findElement(By.css("span#recAccCfm")).getText();
    card = card.replace(/ /g, "");
    if (card != this.task.bank.cardNumber) {
      throw new Error("Card number is not right!");
    }
  }

  async fillNote() {}
  async confirmTransferMessage() {}
  async getBalance() {}
  async confirmTransaction() {}
  async checkIfSuccess() {}
  async sendUSBKey() {}
}
