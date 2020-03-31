import { ThenableWebDriver } from "selenium-webdriver";
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
import * as regexHelper from "./utils/regexHelper";
export default class {
  constructor() {
    this.driver = null;
    this.bankURL = "https://ibank.hrbb.com.cn/";
    this.card = getCurrentCardDetail();
    this.task = "";
    this.bankMapppingList = {};
  }

  async launchSelenium() {
    try {
      await this.driver.get(this.bankURL);
    } catch (error) {
      throw new Error(error);
    }
  }

  async loginToBank() {
    await this.driver.wait(until.elementLocated(By.id("loginIdIndex")), 20 * 1000);
    await executeJavaScript(
      this.driver,
      "fill account name",
      `document.getElementById('loginIdIndex').value ='${this.card.accountName}'`,
      0,
    );
  }

  /**
   *
   * @param {Object} globalState
   * @param {Boolean} globalStore.isManualLogin
   */
  async checkIfLoginSuccess(globalState) {
    const element = until.elementLocated(By.linkText("退出"));
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
    await executeJavaScript(
      this.driver,
      "change page",
      "document.getElementById('customizedList').getElementsByTagName('a')[1].click()",
      0,
    );
    await this.driver.wait(until.elementLocated(By.id("recAccountName")), 3000);
  }

  async fillTransferFrom() {
    try {
      this.task = getSelectedTaskDetail();
      await executeJavaScript(
        this.driver,
        "fill card number",
        `document.getElementById('recAccount').value ='${this.task.bank.cardNumber}'`,
        0,
      );

      await sendKeysV2(
        this.driver,
        this.driver.wait(until.elementLocated(By.id("recAccountName"), 5 * 1000)),
        {
          text: this.task.receiverName,
        },
      );
      // Amount
      await sendKeysV2(
        this.driver,
        this.driver.wait(until.elementLocated(By.id("payAmount"), 5 * 1000)),
        {
          text: Number.parseFloat(this.task.requestAmount).toFixed(2),
          replaceRule: /,/g,
        },
      );

      await this.waitUntilBankSelected();

      await executeJavaScript(
        this.driver,
        "next step",
        "document.getElementById('submit').click()",
        700,
      );
      // 等待确认交易按钮
      await this.driver.wait(until.elementLocated(By.id("Per_TransferSubmitEnsure"), 15000));
      await this.driver.wait(
        until.elementIsVisible(await this.driver.findElement(By.css("b#payAmount"))),
        10 * 1000,
      );
      await this.checkSubmitedValue();
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
          setLog({
            level: "error",
            message: errorMessage,
          });
          throw new Error(errorMessage);
        }
        await executeJavaScript(
          this.driver,
          "focus account",
          "document.getElementById('recAccount').focus()",
          0,
        );
        await executeJavaScript(
          this.driver,
          "focus bank",
          "document.getElementById('recAccountOpenBank').focus()",
          500,
        );
        var bankField = this.driver.wait(until.elementLocated(By.id("recAccountOpenBank")), 1000);
        var selectedBank = await getElementValue(bankField);

        if (selectedBank.length > 0) {
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
    var amount = await this.driver.findElement(By.css("b#payAmount")).getText(); //  "1.00 人民币"
    amount = amount.replace("人民币", "").trim();
    amount = amount.replace(/,/g, "");
    if (parseFloat(amount) != parseFloat(this.task.requestAmount)) {
      throw new Error("Amount is not right!");
    }
    var name = await this.driver.findElement(By.css("b#recAccountName")).getText();
    if (name != this.task.receiverName) {
      throw new Error("Receiver name is not right!");
    }
    var card = await this.driver.findElement(By.css("b#recAccount")).getText();
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
