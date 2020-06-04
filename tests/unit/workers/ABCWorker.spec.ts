import BankWorker from "@/workers/BankWorker";
import TaskDetailModel from "@/workers/models/taskDetailModel";

let worker: BankWorker;
let remitterAccount = {
  id: 63819,
  balance: 1,
  code: "TEST.ABC.237",
  loginName: "kdjroufe",
  loginPassword: "zz326598",
  usbPassword: "zz326598",
  queryPassword: "326598",
  proxy: "52.175.31.129:8800"
};
let task: TaskDetailModel = {
  amount: 1,
  id: 0,
  transferFee: 0,
  payeeAccount: {
    bank: { chineseName: "中国工商银行" },
    cardNumber: "6222030713002394779",
    holderName: "宋倪丽"
  }
};

jest.setTimeout(50 * 1000);

beforeAll(() => {
  worker = new BankWorker(remitterAccount);
});

afterAll(() => {
  // worker.closeSelenium();
  // worker.unsetProxy();
});

describe("ABCWorker", () => {
  it("Set IE Environment", async () => {
    let isSuccess = await worker.setIEEnvironment();
    expect(isSuccess.success).toBe(true);
  });
  // it("Set Proxy", async() => {
  //     var isSuccess = await worker.setProxy();
  //     expect(isSuccess).toBe(true);
  //   });
  it("Launch Selenium", async () => {
    let isSuccess = await worker.launchSelenium({
      width: 1920,
      height: 1080
    });
    expect(isSuccess.success).toBe(true);
  });

  it("Input Sign In Information", async () => {
    let isSuccess = await worker.inputSignInInformation();
    expect(isSuccess.success).toBe(true);
  });

  it("Submit to sign in", async () => {
    let isSuccess = await worker.submitToSignIn();
    expect(isSuccess.success).toBe(true);
  });

  it("Check if sign success", async () => {
    let isSuccess = await worker.checkIfLoginSuccess(false);
    expect(isSuccess.success).toBe(true);
  });

  it("Set Task", async () => {
    let isSuccess = await worker.setTask(task);
    expect(isSuccess.success).toBe(true);
  });

  it("Go Transfer Page", async () => {
    let isSuccess = await worker.goTransferPage();
    expect(isSuccess.success).toBe(true);
  });

  it("Fill Transfer Form", async () => {
    let isSuccess = await worker.fillTransferFrom();
    expect(isSuccess.success).toBe(true);
  });

  it("Confirm transaction", async () => {
    let isSuccess = await worker.confirmTransaction();
    expect(isSuccess.success).toBe(true);
  });

  it("Check if transaction success", async () => {
    let isSuccess = await worker.checkIfTransactionSuccess();
    expect(isSuccess.success).toBe(true);
  });
});
