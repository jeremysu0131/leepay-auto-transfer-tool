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
    this.bankURL =
      "https://ebank.bankofbeijing.com.cn/bccbpb/customerLogon.jsp?language=zh_CN&jobTypeDiff=&jobDataDiff=";
    this.card = getCurrentCardDetail();
    this.task = "";
    this.bankMapppingList = {
      中国工商银行: "1",
      中国农业银行: "2",
      中国银行: "3",
      中国建设银行: "4",
      交通银行: "5",
      中信银行: "6",
      光大银行: "7",
      华夏银行: "8",
      民生银行: "9",
      广州发展银行: "10",
      平安银行: "11",
      招商银行: "12",
      兴业银行: "13",
      浦东发展银行: "14",
      中国邮政储蓄银行: "28",
    };
  }

  async launchSelenium() {
    try {
      await this.driver.get(this.bankURL);
    } catch (error) {
      throw new Error(error);
    }
  }

  async loginToBank() {}

  /**
   *
   * @param {Object} globalState
   * @param {Boolean} globalStore.isManualLogin
   */
  async checkIfLoginSuccess(globalState) {
    const element = until.elementLocated(By.linkText("欢迎页"));
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
      this.task;
      var changePageJs = "document.getElementById('m2_2_2').click()";
      var PageJs = "hidemenu();m2(2,2);submitTran1_t('PB030700');m3left('2','2','1')";
      if (this.task.bank.chineseName.indexOf("北京银行") > -1) {
        changePageJs = "document.getElementById('m2_2_1').click()";
        PageJs = "hidemenu();m2(2,1);submitTran1_t('PB030102');m3left('2','1','1')";
      }
      // 标签点击
      await executeJavaScript(
        this.driver,
        "change page",
        "document.getElementById('m1_2').getElementsByTagName('a')[0].click() ",
        0,
      );
      await this.driver.wait(until.elementLocated(By.id("m2_2_2")), 3 * 1000);
      await executeJavaScript(this.driver, "change page", changePageJs, 0);
      await this.driver.wait(until.elementLocated(By.id("tranFrame")), 3 * 1000);
      await executeJavaScript(this.driver, "change page", PageJs, 0);

      // 点击页面询问按钮
      await executeJavaScript(
        this.driver,
        "click sure button",
        "document.getElementById('tranFrame').contentWindow.submitReg()",
        2 * 1000,
      );
      await waitPageLoad(this.driver);
      await this.driver.wait(until.elementLocated(By.id("tranFrame")), 3 * 1000);

      // 等待填写栏位
      await this.driver.switchTo().frame("tranFrame");
      await waitPageLoad(this.driver);
      await this.driver.wait(until.elementLocated(By.css("input[name='payeeName']")), 20 * 1000);
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  async fillTransferFrom() {
    try {
      await this.driver.switchTo().frame("tranFrame");
      // 选卡 一般一盾一卡
      await executeJavaScript(
        this.driver,
        "choose card",
        "document.getElementById('accList').selectedIndex = 1;",
        0,
      );
      await executeJavaScript(
        this.driver,
        "choose card",
        this.task.bank.chineseName.indexOf("北京银行") > -1
          ? "ajaxQueryBankName()"
          : "ajaxQueryAccount1()",
        1 * 1000,
      );
      await this.waitUntilCardSelected();

      await executeJavaScript(
        this.driver,
        "set name ",
        "document.getElementsByName('payeeName')[0].value='" + this.task.receiverName + "'",
        0,
      );
      await executeJavaScript(
        this.driver,
        "set name ",
        "document.getElementsByName('payeeAcct')[0].value='" + this.task.bank.cardNumber + "'",
        0,
      );
      var waitTime = 4 * 1000;
      if (this.task.bank.chineseName.indexOf("北京银行") > -1) {
        await this.fillTransferFromSameBank();
      } else {
        await this.fillTransferFromDifferentBank();
        waitTime = 8 * 1000;
      }
      await executeJavaScript(
        this.driver,
        "click submit button",
        "doPreRequest('button');",
        waitTime,
      );

      await this.driver.wait(until.elementLocated(By.id("paypwdtxt"), 20 * 1000));
      await this.checkSubmitedValue();
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  async fillTransferFromSameBank() {
    //实时到账 选项

    await executeJavaScript(
      this.driver,
      "set  choose ",
      "document.getElementById('typeMoment').click()",
      0,
    );
    //await this.driver.findElement(By.css("input[name='tranamttxt']")).sendKeys(this.task.requestAmount);
    await executeJavaScript(
      this.driver,
      "set  amount ",
      "document.getElementsByName('tranamttxt')[0].value='" + this.task.requestAmount + "'",
      0,
    );

    //表单点击 让金额格式化
    await this.driver.findElement(By.id("neirong")).click();
    //附言
    await executeJavaScript(
      this.driver,
      "set  note ",
      "document.getElementsByName('payeeRem')[0].value='" + (Date.now() % 100) + "'",
      0,
    );
  }

  async fillTransferFromDifferentBank() {
    // 触发银行
    await executeJavaScript(
      this.driver,
      "trigger bank ",
      "document.getElementById('bankTypeSle').click()",
      0,
    );
    await executeJavaScript(
      this.driver,
      "trigger bank ",
      "document.getElementById('bankTypeSle').selectedIndex = " +
        this.bankMapppingList[this.task.bank.chineseName] +
        ";",
      1 * 1000,
    );
    await executeJavaScript(
      this.driver,
      "trigger bank ",
      "bankTypeChange(document.getElementById('bankTypeSle'))",
      0,
    );
    await this.waitUntilBankSelected();

    // 金额 需要由 填写note来触发格式化
    await executeJavaScript(
      this.driver,
      "set amount ",
      "document.getElementsByName('tranamt')[0].value='" + this.task.requestAmount + "'",
      0,
    );

    await executeJavaScript(
      this.driver,
      "set note ",
      "document.getElementsByName('tranuse')[0].value='" + (Date.now() % 100) + "'",
      0,
    );
    // 必要等待頁面alert 彈框自動消失
    // await this.driver.sleep(5000);
    //await this.driver.wait(until.alertIsPresent() 20 * 1000));
  }

  async waitUntilCardSelected() {
    var retryTimes = 5;
    var card = "";
    while (retryTimes >= 0) {
      try {
        if (retryTimes === 0) {
          const errorMessage = "wait until card selected fail";
          setLog({
            level: "error",
            message: errorMessage,
          });
          throw new Error(errorMessage);
        }
        // card = await getElementValue(this.driver, until.elementLocated(By.id("accList")), 5 * 1000);
        card = await this.driver.executeScript("return document.getElementById('accList').value");
        if (card != "0") {
          setLog({ level: "info", message: "wait until card selected success" });
          break;
        }
        await executeJavaScript(
          this.driver,
          "set accList card  ",
          "document.getElementById('accList').selectedIndex = 1;",
          0,
        );
        await executeJavaScript(
          this.driver,
          "set accList card  page js",
          this.task.bank.chineseName.indexOf("北京银行") > -1
            ? "ajaxQueryBankName()"
            : "ajaxQueryAccount1()",
          1000,
        );
        await this.driver.sleep(3000);
      } catch (error) {
        if (error.name === "OperationalError" || error.name === "JavascriptError") {
          setLog({
            level: "warn",
            message: `wait until card selected fail, ${retryTimes} times, Error: ${error}`,
          });
          continue;
        }
        throw error;
      } finally {
        retryTimes--;
      }
    }
  }

  async waitUntilBankSelected() {
    var retryTimes = 5;
    var bank = "";
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
        //选银行
        await executeJavaScript(
          this.driver,
          "set bank",
          "document.getElementById('bankTypeSle').selectedIndex = " +
            this.bankMapppingList[this.task.bank.chineseName] +
            ";",
          0,
        );
        await executeJavaScript(
          this.driver,
          "set bank",
          "bankTypeChange(document.getElementById('bankTypeSle'))",
          0,
        );
        //查询银行
        bank = await this.driver.executeScript(
          "return document.getElementById('onlytd').innerHTML",
        );
        if (bank.length > 0) {
          setLog({ level: "info", message: "wait until bank selected success" });
          break;
        }
        await this.driver.sleep(4000); // 需要给这个 银行查找一些时间
      } catch (error) {
        if (
          error.name === "OperationalError" ||
          error.name === "JavascriptError" ||
          error.name === "UnexpectedAlertOpenError"
        ) {
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
    var amountCssPath = "table.form>tbody>tr:nth-child(7)>td:nth-child(2)";
    var nameCssPath = "table.form>tbody>tr:nth-child(4)>td:nth-child(4)";
    var cardCssPath = "table.form>tbody>tr:nth-child(4)>td:nth-child(2)";

    if (this.task.bank.chineseName.indexOf("北京银行") > -1) {
      amountCssPath = "table.form>tbody>tr:nth-child(3)>td:nth-child(2)";
      nameCssPath = "table.form>tbody>tr:nth-child(2)>td:nth-child(4)";
      cardCssPath = "table.form>tbody>tr:nth-child(2)>td:nth-child(2)";
    }
    var amount = await this.driver.findElement(By.css(amountCssPath)).getText();
    var name = await this.driver.findElement(By.css(nameCssPath)).getText();
    var card = await this.driver.findElement(By.css(cardCssPath)).getText();

    amount = amount.replace(/,/g, "");
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
}
