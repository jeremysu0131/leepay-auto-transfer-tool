export default interface IWorkerFactory {
  // setIEEnviroment(): Promise<boolean>;
  // setProxy(): Promise<boolean>;
  // unsetProxy(): void;
  // closeSelenium(): void;
  launchSelenium(): void;
  inputSignInInformation(): Promise<void>;
  submitToSignIn(): void;
  sendUSBKey(): void;
  checkIfLoginSuccess(globalState: { isManualLogin: boolean }):Promise<boolean> ;
  getCookie(): void;
  goTransferPage(): void;
  fillTransferFrom(): void;
  fillNote(): void;
  confirmTransaction(): void;
  checkIfSuccess(): Promise<boolean>;
  getBalance(): void;
}
