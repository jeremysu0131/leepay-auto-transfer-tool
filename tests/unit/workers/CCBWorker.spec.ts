import BankWorker from "@/workers/BankWorker";
import BankModel from "../../../src/workers/models/bankModel";
import PayeeAccountModel from "../../../src/workers/models/payeeAccountModel";
import TaskDetailModel from "../../../src/workers/models/taskDetailModel";

var worker: BankWorker;
var remitterAccount = {
  balance: 0,
  code: "5.CCB.327-1",
  loginName: "judjencjd",
  loginPassword: "zz800525",
  usbPassword: "zz800525",
  proxy: "10.203.0.14:8800"
};

jest.setTimeout(300 * 1000);
describe("CCBWorker", () => {
  beforeAll(async () => {
    worker = new BankWorker(remitterAccount);
    await worker.setProxy();
    var isLaunched = await worker.launchSelenium({
      width: 1920,
      height: 980
    });

    expect(isLaunched.isFlowExecutedSuccess).toBe(true);
  });

  afterAll(async () => {
    // await worker.closeSelenium();
  });

  // it("login:setAccount", async () => {
  //   const bank = { chineseName: "中国邮政储蓄银行" } as BankModel;
  //   const payAccount = {
  //     holderName: "康贻龙",
  //     cardNumber: "6217993000391513895",
  //     bank
  //   } as PayeeAccountModel;
  //   worker.setTask({ id: new Date().getTime(), amount: 0.1, payeeAccount: payAccount } as TaskDetailModel);
  //   const result = await worker.inputSignInInformation();
  //   expect(result.isFlowExecutedSuccess).toEqual(true);
  // });

  it("login:submit", async () => {
    await worker.submitToSignIn();
    const success = await worker.checkIfLoginSuccess({});
    expect(success.isFlowExecutedSuccess).toEqual(true);
  });

  // it("get Balance", async () => {
  //   const result = await worker.getBalance();
  //   expect(result.balance).toBeGreaterThan(0);
  // });

  // it("transfer:go transfer page", async () => {
  //   const result = await worker.goTransferPage();
  //   expect(result.isFlowExecutedSuccess).toEqual(true);
  // });

  // it("transfer:fill transfer form", async () => {
  //   const result = await worker.fillTransferFrom();
  //   expect(result.isFlowExecutedSuccess).toEqual(true);
  // });

  // it("transfer:confirm transfer form", async () => {
  //   const result = await worker.confirmTransaction();
  //   expect(result.isFlowExecutedSuccess).toEqual(true);
  // });

  // it("transfer:check transaction result", async () => {
  //   const result = await worker.checkIfTransactionSuccess();
  //   expect(result.isFlowExecutedSuccess).toEqual(true);
  // });
});
