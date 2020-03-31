import { ThenableWebDriver } from "selenium-webdriver";
import { By, until } from "selenium-webdriver";
import * as KeySender from "./utils/keySender";
import { getCurrentCardDetail, getSelectedTaskDetail, setLog } from "./utils/storeHelper";
import { executeJavaScript, sendKeysV2, waitElementFocused } from "./utils/seleniumHelper";
import * as regexHelper from "./utils/regexHelper";

export default class {
  constructor() {
    /** @type {ThenableWebDriver} */
    this.driver = null;
    this.bankURL = "https://bank.pingan.com.cn/m/main/index.html";
    this.card = getCurrentCardDetail();
    this.task = "";
    this.bankMapppingList = {
      // 以银行页面列表排序
      平安银行: "平安银行",
      中国工商银行: "中国工商银行",
      中国农业银行: "中国农业银行",
      中国银行: "中国银行",
      中国建设银行: "中国建设银行",
      交通银行: "交通银行",
      招商银行: "招商银行",
      中信银行: "中信银行",
      光大银行: "中国光大银行",
      华夏银行: "华夏银行",
      民生银行: "中国民生银行",
      广州发展银行: "广州发展银行",
      兴业银行: "兴业银行",
      浦东发展银行: "上海浦东发展银行",
      城市商业银行: "城市商业银行",
      农村商业银行: "农村商业银行",
      城市信用联社: "城市信用联社",
      中国邮政储蓄银行: "邮政储蓄",
      渤海银行: "渤海银行股份有限公司",
      中国农业发展银行: "中国农业发展银行",
      恒生银行: "恒生银行",
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
      await this.driver.switchTo().frame("newbankframe");
      await this.driver.wait(until.elementLocated(By.id("userName")), 30 * 1000);
      await executeJavaScript(
        this.driver,
        "fill account name",
        `document.getElementById('userName').value ='${this.card.accountName}'`,
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
    try {
      await this.driver.switchTo().frame("newbankframe");
      const element = until.elementLocated(By.linkText("首页"));
      if (globalState.isManualLogin) {
        await this.driver.wait(element, 5 * 1000);
      } else {
        await this.driver.wait(element, 120 * 1000);
      }
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  async getCookie() {
    const cookie = await this.driver.executeScript("return document.cookie");
    if (!cookie || cookie.length === 0) throw new Error("get cookie failure!");
    return { cookie, session: null };
  }

  async goTransferPage() {
    // try click <a>  can not change page , then i find change iframe src is same work
    await this.driver.executeScript(
      "document.getElementById('newbankframe').src ='https://bank.pingan.com.cn/m/account/transfer/self-service/self-service.html'",
    );
    await this.driver.sleep(5000);
    await this.driver.wait(until.elementLocated(By.id("newbankframe")), 30 * 1000);
  }

  async fillTransferFrom() {
    try {
      this.task = getSelectedTaskDetail();

      await this.driver.switchTo().frame("newbankframe");

      // receiver name
      const nameSelector =
        "input[avalon-events='focus:efocus_0_showAutoCompleteList4041,blur:eblur_0_blur40$event41,input:einput_0_input40$event41,keydown:ekeydown_0_enter40$event41,input:_6,compositionstart:_4,compositionend:_5,focus:_2,blur:_3']";
      var nameField = this.driver.wait(until.elementLocated(By.css(nameSelector)), 5 * 1000);
      await sendKeysV2(this.driver, nameField, { text: this.task.receiverName });

      var accountField = this.driver.wait(
        until.elementLocated(By.id("payeeBankCardInput")),
        10 * 1000,
      );
      // receiver account
      await sendKeysV2(this.driver, accountField, {
        text: this.task.bank.cardNumber,
        replaceRule: regexHelper.removeSpace,
      });

      // Focus on other field to trigger loading
      await executeJavaScript(
        this.driver,
        "Focuse on remark",
        "document.getElementById('userRemarkId').focus()",
      );

      // Start: Check if needs to select bank --------------------------------------------------
      const provinceStyle = await this.driver
        .wait(until.elementLocated(By.css("div.input_list.bor_b_s.m_t29 > ul > li:nth-child(4)")))
        .getAttribute("style");
      if (provinceStyle !== "display: none;") {
        // FIXME: Chck if bank name input correctly
        // Start select bank --------------------------------------------------------
        // Trigger select bank dropdown
        await executeJavaScript(
          this.driver,
          "Focuse on remark",
          "document.querySelectorAll('.input2.fl.js-dropdown-autocomplete')[1].focus()",
        );

        // Select bank
        var bankField = this.driver.wait(
          until.elementLocated(
            By.css('input.input2.fl.js-dropdown-autocomplete[placeholder="请选择或输入开户行"]'),
            5 * 1000,
          ),
        );
        await sendKeysV2(this.driver, bankField, {
          text: this.bankMapppingList[this.task.bank.chineseName],
        });

        // Focus on other field to trigger loading
        await executeJavaScript(
          this.driver,
          "Click the first bank search result",
          `document.querySelector('div.input_list.bor_b_s.m_t29 ul.js-container.poa.DropDownList.animate.bor_1 > li[style*="display: block"]').click()`,
        );
        // Focus on other field to trigger loading
        await executeJavaScript(
          this.driver,
          "Focuse on remark",
          "document.getElementById('userRemarkId').focus()",
        );
        // End select bank --------------------------------------------------------
        // Start select province --------------------------------------------------------
        await executeJavaScript(
          this.driver,
          "Select province randomly",
          `document.querySelector('div.input_list.bor_b_s.m_t29 > ul > li:nth-child(4) ul.js-container.poa.DropDownList.animate.bor_1 > li[style*="display: block"]').click()`,
          3 * 1000,
        );
        // Focus on other field to trigger loading
        await executeJavaScript(
          this.driver,
          "Focuse on remark",
          "document.getElementById('userRemarkId').focus()",
        );
        // End select province --------------------------------------------------------

        // Start select city --------------------------------------------------------
        await executeJavaScript(
          this.driver,
          "Select city randomly",
          `document.querySelector('div.input_list.bor_b_s.m_t29 > ul > li:nth-child(4) div.por2.sel_list2.add.fl.m_l10.w140 ul.js-container.poa.DropDownList.animate.bor_1 > li[style*="display: block"]').click()`,
          3 * 1000,
        );
        // Focus on other field to trigger loading
        await executeJavaScript(
          this.driver,
          "Focuse on remark",
          "document.getElementById('userRemarkId').focus()",
        );
        // End select city --------------------------

        // Start select branch --------------------------------------------------------
        // Trigger dropdown
        await executeJavaScript(
          this.driver,
          "Select branch randomly",
          `document.querySelector('div.input_list.bor_b_s.m_t29 > ul > li:nth-child(5) ul.js-container.poa.DropDownList.animate.bor_1 > li[style*="display: block"]').click()`,
          3 * 1000,
        );
        // Focus on other field to trigger loading
        await executeJavaScript(
          this.driver,
          "Focuse on remark",
          "document.getElementById('userRemarkId').focus()",
        );
        // End select branch --------------------------------------------------------
      }
      // End: Check if needs to select province --------------------------------------------------

      // Amount
      var amountField = this.driver.wait(until.elementLocated(By.id("transAmt"), 5 * 1000));
      await sendKeysV2(this.driver, amountField, {
        text: Number.parseFloat(this.task.requestAmount).toFixed(2),
        replaceRule: /,/g,
      });

      // 下一步按钮
      await executeJavaScript(
        this.driver,
        "click submit button",
        "document.getElementsByClassName('btn-login')[0].click()",
      );
      if (provinceStyle !== "display: none;") {
        await executeJavaScript(
          this.driver,
          "Confirm the bank warning",
          `document.querySelector('.btn7.dialog-ok-button').click()`,
          3 * 1000,
        );
      }
      // 同日同金额同名转账 按钮判断
      try {
        await this.driver.wait(
          until.elementIsVisible(await this.driver.findElement(By.css("m_r40"))),
          3000,
        );
        await executeJavaScript(
          this.driver,
          "点击弹框的确定按钮",
          `document.querySelector('.btn7.m_r40').click()`,
          100,
        );
      } catch (error) {
        if (error.name != "NoSuchElementError") {
          throw error;
        }
      }

      await this.driver.wait(until.elementLocated(By.id("pwdObject1-pass"), 20 * 1000));
      await this.checkSubmitedValue();
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  // async waitUntilNameRight() {
  //   var retryTime = 3;
  //   while (retryTime >= 0) {
  //     try {
  //       // 只有 avalon-events 属性是唯一的
  //       const nameSelector =
  //         "input[avalon-events='focus:efocus_0_showAutoCompleteList4041,blur:eblur_0_blur40$event41,input:einput_0_input40$event41,keydown:ekeydown_0_enter40$event41,input:_6,compositionstart:_4,compositionend:_5,focus:_2,blur:_3']";
  //       var name = this.driver.wait(until.elementLocated(By.css(nameSelector)), 5 * 1000);
  //       await name.clear();
  //       await name.sendKeys(this.task.receiverName);

  //       // Focus on other field to trigger loading
  //       await executeJavaScript(
  //         this.driver,
  //         "Focuse on remark",
  //         "document.getElementById('userRemarkId').focus()",
  //       );

  //       var receiverName = await name.getAttribute("value");

  //       if (this.task.receiverName === receiverName) break;

  //       setLog({ level: "warn", message: "Input name error" });

  //       if (retryTime === 0) throw new Error("Input receiver name fail");

  //       retryTime--;
  //     } catch (error) {
  //       if (error.name === "OperatorError") {
  //         return;
  //       } else {
  //         throw error;
  //       }
  //     }
  //   }
  // }

  // 检测页面最终获得的值
  async checkSubmitedValue() {
    var amount = await this.driver.findElement(By.css("div.confirm_r")).getText();
    amount = amount.replace("人民币", "");
    amount = amount.replace(/,/g, "");
    if (parseFloat(amount) !== parseFloat(this.task.requestAmount)) {
      throw new Error("Amount is not right!");
    }

    var name = await this.driver.findElement(By.css("div.payright>h2")).getText();
    if (name !== this.task.receiverName) {
      throw new Error("Receiver name is not right!");
    }

    var card = await this.driver
      .findElement(By.css("div.payright>ul.paylist>li:nth-child(1)"))
      .getText();
    if (card !== this.task.bank.cardNumber) {
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
