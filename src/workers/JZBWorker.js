import { By, until, Builder, Key } from "selenium-webdriver";
import * as KeySender from "./utils/keySender";
import { waitPageLoad } from "./utils/seleniumHelper";
import { getSelectedTaskDetail, getCurrentCardDetail } from "./utils/storeHelper";

export default class {
  constructor() {
    this.driver = null;
    this.bankURL = "https://ebank.jinzhoubank.com/pweb/";
    this.card = getCurrentCardDetail();
    this.task = "";
  }

  async launchSelenium() {
    try {
      this.driver = await new Builder()
        .withCapabilities({ ignoreZoomSetting: true })
        .forBrowser("ie")
        .build();

      await this.driver.get(this.bankURL);
    } catch (error) {
      throw new Error(error);
    }
  }

  async loginToBank() {
    // const passwordInput = this.driver.wait(until.elementLocated(By.id('PowerEnterDiv_powerpass_2')), 150000);
    await this.driver.executeScript("document.getElementById('powerpass1').focus();");

    await KeySender.sendText(this.card.usbPassword);
    await KeySender.sendKey(KeySender.KeyEnum.RETURN);

    await this.driver.switchTo().frame("businessfrm");
    await waitPageLoad(this.driver);
  }

  async sendUSBKey() {
    // try {
    //   await this.driver.switchTo().frame('mainfrm');
    //   const ukey = this.driver.wait(until.elementLocated(By.id('SafeTypeU')), 150000);
    //   await ukey.click();
    //   const btnNext = this.driver.wait(until.elementLocated(By.id('btnNext')), 150000);
    //   await btnNext.click();
    //   // Key in usb key
    //   await KeySender.sendKey(KeySender.KeyEnum["ALT+TAB"]);
    //   await KeySender.sendText(this.password);
    //   await KeySender.sendKey(KeySender.KeyEnum.RETURN);
    //   await this.driver.wait(until.elementLocated(By.linkText('退出网银')), 180 * 1000);
    // } catch (error) {
    //   throw error;
    // }
  }

  async getCookie() {
    const cookie = await this.driver.executeScript("return document.cookie");
    if (!cookie || cookie.length === 0) throw new Error("get cookie failure!");
    return { cookie, session: null };
  }

  async transfer(data) {
    await this.goToTransferPage();
    await this.fillTransferFrom(data);
    await this.confirmTransferMessage();
  }

  async goTransferPage() {
    try {
      await this.driver.executeScript(
        "$('#menuNav').find('ul').children('li:eq(3)>ul:eq(0)>li:eq(0)').click();",
      );

      // This wait until transfer page load
      await this.driver.wait(until.elementLocated(By.id("contentFrame")), 60 * 1000);
      // Switch to iframe
      await this.driver.switchTo().frame("contentFrame");
      await this.driver.wait(until.elementLocated(By.id("fromAcctBalance")));
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  async fillTransferFrom() {
    try {
      this.task = getSelectedTaskDetail();
      await this.driver.switchTo().frame("contentFrame");

      var accountNumber = this.driver.wait(until.elementLocated(By.id("toAcctNo")));

      //TODO:
      console.log("task", this.task);
      await accountNumber.sendKeys(this.task.card.number);
      await this.driver.sleep(3 * 1000);
      await accountNumber.sendKeys(Key.ENTER);

      // amount
      await this.driver.wait(until.elementLocated(By.id("transAmt"))).sendKeys(this.task.amount);

      await this.driver
        .wait(until.elementLocated(By.id("toAcctNameKey")))
        .sendKeys(this.task.card.name);

      // submit
      await this.driver.sleep(5 * 1000);
      await this.driver.executeScript("$('#transferNext').click()");
      await waitPageLoad(this.driver);
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  async confirmTransaction() {
    try {
      await this.driver.switchTo().frame("businessfrm");
      await this.driver.executeScript("$('input[name=doItButton]').click()");
      await KeySender.sendText("zz790890");
      await KeySender.sendKey(KeySender.KeyEnum.RETURN);

      // await KeySender.sendText(this.card.usbPassword);
      // KeySender.sendKey(KeySender.KeyEnum.RETURN);
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  async checkIfSuccess() {
    try {
      await this.driver.switchTo().frame("contentFrame");
      var successMessage = await this.driver.wait(until.elementLocated(By.id("trnTips"))).getText();

      if (
        successMessage.indexOf(this.task.card.number) !== -1 &&
        successMessage.indexOf(this.task.amount) !== -1
      ) {
        console.log(successMessage);
      }
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }
}
