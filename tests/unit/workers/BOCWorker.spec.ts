import BankWorker from "@/workers/BankWorker";
import TaskDetailModel from "../../../src/workers/models/taskDetailModel";
import LoggerService from "@/workers/utils/LoggerService";

let logger = new LoggerService("BOCWorker.spec.ts");
// 中国银行
let worker: BankWorker;
const remitterAccount = {
  balance: 1,
  code: "5.BOC.999",
  loginName: "y17667186023",
  loginPassword: "zz800525",
  usbPassword: "zz800525",
  proxy: "10.203.0.14:8800"
};
// 內轉
// const task: TaskDetailModel = {
//   amount: 0.1,
//   transferFee: 0,
//   id: new Date().getTime(),
//   payeeAccount: {
//     bank: { chineseName: "中国银行" },
//     cardNumber: "6216696000004079997",
//     holderName: "魏守亮"
//   }
// };

// 外轉
const task: TaskDetailModel = {
  amount: 0.1,
  transferFee: 0,
  // id: new Date().getTime(),
  id: 6834918,
  payeeAccount: {
    bank: { chineseName: "中国邮政储蓄银行" },
    cardNumber: "6217993000391513895",
    holderName: "康贻龙"
  }
};

jest.setTimeout(30 * 60 * 1000);

beforeAll(() => {
  worker = new BankWorker(remitterAccount);
});

afterAll(() => {
  // worker.closeSelenium();
  // worker.unsetProxy();
});

describe("BOCWorker", () => {
  it("Set IE Environment", async () => {
    const isSuccess = await worker.setIEEnvironment();
    expect(isSuccess.success).toBe(true);
  });
  it("Set Proxy", async () => {
    const isSuccess = await worker.setProxy();
    expect(isSuccess.success).toBe(true);
  });
  it("Launch Selenium", async () => {
    const isSuccess = await worker.launchSelenium({
      width: 1920,
      height: 1080
    });
    expect(isSuccess.success).toBe(true);
  });

  it("Input Sign In Information", async () => {
    const isSuccess = await worker.inputSignInInformation();
    expect(isSuccess.success).toBe(true);
  });

  it("Submit to sign in", async () => {
    const isSuccess = await worker.submitToSignIn();
    expect(isSuccess.success).toBe(true);
  });

  it("Check if sign success", async () => {
    const isSuccess = await worker.checkIfLoginSuccess(false);
    expect(isSuccess.success).toBe(true);
  });

  it("Set Task", async () => {
    const isSuccess = await worker.setTask(task);
    expect(isSuccess.success).toBe(true);
  });

  it("Go Transfer Page", async () => {
    // for (let i = 0; i < 20; i++) {
    //   await worker.checkIfTransactionSuccess();
    //   await worker.goTransferPage();
    // }
    // await worker.checkIfTransactionSuccess();
    // await worker.goTransferPage();
    // await worker.checkIfTransactionSuccess();
    // const isSuccess = await worker.goTransferPage();
    // expect(isSuccess.success).toBe(true);
  });

  // it("Fill Transfer Form", async () => {
  //   const isSuccess = await worker.fillTransferFrom();
  //   expect(isSuccess.success).toBe(true);
  // });

  // it("confirm transaction", async () => {
  //   const isSuccess = await worker.confirmTransaction();
  //   expect(isSuccess.success).toBe(true);
  // });

  it("check transaction", async () => {
    for (let i = 0; i < 20; i++) {
      let result = await worker.checkIfTransactionSuccess();
      logger.info("Check result: " + result.success);
    }
    const isSuccess = await worker.checkIfTransactionSuccess();
    expect(isSuccess.success).toBe(true);
  });
  // it("go balance", async () => {
  //   const result = await worker.getBalance();
  //   expect(result.success).toBe(true);
  //   expect(result.balance).toBeGreaterThan(0);
  // });
});
