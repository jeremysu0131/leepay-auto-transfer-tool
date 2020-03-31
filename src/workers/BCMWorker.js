import { By, until } from "selenium-webdriver";
import * as KeySender from "./utils/keySender";
import {
  executeJavaScript,
  waitPageLoad,
  getElementValue,
  waitUtilGetText,
  sendKeys,
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
    this.bankURL = "https://pbank.95559.com.cn/personbank/system/syLogin.do";
    this.card = getCurrentCardDetail();
    this.task = "";
    this.bankMapppingList = {
      中国工商银行: "中国工商银行 ",
      中国农业银行: "中国农业银行",
      中国银行: "中国银行",
      中国建设银行: "中国建设银行",
      中国邮政储蓄银行: "中国邮政储蓄银行",
      招商银行: "招商银行",
      中信银行: "中信银行",
      民生银行: "中国民生银行",
      兴业银行: "兴业银行",
      浦东发展银行: "上海浦东发展银行",
      光大银行: "中国光大银行",
      平安银行: "平安银行（原深圳发展银行）",
      华夏银行: "华夏银行",
      广发银行: "广发银行股份有限公司",
      北京银行: "北京银行",
      上海银行: "上海银行",
      江苏银行股份有限公司: "江苏银行股份有限公司",
      恒丰银行: "恒丰银行",
      浙商银行: "浙商银行",
      南京银行: "南京银行",
    };
  }

  async launchSelenium() {
    try {
      await this.driver.get(this.bankURL);
      //  await this.loginToBank();
    } catch (error) {
      throw new Error(error);
    }
  }

  async loginToBank() {
    await this.driver.wait(until.elementLocated(By.id("go-login-number")), 10 * 1000);
    await executeJavaScript(
      this.driver,
      "choose login by name ",
      "document.querySelector('#go-login-number>div>img').click()",
      0,
    );
    this.card.accountName = "fsndjzcs";
    await executeJavaScript(
      this.driver,
      "fill account name",
      `document.getElementById('alias').value ='${this.card.accountName}'`,
      0,
    );
  }

  /**
   *
   * @param {Object} globalState
   * @param {Boolean} globalStore.isManualLogin
   */
  async checkIfLoginSuccess(globalState) {
    const element = until.elementLocated(By.id("frameMain"));
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
      this.task = getSelectedTaskDetail();
      await executeJavaScript(
        this.driver,
        "change page",
        "document.getElementById('frameMain').contentDocument.querySelectorAll('#showNewMenus>li')[1].getElementsByTagName('a')[0].click()",
        0,
      );
      //await this.driver.switchTo().frame("frameMain");
      //await waitPageLoad(this.driver);
      // havent know why if i switch to  tranArea frame . page load will error.
      //await this.driver.sleep(2 * 1000);
      //await this.driver.wait(until.elementLocated(By.id("tranArea")), 20 * 1000);
      //await this.driver.switchTo().frame("tranArea");
      //await waitPageLoad(this.driver);
      //await this.driver.wait(until.elementLocated(By.id("transum")), 20 * 1000);
      await this.waitIframeLoad(1);
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }
  async fillTransferFrom() {
    try {
      var common =
        "document.getElementById('frameMain').contentDocument.getElementById('tranArea').contentDocument.";
      await executeJavaScript(
        this.driver,
        "set receiverName ",
        common + "getElementById('toAccName').value='" + this.task.receiverName + "'",
        0,
      );

      var formatCard = this.task.bank.cardNumber.replace(/\s/g, "").replace(/(.{4})/g, "$1 ");
      await executeJavaScript(
        this.driver,
        "set account ",
        common + "getElementById('toCardNo').value='" + formatCard + "'",
        0,
      );
      await executeJavaScript(
        this.driver,
        "set amount ",
        common + "getElementById('transum').value=" + this.task.requestAmount,
        0,
      );

      await executeJavaScript(
        this.driver,
        "focus name ",
        common + "getElementById('toAccName').focus()",
        500,
      );
      await executeJavaScript(
        this.driver,
        "focus accunt ",
        common + "getElementById('toCardNo').focus()",
        500,
      );
      if (this.task.bank.chineseName.indexOf("交通银行") < 0) {
        var bankName = this.bankMapppingList[this.task.bank.chineseName];
        await executeJavaScript(
          this.driver,
          "set bank ",
          common + "querySelector('#tabs-1>ul>li[title=\"" + bankName + "\"]').click()",
          0,
        );
      }
      await executeJavaScript(
        this.driver,
        "submit ",
        common + "getElementById('btnNext').click()",
        500,
      );
      await this.waitIframeLoad(2);
      await this.checkSubmitedValue();
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  /*
   因为尝试切进 ifram 还没成功  (切进ifram 点击下一步按钮后 页面加载不正常)
   等待元素值的方式 暂时采用循环js 获取值的方式,
   pageIndex = 1 时 等待金额元素
   pageIndex != 1 时 在点击下一步后 等待确认页面的栏位信息
  */
  async waitIframeLoad(pageIndex) {
    var retryTimes = 20;
    while (retryTimes >= 0) {
      try {
        if (retryTimes === 0) {
          const errorMessage = "wait iframe fail";
          setLog({
            level: "error",
            message: errorMessage,
          });
          throw new Error(errorMessage);
        }
        var js =
          "return document.getElementById('frameMain').contentDocument.getElementById('tranArea').contentDocument.querySelectorAll";
        if (pageIndex == 1) {
          js += "('#transum').length";
        } else {
          js += "('table.form-table>tbody>tr')[4].querySelectorAll(\"td\")[2].innerText";
        }
        var pageElement = await this.driver.executeScript(js);
        if (pageElement === 1 || pageElement.length > 5) {
          setLog({ level: "info", message: "wait iframe success" });
          break;
        }
        await this.driver.sleep(1000);
      } catch (error) {
        if (error.name === "OperationalError" || error.name === "JavascriptError") {
          setLog({
            level: "warn",
            message: `wait iframe fail, ${retryTimes} times, Error: ${error}`,
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
    var common =
      "return document.getElementById('frameMain').contentDocument.getElementById('tranArea').contentDocument.querySelectorAll";
    var amount = await this.driver.executeScript(
      common + "('table.form-table>tbody>tr')[4].querySelectorAll(\"td\")[2].innerText",
    );
    var name = await this.driver.executeScript(
      common + "('table.form-table>tbody>tr')[1].querySelectorAll(\"td\")[3].innerText",
    );

    var card = await this.driver.executeScript(
      common + "('table.form-table>tbody>tr')[2].querySelectorAll(\"td\")[3].innerText",
    );

    amount = amount.replace(/[^0-9.]/gi, "");
    card = card.replace(/ /g, "");
    if (parseFloat(amount) != parseFloat(this.task.requestAmount)) {
      throw new Error("Amount is not right!");
    }

    if (name != this.task.receiverName) {
      throw new Error("Receiver name is not right!");
    }

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
  // FIXME: Change this in future
  // async fillTransferFrom1() {
  //   try {
  //     await this.driver.switchTo().frame("frameMain");
  //     await this.driver.switchTo().frame("tranArea");
  //     var amount = this.driver.wait(until.elementLocated(By.id("transum")), 15 * 1000);

  //     // Amount
  //     await sendKeys(amount, {
  //       text: Number.parseFloat(this.task.requestAmount).toFixed(2),
  //       replaceRule: /\,/g,
  //     });
  //     // Name
  //     await sendKeys(this.driver.wait(until.elementLocated(By.id("toAccName"), 5 * 1000)), {
  //       text: this.task.receiverName,
  //     });

  //     await amount.click();
  //     // Account
  //     await sendKeys(this.driver.wait(until.elementLocated(By.id("toCardNo"), 5 * 1000)), {
  //       text: this.task.bank.cardNumber,
  //       replaceRule: regexHelper.removeSpace,
  //     });

  //     await amount.click();

  //     //next step
  //     //await this.driver.executeScript("document.getElementById('btnNext').click()");
  //     // 等待确认交易按钮
  //     //await this.driver.wait(until.elementLocated(By.id("safeCommit"), 15000));
  //     //await this.checkSubmitedValue();
  //   } catch (error) {
  //     throw error;
  //   } finally {
  //     await this.driver.switchTo().defaultContent();
  //   }
  // }
}
