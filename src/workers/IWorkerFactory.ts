export default interface IWorkerFactory {
  setIEEnviroment(): Promise<boolean>;
  setProxy(): void;
  launchSelenium(): void;
  inputSignInInformation(): void;
  setIEEnviroment(): boolean;
  setProxy(): boolean;
  unsetProxy(): void;
  launchSelenium(): void;
  closeSelenium(): void;
  inputSignInInformation(): void;
  submitToSignIn(): void;
  sendUSBKey(): void;
  checkIfLoginSuccess(globalState: { isManualLogin: boolean }): boolean;
  getCookie(): void;
  goTransferPage(): void;
  fillTransferFrom(): void;
  fillNote(): void;
  confirmTransaction(): void;
  checkIfSuccess(): boolean;
  getBalance(): void;
}
