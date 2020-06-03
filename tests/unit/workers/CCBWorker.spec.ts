import BankWorker from "@/workers/BankWorker";
import BankModel from "../../../src/workers/models/bankModel";
import PayeeAccountModel from "../../../src/workers/models/payeeAccountModel";
import TaskDetailViewModel from "@/models/taskDetailViewModel";
import { CCBWorkerAdapter } from "@/workers/bankAdapters";

let worker: BankWorker;
let remitterAccount = {
  balance: 0,
  code: "5.CCB.327",
  loginName: "judjencjd",
  loginPassword: "zz800525",
  usbPassword: "zz800525",
  proxy: "52.175.31.129:8800"
};

jest.setTimeout(300 * 1000);
describe("CCBWorker", () => {
  beforeAll(async () => {
    worker = new BankWorker(remitterAccount);
  });

  afterAll(async () => {
    // await worker.closeSelenium();
  });

  it("Set IE Environment", async () => {
    let isSuccess = await worker.setIEEnvironment();
    expect(isSuccess.success).toBe(true);
  });

  it("Set Proxy", async () => {
    let { success } = await worker.setProxy();
    expect(success).toBe(true);
  });

  it("Launch Selenium", async () => {
    let isSuccess = await worker.launchSelenium({
      width: 1920,
      height: 1080
    });
    expect(isSuccess.success).toBe(true);
  });

  it("login:setAccount", async () => {
    const bank = { chineseName: "邮政储蓄" } as BankModel;
    const payAccount = {
      holderName: "康贻龙",
      cardNumber: "6217993000391513895",
      bank
    } as PayeeAccountModel;
    worker.setTask({ id: new Date().getTime(), amount: 0.1, payeeAccount: payAccount } as TaskDetailViewModel);
    const result = await worker.inputSignInInformation();
    expect(result.success).toEqual(true);
  });

  it("login:submit", async () => {
    await worker.submitToSignIn();
    const success = await worker.checkIfLoginSuccess({});
    expect(success.success).toEqual(true);
  });

  it("get Balance", async () => {
    const result = await worker.getBalance();
    expect(result.balance).toBeGreaterThan(0);
  });

  it("transfer:go transfer page", async () => {
    const result = await worker.goTransferPage();
    expect(result.success).toEqual(true);
  });

  it("transfer:fill transfer form", async () => {
    const result = await worker.fillTransferFrom();
    expect(result.success).toEqual(true);
  });

  it("transfer:confirm transfer form", async () => {
    const result = await worker.confirmTransaction();
    expect(result.success).toEqual(true);
  });

  it("transfer:check transaction result", async () => {
    const result = await worker.checkIfTransactionSuccess();
    expect(result.success).toEqual(true);
  });
});
