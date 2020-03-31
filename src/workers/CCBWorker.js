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
    this.bankURL = "https://ibsbjstar.ccb.com.cn/CCBIS/V6/common/login.jsp";
    this.card = getCurrentCardDetail();
    this.task = "";
    this.bankMapppingList = {
      中国建设银行: "getBankInfo('ccb','中国建设银行')",
      中国工商银行: "getBankInfo('102100099996','中国工商银行') ",
      中国农业银行: "getBankInfo('103100000026','中国农业银行')",
      中国银行: "getBankInfo('104000000000','中国银行')",
      交通银行: "getBankInfo('301290000007','交通银行')",
      招商银行: "getBankInfo('308584000013','招商银行')",
      民生银行: "getBankInfo('305100000013','中国民生银行')",
      中国邮政储蓄银行: "getBankInfo('403100000004','邮政储蓄银行')",
      中信银行: "getBankInfo('302100011000','中信银行')",
      光大银行: "getBankInfo('303100000006','光大银行')",
      兴业银行: "getBankInfo('309391000011','兴业银行')",
      华夏银行: "getBankInfo('304100040000','华夏银行')",
      广发银行: "getBankInfo('306581000003','广发银行')",
      平安银行: "getBankInfo('307584007998','平安银行')",
      上海银行: "getBankInfo('325290000012','上海银行')",
      江苏银行: "getBankInfo('313301099999','江苏银行)",
      渤海银行: "getBankInfo('318110000014','渤海银行')",
      广西北部湾银行: "getBankInfo('313611001018','广西北部湾银行股份有限公司')",
      浦东发展银行: "getBankInfo('310290000013','上海浦东发展银行')",
      西安银行: "getBankInfo('313791000015','西安银行')",
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
      await this.driver.wait(until.elementLocated(By.id("fQRLGIN"), 10 * 1000));
      await this.driver.switchTo().frame("fQRLGIN");
      await this.driver.wait(until.elementLocated(By.id("USERID"), 5 * 1000));
      await executeJavaScript(
        this.driver,
        "clear username ",
        "document.getElementById('USERID').value=''",
        0,
      );
      await executeJavaScript(
        this.driver,
        "clear password ",
        "document.getElementById('LOGPASS').value=''",
        0,
      );

      await this.driver.wait(until.elementLocated(By.id("USERID"), 5 * 1000)).sendKeys("fhyftuie");
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
    const element = until.elementLocated(By.linkText("退出网银"));
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
        "document.getElementById('MENUV6030104').click();",
        0,
      );

      // Switch to iframe
      await this.driver.wait(until.elementLocated(By.id("txmainfrm"), 5 * 1000));
      await this.driver.switchTo().frame("txmainfrm");

      await waitPageLoad(this.driver);

      await this.driver.wait(until.elementLocated(By.id("txtTranAmt")), 10 * 1000);
      await this.driver.wait(
        until.elementIsVisible(await this.driver.findElement(By.id("txtTranAmt"))),
        15 * 1000,
      );
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  async fillTransferFrom() {
    try {
      this.task = getSelectedTaskDetail();

      await this.driver.switchTo().frame("txmainfrm");

      // Amount
      await sendKeysV2(
        this.driver,
        this.driver.wait(until.elementLocated(By.id("txtTranAmt"), 5 * 1000)),
        {
          text: Number.parseFloat(this.task.requestAmount).toFixed(2),
          replaceRule: /,/g,
        },
      );
      // Name
      await sendKeysV2(
        this.driver,
        this.driver.wait(
          until.elementLocated(
            By.css("tr#TR_SKZHMC > td.third_td > div > label > input"),
            5 * 1000,
          ),
        ),
        {
          text: this.task.receiverName,
        },
      );
      // Account
      await sendKeysV2(
        this.driver,
        this.driver.wait(
          until.elementLocated(By.css("tr#TR_SKZH > td.third_td > div > label > input"), 5 * 1000),
        ),
        {
          text: this.task.bank.cardNumber,
          replaceRule: regexHelper.removeSpace,
        },
      );

      await executeJavaScript(
        this.driver,
        "select bank",
        this.bankMapppingList[this.task.bank.chineseName],
        100,
      );
      await this.waitUntilBankSelected();
      // next step
      await executeJavaScript(
        this.driver,
        "click submit button",
        "document.getElementById('subBut').click()",
      );

      await this.driver.wait(
        until.elementLocated(By.className("pbd_table_step_title_no_line"), 5 * 1000),
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
        await this.driver.sleep(100);
        var selectedBank = await waitUtilGetText(
          this.driver,
          until.elementLocated(By.id("cbankname")),
        );
        if (selectedBank.indexOf("请选择银行") < 0) {
          setLog({ level: "info", message: "wait until bank selected success" });
          break;
        }
        await executeJavaScript(
          this.driver,
          "select bank",
          this.bankMapppingList[this.task.bank.chineseName],
          100,
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
    var amount = await this.driver.findElement(By.css("#hkje")).getText();
    amount = amount.replace(/,/g, "");
    if (parseFloat(amount) != parseFloat(this.task.requestAmount)) {
      throw new Error("Amount is not right!");
    }
    var name = await this.driver
      .findElement(By.css("div.dqckzc_2>div:nth-child(3)>.cad_money"))
      .getText();
    if (name != this.task.receiverName) {
      throw new Error("Receiver name is not right!");
    }
    var card = await this.driver
      .findElement(By.css("div.dqckzc_2>div:nth-child(3)>.card_menoy1"))
      .getText();
    card = card.replace(/ /g, "");
    if (card != this.task.bank.cardNumber) {
      throw new Error("Card number is not right!");
    }
  }
  async fillNote() {
    try {
      //await this.driver.wait(until.elementLocated(By.id("txmainfrm"), 5 * 1000));
      //await this.driver.switchTo().frame("txmainfrm");
      //await this.driver.wait(until.elementLocated(By.id("MEMO"), 5 * 1000)).sendKeys("note");
      // final check
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
    await KeySender.sendText("zz123520");
    // await KeySender.sendKey(KeySender.KeyEnum.RETURN);
  }
  // FIXME:
  async getBalance() {
    await this.driver.switchTo().defaultContent();
    try {
      await this.driver.executeScript("document.getElementById('MENUV6030104').click();");
    } catch (e) {
      console.log(e);
    }
    // Switch to iframe
    await this.driver.wait(until.elementLocated(By.id("txmainfrm"), 5 * 1000));
    await this.driver.switchTo().frame("txmainfrm");
    // This wait until transfer page load
    await this.driver.wait(until.elementLocated(By.css("#txtTranAmt")), 60 * 1000);

    let balance = await this.driver.findElement(By.css(".backnone")).getText();
    balance = balance.replace(/,/g, "");
    console.log(balance);
  }
  async confirmTransaction() {}
  async checkIfSuccess() {}
  async sendUSBKey() {
    //   if (this.isCertified) {
    //     setConsole({ type: "success", message: "Already certified" });
    //     return;
    //   }
    //   try {
    //     await this.driver.wait(until.elementLocated(By.id("mainfrm"), 5 * 1000));
    //     await this.driver.switchTo().frame("mainfrm");
    //     await this.driver
    //       .wait(until.elementLocated(By.id("SafeTypeU")), 5 * 1000)
    //       .click();
    //     await this.driver
    //       .wait(until.elementLocated(By.id("btnNext"), 5 * 1000))
    //       .click();
    //     // Key in usb key
    //     await KeySender.sendKey(KeySender.KeyEnum["ALT+TAB"]);
    //     await KeySender.sendText(this.card.usbPassword);
    //     await KeySender.sendKey(KeySender.KeyEnum.RETURN);
    //     // final check
    //     await this.driver.wait(
    //       until.elementLocated(By.linkText("退出网银")),
    //       180 * 1000
    //     );
    //   } catch (error) {
    //     throw error;
    //   } finally {
    //     await this.driver.switchTo().defaultContent();
    //   }
  }
}

// async waitUntilConfirmDialogClose() {
//   var retryTime = 10;
//   while (retryTime >= 0) {
//     try {
//       await this.driver.switchTo().defaultContent();
//       await this.driver.wait(until.elementLocated(By.id("mainfrm"), 5 * 1000));
//       await this.driver.switchTo().frame("mainfrm");
//       var isConfirmDialogDie = await this.driver.wait(until.elementLocated(By.id("SafeTypeU")), 10 * 1000).isEnabled();
//       if (isConfirmDialogDie) {
//         await KeySender.sendKey(KeySender.KeyEnum.RETURN, 5 * 1000);
//         setConsole({
//           type: "success",
//           message: "ConfirmDialog is closed"
//         })
//         break;
//       }

//       setConsole({
//         type: "warning",
//         message: "ConfirmDialog close fail, retrying... Remaining times" + retryTime
//       });

//       retryTime--;

//       if (retryTime === 0)
//         throw new OperationalError("Close confirmDialog fail, please restart the task");

//     } catch (error) {
//       if (error.message === "Modal dialog present") {
//         setConsole({
//           type: "success",
//           message: "ConfirmDialog is auto closed by selenium"
//         })
//         await this.driver.switchTo().defaultContent();
//         await this.sendUSBKey()
//       } else if (error.name === "OperationalError") {
//         setConsole({ type: "danger", message: error.message });
//       }
//       throw error
//     }
//   }
// }

// async checkIfUSBkeyIsNeeded() {
//   try {
//     return Promise.race([
//       this.usbKeyNotNeeded(),
//       this.usbKeyNeeded(),
//       new Promise((_, reject) => setTimeout(() => reject('Checking of USBkey certification is over 15s, process stop'), 15 * 1000))
//     ])
//       .then(
//         async result => {
//           // console.log(result)
//           // console.log(result ? 'USB is needed' : "USB is not needed")
//           this.isCertified = !result;
//           if (result) {
//             await this.waitUntilConfirmDialogClose();
//           }
//         }
//       )
//       .catch(async (error) => {
//         setConsole({
//           type: "warning",
//           message: error
//         })
//       });
//   } catch(error) {
//     throw error;
//   } finally {
//     await this.driver.switchTo().defaultContent();
//   }
// }

// async  usbKeyNeeded() {
//     try {
//       await this.driver.switchTo().defaultContent();
//       await this.driver.wait(until.elementLocated(By.id("mainfrm"), 10 * 1000));
//       await this.driver.switchTo().frame("mainfrm");
//       await this.driver.wait(until.elementLocated(By.id("SafeTypeU")), 10 * 1000);
// return true;
//     } catch (error) {
//      throw error;
//     }
//   }

// async usbKeyNotNeeded() {
//   await this.driver.switchTo().defaultContent();
//   return new Promise(async resolve => {
//     var loginedElement = await this.driver.wait(
//       until.elementLocated(By.linkText("退出网银")),
//       15 * 1000
//     );
//     if (loginedElement) {
//       resolve(false);
//     }
//   })
// }
