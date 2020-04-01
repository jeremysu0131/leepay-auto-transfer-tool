export default interface IWorkerFactory {
  // setIEEnviroment(): Promise<boolean>;
  // setProxy(): Promise<boolean>;
  // unsetProxy(): void;
  // closeSelenium(): void;

  /**
   * 進入銀行登入頁面
   * 並且做檢查確認是否有進入該頁面
   */
  launchSelenium(): void;

  /**
   * 填寫登入資訊
   */
  inputSignInInformation(): Promise<void>;

  /**
   * 送出登入表單
   */
  submitToSignIn(): void;

  /**
   * 輸入 U Key 密碼
   */
  sendUSBKey(): void;

  /**
   * 檢查登入是否成功
   * 自動與手動差異為檢查差異秒數；以及自動時，需要額外檢查是否完全載入。
   * @param globalState 
   */
  checkIfLoginSuccess(globalState: { isManualLogin: boolean }): Promise<boolean> ;

  /**
   * 取得登入 Cookie
   */
  getCookie(): void;

  /**
   * 進入轉帳頁面
   * 1. 從登入後的頁面跳轉到至轉帳首頁
   * 2. 檢查確認是否正確至轉帳頁面
   */
  goTransferPage(): void;

  /**
   * 填寫轉帳訊息
   * 1. 填寫受款人的訊息
   * 2. 填寫金額
   * ps 1. 欄位檢查：逐一欄位做檢查
   * ps 2. 表單檢查：檢查全部表單
   */
  fillTransferFrom(): void;

  /**
   * 填寫附言 (非必要)
   */
  fillNote(): void;

  /**
   * 轉帳填寫完畢後，點擊【確認】後的流程。(各家銀行不一樣)
   */
  confirmTransaction(): void;

  /**
   * 檢查轉帳是否轉帳成功
   * 
   * e.g. 農行
   * 1. 檢查彈跳視窗是否有回條
   * 2. 如果銀行端發生問題，查詢不到回條，則需要導入至交易明細頁面做檢查
   */
  checkIfSuccess(): Promise<boolean>;

  /**
   * 取得餘額
   */
  getBalance(): void;
}
