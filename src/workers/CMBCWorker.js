import { ThenableWebDriver } from "selenium-webdriver";
import { By, until } from "selenium-webdriver";
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
    /** @type {ThenableWebDriver} */
    this.driver = null;
    this.bankURL = "https://nper.cmbc.com.cn/pweb/static/login.html";
    this.card = getCurrentCardDetail();
    this.task = "";
    this.bankMapppingList = {
      中国工商银行: "dda0",
      中国银行: "dda1",
      兴业银行: "dda3",
      浦东发展银行: "dda2",
      中国农业银行: "dda4",
      交通银行: "dda5",
      中信银行: "dda6",
      光大银行: "dda12",
      中国建设银行: "dda8",
      招商银行: "dda9",
      华夏银行: "dda11",
      广发银行: "dda10",
      中国邮政储蓄银行: "dda13",
      平安银行: "dda7",
    };
  }

  async launchSelenium() {
    try {
      await this.driver.get(this.bankURL);
      await this.driver.navigate().refresh();
    } catch (error) {
      throw new Error(error);
    }
  }

  async loginToBank() {
    await this.driver.wait(until.elementLocated(By.id("writeUserId")), 20 * 1000);
    await executeJavaScript(
      this.driver,
      "fill account name",
      `document.getElementById('writeUserId').value ='${this.card.accountName}'`,
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
    this.task = getSelectedTaskDetail();
    var retryTime = 30;
    if (this.task.bank.chineseName.indexOf("民生") > -1) {
      await executeJavaScript(
        this.driver,
        "click  inner transfer <a> tag",
        "document.getElementsByClassName('nav_n')[0].getElementsByTagName('li')[43].getElementsByTagName('a')[0].click()",
        0,
      );
      await this.driver.wait(until.elementLocated(By.id("payerAcId")), 30 * 1000);
      while (retryTime > 0) {
        retryTime--;
        const text = await this.driver
          .wait(until.elementLocated(By.id("payerAcId")), 1000)
          .getText();
        if (text) break;
        if (retryTime === 0) throw new Error("wait account show fail");
      }
    } else {
      await executeJavaScript(
        this.driver,
        "click out transfer <a> tag",
        "document.getElementsByClassName('nav_n')[0].getElementsByTagName('li')[42].getElementsByTagName('a')[0].click()",
        0,
      );
      await this.driver.wait(until.elementLocated(By.id("idPayerAc")), 30 * 1000);
      while (retryTime > 0) {
        retryTime--;
        const text = await this.driver
          .wait(until.elementLocated(By.id("idPayerAc")), 1000)
          .getText();
        if (text) break;
        if (retryTime === 0) throw new Error("wait account show fail");
      }
    }
  }

  async fillTransferFrom() {
    if (this.task.bank.chineseName.indexOf("民生") > -1) {
      await this.fillTransferFromSameBank();
    } else {
      await this.fillTransferFromDifferentBank();
    }
  }

  async fillTransferFromDifferentBank() {
    // Amount
    await sendKeysV2(
      this.driver,
      this.driver.wait(until.elementLocated(By.id("Amount"), 5 * 1000)),
      {
        text: Number.parseFloat(this.task.requestAmount).toFixed(2),
        replaceRule: /,/g,
      },
    );
    // Name
    await sendKeysV2(
      this.driver,
      this.driver.wait(until.elementLocated(By.css("input[v-model='PayeeAcName']"), 5 * 1000)),
      {
        text: this.task.receiverName,
      },
    );
    // Account
    await sendKeysV2(
      this.driver,
      this.driver.wait(until.elementLocated(By.id("PayeeAcNo"), 5 * 1000)),
      {
        text: this.task.bank.cardNumber,
        replaceRule: regexHelper.removeSpace,
      },
    );
    await this.waitUntilBankSelected();

    await executeJavaScript(
      this.driver,
      "Submit outer transfer form",
      "document.querySelector('input[name=Submit][class=anniucss][type=button]').click()",
      0,
    );
    await this.driver.wait(until.elementLocated(By.id("safety_pwd"), 10 * 1000));
    await this.checkSubmitedValue();
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
          "Click bank list",
          "document.querySelector('#IBPSPayeeBank').click()",
        );
        await executeJavaScript(
          this.driver,
          "Select bank",
          `document.querySelector('.${this.bankMapppingList[this.task.bank.chineseName]}').click()`,
        );
        // check if bank been selected
        var bankField = this.driver.wait(until.elementLocated(By.id("IBPSPayeeBank")), 5 * 1000);
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

  async fillTransferFromSameBank() {
    await this.driver.wait(until.elementLocated(By.id("amountInput")), 10 * 1000);

    // Amount
    await sendKeysV2(
      this.driver,
      this.driver.wait(until.elementLocated(By.id("amountInput"), 5 * 1000)),
      {
        text: Number.parseFloat(this.task.requestAmount).toFixed(2),
        replaceRule: /,/g,
      },
    );
    // Name
    await sendKeysV2(
      this.driver,
      this.driver.wait(until.elementLocated(By.css("input[v-model='PayeeAcName']"), 5 * 1000)),
      {
        text: this.task.receiverName,
      },
    );
    // Account
    await sendKeysV2(
      this.driver,
      this.driver.wait(until.elementLocated(By.css("input[v-model='PayeeAcNo']"), 5 * 1000)),
      {
        text: this.task.bank.cardNumber,
        replaceRule: regexHelper.removeSpace,
      },
    );
    await executeJavaScript(
      this.driver,
      "let Remark focus",
      "document.getElementById('Remark').focus()",
      0,
    );
    await executeJavaScript(
      this.driver,
      "Submit inner transfer form",
      "document.querySelector('input[name=Submit][class=anniucss][type=button]').click()",
    );
    await this.driver.wait(until.elementLocated(By.id("safety_pwd"), 10 * 1000));
    await this.checkSubmitedValue();
  }
  // 检测页面最终获得的值
  async checkSubmitedValue() {
    //6214 8353 6830 1907 滕学芹 招商银行
    var cardNameLine = await this.driver
      .findElement(By.css("table.biaocss.biaocssqr>tbody>tr:nth-child(2)>td"))
      .getText();

    //1.00 人民币 壹元整、
    var amountLine = await this.driver
      .findElement(By.css("table.biaocss.biaocssqr>tbody>tr:nth-child(3)>td"))
      .getText();
    var amount = amountLine.split(" ")[0].trim();
    amount = amount.replace(/,/g, "");
    if (parseFloat(amount) != parseFloat(this.task.requestAmount)) {
      throw new Error("Amount is not right!");
    }

    var name = cardNameLine
      .replace(/\d+/g, "")
      .trim()
      .split(" ")[0];
    if (name != this.task.receiverName) {
      throw new Error("Receiver name is not right!");
    }

    var card = cardNameLine.replace(/[^0-9]/gi, "").trim();
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
