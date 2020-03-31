import { ThenableWebDriver } from "selenium-webdriver";
import { By, until } from "selenium-webdriver";
import * as KeySender from "./utils/keySender";
import * as BankActivexTool from "./utils/bankActivexTool";

import {
  executeJavaScript,
  waitPageLoad,
  getElementValue,
  waitUtilGetText,
  sendKeysV2,
  isElementExist,
} from "./utils/seleniumHelper";
import {
  getCurrentCardDetail,
  getSelectedTaskDetail,
  setBankBalance,
  setLog,
} from "./utils/storeHelper";
import { OperationalError } from "./utils/workerErrorHandler";
import * as regexHelper from "./utils/regexHelper";
import cheerio from "cheerio";
import * as FormatHelper from "./utils/formatHelper";
import moment from "moment";
import * as ScreenshotHelper from "./utils/screenshotHelper";
import * as WindowFocusTool from "./utils/windowFocusTool";
import * as UsbTrigger from "./utils/usbTrigger";
import * as RegexHelper from "./utils/regexHelper";
import { info } from "winston";
import { TouchBarSlider } from "electron";
const HOME_PAGE = "success in home page";
const CHECK_PAGE = "success in check page";

export default class {
  constructor() {
    /** @type { ThenableWebDriver } */
    this.bankCode = "ICBC";
    this.driver = null;
    this.bankURL = "https://mybank.icbc.com.cn/icbc/newperbank/perbank3/frame/frame_index.jsp";
    this.card = {};
    this.task = "";
    this.charge = 0;
    this.transactionTime = "";
    this.page = "";
    this.bankMapppingList = {
      中国工商银行: "setBankInfo(102,'中国工商银行')",
      中国农业银行: "setBankInfo(103,'中国农业银行')",
      中国银行: "setBankInfo(104,'中国银行')",
      中国建设银行: "setBankInfo(105,'中国建设银行')",
      交通银行: "setBankInfo(301,'交通银行')",

      中信银行: "setBankInfo(302,'中信银行')",
      光大银行: "setBankInfo(303,'中国光大银行')",
      华夏银行: "setBankInfo(304,'华夏银行')",
      民生银行: "setBankInfo(305,'中国民生银行')",
      广发银行: "setBankInfo(306,'广发银行')",
      广州发展银行: "setBankInfo(306,'广发银行')",

      平安银行: "setBankInfo(307,'平安银行')",
      招商银行: "setBankInfo(308,'招商银行')",
      兴业银行: "setBankInfo(309,'兴业银行')",
      浦发银行: "setBankInfo(310,'上海浦东发展银行')",
      浦东发展银行: "setBankInfo(310,'上海浦东发展银行')",
      城市商业银行: "setBankInfo(313,'城市商业银行')",

      农村商业银行: "setBankInfo(314,'农村商业银行')",
      恒丰银行: "setBankInfo(315,'恒丰银行')",
      浙商银行: "setBankInfo(316,'浙商银行')",
      渤海银行: "setBankInfo(318,'渤海银行')",
      中国邮政储蓄银行: "setBankInfo(403,'邮储银行')",
      北京银行: "setBankInfo(313,'北京银行')",
    };
  }

  async launchSelenium() {
    try {
      await this.driver.get(this.bankURL);
      await this.removeNewbieGuide();
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  async removeNewbieGuide() {
    try {
      await this.driver.wait(until.elementLocated(By.css("#threemap>area")), 1000);
      this.actionStartLog("removeNewbieGuide");
      await executeJavaScript(
        this.driver,
        "清理新手教學",
        "document.querySelector('#threemap>area').click()",
        0,
      );
      await this.driver.wait(
        until.urlIs("https://mybank.icbc.com.cn/icbc/newperbank/perbank3/frame/frame_index.jsp"),
        30000,
      );
      await waitPageLoad(this.driver);
    } catch (error) {
      if (error.name === "TimeoutError") {
        return;
      }
      throw error;
    }
  }

  async inputSignInInformation() {
    await this.waitForLoginFrame();
    try {
      await this.inputAccountName();
      await this.inputLoginPassword();
      await this.focusLoginPasswordField();
      await this.focusLoginVerifyField();
      await this.waitForInputVerifyField();
    } catch (error) {
      switch (error.name) {
        case "TimeoutError":
          setLog({
            level: "error",
            message: "wait for login in over time",
          });
          break;
        default:
          setLog({
            level: "error",
            message: error,
          });
          break;
      }
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }
  async focusLoginPasswordField() {
    this.actionStartLog("focusLoginPasswordField");
    await executeJavaScript(
      this.driver,
      "Focus password field",
      "document.getElementById('safeEdit1').focus()",
      500,
    );
  }

  async waitForLoginFrame() {
    this.actionStartLog("wait for login frame");
    await this.driver.wait(until.elementLocated(By.id("ICBC_login_frame")), 30 * 1000);
    await this.driver.switchTo().frame("ICBC_login_frame");
    await this.driver.wait(until.elementLocated(By.id("logonCardNum")), 30 * 1000);
    //ElementNotVisibleError
  }

  async inputAccountName() {
    this.actionStartLog("input account name");

    await sendKeysV2(
      this.driver,
      this.driver.wait(until.elementLocated(By.id("logonCardNum")), 5 * 1000),
      {
        text: this.card.accountName,
      },
    );
  }

  async inputLoginPassword() {
    setLog({
      level: "info",
      message: "start to input login password",
    });
    var passwordInputResult = await BankActivexTool.execute(
      this.bankCode,
      "InputLoginPassword",
      this.getCardInfo(),
    );
    if (passwordInputResult < 1)
      throw new Error(`input account password fail with code - ${passwordInputResult}`);
  }

  async focusLoginVerifyField() {
    this.actionStartLog("focusLoginVerifyField");
    await executeJavaScript(
      this.driver,
      "Focus verify code field",
      "document.getElementById('verifyCodeCn').focus()",
      100,
    );
  }

  async waitForInputVerifyField() {
    this.actionStartLog(`wait for input verify field`);
    await this.driver.wait(
      until.urlIs("https://epass.icbc.com.cn/servlet/ICBCINBSReqServlet"),
      120 * 1000,
    );
    this.logInfo(`login success`);
  }

  async submitToSignIn() {
    await this.driver.wait(
      until.urlIs("https://epass.icbc.com.cn/servlet/ICBCINBSReqServlet"),
      30000,
    );
    this.actionStartLog(`submitToSignIn`);
    await waitPageLoad(this.driver);
    await this.switchToUkeyValidationTab();
    await this.pressToShowUsbPopup(3);
    await this.proccessUkey();
    await this.cancelValidationRecord();
  }

  async proccessUkey() {
    await this.driver.wait(until.alertIsPresent(), 10 * 1000);

    if ((await this.getCurrenttage()) === 2) {
      await this.inputUkeyPasswrod();
      await this.driver.wait(until.alertIsPresent(), 10 * 1000);
    }
    await this.clickUkey(1 * 1000);
  }

  async getCurrenttage() {
    var retry = 3;
    while (retry > 0) {
      var currentStage = await BankActivexTool.execute(
        this.bankCode,
        "GetCurrentStage",
        this.getCardInfo(),
      );
      if (currentStage > 0) return currentStage;
      retry--;
    }
    throw new Error(`can not get current stage from activex tool`);
  }

  async switchToUkeyValidationTab() {
    this.actionStartLog("switch to Ukey validation tab");
    try {
      await executeJavaScript(
        this.driver,
        "Switch to 安全工具认证",
        "document.querySelector('#ebdp-pc4promote-menu-level1-text-2').click();",
        1000,
      );

      await this.driver.wait(until.elementLocated(By.id("integratemainFrame")), 5 * 1000);
      await this.driver.switchTo().frame("integratemainFrame");

      await this.driver.wait(until.elementLocated(By.id("queding")), 30 * 1000);
      this.logInfo("switch to Ukey validation tab success");
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  async pressToShowUsbPopup(retryTimes) {
    this.actionStartLog("press button to show Usb popup");
    let retry = retryTimes;
    await this.driver.wait(until.elementLocated(By.id("integratemainFrame")), 5 * 1000);

    while (retry > 0) {
      try {
        await this.driver.switchTo().frame("integratemainFrame");
        await this.driver.wait(until.elementLocated(By.id("otherMedium")), 30 * 1000);

        await this.driver.findElement(By.id("queding")).click();

        await this.driver.wait(until.alertIsPresent(), 10 * 1000);
        this.logInfo("usb pop up showed");
        break;
      } catch (error) {
        setLog({ level: "warn", message: `點擊後出現未預期情況 ${error}` });
        retry--;
        continue;
      }
    }
  }

  async inputUkeyPasswrod() {
    this.actionStartLog("send Ukey password to Login");
    var result = await BankActivexTool.execute(
      this.bankCode,
      "ProcessUSBInput",
      this.getCardInfo(),
    );
    await this.driver.wait(until.alertIsPresent(), 10 * 1000);
    if (result < 1) throw new Error(`input Ukey password fail with code - ${result}`);
    this.logInfo("input Ukey password success");
  }

  getCardInfo() {
    return JSON.stringify(this.card);
  }

  async cancelValidationRecord() {
    this.actionStartLog("cancel validation record");
    await this.driver.wait(until.elementLocated(By.id("saveForm"), 10 * 1000));
    await this.driver
      .wait(until.elementLocated(By.css("span > input:nth-child(2)")), 10 * 1000)
      .click();

    await this.driver.wait(until.elementLocated(By.id("queding")), 5 * 1000).click();
    this.logInfo("cancel validation record end");
  }

  async clickUkey(clickInterval) {
    this.actionStartLog("start click Ukey");
    await this.driver.wait(until.alertIsPresent(), 10 * 1000);
    var retry = 3;
    while (retry > 0) {
      try {
        UsbTrigger.run(this.card.accountCode);
        await this.driver.sleep(clickInterval);
        UsbTrigger.run(this.card.accountCode);
        await this.driver.sleep(clickInterval);
        if ((await this.getCurrenttage()) === 4) {
          retry--;
          continue;
        }

        setLog({ level: "info", message: "click Ukey finished" });
        return;
      } catch (error) {
        switch (error.name) {
          case "UnexpectedAlertOpenError":
            retry--;
            break;
          default:
            throw error;
        }
      }
    }
  }

  // U盾认证页面
  // async verifyToolSelectStage() {
  //   try {
  //     var retry = 0;
  //     do {
  //       if (await this.inputLoginUSBKey()) break;
  //       retry++;
  //     } while (retry > 3);
  //     setLog({ level: "info", message: "wait for press double ok" });
  //     // 等待UKey 按下, 按下后的页面有该元素
  //     await this.waitUsbPress(By.css("saveForm"));
  //     // await this.sendUkeyPassword("#queding", By.id("saveForm"));
  //     // setLog({
  //     //   level: "info",
  //     //   message: "wait for usb input 30 seconds",
  //     // });

  //     //await this.driver.switchTo().frame("integratemainFrame");
  //     // 仅测试需要
  //     await this.waitForLoginSuccess();
  //   } finally {
  //     await this.driver.switchTo().defaultContent();
  //   }
  // }

  // async inputLoginUSBKey() {
  //   try {
  //     setLog({ level: "debug", message: "after trigger verify confirm button" });
  //     this.driver.findElement(By.id("queding")).click();
  //     await this.usbStage();
  //     return true;
  //   } catch (verifyPageError) {
  //     setLog({
  //       level: "error",
  //       message: "open veirfy page encouter error: " + verifyPageError.message,
  //     });
  //     return false;
  //   }
  // }

  // // 用于判断页面加载到的是U盾认证页面还是首页
  // async waitForLoginSuccess() {
  //   try {
  //     const url = await this.driver.getCurrentUrl();
  //     if (url.indexOf("frame_guide.jsp") > 0) {
  //       // 清理登陆后的map
  //       await this.removeNewbieGuide();
  //     }
  //     setLog({
  //       level: "info",
  //       message: "wait for user press usb ok" + new Date(),
  //     });
  //     //首頁
  //     await this.driver.wait(until.elementLocated(By.linkText("退出")), 30000);
  //   } catch (error) {
  //     switch (error.name) {
  //       case "TimeoutError":
  //         setLog({
  //           level: "error",
  //           message: "wait for user press usb over time" + new Date(),
  //         });
  //         break;
  //       default:
  //         setLog({
  //           level: "error",
  //           message: error,
  //         });
  //         break;
  //     }
  //     await this.driver.sleep(1000);
  //     // await this.driver.switchTo().window(this.currentWindowHandle);
  //     throw error;
  //   }
  // }

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
    return true;
  }

  //首页时,需要清理掉广告层
  // async clearFlotFrame() {
  //   try {
  //     await this.driver.switchTo().defaultContent();
  //     await this.driver.wait(until.elementLocated(By.css("#ICBC_window_flot_frame")), 3000);
  //     await this.driver.switchTo().frame("ICBC_window_flot_frame");
  //     await this.driver.wait(until.elementLocated(By.css("#content-frame")), 3000);
  //     await this.driver.switchTo().frame("content-frame");
  //     var closeButton = await this.driver.wait(
  //       until.elementLocated(By.css("#div_3>div:nth-child(2)>div")),
  //       3000,
  //     );
  //     //存在广告,点击消除后等待页面加载
  //     await closeButton.click();
  //     await this.driver.sleep(2000);
  //     await waitPageLoad(this.driver);
  //   } catch (error) {
  //     if (error.name === "TimeoutError" || error.name === "NoSuchElementError") {
  //       return;
  //     }
  //     throw error;
  //   } finally {
  //     await this.driver.switchTo().defaultContent();
  //   }
  // }

  async getCookie() {
    const cookie = await this.driver.executeScript("return document.cookie");
    if (!cookie || cookie.length === 0) throw new Error("get cookie failure!");
    return { cookie, session: null };
  }

  // TODO
  async goTransferPage() {
    this.actionStartLog("go to transfer page");
    try {
      await executeJavaScript(
        this.driver,
        "跳转到转账页面",
        "document.querySelector('#commonUseTbl > ul > li:nth-child(3)').click();",
        3 * 1000,
      );
      await this.driver.sleep(3 * 1000);
      await this.driver.wait(until.elementLocated(By.id("perbank-content-frame")), 30 * 1000);
      this.logInfo("in the transfer page now");
      await this.enterFirstFrame();
      await this.enterSecondFrame();
      // 在内层等待 付款卡号显示 页面慢时 有loadding 挡住这个元素
      var loadingStyle = await this.driver
        .wait(until.elementLocated(By.id("loadingDiv")), 10 * 1000)
        .getAttribute("style");
      console.log(loadingStyle);
      await this.waitUntilTransferFormLoaded();
    } catch (error) {
      // if (error.name === "UnsupportedOperationError") {
      //   setLog({
      //     level: "warn",
      //     message: `go to transfer page fail, ${retryTimes} times, Error: ${error}`,
      //   });
      //   await this.goTransferPage(retryTimes - 1);
      // } else {
      //   throw error;
      // }
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  async enterFirstFrame() {
    var retryTimes = 15;
    this.actionStartLog("enter first frame");
    while (retryTimes >= 0) {
      try {
        if (retryTimes === 0) {
          const errorMessage = "Trying enter first iframe fail";
          setLog({
            level: "error",
            message: errorMessage,
          });
          throw new Error(errorMessage);
        }
        await this.driver.switchTo().frame("perbank-content-frame");
        await this.driver.wait(until.elementLocated(By.id("content-frame")), 10 * 1000);
        this.logInfo("In the transfer first frame now");
        break;
      } catch (error) {
        if (error.name === "JavascriptError" || error.name === "TimeoutError") {
          setLog({
            level: "warn",
            message: `Enter first frame fail, ${retryTimes} times, Error: ${error}`,
          });
          continue;
        }
        throw error;
      } finally {
        retryTimes--;
        await this.driver.switchTo().defaultContent();
      }
    }
  }

  async enterSecondFrame() {
    var retryTimes = 15;
    this.actionStartLog("enter second frame");
    while (retryTimes >= 0) {
      try {
        if (retryTimes === 0) {
          const errorMessage = "Trying enter second iframe fail";
          setLog({
            level: "error",
            message: errorMessage,
          });
          throw new Error(errorMessage);
        }
        await this.driver.wait(until.elementLocated(By.id("perbank-content-frame")), 10 * 1000);
        await this.driver.switchTo().frame("perbank-content-frame");

        await this.driver.wait(until.elementLocated(By.id("content-frame")), 10 * 1000);
        await this.driver.switchTo().frame("content-frame");

        const element = await this.driver.wait(
          until.elementLocated(By.id("tr_receiveBank")),
          15 * 1000,
        );

        if (element) {
          this.logInfo("in the second frame");
          break;
        }
        await this.driver.sleep(1000);
      } catch (error) {
        if (
          error.name === "JavascriptError" ||
          error.name === "TimeoutError" ||
          error.name === "NoSuchElementError"
        ) {
          setLog({
            level: "warn",
            message: `Enter second frame fail, ${retryTimes} times, Error: ${error}`,
          });
          await this.driver.switchTo().defaultContent();
          continue;
        }
        throw error;
      } finally {
        retryTimes--;
      }
    }
  }

  async switchToTransferForm() {
    this.actionStartLog("switch to transfer form");
    await this.driver.wait(until.elementLocated(By.id("perbank-content-frame")), 10 * 1000);
    this.driver.switchTo().frame("perbank-content-frame");

    await this.driver.wait(until.elementLocated(By.id("content-frame")), 10 * 1000);
    this.driver.switchTo().frame("content-frame");

    await this.driver.wait(until.elementLocated(By.id("bankListShow")), 10 * 1000);
    this.logInfo("in the transfer form now");
  }

  async waitUntilTransferFormLoaded() {
    this.actionStartLog("wait for transfer form load");
    var retryTimes = 3;
    while (retryTimes >= 0) {
      try {
        if (retryTimes === 0) {
          const errorMessage = "wait until Transfer From Visible";
          setLog({
            level: "error",
            message: errorMessage,
          });
          throw new Error(errorMessage);
        }

        await waitPageLoad(this.driver);
        await this.driver.wait(until.elementLocated(By.id("payCardListShow")), 30 * 1000);
        this.logInfo("transfer form loaded");
        break;
      } catch (error) {
        setLog({ level: "error", message: error.name });
        if (
          error.name === "JavascriptError" ||
          error.name === "TimeoutError" ||
          error.name === "NoSuchElementError"
        ) {
          setLog({
            level: "warn",
            message: `wait until Transfer From Visible fail, ${retryTimes} times, Error: ${error}`,
          });
          continue;
        }
        throw error;
      } finally {
        retryTimes--;
      }
    }
  }

  async fillTransferFrom() {
    await this.switchToTransferForm();
    this.actionStartLog("fill transfer form");
    try {
      this.task = getSelectedTaskDetail();
      this.card = getCurrentCardDetail();

      // name
      await sendKeysV2(
        this.driver,
        this.driver.wait(until.elementLocated(By.id("recNameShow"), 5 * 1000)),
        {
          text: this.task.receiverName,
        },
      );
      // amount
      await sendKeysV2(
        this.driver,
        this.driver.wait(until.elementLocated(By.id("remitAmtInput"), 5 * 1000)),
        {
          text: FormatHelper.amount(this.task.requestAmount),
        },
      );

      // bank
      await executeJavaScript(
        this.driver,
        "执行页面js 设置银行",
        this.bankMapppingList[this.task.bank.chineseName],
        500,
      );

      // card number
      await sendKeysV2(
        this.driver,
        this.driver.wait(until.elementLocated(By.id("recAcctShow"), 5 * 1000)),
        {
          text: this.task.bank.cardNumber,
        },
      );

      this.logInfo("transfer form filled");
      await this.submitTransferForm();
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  async submitTransferForm() {
    this.actionStartLog("submit transfer form");
    await executeJavaScript(
      this.driver,
      "提交表单",
      "document.getElementById('tijiao').click()",
      500,
    );
    await this.driver.wait(until.elementLocated(By.id("queren"), 10 * 1000));
    this.logInfo("submit transfer form success!");
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
          "fill card number",
          `document.getElementById('recAcctShow').value ='${this.task.bank.cardNumber}'`,
          0,
        );
        await executeJavaScript(
          this.driver,
          "focus card number",
          "document.getElementById('recAcctShow').focus()",
        );
        var bankField = this.driver.wait(until.elementLocated(By.id("bankListShow")), 1000);
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

  async waitUntilNameFilled() {
    var retryTimes = 5;
    while (retryTimes >= 0) {
      try {
        if (retryTimes === 0) {
          const errorMessage = "wait until name filled faill";
          setLog({
            level: "error",
            message: errorMessage,
          });
          throw new Error(errorMessage);
        }
        var nameField = this.driver.wait(until.elementLocated(By.id("recNameShow")), 100);
        var name = await getElementValue(nameField);

        if (name === this.task.receiverName) {
          setLog({ level: "info", message: "wait until name filled success" });
          break;
        }
        await executeJavaScript(
          this.driver,
          "fill receiverName",
          `document.getElementById('recNameShow').value ='${this.task.receiverName}'`,
          0,
        );
        await executeJavaScript(
          this.driver,
          "focus receiverName",
          "document.getElementById('recNameShow').focus()",
          500,
        );
      } catch (error) {
        if (error.name === "JavascriptError" || error.name === "TimeoutError") {
          setLog({
            level: "warn",
            message: `wait until name filled fail, ${retryTimes} times, Error: ${error}`,
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
    this.actionStartLog("check submited value");
    var amount = await this.driver
      .wait(until.elementLocated(By.css("#Remit-Money")), 1 * 1000)
      .getText(); //￥11.00
    if (
      FormatHelper.amount(amount.replace("￥", "")) !== FormatHelper.amount(this.task.requestAmount)
    ) {
      throw new Error("amount is incorrect!");
    }

    var nameLine = await this.driver
      .wait(until.elementLocated(By.css("#custName_id")), 1 * 1000)
      .getText(); // 张丽（尾号3878）转账
    var name = nameLine.split("（")[0];
    if (name !== this.task.receiverName) {
      throw new Error("name is incorrect!");
    }

    var card = nameLine.replace(/[^0-9]/gi, "").trim();
    if (!card) {
      card = await this.driver
        .wait(until.elementLocated(By.xpath("//span[@id='custName_id']/..")), 1 * 1000)
        .getText(); //  注意 向 张丽（尾号3878）转账时 结构不一样
      card = card.replace(/[^0-9]/gi, "").trim();
    }

    if (card !== this.task.bank.cardNumber.substr(this.task.bank.cardNumber.length - 4)) {
      throw new Error("Card number is not right!");
    }
    this.charge =
      (await this.driver.wait(until.elementLocated(By.css("#Fee-Money")), 1 * 1000).getText()) ||
      "0"; //"（手续费：7.50元）"
    this.charge = FormatHelper.amount(this.charge.replace(/[^0-9.]/gi, ""));
    this.logInfo("submited value is correct");
  }

  async fillNote() {
    this.actionStartLog("fill note");
    try {
      // final check
      await this.driver.wait(until.elementLocated(By.id("perbank-content-frame")), 10 * 1000);
      this.driver.switchTo().frame("perbank-content-frame");

      await this.driver.wait(until.elementLocated(By.id("content-frame")), 10 * 1000);
      this.driver.switchTo().frame("content-frame");
      await this.checkSubmitedValue();
      this.logInfo("note filled");
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }
  async confirmTransferMessage() {
    await this.driver.wait(until.elementLocated(By.id("txmainfrm")));
    await this.driver.switchTo().frame("txmainfrm");
    await this.driver.wait(until.elementLocated(By.css("input.btn[type=submit]"))).click();

    //FIXME:
    // Not detected disable
    await this.driver.wait(until.elementIsDisabled(By.css("input.btn[type=submit]")));

    // Key in usb key
    await KeySender.sendText("abc123");
    // await KeySender.sendKey(KeySender.KeyEnum.RETURN);
  }
  async getBalance() {
    this.actionStartLog("get balance");
    try {
      await executeJavaScript(
        this.driver,
        "跳转到账户页面",
        "document.querySelector('#commonUseTbl > ul > li:nth-child(1)').click();",
        0,
      );
      await this.driver.sleep(3000);
      await this.enterFirstFrame(); // 等待页面加载
      await this.driver.wait(until.elementLocated(By.id("perbank-content-frame")), 30 * 1000);
      await this.driver.switchTo().frame("perbank-content-frame");
      await this.driver.wait(until.elementLocated(By.id("content-frame")), 30 * 1000);
      await this.driver.switchTo().frame("content-frame");

      var cssPath = "table.card-money-table.show-span>tbody>tr>td:nth-child(3)>span.active";
      await this.driver.wait(
        until.elementIsVisible(
          await this.driver.wait(until.elementLocated(By.css(cssPath)), 30 * 1000),
        ),
        30 * 1000,
      );

      var balance = await waitUtilGetText(this.driver, until.elementLocated(By.css(cssPath)));
      setBankBalance(FormatHelper.amount(balance));
      this.logInfo("balance got");
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }
  async switchToUkeyValidationForTransfer() {
    this.actionStartLog("switch to ukey validation for transfer");
    var isRequire = await this.isRequireMobile();
    if (!isRequire) {
      await executeJavaScript(
        this.driver,
        "触发确认按钮",
        // TODO use focus instead
        "setTimeout(function(){document.querySelector('#queren').click();},500)",
        0,
      );
      this.logInfo("Switched to Ukey validation");
    }
    this.logInfo("No need to switch to Ukey validation");
  }

  async confirmTransaction() {
    this.actionStartLog("confirm transaction");
    try {
      await this.driver.switchTo().frame("perbank-content-frame");
      await this.driver.switchTo().frame("content-frame");
      await this.switchToUkeyValidationForTransfer();
      await this.driver.wait(until.alertIsPresent(), 10 * 1000);
      await this.proccessUkey();

      var status = await this.driver
        .wait(until.elementLocated(By.css("div.bigFontSize")), 30 * 1000)
        .getText();
      var result = status.indexOf("成功") !== -1;
      this.logInfo(`confirm result - ${result}`);
      return result;
      // var status1 = await this.driver
      //   .wait(until.elementLocated(By.css("div.middleFontSize")), 1 * 1000)
      //   .getText();已实时到账
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  // async sendUkeyPassword(button, successItem) {
  //   var retryTimes = 5;
  //   while (retryTimes >= 0) {
  //     try {
  //       var buttonExist = await isElementExist(this.driver, By.css(button));
  //       if (!buttonExist) {
  //         setLog({ level: "info", message: "Ukey password is right" });
  //         break;
  //       }
  //       var url = await this.driver.getCurrentUrl();
  //       if (button === "#queding" && url.indexOf("frame_index.jsp")) {
  //         setLog({ level: "info", message: "Ukey password is right,login home page" });
  //         break;
  //       }
  //       setLog({ level: "error", message: "Ukey password is incorrect... retry" });
  //       //触发按钮仍然存在 那就是密码没有对 再次触发
  //       await executeJavaScript(
  //         this.driver,
  //         "触发确认按钮",
  //         `setTimeout(function(){document.querySelector('${button}').click();},500)`,
  //         0,
  //       );
  //       await this.inputUSBKey();
  //       await this.waitUsbPress(successItem);
  //       if (retryTimes === 0) {
  //         throw new OperationalError("Send ukey password fail, please restart the task");
  //       }
  //     } catch (error) {
  //       if (error.name === "OperationalError") {
  //         setLog({ level: "error", message: error.message });
  //         throw new Error(error.message);
  //       } else if (error.name === "UnexpectedAlertOpenError") {
  //         // this means usb password showed, so the password input correctly
  //         setLog({ level: "warn", message: "Catch dialog popup" });
  //         break;
  //       } else throw error;
  //     } finally {
  //       retryTimes--;
  //     }
  //   }
  // }

  async checkIfSuccess() {
    try {
      ScreenshotHelper.capture(
        "ICBC-" + this.card.accountCode + "-" + this.task.id + "-transactionResult",
      );
      await this.driver.switchTo().frame("perbank-content-frame");
      await this.driver.switchTo().frame("content-frame");
      var status = await this.driver
        .wait(until.elementLocated(By.css("div.bigFontSize")), 10 * 1000)
        .getText();

      if (status.indexOf("成功") !== -1) return true;

      await this.checkTransferRecord();
      return true;
    } catch (error) {
      setLog({ level: "error", message: error.message });
      return false;
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  async goTransferRecordPage(retryTimes = 2) {
    try {
      if (retryTimes === 0) {
        const errorMessage = "go to transfer record page fail";
        setLog({
          level: "error",
          message: errorMessage,
        });
        throw new Error(errorMessage);
      }
      await this.driver.switchTo().defaultContent();
      await executeJavaScript(
        this.driver,
        "click account button",
        "document.getElementById('PBL200811r').click()",
        0,
      );
      await this.driver.sleep(3000);
      await waitPageLoad(this.driver);
      await this.driver.wait(until.elementLocated(By.css("#perbank-content-frame")), 30 * 1000);
      await this.driver.switchTo().frame("perbank-content-frame");

      await this.driver.wait(until.elementLocated(By.css("#content-frame")), 30 * 1000);
      await this.driver.switchTo().frame("content-frame");
      await this.driver.wait(
        until.elementIsVisible(
          await this.driver.wait(until.elementLocated(By.id("payCardListShow")), 30 * 1000),
        ),
        30 * 1000,
      );
      await this.driver.switchTo().defaultContent();
      await this.driver.switchTo().frame("perbank-content-frame");
      await this.driver.wait(
        until.elementLocated(By.css("#ebdp-pc4promote-menu-level1-text-3")),
        30 * 1000,
      );
    } catch (error) {
      if (error.name === "JavascriptError") {
        setLog({
          level: "warn",
          message: `go to transfer record page fail, ${retryTimes} times, Error: ${error}`,
        });
        await this.goTransferRecordPage(retryTimes - 1);
      }
    }
  }

  async waitUntilTransactionPageLoaded() {
    var retryTimes = 20;
    while (retryTimes >= 0) {
      try {
        if (retryTimes === 0) {
          const errorMessage = "wait until transaction page loaded fail";
          setLog({
            level: "error",
            message: errorMessage,
          });
          throw new Error(errorMessage);
        }
        await this.driver.sleep(1 * 1000);
        var startDateField = await this.driver.wait(
          until.elementLocated(By.id("datepicker1-beginDate")),
          10 * 1000,
        );
        var endDateField = await this.driver.wait(
          until.elementLocated(By.id("datepicker1-endDate")),
          10 * 1000,
        );
        var [startDate, endDate] = await Promise.all([
          getElementValue(startDateField),
          getElementValue(endDateField),
        ]);
        if (
          startDate.replace(RegexHelper.removeSpace, "") &&
          endDate.replace(RegexHelper.removeSpace, "")
        ) {
          break;
        }
      } catch (error) {
        if (error.name === "TimeoutError") {
          setLog({
            level: "warn",
            message: `wait until search head loaded, ${retryTimes} times, Error: ${error}`,
          });
          continue;
        }
        throw error;
      } finally {
        retryTimes--;
      }
    }
  }

  // div.datepicker1-link>span class need is ebdp-pc4promote-datepicker-button ebdp-pc4promote-datepicker-button-selected

  async waitUntilCurDateButtonSelected() {
    var retryTimes = 20;
    while (retryTimes >= 0) {
      try {
        if (retryTimes === 0) {
          const errorMessage = "wait until cur button selected";
          setLog({
            level: "error",
            message: errorMessage,
          });
          throw new Error(errorMessage);
        }
        var curDateButton = await this.driver.wait(
          until.elementLocated(By.css("div#datepicker1-link>span")),
          10 * 1000,
        );
        var className = await curDateButton.getAttribute("class");
        if (className.indexOf("selected") > 0) {
          break;
        }
        await executeJavaScript(
          this.driver,
          "click cur date button",
          "document.querySelector('#datepicker1-link>.ebdp-pc4promote-datepicker-button:nth-child(1)').click()",
          500,
        );
      } catch (error) {
        if (error.name === "TimeoutError" || error.name === "JavascriptError") {
          setLog({
            level: "warn",
            message: `wait until cur button selected, ${retryTimes} times, Error: ${error}`,
          });
          continue;
        }
        throw error;
      } finally {
        retryTimes--;
      }
    }
  }

  async checkTransferRecord(retryTimes = 2) {
    try {
      if (retryTimes === 0) {
        const errorMessage = "check transfer record fail";
        setLog({
          level: "error",
          message: errorMessage,
        });
        throw new Error(errorMessage);
      }
      // 准备消除弹框
      WindowFocusTool.focusAndCheckIE();

      setTimeout(async () => {
        await KeySender.sendKey(KeySender.KeyEnum.RETURN);
      }, 5 * 1000);
      // 按下后可能会有弹框

      await this.driver.switchTo().defaultContent();
      await this.driver.switchTo().frame("perbank-content-frame");
      await executeJavaScript(
        this.driver,
        "click mingxi button",
        "document.querySelector('#ebdp-pc4promote-menu-level1-text-3').click()",
        0,
      );

      await this.driver.wait(until.elementLocated(By.css("#content-frame")), 30 * 1000);
      await this.driver.switchTo().frame("content-frame");
      await this.waitUntilTransactionPageLoaded();

      await this.driver.wait(
        until.elementLocated(By.css(".ebdp-pc4promote-datepicker-button")),
        30 * 1000,
      );
      await executeJavaScript(
        this.driver,
        "click cur date button",
        "document.querySelector('#datepicker1-link>.ebdp-pc4promote-datepicker-button:nth-child(1)').click()",
        0,
      );
      await this.waitUntilCurDateButtonSelected();
      await executeJavaScript(
        this.driver,
        "click cur date button",
        "document.querySelector('#queren').click()",
        1000,
      );
      await this.driver.wait(until.elementLocated(By.css("table.lst")), 60 * 1000);

      var tableElement = await this.driver.wait(
        until.elementLocated(By.css("table.lst>tbody")),
        30 * 1000,
      );

      ScreenshotHelper.capture(
        "ICBC-" + this.card.accountCode + "-" + this.task.id + "-checkTransferHistory",
      );
      var tableHtml = await tableElement.getAttribute("outerHTML");

      const $ = cheerio.load(tableHtml, {
        xmlMode: true,
      });

      const transactions = $("tbody > tr");
      let isTransferSuccess = false;

      transactions.each((index, transaction) => {
        if (index > 0) {
          let date = transaction.children[1].children[0].children[0].data
            .replace("年", "-")
            .replace("月", "-")
            .replace("日", "");
          let receiverName = transaction.children[3].children[1].children[0].data.trim();
          let receiverAccount = transaction.children[5].children[0].children[0].data.replace(
            /\s/g,
            "",
          );
          let amount = FormatHelper.amount(transaction.children[7].children[0].data);
          let status = transaction.children[9].children[0].data.trim();
          if (
            moment(date).diff(moment(this.transactionTime), "seconds") <= 30 &&
            receiverName === this.task.receiverName &&
            receiverAccount === this.task.bank.cardNumber &&
            amount === FormatHelper.amount(this.task.requestAmount) &&
            status === "交易成功"
          ) {
            isTransferSuccess = true;
          }
        }
      });
      return isTransferSuccess;
    } catch (error) {
      // 有弹窗或者网络问题时需要重新执行
      if (
        error.name === "OperationalError" ||
        error.name === "UnexpectedAlertOpenError" ||
        error.name === "TimeoutError" ||
        error.name === "NoSuchWindowError"
      ) {
        setLog({
          level: "error",
          message: error.message,
        });
        // await this.checkTransferRecord(retryTimes - 1);
      }
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  // 确认页面有时候需要切换认证方式
  async isRequireMobile() {
    try {
      await this.driver.wait(until.elementLocated(By.css("#getSMSCode")), 1000);
      await executeJavaScript(
        this.driver,
        "click otherMedium",
        "document.getElementById('otherMedium').click()",
        0,
      );
      await executeJavaScript(
        this.driver,
        "click  usb check",
        "document.getElementById('ebdp-pc4promote-floattip0').click()",
        500,
      );
      await this.driver.sleep(3000);
      // var s = await this.driver.wait(until.elementLocated(By.css("#queren")), 1000);
      // await s.click();
      await executeJavaScript(
        this.driver,
        "触发确认按钮",
        "setTimeout(function(){document.querySelector('#queren').click();},500)",
        0,
      );

      return true;
    } catch (error) {
      if (error.name === "TimeoutError" || error.name === "NoSuchElementError") {
        return false;
      }
      throw error;
    }
  }

  async sendUSBKey() {}
  async inputUSBKey(waitTime) {
    setLog({
      level: "info",
      message: "inputing usb password",
    });
    if (!waitTime) waitTime = 10000;
    await KeySender.sendText(this.card.usbPassword, waitTime, 300);
    await KeySender.sendKey(KeySender.KeyEnum.RETURN, 1500);
    // 当错误时能按下,消除弹框 (正确时不影响)
    await KeySender.sendKey(KeySender.KeyEnum.TAB, 500);
    await KeySender.sendKey(KeySender.KeyEnum.RETURN, 500);

    setLog({
      level: "info",
      message: "input usb password finished",
    });
  }

  // async usbStage() {
  //   setLog({
  //     level: "info",
  //     message: "wait for usb box is present",
  //   });
  //   await this.driver.wait(until.alertIsPresent(), 3000);
  //   setLog({
  //     level: "info",
  //     message: "usb box is presented",
  //   });
  //   this.inputUSBKey(1000);

  //   //wait for 6 seconds
  //   try {
  //     await this.driver.wait(until.alertIsPresent(), 6 * 1000);
  //     setLog({
  //       level: "info",
  //       message: "usb box is presented",
  //     });
  //   } catch (pressOkButtonError) {
  //     setLog({
  //       level: "error",
  //       message: "usb press ok button not present",
  //     });
  //   }
  // }

  // async waitUsbPress(locator) {
  //   var retryTimes = 20;
  //   while (retryTimes >= 0) {
  //     try {
  //       await this.driver.sleep(3 * 1000);
  //       UsbTrigger.run(this.card.accountCode);
  //       await this.driver.sleep(1 * 1000);
  //       UsbTrigger.run(this.card.accountCode);
  //       await this.driver.sleep(3 * 1000);
  //       // this wait 20 sec it because we need to wait the success page
  //       var message = await this.driver.wait(until.elementLocated(locator), 20 * 1000);

  //       if (message) {
  //         setLog({ level: "info", message: "USB pressed" });
  //         break;
  //       }

  //       if (retryTimes === 0)
  //         throw new OperationalError("USB didn't press, please restart the task");
  //     } catch (error) {
  //       if (error.name === "UnexpectedAlertOpenError") {
  //         setLog({
  //           level: "warn",
  //           message: `Waiting for usb press, remaining times: ${retryTimes}`,
  //         });
  //       } else if (error.name === "OperationalError") {
  //         setLog({ level: "error", message: error.message });
  //         throw error;
  //       } else if (error.name === "TimeoutError") {
  //         setLog({ level: "warn", message: `Can't get the element ${locator}` });
  //         break;
  //       } else throw error;
  //     } finally {
  //       retryTimes--;
  //     }
  //   }
  // }

  actionStartLog(message) {
    setLog({
      level: "info",
      message: `${this.card.accountCode}: start to ${message}`,
    });
  }
  logInfo(message) {
    setLog({
      level: "info",
      message: `${this.card.accountCode}: ${message}`,
    });
  }
}
