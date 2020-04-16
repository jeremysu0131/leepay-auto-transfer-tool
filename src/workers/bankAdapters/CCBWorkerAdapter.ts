import dayjs, { Dayjs } from "dayjs";
import * as fs from "fs";
import { isElementExist, executeJavaScript, sendKeysV2, waitAndSwitchToTargetFrame, waitPageLoad, waitPageLoadCondition, waitUtilGetText } from "../utils/seleniumHelper";
import { By, until, WebDriver, WebElement, error } from "selenium-webdriver";
import { IWorkerAdapter } from "../IWorkerAdapter";
import RemitterAccountModel from "../models/remitterAccountModel";
import TaskDetailModel from "../models/taskDetailModel";
import * as FormatHelper from "../utils/formatHelper";
import * as KeySender from "../utils/keySender";
import Logger from "../utils/logger";

import * as UsbTrigger from "../utils/usbTrigger";
import * as WindowFocusTool from "../utils/windowFocusTool";

export class CCBWorkerAdapter implements IWorkerAdapter {
  private driver: WebDriver;
  private bankUrl: string;
  // private card: any;
  private task: TaskDetailModel;
  private remitterAccount: RemitterAccountModel;
  private charge: string;
  private transactionTime: Dayjs;
  private bankMappingList: any;
  private screenshotPath: string = "";
  private readonly loginFrame = "fQRLGIN";
  private readonly wattingTime = 10 * 1000;

  constructor() {
    this.driver = {} as WebDriver;
    this.bankUrl = "http://www.ccb.com/cn/jump/personal_loginbank.html";
    // this.card = {};
    this.remitterAccount = new RemitterAccountModel();
    this.task = {} as TaskDetailModel;
    this.charge = "";
    this.transactionTime = dayjs();
    this.bankMappingList = {
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
      广西北部湾银行:
        "getBankInfo('313611001018','广西北部湾银行股份有限公司')",
      浦东发展银行: "getBankInfo('310290000013','上海浦东发展银行')",
      西安银行: "getBankInfo('313791000015','西安银行')"
    };
  }
  getRemitterAccount(): RemitterAccountModel {
    return this.remitterAccount;
  }
  setRemitterAccount(account: RemitterAccountModel): void {
    this.remitterAccount = account;
  }

  getDriver(): WebDriver {
    return this.driver;
  }
  setDriver(driver: WebDriver): void {
    this.driver = driver;
  }
  getTask(): TaskDetailModel {
    return this.task;
  }
  setTask(task: TaskDetailModel): void {
    this.task = task;
  }
  async launchSelenium(): Promise<void> {
    await this.driver.get(this.bankUrl);
  }
  async inputSignInInformation(): Promise<void> {
    let retryTimes = 0;
    let MaxRetry = 3;
    // 確認頁面載入
    await waitPageLoad(this.driver);
    // 切換frame 到登入
    const loginFrameCon = until.elementLocated(By.id(this.loginFrame));
    await waitPageLoadCondition("login page", this.driver, loginFrameCon);
    await waitAndSwitchToTargetFrame(
      "switch to login iframe",
      this.driver,
      loginFrameCon
    );
    // validate login info data
    if (!this.remitterAccount.loginName) {
      throw new Error("Account name is null");
    }
    if (!this.remitterAccount.loginPassword) {
      throw new Error("Password name is null");
    }

    while (retryTimes < MaxRetry) {
      this.logInfo(`start to fill login info retry times (${retryTimes})`);
      // 輸入登入帳號
      WindowFocusTool.focusAndCheckIE();
      await sendKeysV2(
        this.driver,
        this.driver.wait(until.elementLocated(By.id("USERID")), 20 * 1000),
        { text: this.remitterAccount.loginName }
      );

      // 輸入登入密碼
      WindowFocusTool.focusAndCheckIE();
      await sendKeysV2(
        this.driver,
        this.driver.wait(until.elementLocated(By.id("LOGPASS")), 20 * 1000),
        { text: this.remitterAccount.loginPassword }
      );

      // 確認輸入資訊
      const check = await this.checkSignInInformationCorrectly();
      if (check) {
        break;
      } else {
        retryTimes++;
      }
    }
    if (retryTimes === MaxRetry) {
      throw new Error(`"輸入資訊錯誤超過${MaxRetry}次`);
    }
    this.logInfo("fill login info success");
  }

  public async checkSignInInformationCorrectly(): Promise<boolean> {
    // 確認頁面載入
    await waitPageLoad(this.driver);
    this.logInfo("start check input value");
    // 驗證帳號資訊
    const userElementId = "USERID";
    WindowFocusTool.focusAndCheckIE();

    var user = await this.driver.wait(
      until.elementLocated(By.id(userElementId)),
      20 * 1000
    );
    var userText = await user.getAttribute("value");
    if (userText !== this.remitterAccount.loginName) {
      this.logDebug(
        `Login user account incorrectly. Message on bank: CCB value : (${userText})`
      );
      return false;
    }

    // 驗證密碼資訊

    const passwordElementId = "LOGPASS";
    WindowFocusTool.focusAndCheckIE();

    var password = await this.driver.wait(
      until.elementLocated(By.id(passwordElementId)),
      20 * 1000
    );
    var passwordText = await password.getAttribute("value");
    if (passwordText !== this.remitterAccount.loginPassword) {
      this.logDebug(
        `Login password incorrectly. Message on bank: CCB value : (${passwordText})`
      );
      return false;
    }
    return true;
  }

  public async submitToSignIn(): Promise<void> {
    this.logInfo("login submit");
    try {
      const webElement = await this.driver.wait(
        until.elementLocated(By.id("loginButton"))
      );
      await webElement.click();
      await this.driver.wait(until.urlContains("B2CMainPlat"), this.wattingTime);
    } catch (e) {
      throw new Error("can not find submit button - " + e);
    }
  }

  async sendUSBKey(): Promise<void> {
    await UsbTrigger.run(this.remitterAccount.code);
  }

  async checkIfLoginSuccess(globalState: {
    isManualLogin: boolean;
  }): Promise<boolean> {
    // 看看是不是有裝置驗證選擇畫面，如果有則點選U頓
    if (await this.isInVerifyPage()) {
      await this.selectTypeU();
    }

    if (globalState.isManualLogin) {
      this.sleep(30);
    }

    this.logInfo("check login status");
    const container = await this.driver.wait(
      until.elementLocated(By.id("idxmaincontainer")),
      this.wattingTime
    );
    return !!container;
  }
  async isInVerifyPage(): Promise<boolean> {
    try {
      await waitPageLoad(this.driver);
    } catch (e) {
      if (e instanceof (error.JavascriptError)) {
        this.logDebug("found javascript error ignore it");
      } else {
        throw e;
      }
    }
    await this.driver.sleep(1 * 1000);
    this.logDebug("try to check now!");
    try {
      if (!await isElementExist(this.driver, By.id("mainfrm"))) {
        return false;
      }
      await this.driver.switchTo().frame(this.driver.wait(until.elementLocated(By.id("mainfrm")), 3 * 1000));

      if (await isElementExist(this.driver, By.id("SafeTypeU"))) {
        this.logInfo("in the device selection page");
        return true;
      }
      this.logDebug("not in device selection page");
      return false;
    } catch (e) {
      if (e instanceof (error.UnexpectedAlertOpenError)) {
        throw new Error("please check is UKey connected");
      }
      throw e;
    }
  }
  async getCookie(): Promise<void> {
    // FIXME 定義回傳介面
    const cookie = (await this.driver.executeScript(
      "return document.cookie"
    )) as any;
    if (!cookie || cookie.length === 0) throw new Error("get cookie failure!");
    // return { cookie, session: null };
  }

  async goTransferPage(): Promise<void> {
    // 確認頁面載入
    await waitPageLoad(this.driver);
    // button id 'MENUV6030104' , go transfer page
    this.logInfo("start to go transfer page");
    WindowFocusTool.focusAndCheckIE();
    const pageButton = this.driver.wait(
      until.elementLocated(By.id("MENUV6030104"))
    );

    if (!pageButton) throw new Error("page button not found");
    await executeJavaScript(
      this.driver,
      "go transfer page",
      'document.getElementById("MENUV6030104").click()'
    );
    // 等待 txmainfrm frame 被載入
    await waitPageLoadCondition(
      "load transfer form page",
      this.driver,
      until.elementLocated(By.id("txmainfrm"))
    );
  }

  async checkIfInTransferPage(): Promise<boolean> {
    // switch to frame txmainfrm
    this.logInfo("check if receiver name input exist");
    let frame = await this.driver.wait(
      until.elementLocated(By.id("txmainfrm")),
      10 * 1000
    );
    if (!frame) throw new Error("can not found transfer frame (txmainfrm)");
    await this.driver.switchTo().frame(frame);

    const receiverNameInput = await this.driver.wait(
      until.elementLocated(By.id("TR_SKZHMC")),
      this.wattingTime
    );
    if (!receiverNameInput) {
      throw new Error("transfer page check element (TR_SKZHMC) not found");
    }
    await this.driver.switchTo().defaultContent();
    return !!receiverNameInput;
  }

  async setInputByParentTrID(
    name: string,
    id: string,
    text: string
  ): Promise<string> {
    const trElement = await this.driver.wait(
      until.elementLocated(By.id(id)),
      this.wattingTime
    );
    if (!trElement) throw new Error(`not found ${name} input column in view`);
    // const input = this.driver.findElement(By.tagName("input"));
    await sendKeysV2(this.driver, trElement.findElement(By.tagName("input")), {
      text,
      replaceRule: new RegExp(/\s/g)
    });
    const value = await trElement.findElement(By.tagName("input"));
    const valueText = await value.getAttribute("value");
    return valueText;
  }

  async fillTransferForm(): Promise<void> {
    await waitPageLoad(this.driver);

    // switch to frame txmainfrm
    this.logInfo("check if receiver name input exist");
    let frame = await this.driver.wait(
      until.elementLocated(By.id("txmainfrm")),
      10 * 1000
    );
    if (!frame) throw new Error("can not found transfer frame (txmainfrm)");
    await this.driver.switchTo().frame(frame);
    const task = this.getTask();
    // 驗證task 資訊
    if (!task) throw new Error("task is not defined");
    if (!task.id) throw new Error("task id is not defined");
    if (!task.amount || task.amount < 0) throw new Error("task amount error");
    if (!task.payeeAccount) throw new Error("task payee account is null");
    if (!task.payeeAccount.holderName) {
      throw new Error("task payee holderName is null");
    }
    if (!task.payeeAccount.cardNumber) {
      throw new Error("task payee cardNumber is null");
    }

    // TR_SKZHMC 姓名 tr id
    await this.setInputByParentTrID(
      "User name",
      "TR_SKZHMC",
      task.payeeAccount.holderName
    );
    // TR_SKZH 帳號 tr id
    await this.setInputByParentTrID(
      "User card number",
      "TR_SKZH",
      task.payeeAccount.cardNumber
    );

    // RECVBRANCH1 bank value 選擇轉出銀行
    await this.waitUntilBankSelected();

    // txtTranAmt 目標金額 input id
    await sendKeysV2(
      this.driver,
      this.driver.wait(
        until.elementLocated(By.id("txtTranAmt")),
        this.wattingTime
      ),
      { text: task.amount.toString() }
    );

    // subBut 下一步
    const nextButton = this.driver.wait(until.elementLocated(By.id("subBut")));
    if (!nextButton) throw new Error("transfer next step Button is not found");
    await executeJavaScript(
      this.driver,
      "click submit button",
      "document.getElementById('subBut').click()"
    );
    await this.driver.switchTo().defaultContent();
    // 等待載入, 確認進到下一個頁面
    const trxFrameCondition = until.elementLocated(By.id("txmainfrm"));
    await waitPageLoadCondition(
      "load transaction check page",
      this.driver,
      trxFrameCondition
    );
    await waitAndSwitchToTargetFrame(
      "check if in transaction check page",
      this.driver,
      trxFrameCondition
    );
    const checkTransactionPage = await this.driver.wait(
      until.elementLocated(By.className("pbd_table_step_title_no_line")),
      5 * 1000
    );
    if (!checkTransactionPage) {
      throw new Error("not exist transaction check page");
    }
    await this.driver.switchTo().defaultContent();
  }

  async waitUntilBankSelected() {
    let retryTimes = 0;
    const MaxRetry = 3;

    // 檢查銀行名稱是否存在
    if (
      !this.getTask() ||
      !this.getTask().payeeAccount ||
      !this.getTask().payeeAccount.bank ||
      !this.getTask().payeeAccount.bank.chineseName
    ) {
      throw new Error(
        "task bank name is not defind : " + JSON.stringify(this.getTask())
      );
    }
    const backName = this.task.payeeAccount.bank.chineseName as string;
    while (retryTimes < MaxRetry) {
      try {
        var selectedBank = await waitUtilGetText(
          this.driver,
          until.elementLocated(By.id("cbankname"))
        );
        if (selectedBank.indexOf("请选择银行") < 0) {
          this.logInfo("wait until bank selected success");
          break;
        }
        await executeJavaScript(
          this.driver,
          "select bank",
          this.bankMappingList[backName],
          100
        );
      } catch (error) {
        if (error.name === "JavascriptError" || error.name === "TimeoutError") {
          this.logWarn(
            `wait until bank selected fail, ${retryTimes} times, Error: ${error}`
          );
          continue;
        }
        throw error;
      } finally {
        retryTimes++;
      }
    }

    if (retryTimes === 3) {
      throw new Error("wait until bank selected fail");
    }
  }
  // 已經在輸入的時候就完成檢測了
  async checkTransferInformationCorrectly(): Promise<boolean> {
    return true;
  }
  submitTransaction(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async fillNote(): Promise<void> {
    // not necessary
    this.logDebug("skip fill note");
  }
  async checkIfNoteFilled(): Promise<void> {
    this.logDebug("skip fill note");
  }

  async selectTypeU() {
    try {
      const button = await this.driver.wait(
        until.elementLocated(By.id("SafeTypeU")),
        this.wattingTime
      );
      await button.click();
      this.logDebug("click type u");
      await (await this.driver.wait(until.elementLocated(By.id("btnNext")), 3 * 1000)).click();
      this.logDebug("go to next step");
    } catch (e) {
      if (e instanceof (error.UnexpectedAlertOpenError)) {
        throw new Error("please check is usb deivce connected!");
      }
      throw e;
    }
  }

  async checkBankReceivedTransferInformation(): Promise<boolean> {
    this.logInfo("start check transaction info and setting remark");
    const task = this.getTask();
    // 切換到目標 iframe
    const transactionFrameCon = await until.elementLocated(By.id("txmainfrm"));
    await waitPageLoadCondition(
      "transaction detail page",
      this.driver,
      transactionFrameCon
    );
    await waitAndSwitchToTargetFrame(
      "transaction detail view load",
      this.driver,
      transactionFrameCon
    );

    // 使用U盾傳帳 click #SafeTypeU;
    await this.selectTypeU();

    const button = await this.driver.wait(
      until.elementLocated(By.id("SafeTypeU")),
      this.wattingTime
    );
    await button.click();

    this.logInfo("add remark use task id");
    // 將task id 加入附言
    await sendKeysV2(
      this.driver,
      this.driver.wait(until.elementLocated(By.id("MEMO")), this.wattingTime),
      { text: task.id.toString() }
    );

    // 取得所有帳號欄位 card_menoy1 在做塞選
    const accountElement = await this.driver.wait(
      until.elementsLocated(By.className("card_menoy1")),
      this.wattingTime
    );
    const accounts = await Promise.all(
      accountElement.map(async x => x.getText())
    );
    const distAccount = accounts.find(
      x => x.replace(/\s/g, "") === task.payeeAccount.cardNumber
    );
    if (!distAccount) throw new Error("not equals dist account");
    // 取得所有轉帳金額欄位
    const amountElement = await this.driver.wait(
      until.elementsLocated(By.className("font_money")),
      this.wattingTime
    );
    const amounts = await Promise.all(
      amountElement.map(async x => x.getText())
    );
    const amount = amounts.find(x => +FormatHelper.amount(x) === task.amount);
    if (!amount) throw new Error("not equals dist amount");
    const buttons = await this.driver.wait(
      until.elementsLocated(
        By.css("div#pbd > div.border_box > div.pbd_operation_std > input.btn")
      ),
      this.wattingTime
    );

    let confirmButton;
    for (const e of buttons) {
      const value = await e.getAttribute("value");
      if (!value) continue;
      if (value === "确 认") {
        confirmButton = e;
        this.logInfo("found confirm button");
        break;
      }
    }
    if (!confirmButton) throw new Error("not found confirm button");
    this.logInfo("confirm button click");
    await confirmButton.click();
    await waitPageLoad(this.driver);

    return true;
  }
  /**
   *  等待 Loading 並輸入密碼
   * */
  async sendPasswordToPerformTransaction(): Promise<void> {
    await KeySender.sendText(this.remitterAccount.usbPassword);
    await KeySender.sendKey(KeySender.KeyEnum.RETURN);
    this.logInfo("Send USB password success");
  }

  /**
   * 輸入玩U頓密碼後要觸發機械手臂 (測試中暫不執行)
   */
  async sendUsbPasswordToPerformTransaction(): Promise<void> {
    // var retryTimes = 20;
    // while (retryTimes >= 0) {
    //   try {
    //     if (retryTimes === 0) {
    //       throw new Error("USB didn't press, please restart the task");
    //     }
    //     this.sleep(3);
    //     this.sendUSBKey();
    //     this.sleep(3);
    //     const waitingCon = until.elementLocated(By.id("trnTips"));
    //     await waitPageLoadCondition(this.driver, waitingCon);
    //     var message = await this.driver.wait(waitingCon, 10 * 1000);
    //     if (message) {
    //       this.logInfo("USB pressed");
    //       break;
    //     }
    //   } catch (error) {
    //     if (error.name === "UnexpectedAlertOpenError") {
    //       this.logWarn(`Waiting for usb press, remaining times: ${retryTimes}`);
    //       continue;
    //     } else if (error.name === "TimeoutError") {
    //       this.logWarn("Can't get the element 'trnTips'");
    //       break;
    //     } else throw error;
    //   } finally {
    //     retryTimes--;
    //   }
    // }
    // TODO 等待跳轉 用工具取代計時
    await this.sleep(60);
    // 結果頁面 截圖
    const base64Png = await this.driver.takeScreenshot();
    if (!base64Png) {
      this.logWarn("can not take Screenshot");
      return;
    }
    const fileName = `${this.getTask().id}.png`;
    this.screenshotPath = `./logs/${fileName}`;
    this.logInfo(`check result page in file name ${fileName}`);
    fs.writeFileSync(
      this.screenshotPath,
      base64Png.replace(/^data:image\/png;base64,/, ""),
      { encoding: "base64" }
    );
  }
  async checkIfTransactionSuccess(): Promise<boolean> {
    let resultPageCheck = true;
    try {
      // 確認交易回條
      this.logInfo("check result page start...");
      await this.driver.switchTo().defaultContent();
      const frameCon = until.elementLocated(By.id("txmainfrm"));
      await waitAndSwitchToTargetFrame(
        "switch to txmainfrm frame",
        this.driver,
        frameCon
      );
      // check success span .succeed_span
      try {
        const successSpans = await this.driver.wait(
          until.elementsLocated(
            By.css("div#showINFO > div.pResult > div.succeed_span > p")
          ),
          this.wattingTime
        );
        let successTitleCheck = false;
        if (successSpans && successSpans.length > 0) {
          for (const element of successSpans) {
            const text = await element.getText();
            if (text.indexOf("转账成功") > -1) {
              this.logInfo("轉帳成功");
              successTitleCheck = true;
            }
          }
        }
        if (!successTitleCheck) {
          resultPageCheck = false;
          this.logWarn("transfer success title not show, transfer fail");
          const errorDiv = await this.driver.wait(
            until.elementLocated(By.id("err_info")),
            this.wattingTime
          );
          const errorSpan = await errorDiv.findElements(By.tagName("p"));
          for (const p of errorSpan) {
            const text = await p.getText();
            this.logWarn(text);
          }
        }
      } catch (e) {
        return false;
      }
      // check success table exist
      const successTableElementCon = until.elementLocated(
        By.css(
          "div#showINFO > div.four_column_table_padLR > table.four_column_table > tbody"
        )
      );
      const table = await this.driver.wait(
        successTableElementCon,
        this.wattingTime
      );

      // 檢查交易明細頁面 是否存在該筆任務id
      const checkTransactionList = await this.checkTransactionDetailList();
      this.logInfo(
        `check transaction list result (${checkTransactionList}), result page result (${resultPageCheck})`
      );
      return resultPageCheck;
    } catch (e) {
      this.logWarn(e);
      return false;
    }
  }

  /**
   * 交易明細頁面 確認是否有交易結果
   */
  async checkTransactionDetailList(): Promise<boolean> {
    try {
      await this.driver.switchTo().defaultContent();
      // go my account page #MENUV6020101
      // 前往我的帳戶頁面
      this.logInfo("go to transaction detail page MENUV6020101");
      await waitPageLoadCondition(
        "transaction detail page",
        this.driver,
        until.elementLocated(By.id("MENUV6020101"))
      );
      const nextButton = await this.driver.wait(
        until.elementLocated(By.id("MENUV6020101")),
        this.wattingTime
      );

      if (!nextButton) {
        throw new Error("transfer list page Button is not found");
      }
      await executeJavaScript(
        this.driver,
        "click transfer list page button",
        "document.getElementById('MENUV6020101').click()"
      );
      // go transaction list frame #txmainfrm -> #result -> #result
      // 切換到目標 iframe #txmainfrm
      this.logInfo("switch to frame");
      const transactionFrameCon = until.elementLocated(By.id("txmainfrm"));
      await waitPageLoadCondition("", this.driver, transactionFrameCon);
      await waitAndSwitchToTargetFrame(
        "transaction list frame",
        this.driver,
        transactionFrameCon
      );
      // 切換到 圖形模式 #tuxing
      await executeJavaScript(
        this.driver,
        "click 圖形模式 button",
        "document.getElementById('tuxing').click()"
      );
      // 切換到目標 iframe #result
      await waitAndSwitchToTargetFrame(
        "result",
        this.driver,
        until.elementLocated(By.id("result"))
      );
      // 切換到目標 iframe #result
      await waitAndSwitchToTargetFrame(
        "result1",
        this.driver,
        until.elementLocated(By.id("result"))
      );

      // search detail href .detail pr_5
      const hrefCon = until.elementLocated(By.className("detail pr_5"));
      const hrefElement = await this.driver.wait(hrefCon, this.wattingTime);
      if (!hrefElement) throw new Error("not found detail list href");
      this.logInfo("click detail link");
      await executeJavaScript(
        this.driver,
        "click transfer list page button",
        "document.getElementsByClassName('detail pr_5')[0].click()"
      );
      // await hrefElement.click();
      // find pop out window and get body
      const lastPageData = await this.getTransactionList();
      if (!lastPageData) {
        this.logWarn("not found any transaction record");
        return false;
      }
      const taskRecord = lastPageData.filter(x => +x.remark === this.task.id);
      // console.log(lastPageData);
      this.logInfo(`task record is ${JSON.stringify(taskRecord)}`);
      if (taskRecord) {
        // 失敗的交易會被沖正, 所以確認沒有同樣的task id 被沖正
        const revertRecord = taskRecord.find(x => x.title === "冲正");
        if (revertRecord) {
          this.logWarn("content revert record, transfer fail");
          return false;
        }
        return true;
      }
      return false;
    } catch (e) {
      this.logWarn(e.toString());
      return false;
    }
  }

  async getTransactionList(): Promise<
    | Array<{
      cardNumber: string;
      distName: string;
      amount: string;
      timeStr: string;
      remark: string;
      // 摘要
      title: string;
    }>
    | undefined
    | null
  > {
    try {
      // window.frames[0].document.getElementById("result").document dev #result
      const parent = await this.driver.getWindowHandle();
      const availableWindows = await this.driver.getAllWindowHandles();
      let newWindow = availableWindows.find(x => x !== parent);
      if (!newWindow) {
        throw new Error("not found new window for transacion detail");
      }
      await this.driver.switchTo().window(newWindow);
      WindowFocusTool.focusAndCheckIE();
      await this.driver.switchTo().frame(0);
      await waitPageLoad(this.driver);

      // go last page btns #query_amount_page2
      this.logInfo("go last page click");
      const pagesButton = await this.driver.wait(
        until.elementLocated(By.id("query_amount_page2")),
        this.wattingTime
      );
      const hrefs = await pagesButton.findElements(By.tagName("a"));
      let lastBtn: { page: number; element: WebElement } = {
        page: 0,
        element: null as any
      };
      for (const href of hrefs) {
        const page = +(await href.getText());
        if (page > lastBtn.page) {
          lastBtn.page = page;
          lastBtn.element = href;
        }
      }
      if (lastBtn.element) await lastBtn.element.click();

      await waitAndSwitchToTargetFrame(
        "go to result frame",
        this.driver,
        until.elementLocated(By.id("result"))
      );
      const tableBody = await this.driver.wait(
        until.elementLocated(By.css(" form#jhform > table#result > tbody ")),
        this.wattingTime
      );
      await waitPageLoad(this.driver);
      // resolve table body to dictionary
      this.logInfo("resolve table data");
      const records = await tableBody.findElements(By.className("td_span"));
      const dataResult = [];
      for (const x of records) {
        try {
          // const dataTagName = await x.getTagName();
          // const html = await x.getAttribute("innerHTML");
          // const data = await this.driver.wait(until.elementsLocated(By.tagName("td")));
          const data = await x.findElements(By.tagName("td"));
          if (!data || data.length <= 4) continue;
          let timeStr = await data[1].getText();
          timeStr = timeStr.replace("\n", " ");
          const amount = await data[2].getText();
          const title = await data[5].getAttribute("title");
          const cardNumber = await data[6].getAttribute("title");
          const distName = await data[7].getAttribute("title");
          const remarkTd = await data[8].findElement(By.tagName("div"));
          let remark = "";
          if (remarkTd) {
            remark = await remarkTd.getText();
          }
          dataResult.push({
            cardNumber,
            distName,
            amount,
            timeStr,
            remark,
            title
          });
        } catch (e) {
          return null;
        }
      }
      await this.driver.switchTo().window(parent);
      this.logInfo("resolve table data success");
      return dataResult;
    } catch (e) {
      this.logWarn("getTransactionList fail please check");
      this.logWarn(e.toString());
      throw e;
    }
  }

  async getBalance(): Promise<number> {
    // 跳賺到我的帳戶頁面
    this.logInfo("start to go balance page");
    WindowFocusTool.focusAndCheckIE();
    await executeJavaScript(
      this.driver,
      "go balance page",
      'document.getElementById("MENUV6020101").click()'
    );
    await waitPageLoadCondition(
      "load my account",
      this.driver,
      until.elementLocated(By.id("txmainfrm"))
    );
    this.logInfo("start to go balance iframe first");
    // 切換到餘額結果的 iframe
    let frame = await this.driver.wait(
      until.elementLocated(By.id("txmainfrm")),
      10 * 1000
    );
    if (!frame) throw new Error("can not found balance id (txmainfrm) element");
    await this.driver.switchTo().frame(frame);

    this.logInfo("start to go balance iframe second");
    frame = await this.driver.wait(
      until.elementLocated(By.id("result")),
      10 * 1000
    );
    if (!frame) throw new Error("can not found balance (result) element");

    this.logInfo("start to go balance iframe third");
    await this.driver.switchTo().frame(frame);
    frame = await this.driver.wait(
      until.elementLocated(By.id("result")),
      10 * 1000
    );
    if (!frame) throw new Error("can not found balance (result) element - 1");
    await this.driver.switchTo().frame(frame);
    this.logInfo("try to go balance element");
    await this.sleep(1);
    const balanceText = await waitUtilGetText(
      this.driver,
      until.elementLocated(By.className("font_money table_th_money"))
    );
    const balance = +FormatHelper.amount(balanceText);
    this.logInfo(`balance value (${balance})`);
    await this.driver.switchTo().defaultContent();
    return balance;
  }

  async sleep(s: number = 7) {
    await new Promise(resolve => setTimeout(resolve, s * 1000));
  }

  logDebug(message: string): void {
    Logger({ level: "debug", message: message });
  }

  logInfo(message: string): void {
    Logger({ level: "info", message: message });
  }

  logWarn(message: string): void {
    Logger({ level: "warn", message: message });
  }
}
