import { WebDriver } from "selenium-webdriver";
import TaskDetailModel from "./models/taskDetailModel";

/**
 * 此介面僅提供銀行網頁互動
 */
export interface IWorkerAdapter {
  // setIEEnvironment(): Promise<boolean>;
  // setProxy(): Promise<boolean>;
  // unsetProxy(): Promise<void>
  // closeSelenium(): Promise<void>

  getDriver(): WebDriver;
  setDriver(driver: WebDriver): void;

  getTask():TaskDetailModel;
  setTask(task:TaskDetailModel):void;

  /**
   * 進入銀行登入頁面
   * 並且做檢查確認是否有進入該頁面
   */
  launchSelenium(): Promise<void>;

  /**
   * 填寫登入資訊
   */
  inputSignInInformation(): Promise<void>;
  checkSignInInformationCorrectly(): Promise<boolean>;

  /**
   * 送出登入表單
   */
  submitToSignIn(): Promise<void>;

  /**
   * 輸入 U Key 密碼
   */
  sendUSBKey(): Promise<void>;

  /**
   * 檢查登入是否成功
   * 自動與手動差異為檢查差異秒數；以及自動時，需要額外檢查是否完全載入。
   * @param globalState
   */
  checkIfLoginSuccess(globalState: {
    isManualLogin: boolean;
  }): Promise<boolean>;

  /**
   * 取得登入 Cookie
   */
  getCookie(): Promise<void>;

  /**
   * 進入轉帳頁面
   * 從登入後的頁面跳轉到至轉帳首頁
   */
  goTransferPage(): Promise<void>;
  /**
   * 檢查確認是否正確至轉帳頁面
   */
  checkIfInTransferPage(): Promise<boolean>;

  /**
   * 填寫轉帳訊息
   * 1. 填寫受款人的訊息
   * 2. 填寫金額
   * ps 1. 欄位檢查：逐一欄位做檢查
   */
  fillTransferForm(): Promise<void>;

  /**
   * 表單檢查：檢查表單填寫內容
   */
  checkTransferInformationCorrectly(): Promise<boolean>;

  /**
   * Submit transaction form if check transfer information correctly
   */
  submitTransaction(): Promise<void>;

  /**
   * 填寫附言 (非必要)
   */
  fillNote(): Promise<void>;
  /**
   * 檢查填寫附言 (非必要)
   */
  checkIfNoteFilled(): Promise<void>;

  /**
   * Check if bank received data correctly before confirm transaction
   */
  checkBankReceivedTransferInformation(): Promise<boolean>;

  /**
   * Send password to perform transaction
   */
  sendPasswordToPerformTransaction(): Promise<void>;

  /**
   * Send usb password to perform transaction
   */
  sendUsbPasswordToPerformTransaction(): Promise<void>;

  /**
   * 轉帳填寫完畢後，點擊【確認】後的流程。(各家銀行不一樣)
   */
  // confirmTransaction(): Promise<void>

  /**
   * 檢查轉帳是否轉帳成功
   *
   * e.g. 農行
   * 1. 檢查彈跳視窗是否有回條
   * 2. 如果銀行端發生問題，查詢不到回條，則需要導入至交易明細頁面做檢查
   */
  checkIfTransactionSuccess(): Promise<boolean>;

  /**
   * 取得餘額
   */
  getBalance(): Promise<number>;
}
