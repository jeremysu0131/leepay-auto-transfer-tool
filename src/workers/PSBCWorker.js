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
    this.bankURL = "https://pbank.psbc.com/perbank/html/system/login.html";
    this.card = getCurrentCardDetail();
    this.task = "";
    this.bankMapppingList = {
      中国邮政储蓄银行: "邮政",
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
    try {
      const logType = this.driver.findElement(By.id("logType"));
      await this.driver.wait(until.elementIsVisible(logType), 15000).click();
      await executeJavaScript(
        this.driver,
        "choose  login by username",
        "document.getElementById('logType').click()",
        0,
      );
      await executeJavaScript(
        this.driver,
        "choose  login by username",
        `document.getElementById('logonId').value ='${this.card.accountName}'`,
        500,
      );
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  /**
   *
   * @param {Object} globalState
   * @param {Boolean} globalStore.isManualLogin
   */
  async checkIfLoginSuccess(globalState) {
    await this.driver.wait(until.elementLocated(By.linkText("首页")), 300000);
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
    await executeJavaScript(
      this.driver,
      "change page",
      "document.getElementById('firsrMenu').getElementsByTagName('li')[2].click()",
      0,
    );
    await this.driver.wait(until.elementLocated(By.id("recAccountName")), 20 * 1000);
  }

  async fillTransferFrom() {
    try {
      this.task = getSelectedTaskDetail();

      await sendKeysV2(
        this.driver,
        this.driver.wait(until.elementLocated(By.id("recAccountName"), 5 * 1000)),
        {
          text: this.task.receiverName,
        },
      );

      await sendKeysV2(
        this.driver,
        this.driver.wait(until.elementLocated(By.id("recAccountshow"), 5 * 1000)),
        {
          text: this.task.bank.cardNumber,
          replaceRule: regexHelper.removeSpace,
        },
      );
      await sendKeysV2(
        this.driver,
        this.driver.wait(until.elementLocated(By.id("transferSum"), 5 * 1000)),
        {
          text: Number.parseFloat(this.task.requestAmount).toFixed(2),
          replaceRule: /,/g,
        },
      );

      // Search bank
      var bankField = this.driver.wait(until.elementLocated(By.id("recAccountOpenBank")), 1000);
      var bank = await getElementValue(bankField);
      // If not able auto select bank, manual select it
      if (!bank) {
        var bankName =
          this.bankMapppingList[this.task.bank.chineseName] || this.task.bank.chineseName;
        // 进行点击
        await executeJavaScript(
          this.driver,
          "triger search",
          "document.getElementById('recAccountOpenBank').click()",
          0,
        );
        await this.driver.sleep(3000);
        await sendKeysV2(
          this.driver,
          this.driver.wait(until.elementLocated(By.id("queryBank"), 5 * 1000)),
          {
            text: bankName,
          },
        );
        // 查询
        await executeJavaScript(
          this.driver,
          "click search",
          "document.getElementById('query').click()",
          0,
        );
        await this.driver.sleep(1000);
        await this.driver.wait(until.elementLocated(By.id("reList")), 1000);
        // 点击元素
        await executeJavaScript(
          this.driver,
          "choose bank ",
          "document.getElementById('reList').getElementsByTagName('li')[0].getElementsByTagName('a')[0].click()",
          0,
        );

        bank = await getElementValue(bankField);
        if (!bank) throw new Error("Select bank fail");
      }

      // submit
      await executeJavaScript(
        this.driver,
        "submit transfer ",
        "document.getElementById('nextBut').click()",
        0,
      );
      await this.driver.wait(until.elementLocated(By.id("mobileVerifyCode"), 30 * 1000));
      await this.checkSubmitedValue();
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  // 检测页面最终获得的值
  async checkSubmitedValue() {
    var amount = await this.driver.findElement(By.css("i.e-cor-red.e-fz-16")).getText();
    amount = amount.replace(/,/g, "");
    if (parseFloat(amount) != parseFloat(this.task.requestAmount)) {
      throw new Error("Amount is not right!");
    }

    var name = await this.driver
      .findElement(By.css("div.e-sure>div:nth-child(3)>div.card-main>p.e-fz-16.mt-25.ml-10"))
      .getText();
    if (name != this.task.receiverName) {
      throw new Error("Receiver name is not right!");
    }

    var card = await this.driver
      .findElement(By.css("div.e-sure>div:nth-child(3)>div.card-main>div.card-query>ul>li>i"))
      .getText();
    if (card != this.task.bank.cardNumber) {
      throw new Error("Card number is not right!");
    }
  }

  async fillNote() {}
  async confirmTransferMessage() {}
  async getBalance() {
    try {
      await this.goToTransferPage();
      await this.driver.wait(until.elementLocated(By.id("balance")), 20 * 1000);
      let balance = await this.driver.findElement(By.id("balance")).getText();
      balance = balance.replace(/,/g, "");
      console.log(balance);
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }
  async confirmTransaction() {}
  async checkIfSuccess() {}
  async sendUSBKey() {}
}
