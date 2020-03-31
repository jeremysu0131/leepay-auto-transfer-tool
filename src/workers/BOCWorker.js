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
    this.bankURL = "https://ebsnew.boc.cn/boc15/login.html";
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
      var name = this.driver.findElement(By.id("txt_username_79443"));
      await name.sendKeys(this.card.accountName);
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
    await executeJavaScript(
      this.driver,
      "click transfer <a> tag ",
      "document.getElementsByTagName('a')[10].click() ",
    );
    await this.driver.sleep(2000);
    await this.driver.wait(until.elementLocated(By.id("subMenu")), 20 * 1000);
    if (this.task.bank.chineseName.indexOf("中国银行") === 0) {
      await executeJavaScript(
        this.driver,
        "click inner transfer <a> tag ",
        "document.getElementsByTagName('a')[34].click() ",
      );
      await waitPageLoad(this.driver);
      await this.driver.wait(until.elementLocated(By.id("txt_transamount_471")), 30 * 1000);
      await this.driver.wait(
        until.elementIsVisible(await this.driver.findElement(By.id("txt_transamount_471"))),
        20 * 1000,
      );
    } else {
      await executeJavaScript(
        this.driver,
        "click out transfer <a> tag ",
        "document.getElementsByTagName('a')[35].click() ",
      );
      await waitPageLoad(this.driver);
      await this.driver.wait(until.elementLocated(By.id("txt_transamount_1690")), 30 * 1000);
      await this.driver.wait(
        until.elementIsVisible(await this.driver.findElement(By.id("txt_transamount_1690"))),
        20 * 1000,
      );
    }
  }

  async fillTransferFrom() {
    if (this.task.bank.chineseName.indexOf("中国银行") > -1) {
      await this.fillTransferFromSameBank();
    } else {
      await this.fillTransferFromDifferentBank();
    }
  }

  async fillTransferFromSameBank() {
    var box = this.driver.findElement(By.id("ajaxLoading"));
    if (await box.isDisplayed()) {
      await executeJavaScript(
        this.driver,
        "let div not display ",
        "document.getElementById('ajaxLoading').style.display='none'",
      );
      //await this.driver.sleep(3000);
    }

    // Account
    await sendKeysV2(
      this.driver,
      this.driver.wait(until.elementLocated(By.id("txt_transinaccparent_458"), 5 * 1000)),
      {
        text: this.task.bank.cardNumber,
        replaceRule: regexHelper.removeSpace,
      },
    );

    //触发账户, 账户不被触发会弹出关联账户询问框
    await this.waitUntilBankTrigger();
    // Name
    await sendKeysV2(
      this.driver,
      this.driver.wait(until.elementLocated(By.id("txt_payeename_455"), 5 * 1000)),
      {
        text: this.task.receiverName,
      },
    );
    // Amount
    await sendKeysV2(
      this.driver,
      this.driver.wait(until.elementLocated(By.id("txt_transamount_471"), 5 * 1000)),
      {
        text: Number.parseFloat(this.task.requestAmount).toFixed(2),
        replaceRule: /,/g,
      },
    );

    //choose ca
    await executeJavaScript(
      this.driver,
      "click CA choose  ",
      "document.getElementById('trans_tips_ca_180528').click()",
    );
    await this.driver.sleep(1000);

    //next step
    await executeJavaScript(
      this.driver,
      "click submit button  ",
      "document.getElementById('btnBocTransferNext').click()",
    );
    //await this.driver.wait(until.elementLocated(By.id("hideMsgBox"), 20 * 1000));
    this.driver.wait(
      until.elementIsVisible(await this.driver.findElement(By.id("hideMsgBox"))),
      15 * 1000,
    );

    await this.checkSubmitedValue();
  }

  async fillTransferFromDifferentBank() {
    var box = this.driver.findElement(By.id("ajaxLoading"));
    if (await box.isDisplayed()) {
      await executeJavaScript(
        this.driver,
        "let div not display ",
        "document.getElementById('ajaxLoading').style.display='none'",
      );
    }
    // Name
    await sendKeysV2(
      this.driver,
      this.driver.wait(until.elementLocated(By.id("txt_payeename_1600"), 5 * 1000)),
      {
        text: this.task.receiverName,
      },
    );

    // Account
    await sendKeysV2(
      this.driver,
      this.driver.wait(until.elementLocated(By.id("txt_transinaccparent_1601"), 5 * 1000)),
      {
        text: this.task.bank.cardNumber,
        replaceRule: regexHelper.removeSpace,
      },
    );

    await this.waitUntilBankSelected();
    // wait amount visible
    this.driver.wait(
      until.elementIsVisible(await this.driver.findElement(By.id("txt_transamount_1690"))),
      15 * 1000,
    );
    // Amount
    await sendKeysV2(
      this.driver,
      this.driver.wait(until.elementLocated(By.id("txt_transamount_1690"), 5 * 1000)),
      {
        text: Number.parseFloat(this.task.requestAmount).toFixed(2),
        replaceRule: /,/g,
      },
    );

    // await executeJavaScript( this.driver,"keep default value  "," document.getElementById('rd_choose_security_tool_17637_2').checked = true ",0,);
    await executeJavaScript(
      this.driver,
      "submit form  ",
      "document.getElementById('btn_nextstep_1732').click()",
      500,
    );

    this.driver.wait(
      until.elementIsVisible(await this.driver.findElement(By.id("hideMsgBox"))),
      15 * 1000,
    );

    await this.checkSubmitedValue();
  }

  async waitUntilBankTrigger() {
    var retryTimes = 20;
    while (retryTimes >= 0) {
      try {
        if (retryTimes === 0) {
          const errorMessage = "wait until bank trigger fail";
          setLog({
            level: "error",
            message: errorMessage,
          });
          throw new Error(errorMessage);
        }
        var box = this.driver.findElement(By.id("inputAccount"));
        if (!(await box.isDisplayed())) {
          setLog({ level: "info", message: "wait until bank trigger success" });
          break;
        }

        // 账户 收款人交替 使得收款账户触发
        await executeJavaScript(
          this.driver,
          "focus account input ",
          "document.getElementById('txt_transinaccparent_458').focus()",
        );
        await executeJavaScript(
          this.driver,
          "focus name input ",
          "document.getElementById('txt_payeename_455').focus()",
        );
      } catch (error) {
        if (error.name === "JavascriptError" || error.name === "TimeoutError") {
          setLog({
            level: "warn",
            message: `wait until bank trigger fail, ${retryTimes} times, Error: ${error}`,
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
        var bank = await waitUtilGetText(
          this.driver,
          until.elementLocated(By.id("txt_addaccforbank_1664")),
        );

        if (bank.length) {
          if (bank.indexOf("请选择银行") < 0 || bank.indexOf("Please select bank") < 0) {
            setLog({ level: "info", message: "wait until bank selected success" });
            break;
          }
        }
        await executeJavaScript(
          this.driver,
          "clear account number ",
          "document.getElementById('txt_transinaccparent_1601').value=''",
        );
        await sendKeysV2(
          this.driver,
          this.driver.wait(until.elementLocated(By.id("txt_transinaccparent_1601"), 1000)),
          { text: this.task.bank.cardNumber },
        );
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
    var amountCssPath = "ul.layout-lr.layout-lr45.border-box>li:nth-child(3)>div";
    var nameCssPath = "ul.layout-lr.layout-lr45.border-box>li:nth-child(4)>div";
    var cardCssPath = "ul.layout-lr.layout-lr45.border-box>li:nth-child(5)>div";

    if (this.task.bank.chineseName.indexOf("中国银行") > -1) {
      amountCssPath = "ul.layout-lr.layout-lr45>li:nth-child(5)>div";
      nameCssPath = "ul.layout-lr.layout-lr45>li:nth-child(3)>div";
      cardCssPath = "ul.layout-lr.layout-lr45>li:nth-child(2)>div";
    }
    var amount = await this.driver.findElement(By.css(amountCssPath)).getText();
    var name = await this.driver.findElement(By.css(nameCssPath)).getText();
    var card = await this.driver.findElement(By.css(cardCssPath)).getText();

    amount = amount.replace(/,/g, "");
    card = card.replace(/[^0-9]/gi, "").trim();
    console.log(amount);
    console.log(card);
    console.log(name);

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
